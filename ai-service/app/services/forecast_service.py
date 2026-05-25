"""
Forecast Service — logic dự báo tồn kho.

Chiến lược chọn model theo lượng dữ liệu lịch sử:
  >= 60 ngày  → XGBoost (gradient boosting + feature engineering)
  >= 14 ngày  → Holt-Winters (trend + level)
   7–13 ngày  → Linear Regression
    < 7 ngày  → Simple Moving Average (3 ngày gần nhất)

Tại sao XGBoost cần >= 60 ngày?
- Lag feature lớn nhất là lag_28 → cần 28 hàng "warmup"
- Sau khi dropna(), cần ít nhất 30 samples để train có ý nghĩa
- 60 ngày = 30 samples dùng được sau khi loại NaN từ lag features
"""

import math
from datetime import datetime
from typing import List, Tuple

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

SAFETY_FACTOR = 1.65  # Z-score cho service level 95%


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

    # ── Chọn model: ưu tiên preferred_model từ lịch sử accuracy ─────────────
    daily_preds, model_name = _select_and_run_model(
        df, demand_series, n, horizon, product.preferred_model
    )

    daily_preds = [max(0, int(round(p))) for p in daily_preds]

    avg_demand = float(np.mean(demand_series))
    std_demand = float(np.std(demand_series)) if n > 1 else avg_demand * 0.2

    safety_stock        = _calc_safety_stock(std_demand, product.lead_time_days)
    reorder_point       = _calc_rop(avg_demand, product.lead_time_days, safety_stock)
    eoq                 = _calc_eoq(avg_demand, product.ordering_cost, product.holding_cost_per_unit)
    days_until_stockout = _calc_days_to_stockout(product.current_stock, avg_demand)
    stockout_risk       = _assess_risk(days_until_stockout)
    confidence          = _calc_confidence(n, demand_series, model_name)

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
    )


# ═══════════════════════ Model Selection ════════════════════════════════════

# Số ngày tối thiểu mỗi model cần để chạy được
_MODEL_MIN_DAYS = {
    "xgboost": 60,
    "holt_winters": 14,
    "linear_regression": 7,
    "simple_moving_average": 0,
}


def _select_and_run_model(
    df, demand_series: np.ndarray, n: int, horizon: int, preferred_model: str | None
) -> Tuple[List[float], str]:
    """
    Dùng preferred_model nếu có đủ dữ liệu.
    Fallback về logic chọn theo số ngày nếu không có hoặc không đủ data.
    """
    if preferred_model and preferred_model in _MODEL_MIN_DAYS:
        min_days = _MODEL_MIN_DAYS[preferred_model]
        if n >= min_days:
            if preferred_model == "xgboost":
                return _forecast_xgboost(df, horizon)
            elif preferred_model == "holt_winters":
                return _forecast_holt_winters(demand_series, horizon)
            elif preferred_model == "linear_regression":
                return _forecast_linear_regression(demand_series, horizon)
            else:
                return _forecast_sma(demand_series, horizon)

    # Default: chọn theo lượng data
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
        # shift(1): dùng giá trị hôm qua để predict hôm nay
        # (tránh data leakage — không dùng giá trị cùng ngày)
        demand = df["quantity_out"]
        for lag in [1, 2, 3, 7, 14, 21, 28]:
            df[f"lag_{lag}"] = demand.shift(lag)

        # ── Rolling statistics ────────────────────────────────────────────────
        shifted = demand.shift(1)  # shift để tránh leakage
        df["roll_7_mean"]  = shifted.rolling(7).mean()
        df["roll_7_std"]   = shifted.rolling(7).std().fillna(0)
        df["roll_14_mean"] = shifted.rolling(14).mean()
        df["roll_28_mean"] = shifted.rolling(28).mean()
        df["roll_28_max"]  = shifted.rolling(28).max()

        # Drop NaN sinh ra từ lag features (28 hàng đầu)
        df_clean = df.dropna().reset_index(drop=True)

        if len(df_clean) < 20:
            # Không đủ samples sau khi dropna → fallback
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
            max_depth=4,           # Không quá sâu để tránh overfit trên data nhỏ
            learning_rate=0.05,
            subsample=0.8,         # Row subsampling
            colsample_bytree=0.8,  # Feature subsampling
            min_child_weight=5,    # Tránh overfit: node cần >= 5 samples
            random_state=42,
            verbosity=0,
        )
        model.fit(X_train, y_train)

        # ── Multi-step recursive forecasting ─────────────────────────────────
        # Giữ rolling history để tính lag/rolling cho các bước tương lai
        history    = demand.values.tolist()
        last_date  = df["date"].max()
        predictions = []

        for step in range(horizon):
            future_date = last_date + pd.Timedelta(days=step + 1)

            # Lấy lịch sử đủ dài cho rolling windows
            h = history  # alias ngắn

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
                _safe_get(1),   # lag_1
                _safe_get(2),   # lag_2
                _safe_get(3),   # lag_3
                _safe_get(7),   # lag_7
                _safe_get(14),  # lag_14
                _safe_get(21),  # lag_21
                _safe_get(28),  # lag_28
                _roll_mean(7),
                _roll_std(7),
                _roll_mean(14),
                _roll_mean(28),
                _roll_max(28),
            ]

            pred = max(0.0, float(model.predict(np.array([features]))[0]))
            predictions.append(pred)
            history.append(pred)  # dùng dự báo làm lag cho bước sau

        return predictions, "xgboost"

    except Exception:
        # Bất kỳ lỗi nào → fallback về Holt-Winters
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


def _calc_confidence(n: int, series: np.ndarray, model_used: str) -> float:
    """
    Confidence score phản ánh độ tin cậy của dự báo.
    XGBoost với nhiều data được bonus thêm vì model phức tạp hơn.
    """
    if n >= 180:
        base = 0.88
    elif n >= 90:
        base = 0.82
    elif n >= 60:
        base = 0.75
    elif n >= 30:
        base = 0.65
    elif n >= 14:
        base = 0.55
    elif n >= 7:
        base = 0.40
    else:
        base = 0.25

    mean = np.mean(series)
    if mean > 0:
        cv = np.std(series) / mean
        base -= min(cv, 1.0) * 0.20

    return max(0.1, round(base, 3))


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
    )
