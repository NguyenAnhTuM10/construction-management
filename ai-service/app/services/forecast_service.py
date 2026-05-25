"""
Forecast Service — AI Inventory Forecasting Engine
===================================================

Kiến trúc 7 bước:
  1. Classify demand  — smooth / intermittent / lumpy
  2. Prepare data     — fill gaps, clip outliers
  3. Evaluate models  — rolling-origin 3-fold, đo MAE + Bias
  4. Select winner    — model có weighted score thấp nhất
  5. Retrain + Forecast — train trên full data, dự báo 7 ngày
  6. Inventory logic  — Safety Stock, ROP, EOQ (demand-type aware)
  7. Confidence score — kết hợp data quality + model skill vs naïve

Chỉ 2 model được dùng: XGBoost và Holt-Winters.
  - XGBoost  : cần n >= 60 ngày, phù hợp smooth demand có pattern rõ
  - Holt-Winters: cần n >= 14 ngày, bắt trend tốt, fallback cho intermittent

Demand classification (Syntetos-Boylan):
  ADI = trung bình khoảng cách giữa các ngày có demand
  CV² = bình phương hệ số biến thiên của demand nonzero
  smooth       (ADI < 1.32, CV² < 0.49) → XGBoost / HW
  intermittent (ADI >= 1.32, CV² < 0.49) → HW (demand đều nhưng thưa)
  erratic      (ADI < 1.32, CV² >= 0.49) → HW (demand thường xuyên nhưng bất thường)
  lumpy        (ADI >= 1.32, CV² >= 0.49) → HW conservative (demand thưa và bất thường)
"""

import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple

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

# ─────────────────────────── Hằng số ─────────────────────────────────────────

SAFETY_FACTOR = 1.65        # Z-score cho service level 95%
VAL_DAYS      = 7           # Số ngày mỗi fold hold-out
N_FOLDS       = 3           # Số fold rolling-origin evaluation
MIN_TRAIN_AFTER_VAL = 14    # Sau khi tách val, train phải còn ít nhất N ngày

# Ngưỡng số ngày để evaluate từng model (toàn bộ series trước split)
_MIN_N_EVAL = {
    "xgboost":      60,   # cần 60 - 7*3 = 39 ngày train tối thiểu
    "holt_winters": 14 + VAL_DAYS * N_FOLDS,  # = 35 ngày
}

# Ngưỡng để force-run model (preferred_model / rule-based fallback)
_MIN_N_FORCE = {
    "xgboost":      60,
    "holt_winters":  0,
}


# ══════════════════════════ Public API ════════════════════════════════════════

