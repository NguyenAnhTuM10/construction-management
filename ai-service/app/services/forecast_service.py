"""
Forecast Service — logic dự báo tồn kho.

Chiến lược chọn model (Model Evaluation & Selection):
  Thay vì chọn cứng theo số ngày, service chạy TẤT CẢ model đủ điều kiện
  trên một validation window (7 ngày gần nhất), đo MAE, rồi chọn model
  có sai số thấp nhất để forecast thực sự.

  Điều kiện để evaluate (n = số ngày sau fill):
    >= 60 ngày → thử: XGBoost + Holt-Winters + LinearReg + SMA
    21–59 ngày → thử: Holt-Winters + LinearReg + SMA
    14–20 ngày → thử: LinearReg + SMA
    < 14 ngày  → SMA (không đủ data để tách validation set có ý nghĩa)

  preferred_model (từ Spring Boot): force dùng model đó nếu đủ data,
  bỏ qua evaluation → dùng cho kịch bản "người dùng muốn override".

Tại sao XGBoost cần >= 60 ngày?
  Lag feature lớn nhất là lag_28 → cần 28 hàng "warmup".
  Sau dropna(), cần ít nhất 20 samples để train có ý nghĩa.
  60 ngày - 7 (val) - 28 (warmup) ≈ 25 samples → đủ.
"""

import math
from datetime import datetime
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from app.models.schemas import (
    ForecastRequest,
    ForecastResponse,
    ProductForecastInput,
    ProductForecastResult,
    StockoutRisk,
)
from app.services.data_preparation import prepare_time_series

SAFETY_FACTOR = 1.65   # Z-score cho service level 95%
VAL_DAYS      = 7      # Số ngày hold-out để đo MAE

# Số ngày tối thiểu toàn bộ series (trước khi tách val) để mỗi model có thể evaluate
_MODEL_EVAL_MIN = {
    "xgboost":              60,   # train >= 53 sau val split
    "holt_winters":         21,   # train >= 14 sau val split
    "linear_regression":    14,   # train >= 7 sau val split
    "simple_moving_average": 0,   # luôn chạy được
}

# Ngưỡng để dùng model khi bị force (preferred_model / rule-based)
_MODEL_FORCE_MIN = {
    "xgboost":              60,
    "holt_winters":         14,
    "linear_regression":     7,
    "simple_moving_average": 0,
}


# ═══════════════════════════ Public API ══════════════════════════════════════

def run_forecast(request: ForecastRequest) -> ForecastResponse:
    results = [
        forecast_product(product, request.forecast_horizon_days)
        for product in request.products
    ]
    return ForecastResponse(
        forecast_run_at=datetime.utcnow(),
        products_processed=len(results),
        results=results,
    )


def forecast_product(product: ProductForecastInput, horizon: int) -> ProductForecastResult:
    df = prepare_time_series(product.daily_history)

    if df.empty or df["quantity_out"].sum() == 0:
        return _zero_demand_result(product, horizon)

    demand_series = df["quantity_out"].values.astype(float)
    n = len(demand_series)

    daily_preds, model_name, model_scores = _select_and_run_model(
        df, demand_series, n, horizon, product.preferred_model
    )

    daily_preds = [max(0, int(round(p))) for p in daily_preds]

    avg_demand   = float(np.mean(demand_series))
    std_demand   = float(np.std(demand_series)) if n > 1 else avg_demand * 0.2

    safety_stock        = _calc_safety_stock(std_demand, product.lead_time_days)
    reorder_point       = _calc_rop(avg_demand, product.lead_time_days, safety_stock)
    eoq                 = _calc_eoq(avg_demand, product.ordering_cost, product.holding_cost_per_unit)
    days_until_stockout = _calc_days_to_stockout(product.current_stock, avg_demand)
    stockout_risk       = _assess_risk(days_until_stockout)

    # Confidence tích hợp cả MAE thực tế (nếu có)
    best_mae = model_scores.get(model_name)
    confidence = _calc_confidence(n, demand_series, model_name, best_mae)

    recommended_qty = max(
        eoq,
        max(0, int(avg_demand * 30) - product.current_stock + safety_stock),
    )

    return ProductForecastResult(
        product_id=product.product_id,
        predicted_demand_7days=sum(daily_preds),
        avg_daily_demand=round(avg_demand, 2),
        confidence_score=round(confidence, 3),
        stockout_risk=stockout_risk,
        days_until_stockout=days_until_stockout,
        reorder_point=reorder_point,
        recommended_reorder_qty=recommended_qty,
        safety_stock=safety_stock,
        eoq=eoq,
        daily_forecast=daily_preds,
        model_used=model_name,
        model_scores=model_scores,
    )


