from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Dict, List, Optional
from enum import Enum


class StockoutRisk(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DailyData(BaseModel):
    date: date
    quantity_out: int = 0
    quantity_in: int = 0


class ProductForecastInput(BaseModel):
    product_id: int
    product_name: str
    unit: str = "unit"
    current_stock: int = 0
    lead_time_days: int = 3
    ordering_cost: float = 100000.0
    holding_cost_per_unit: float = 500.0
    daily_history: List[DailyData] = []
    # preferred_model: khi Spring Boot muốn force dùng model cụ thể (override evaluation)
    preferred_model: Optional[str] = None


class ForecastRequest(BaseModel):
    forecast_horizon_days: int = Field(default=7, ge=1, le=30)
    products: List[ProductForecastInput]


class ProductForecastResult(BaseModel):
    product_id: int
    predicted_demand_7days: int
    avg_daily_demand: float
    confidence_score: float
    stockout_risk: StockoutRisk
    days_until_stockout: int
    reorder_point: int
    recommended_reorder_qty: int
    safety_stock: int
    eoq: int
    daily_forecast: List[int]
    model_used: str
    # MAE của từng model trên validation set (rỗng nếu không đủ data để evaluate)
    # Ví dụ: {"xgboost": 3.2, "holt_winters": 5.1, "linear_regression": 6.8}
    model_scores: Dict[str, float] = Field(default_factory=dict)


class ForecastResponse(BaseModel):
    forecast_run_at: datetime
    products_processed: int
    results: List[ProductForecastResult]