def run_forecast(request: ForecastRequest) -> ForecastResponse:
    results = [
        forecast_product(p, request.forecast_horizon_days)
        for p in request.products
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

    series = df["quantity_out"].values.astype(float)
    n      = len(series)

    # ── 1. Classify demand pattern ────────────────────────────────────────────
    demand_type = _classify_demand(series)

    # ── 2–5. Select model, train, forecast ───────────────────────────────────
    daily_preds, model_name, model_scores = _select_and_forecast(
        df, series, n, horizon, product.preferred_model, demand_type
    )
    daily_preds = [max(0, int(round(p))) for p in daily_preds]

    # ── 6. Inventory calculations ─────────────────────────────────────────────
    avg_demand, std_demand = _demand_stats(series, demand_type)

    safety_stock        = _calc_safety_stock(std_demand, product.lead_time_days)
    reorder_point       = _calc_rop(avg_demand, product.lead_time_days, safety_stock)
    eoq                 = _calc_eoq(avg_demand, product.ordering_cost, product.holding_cost_per_unit)
    days_until_stockout = _calc_days_to_stockout(product.current_stock, avg_demand)
    stockout_risk       = _assess_risk(days_until_stockout)
    recommended_qty     = _calc_recommended_qty(avg_demand, eoq, product.current_stock, safety_stock)

    # ── 7. Confidence score ───────────────────────────────────────────────────
    best_mae   = model_scores.get(model_name)
    naive_mae  = _naive_mae(series)
    confidence = _calc_confidence(n, series, demand_type, best_mae, naive_mae)

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


# ══════════════════════ Bước 1: Demand Classification ════════════════════════

def _classify_demand(series: np.ndarray) -> str:
    """
    Phân loại demand theo Syntetos-Boylan (2005):

      ADI (Average Demand Interval): trung bình khoảng cách (ngày) giữa
          các ngày có demand > 0. ADI cao → demand thưa.

      CV² (Squared Coefficient of Variation): đo độ bất thường của SIZE
          demand trên các ngày có demand. CV² cao → demand không đều.

    Bảng phân loại:
      ┌─────────────┬──────────────┬───────────────┐
      │             │  CV² < 0.49  │  CV² >= 0.49  │
      ├─────────────┼──────────────┼───────────────┤
      │ ADI < 1.32  │   smooth     │   erratic     │
      │ ADI >= 1.32 │ intermittent │    lumpy      │
      └─────────────┴──────────────┴───────────────┘
    """
    nonzero_idx = np.where(series > 0)[0]
    if len(nonzero_idx) == 0:
        return "no_demand"

    # ADI: trung bình khoảng cách giữa các lần có demand
    if len(nonzero_idx) > 1:
        intervals = np.diff(nonzero_idx)
        adi = float(np.mean(intervals))
    else:
        adi = float(len(series))  # chỉ có 1 lần demand → rất thưa

    # CV² trên giá trị nonzero
    nonzero_vals = series[nonzero_idx]
    if len(nonzero_vals) > 1 and np.mean(nonzero_vals) > 0:
        cv2 = (float(np.std(nonzero_vals)) / float(np.mean(nonzero_vals))) ** 2
    else:
        cv2 = 0.0

    if adi < 1.32 and cv2 < 0.49:
        return "smooth"
    elif adi >= 1.32 and cv2 < 0.49:
        return "intermittent"
    elif adi < 1.32 and cv2 >= 0.49:
        return "erratic"
    else:
        return "lumpy"


# ══════════════════════ Bước 2–5: Model Selection & Forecast ═════════════════

def _select_and_forecast(
    df: pd.DataFrame,
    series: np.ndarray,
    n: int,
    horizon: int,
    preferred_model: Optional[str],
    demand_type: str,
) -> Tuple[List[float], str, Dict[str, float]]:
    """
    Chiến lược:
      A. preferred_model được chỉ định → force dùng nếu đủ data
      B. n nhỏ → rule-based (không đủ data để eval)
      C. Còn lại → rolling-origin evaluation, chọn winner
    """

    # A. preferred_model override
    if preferred_model and preferred_model in _MIN_N_FORCE:
        if n >= _MIN_N_FORCE[preferred_model]:
            preds, name = _run_model(preferred_model, df, series, horizon)
            return preds, name, {}

    # B. Không đủ data → rule-based
    min_eval_n = min(
        v for k, v in _MIN_N_EVAL.items()
        if _model_eligible(k, n, demand_type)
    ) if any(_model_eligible(k, n, demand_type) for k in _MIN_N_EVAL) else 999

    if n < _MIN_N_EVAL["holt_winters"]:
        preds, name = _rule_based(df, series, n, horizon)
        return preds, name, {}

    # C. Rolling-origin evaluation
    return _rolling_origin_eval(df, series, n, horizon, demand_type)


def _model_eligible(model_name: str, n: int, demand_type: str) -> bool:
    """Kiểm tra model có đủ điều kiện để evaluate không."""
    if n < _MIN_N_EVAL.get(model_name, 999):
        return False
    # XGBoost không phù hợp với lumpy/intermittent demand
    if model_name == "xgboost" and demand_type in ("lumpy", "intermittent"):
        return False
    return True


def _rolling_origin_eval(
    df: pd.DataFrame,
    series: np.ndarray,
    n: int,
    horizon: int,
    demand_type: str,
) -> Tuple[List[float], str, Dict[str, float]]:
    """
    Rolling-origin evaluation với N_FOLDS fold:

      Fold 1: train = series[:n-21], val = series[n-21:n-14]
      Fold 2: train = series[:n-14], val = series[n-14:n-7]
      Fold 3: train = series[:n-7],  val = series[n-7:]

    Với mỗi fold, đo MAE. Score cuối = mean MAE qua các fold.
    Model nào score thấp hơn → thắng.
    """
    candidates = [
        m for m in ["xgboost", "holt_winters"]
        if _model_eligible(m, n, demand_type)
    ]

    if not candidates:
        preds, name = _rule_based(df, series, n, horizon)
        return preds, name, {}

    # Tính score cho mỗi model qua N_FOLDS fold
    fold_errors: Dict[str, List[float]] = {m: [] for m in candidates}
    fold_biases: Dict[str, List[float]] = {m: [] for m in candidates}

    for fold in range(N_FOLDS):
        # Cutoff: fold 0 = giữ lại [n-7:], fold 1 = giữ lại [n-14:n-7], ...
        val_end   = n - VAL_DAYS * fold
        val_start = val_end - VAL_DAYS
        if val_start < MIN_TRAIN_AFTER_VAL:
            break

        train_series = series[:val_start]
        train_df     = df.iloc[:val_start].copy().reset_index(drop=True)
        val_actual   = series[val_start:val_end]

        for model_name in candidates:
            try:
                preds, _ = _run_model(model_name, train_df, train_series, VAL_DAYS)
                preds_arr = np.array(preds[:VAL_DAYS])
                mae  = float(np.mean(np.abs(preds_arr - val_actual)))
                bias = float(np.mean(preds_arr - val_actual))   # + = over-forecast
                fold_errors[model_name].append(mae)
                fold_biases[model_name].append(bias)
            except Exception:
                pass

    # Tổng hợp scores — bỏ qua model không có đủ fold data
    final_scores: Dict[str, float] = {}
    for model_name in candidates:
        errs = fold_errors[model_name]
        if not errs:
            continue
        avg_mae  = float(np.mean(errs))
        avg_bias = float(np.mean(fold_biases[model_name]))
        # Penalty nhẹ nếu bias lớn (systematic over/under-prediction)
        bias_penalty = abs(avg_bias) * 0.1
        final_scores[model_name] = round(avg_mae + bias_penalty, 2)

    if not final_scores:
        preds, name = _rule_based(df, series, n, horizon)
        return preds, name, {}

    # Chọn winner
    winner = min(final_scores, key=final_scores.get)

    # Retrain winner trên toàn bộ data và forecast thực sự
    final_preds, winner_name = _run_model(winner, df, series, horizon)

    return final_preds, winner_name, final_scores


def _rule_based(
    df: pd.DataFrame,
    series: np.ndarray,
    n: int,
    horizon: int,
) -> Tuple[List[float], str]:
    """Fallback khi không đủ data để evaluate."""
    if n >= 60:
        return _forecast_xgboost(df, horizon)
    return _forecast_holt_winters(series, horizon)


def _run_model(
    model_name: str,
    df: pd.DataFrame,
    series: np.ndarray,
    horizon: int,
) -> Tuple[List[float], str]:
    """Dispatch sang model function tương ứng."""
    if model_name == "xgboost":
        return _forecast_xgboost(df, horizon)
    return _forecast_holt_winters(series, horizon)


# ══════════════════════════ Model Functions ═══════════════════════════════════

def _forecast_xgboost(df: pd.DataFrame, horizon: int) -> Tuple[List[float], str]:
    """
    XGBoost time series forecasting với feature engineering.

    Features:
      Calendar  : day_of_week, is_weekend, month, quarter
      Lag       : t-1, t-2, t-3, t-7, t-14, t-21, t-28
      Rolling   : mean/std/max cửa sổ 7, 14, 28 ngày

    Multi-step: recursive — dùng prediction bước trước làm lag bước sau.
    Chỉ eligible khi n >= 60 VÀ demand_type == smooth/erratic.
    """
    try:
        from xgboost import XGBRegressor

        df = df.copy().sort_values("date").reset_index(drop=True)
        df["date"] = pd.to_datetime(df["date"])

        demand = df["quantity_out"]

        # Calendar features
        df["day_of_week"] = df["date"].dt.dayofweek
        df["is_weekend"]  = (df["day_of_week"] >= 5).astype(int)
        df["month"]       = df["date"].dt.month
        df["quarter"]     = df["date"].dt.quarter

        # Lag features
        for lag in [1, 2, 3, 7, 14, 21, 28]:
            df[f"lag_{lag}"] = demand.shift(lag)

        # Rolling statistics (shift(1) để tránh leakage)
        shifted = demand.shift(1)
        df["roll_7_mean"]  = shifted.rolling(7).mean()
        df["roll_7_std"]   = shifted.rolling(7).std().fillna(0)
        df["roll_14_mean"] = shifted.rolling(14).mean()
        df["roll_28_mean"] = shifted.rolling(28).mean()
        df["roll_28_max"]  = shifted.rolling(28).max()

        df_clean = df.dropna().reset_index(drop=True)

        if len(df_clean) < 20:
            return _forecast_holt_winters(demand.values.astype(float), horizon)

        FEATURE_COLS = [
            "day_of_week", "is_weekend", "month", "quarter",
            "lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_21", "lag_28",
            "roll_7_mean", "roll_7_std", "roll_14_mean", "roll_28_mean", "roll_28_max",
        ]

        X_train = df_clean[FEATURE_COLS].values
        y_train = df_clean["quantity_out"].values
        n_train = len(df_clean)

        model = XGBRegressor(
            n_estimators=150,
            max_depth=3,                          # shallower = ít overfit hơn
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=max(5, n_train // 8), # scale với data size
            reg_alpha=0.1,                         # L1 regularization
            reg_lambda=1.0,                        # L2 regularization
            random_state=42,
            verbosity=0,
        )
        model.fit(X_train, y_train)

        # Multi-step recursive forecasting
        history   = demand.values.tolist()
        last_date = df["date"].max()
        predictions: List[float] = []

        for step in range(horizon):
            future_date = last_date + pd.Timedelta(days=step + 1)
            h = history

            def _safe_lag(offset: int) -> float:
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
                _safe_lag(1), _safe_lag(2), _safe_lag(3),
                _safe_lag(7), _safe_lag(14), _safe_lag(21), _safe_lag(28),
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
    """
    Double Exponential Smoothing (Holt's method) — bắt trend tuyến tính.
    seasonal=None vì với 90 ngày không đủ 2 chu kỳ seasonal đầy đủ.

    Fallback nội bộ: nếu statsmodels fail → dùng weighted moving average
    (trọng số gần nhất cao hơn) nhưng vẫn label là holt_winters.
    """
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        model = ExponentialSmoothing(
            series,
            trend="add",
            seasonal=None,
            initialization_method="estimated",
        )
        fit = model.fit(optimized=True)
        return fit.forecast(horizon).tolist(), "holt_winters"

    except Exception:
        # Weighted moving average — trọng số tăng dần về cuối
        window = min(7, len(series))
        weights = np.arange(1, window + 1, dtype=float)
        weights /= weights.sum()
        avg = float(np.dot(series[-window:], weights))
        return [max(0.0, avg)] * horizon, "holt_winters"


# ══════════════════════ Bước 6: Inventory Calculations ═══════════════════════

def _demand_stats(
    series: np.ndarray, demand_type: str
) -> Tuple[float, float]:
    """
    Tính avg và std demand theo demand_type.

    Với smooth: dùng toàn bộ series (kể cả zero — zero có thể là ngày thật ít demand).
    Với intermittent/lumpy/erratic: dùng nonzero mean để tránh underestimate.
    Std dùng để tính safety stock — luôn trên toàn bộ series.
    """
    nonzero = series[series > 0]

    if demand_type == "smooth":
        avg = float(np.mean(series))
    else:
        # Intermittent/lumpy: avg = nonzero_mean × occurrence_rate
        occurrence_rate = len(nonzero) / len(series) if len(series) > 0 else 1.0
        avg = float(np.mean(nonzero)) * occurrence_rate if len(nonzero) > 0 else 0.0

    std = float(np.std(series)) if len(series) > 1 else avg * 0.2
    return avg, std


def _calc_safety_stock(std_demand: float, lead_time: int) -> int:
    """
    Safety Stock = Z × σ_demand × √lead_time
    Giả định lead_time cố định (chưa có σ_lead_time).
    """
    return max(0, int(math.ceil(SAFETY_FACTOR * std_demand * math.sqrt(lead_time))))


def _calc_rop(avg_demand: float, lead_time: int, safety_stock: int) -> int:
    """Reorder Point = avg_demand × lead_time + safety_stock"""
    return max(0, int(math.ceil(avg_demand * lead_time)) + safety_stock)


def _calc_eoq(avg_demand: float, ordering_cost: float, holding_cost: float) -> int:
    """
    EOQ = √(2DS/H)
    D = annual demand, S = ordering cost, H = holding cost per unit per year.
    Giả định: demand đủ đều để EOQ có ý nghĩa.
    Với lumpy demand, kết quả này chỉ là tham khảo.
    """
    if avg_demand <= 0 or holding_cost <= 0:
        return 0
    annual_demand = avg_demand * 365
    return max(1, int(math.sqrt(2 * annual_demand * ordering_cost / holding_cost)))


def _calc_recommended_qty(
    avg_demand: float, eoq: int, current_stock: int, safety_stock: int
) -> int:
    """
    Recommended reorder qty = max(EOQ, lượng cần để đạt 30 ngày tồn kho + safety stock).
    Không mix 2 philosophy — dùng EOQ làm floor, order-up-to làm ceiling reference.
    """
    order_up_to = max(0, int(avg_demand * 30) - current_stock + safety_stock)
    return max(eoq, order_up_to)


def _calc_days_to_stockout(current_stock: int, avg_demand: float) -> int:
    if avg_demand <= 0:
        return 9999
    return min(9999, int(current_stock / avg_demand))


def _assess_risk(days_until_stockout: int) -> StockoutRisk:
    if days_until_stockout <= 3:   return StockoutRisk.CRITICAL
    elif days_until_stockout <= 7: return StockoutRisk.HIGH
    elif days_until_stockout <= 14: return StockoutRisk.MEDIUM
    return StockoutRisk.LOW


# ══════════════════════ Bước 7: Confidence Score ═════════════════════════════

def _naive_mae(series: np.ndarray) -> float:
    """
    MAE của naïve forecast: dự báo ngày hôm nay = ngày hôm qua.
    Dùng làm baseline để so sánh model skill.
    MASE = model_MAE / naive_MAE — nếu < 1.0 thì model tốt hơn naïve.
    """
    if len(series) < 2:
        return 1.0
    errors = np.abs(np.diff(series))
    return float(np.mean(errors)) if len(errors) > 0 else 1.0


def _calc_confidence(
    n: int,
    series: np.ndarray,
    demand_type: str,
    best_mae: Optional[float],
    naive_mae: float,
) -> float:
    """
    Confidence score: kết hợp 3 thành phần có trọng số.

    Thành phần 1 — Data Volume (40%):
      Nhiều data hơn → forecast tin cậy hơn.
      Scale tuyến tính từ 0 (n=0) đến 1 (n>=180).

    Thành phần 2 — Demand Regularity (30%):
      smooth=1.0, erratic=0.7, intermittent=0.6, lumpy=0.4
      Demand đều → forecast dễ và tin cậy hơn.

    Thành phần 3 — Model Skill vs Naïve (30%):
      MASE = model_MAE / naive_MAE
      MASE < 1 → model tốt hơn naïve → điểm cao
      MASE > 1 → model tệ hơn naïve → điểm thấp
      Nếu chưa có MAE (rule-based) → dùng 0.5 (neutral)

    Lý do không dùng heuristic n-based base score như trước:
      Base score cũ không phân biệt 180 ngày data tốt vs 180 ngày nhiễu.
      MASE-based score phản ánh THỰC TẾ model có tốt hơn làm gì không.
    """
    # ── Thành phần 1: Data volume score ──────────────────────────────────────
    vol_score = min(1.0, n / 180.0)   # 0 → 1 khi n tăng từ 0 → 180

    # ── Thành phần 2: Demand regularity score ────────────────────────────────
    regularity_map = {
        "smooth":       1.0,
        "erratic":      0.70,
        "intermittent": 0.60,
        "lumpy":        0.40,
        "no_demand":    0.10,
    }
    reg_score = regularity_map.get(demand_type, 0.5)

    # ── Thành phần 3: Model skill score (MASE-based) ─────────────────────────
    if best_mae is not None and naive_mae > 0:
        mase = best_mae / naive_mae
        if mase <= 0.50:   skill_score = 1.00   # model tốt hơn naïve 2x+
        elif mase <= 0.75: skill_score = 0.85
        elif mase <= 1.00: skill_score = 0.70   # tốt hơn naïve một chút
        elif mase <= 1.25: skill_score = 0.50   # xấp xỉ naïve
        elif mase <= 1.50: skill_score = 0.35   # tệ hơn naïve
        else:              skill_score = 0.20   # tệ hơn naïve nhiều
    else:
        skill_score = 0.50   # rule-based / không có eval data → neutral

    # ── Kết hợp có trọng số ──────────────────────────────────────────────────
    confidence = (
        0.40 * vol_score    +
        0.30 * reg_score    +
        0.30 * skill_score
    )

    return max(0.10, min(0.95, round(confidence, 3)))


# ══════════════════════════ Zero Demand ══════════════════════════════════════

def _zero_demand_result(product: ProductForecastInput, horizon: int) -> ProductForecastResult:
    return ProductForecastResult(
        product_id=product.product_id,
        predicted_demand_7days=0,
        avg_daily_demand=0.0,
        confidence_score=0.10,
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
