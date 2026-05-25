package com.example.construction_management.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO nhận kết quả trả về từ AI service.
 * Dùng @JsonProperty để map snake_case Python → camelCase Java.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiForecastResponseDTO {

    @JsonProperty("forecast_run_at")
    private LocalDateTime forecastRunAt;

    @JsonProperty("products_processed")
    private int productsProcessed;

    @JsonProperty("results")
    private List<ProductForecastResult> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductForecastResult {

        @JsonProperty("product_id")
        private Long productId;

        @JsonProperty("predicted_demand_7days")
        private int predictedDemand7Days;

        @JsonProperty("avg_daily_demand")
        private double avgDailyDemand;

        @JsonProperty("confidence_score")
        private double confidenceScore;

        @JsonProperty("stockout_risk")
        private String stockoutRisk;

        @JsonProperty("days_until_stockout")
        private int daysUntilStockout;

        @JsonProperty("reorder_point")
        private int reorderPoint;

        @JsonProperty("recommended_reorder_qty")
        private int recommendedReorderQty;

        @JsonProperty("safety_stock")
        private int safetyStock;

        @JsonProperty("eoq")
        private int eoq;

        @JsonProperty("daily_forecast")
        private List<Integer> dailyForecast;

        @JsonProperty("model_used")
        private String modelUsed;

        // MAE của từng model trên 7-day validation set.
        // Rỗng nếu không đủ data để evaluate (< 14 ngày).
        // Ví dụ: {"xgboost": 3.52, "holt_winters": 7.97, "linear_regression": 8.36}
        @JsonProperty("model_scores")
        private Map<String, Double> modelScores = new HashMap<>();
    }
}