# ═══════════════════════ Model Selection ═════════════════════════════════════

def _select_and_run_model(
    df: pd.DataFrame,
    demand_series: np.ndarray,
    n: int,
    horizon: int,
    preferred_model: str | None,
) -> Tuple[List[float], str, Dict[str, float]]:
    """
    Chiến lược:
    1. preferred_model được chỉ định → force dùng (skip evaluation).
    2. n < 14 → không đủ data để evaluate → rule-based.
    3. Còn lại → evaluate tất cả model đủ điều kiện, chọn MAE thấp nhất.
    """
    # ── 1. preferred_model override ───────────────────────────────────────────
    if preferred_model and preferred_model in _MODEL_FORCE_MIN:
        if n >= _MODEL_FORCE_MIN[preferred_model]:
            preds, name = _run_model(preferred_model, df, demand_series, horizon)
            return preds, name, {}

    # ── 2. Không đủ data để tách validation set ───────────────────────────────
    if n < _MODEL_EVAL_MIN["linear_regression"]:   # n < 14
        preds, name = _rule_based(df, demand_series, n, horizon)
        return preds, name, {}

    # ── 3. Evaluate all eligible models, pick best MAE ────────────────────────
    return _evaluate_and_select(df, demand_series, n, horizon)


def _evaluate_and_select(
    df: pd.DataFrame,
    demand_series: np.ndarray,
    n: int,
    horizon: int,
) -> Tuple[List[float], str, Dict[str, float]]:
    """
    Walk-forward single-split evaluation:
      train = df.iloc[:-VAL_DAYS]   (tất cả trừ 7 ngày cuối)
      val   = demand_series[-VAL_DAYS:]

    Chạy mỗi model đủ điều kiện trên train → predict VAL_DAYS bước →
    đo MAE so với val thực tế → rank → chọn winner → retrain trên full data.
    """
    train_df     = df.iloc[:-VAL_DAYS].copy().reset_index(drop=True)
    train_series = train_df["quantity_out"].values.astype(float)
    val_actual   = demand_series[-VAL_DAYS:]
    n_train      = len(train_series)

    scores: Dict[str, float] = {}

    # Danh sách model cần thử
    candidates = [
        model for model, min_n in _MODEL_EVAL_MIN.items()
        if n >= min_n  # dùng n (full) để check ngưỡng, không phải n_train
    ]

    for model_name in candidates:
        try:
            if model_name == "xgboost":
                # XGBoost cần DataFrame, train trên train_df
                preds, _ = _forecast_xgboost(train_df, VAL_DAYS)
            elif model_name == "holt_winters":
                if n_train < 14:
                    continue
                preds, _ = _forecast_holt_winters(train_series, VAL_DAYS)
            elif model_name == "linear_regression":
                if n_train < 7:
                    continue
                preds, _ = _forecast_linear_regression(train_series, VAL_DAYS)
            else:
                preds, _ = _forecast_sma(train_series, VAL_DAYS)

            mae = float(np.mean(np.abs(np.array(preds[:VAL_DAYS]) - val_actual)))
            scores[model_name] = round(mae, 2)

        except Exception:
            # Model fail trên validation → không tính vào candidates
            pass

    if not scores:
        # Tất cả model đều fail → fallback
        preds, name = _rule_based(df, demand_series, n, horizon)
        return preds, name, {}

    # Chọn model thắng (MAE thấp nhất)
    best_model = min(scores, key=scores.get)

    # Retrain winner trên TOÀN BỘ data và forecast thực sự
    final_preds, winner = _run_model(best_model, df, demand_series, horizon)

    return final_preds, winner, scores


