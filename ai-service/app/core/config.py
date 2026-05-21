import json
from pydantic import field_validator
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

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v


settings = Settings()
