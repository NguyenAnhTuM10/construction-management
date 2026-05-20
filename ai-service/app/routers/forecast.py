from fastapi import APIRouter, HTTPException
from app.models.schemas import ForecastRequest, ForecastResponse
from app.services.forecast_service import run_forecast
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/forecast", response_model=ForecastResponse)
def forecast(request: ForecastRequest) -> ForecastResponse:
    if not request.products:
        raise HTTPException(status_code=400, detail="Danh sách sản phẩm không được rỗng")

    logger.info("Received forecast request for %d products", len(request.products))

    result = run_forecast(request)

    logger.info("Forecast complete: %d results", result.products_processed)
    return result