def _run_model(
    model_name: str,
    df: pd.DataFrame,
    demand_series: np.ndarray,
    horizon: int,
) -> Tuple[List[float], str]:
    """Chạy một model cụ thể trên full data."""
    if model_name == "xgboost":
        return _forecast_xgboost(df, horizon)
    elif model_name == "holt_winters":
        return _forecast_holt_winters(demand_series, horizon)
    elif model_name == "linear_regression":
        return _forecast_linear_regression(demand_series, horizon)
    else:
        return _forecast_sma(demand_series, horizon)


def _rule_based(
    df: pd.DataFrame,
    demand_series: np.ndarray,
    n: int,
    horizon: int,
) -> Tuple[List[float], str]:
    """Chọn model theo số ngày — fallback khi không đủ data để evaluate."""
    if n >= 60:
        return _forecast_xgboost(df, horizon)
    elif n >= 14:
        return _forecast_holt_winters(demand_series, horizon)
    elif n >= 7:
        return _forecast_linear_regression(demand_series, horizon)
    else:
        return _forecast_sma(demand_series, horizon)


# ═══════════════════════════ Forecasting Models ══════════════════════════════

def _forecast_xgboost(df: pd.DataFrame, horizon: int) -> Tuple[List[float], str]:
    """
    XGBoost với feature engineering cho time series.

    Ý tưởng cốt lõi:
    Biến bài toán "dự báo chuỗi thời gian" thành bài toán "supervised regression".
    Mỗi ngày = 1 sample với features là:
      - Lag features: giá trị trong quá khứ (t-1, t-2, ..., t-28)
      - Rolling stats: trung bình/độ lệch chuẩn cửa sổ trượt
      - Calendar features: ngày trong tuần, tháng, quý (bắt seasonality)

    Multi-step forecasting:
    Dự báo từng bước, dùng kết quả bước trước làm lag cho bước sau.
    """
    try:
        from xgboost import XGBRegressor

        df = df.copy().sort_values("date").reset_index(drop=True)
        df["date"] = pd.to_datetime(df["date"])

        # ── Calendar features ─────────────────────────────────────────────────
        df["day_of_week"] = df["date"].dt.dayofweek   # 0=Thứ 2, 6=Chủ nhật
        df["is_weekend"]  = (df["day_of_week"] >= 5).astype(int)
        df["month"]       = df["date"].dt.month
        df["quarter"]     = df["date"].dt.quarter

        # ── Lag features ──────────────────────────────────────────────────────
        demand = df["quantity_out"]
        for lag in [1, 2, 3, 7, 14, 21, 28]:
            df[f"lag_{lag}"] = demand.shift(lag)

        # ── Rolling statistics ────────────────────────────────────────────────
        shifted = demand.shift(1)
        df["roll_7_mean"]  = shifted.rolling(7).mean()
        df["roll_7_std"]   = shifted.rolling(7).std().fillna(0)
        df["roll_14_mean"] = shifted.rolling(14).mean()
        df["roll_28_mean"] = shifted.rolling(28).mean()
        df["roll_28_max"]  = shifted.rolling(28).max()

        df_clean = df.dropna().reset_index(drop=True)

        if len(df_clean) < 20:
            return _forecast_holt_winters(demand.values, horizon)

        FEATURE_COLS = [
            "day_of_week", "is_weekend", "month", "quarter",
            "lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_21", "lag_28",
            "roll_7_mean", "roll_7_std", "roll_14_mean", "roll_28_mean", "roll_28_max",
        ]

        X_train = df_clean[FEATURE_COLS].values
        y_train = df_clean["quantity_out"].values

        model = XGBRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,
            random_state=42,
            verbosity=0,
        )
        model.fit(X_train, y_train)

        # ── Multi-step recursive forecasting ─────────────────────────────────
        history   = demand.values.tolist()
        last_date = df["date"].max()
        predictions: List[float] = []

        for step in range(horizon):
            future_date = last_date + pd.Timedelta(days=step + 1)
            h = history

            def _safe_get(offset: int) -> float:
                return h[-offset] if len(h) >= offset else float(np.mean(h))

            def _roll_mean(window: int) -> float:
                return float(np.mean(h[-window:])) if len(h) >= 1 else 0.0

            def _roll_std(window: int) -> float:
                return float(np.std(h[-window:])) if len(h) >= 2 else 0.0

            def _roll_max(window: int) -> float:
                return float(np.max(h[-window:])) if len(h) >= 1 else 0.0

            features = [
                future_date.dayofweek,
                int(future_date.dayofweek >= 5),
                future_date.month,
                future_date.quarter,
                _safe_get(1), _safe_get(2), _safe_get(3),
                _safe_get(7), _safe_get(14), _safe_get(21), _safe_get(28),
                _roll_mean(7), _roll_std(7), _roll_mean(14),
                _roll_mean(28), _roll_max(28),
            ]

            pred = max(0.0, float(model.predict(np.array([features]))[0]))
            predictions.append(pred)
            history.append(pred)

        return predictions, "xgboost"

    except Exception:
        return _forecast_holt_winters(df["quantity_out"].values.astype(float), horizon)


