import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import forecast
from app.core.config import settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="AI Inventory Forecast Service",
    description="Microservice dự báo nhu cầu tồn kho — dùng Holt-Winters / Linear Regression / SMA",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router, prefix="/api/v1", tags=["forecast"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "ai-forecast-service"}
