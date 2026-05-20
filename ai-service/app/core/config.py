from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "AI Forecast Service"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Inventory calculation defaults
    DEFAULT_LEAD_TIME_DAYS: int = 3
    DEFAULT_ORDERING_COST: float = 100000.0
    DEFAULT_HOLDING_COST_PER_UNIT: float = 500.0
    FORECAST_HORIZON_DAYS: int = 7

    model_config = {"env_file": ".env"}


settings = Settings()