def _forecast_holt_winters(series: np.ndarray, horizon: int) -> Tuple[List[float], str]:
    """Double Exponential Smoothing — bắt trend. Dùng khi 14–59 ngày."""
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        model = ExponentialSmoothing(
            series, trend="add", seasonal=None, initialization_method="estimated"
        )
        fit = model.fit(optimized=True)
        return fit.forecast(horizon).tolist(), "holt_winters"
    except Exception:
        return _forecast_sma(series, horizon)


def _forecast_linear_regression(series: np.ndarray, horizon: int) -> Tuple[List[float], str]:
    """Linear Regression trên time index. Dùng khi 7–13 ngày."""
    try:
        from sklearn.linear_model import LinearRegression

        n = len(series)
        X = np.arange(n).reshape(-1, 1)
        model = LinearRegression()
        model.fit(X, series)
        future_X = np.arange(n, n + horizon).reshape(-1, 1)
        return model.predict(future_X).tolist(), "linear_regression"
    except Exception:
        return _forecast_sma(series, horizon)


def _forecast_sma(series: np.ndarray, horizon: int) -> Tuple[List[float], str]:
    """Simple Moving Average 3 ngày. Fallback cuối cùng."""
    window = min(3, len(series))
    avg = float(np.mean(series[-window:])) if len(series) > 0 else 0.0
    return [avg] * horizon, "simple_moving_average"


# ═══════════════════════ Inventory Calculations ══════════════════════════════

def _calc_safety_stock(std_demand: float, lead_time: int) -> int:
    """Safety Stock = Z * σ * √lead_time  (service level 95%)"""
    return max(0, int(math.ceil(SAFETY_FACTOR * std_demand * math.sqrt(lead_time))))


def _calc_rop(avg_demand: float, lead_time: int, safety_stock: int) -> int:
    """Reorder Point = avg_demand * lead_time + safety_stock"""
    return max(0, int(math.ceil(avg_demand * lead_time)) + safety_stock)


def _calc_eoq(avg_demand: float, ordering_cost: float, holding_cost: float) -> int:
    """EOQ = √(2 * D * S / H)"""
    if avg_demand <= 0 or holding_cost <= 0:
        return 0
    annual_demand = avg_demand * 365
    return max(1, int(math.sqrt(2 * annual_demand * ordering_cost / holding_cost)))


def _calc_days_to_stockout(current_stock: int, avg_demand: float) -> int:
    if avg_demand <= 0:
        return 9999
    return min(9999, int(current_stock / avg_demand))


def _assess_risk(days_until_stockout: int) -> StockoutRisk:
    if days_until_stockout <= 3:
        return StockoutRisk.CRITICAL
    elif days_until_stockout <= 7:
        return StockoutRisk.HIGH
    elif days_until_stockout <= 14:
        return StockoutRisk.MEDIUM
    return StockoutRisk.LOW


def _calc_confidence(
    n: int,
    series: np.ndarray,
    model_used: str,
    best_mae: float | None,
) -> float:
    """
    Confidence score 0.10 → 0.95, tích hợp 3 yếu tố:

    1. Data volume  : nhiều ngày lịch sử → base cao hơn
    2. Demand regularity:
       - Sparsity (tỷ lệ ngày không có giao dịch)
       - CV tính trên ngày CÓ demand (nonzero) — tránh bị kéo bởi fill-zeros
    3. Validation accuracy: MAE / mean_nonzero
       - Dùng mean của ngày có demand thật, không phải mean cả series
         (lumpy product có mean_series rất thấp → relative_mae bị inflate)

    Tại sao không dùng mean_series cho MAE ratio?
      Ví dụ lumpy: [0,0,0,0,45,0,0,72,...] → mean_series ≈ 2.5
      MAE=9.83 → relative = 9.83/2.5 = 3.9 → penalty lớn không hợp lý
      mean_nonzero = (45+72+...)/count ≈ 45 → relative = 9.83/45 = 0.22 → hợp lý hơn

    Scale: 0.10 (không đủ data/model rất kém) → 0.95 (nhiều data, model rất chính xác)
    """
    # ── 1. Base từ data volume ────────────────────────────────────────────────
    if n >= 180:   base = 0.90
    elif n >= 90:  base = 0.84
    elif n >= 60:  base = 0.78
    elif n >= 30:  base = 0.70
    elif n >= 21:  base = 0.62
    elif n >= 14:  base = 0.52
    elif n >= 7:   base = 0.42
    else:          base = 0.25

    # ── 2. Demand regularity ──────────────────────────────────────────────────
    nonzero = series[series > 0]
    n_nonzero = len(nonzero)

    if n_nonzero == 0:
        return 0.10   # Không có demand gì cả

    mean_nz = float(np.mean(nonzero))   # Mean của ngày thực sự có giao dịch

    # Sparsity: tỷ lệ ngày zero (weekend, ngày lễ, lumpy = nhiều zero)
    sparsity = 1.0 - (n_nonzero / n)
    base -= min(sparsity, 0.80) * 0.12  # tối đa -9.6%

    # CV tính trên ngày nonzero (loại bỏ nhiễu từ fill-zeros)
    if n_nonzero > 1:
        cv_nz = float(np.std(nonzero)) / mean_nz
        base -= min(cv_nz, 1.5) * 0.08  # tối đa -12%

    # ── 3. Validation accuracy ────────────────────────────────────────────────
    if best_mae is not None and mean_nz > 0:
        # So sánh MAE với demand THỰC TẾ (nonzero mean), không phải mean bao gồm zero fill
        relative_mae = best_mae / mean_nz
        if relative_mae <= 0.10:    base += 0.08   # sai số <10%: rất chính xác
        elif relative_mae <= 0.20:  base += 0.05   # <20%: tốt
        elif relative_mae <= 0.35:  base += 0.02   # <35%: trên trung bình
        elif relative_mae <= 0.60:  pass            # <60%: trung bình
        elif relative_mae <= 1.00:  base -= 0.05   # <100%: kém
        else:                       base -= 0.10   # >100%: rất kém (thường do lumpy)

    return max(0.10, min(0.95, round(base, 3)))


def _zero_demand_result(product: ProductForecastInput, horizon: int) -> ProductForecastResult:
    return ProductForecastResult(
        product_id=product.product_id,
        predicted_demand_7days=0,
        avg_daily_demand=0.0,
        confidence_score=0.1,
        stockout_risk=StockoutRisk.LOW,
        days_until_stockout=9999,
        reorder_point=0,
        recommended_reorder_qty=0,
        safety_stock=0,
        eoq=0,
        daily_forecast=[0] * horizon,
        model_used="no_history",
        model_scores={},
    )
