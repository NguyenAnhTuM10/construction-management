package com.example.construction_management.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO Spring Boot gửi sang AI service.
 * Dùng @JsonProperty để map camelCase Java → snake_case Python.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiForecastRequestDTO {

    @JsonProperty("forecast_horizon_days")
    @Builder.Default
    private int forecastHorizonDays = 7;

    @JsonProperty("products")
    private List<ProductForecastInput> products;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductForecastInput {

        @JsonProperty("product_id")
        private Long productId;

        @JsonProperty("product_name")
        private String productName;

        @JsonProperty("unit")
        private String unit;

        @JsonProperty("current_stock")
        private Integer currentStock;

        @JsonProperty("lead_time_days")
        @Builder.Default
        private int leadTimeDays = 3;

        @JsonProperty("ordering_cost")
        @Builder.Default
        private double orderingCost = 100000.0;

        @JsonProperty("holding_cost_per_unit")
        @Builder.Default
        private double holdingCostPerUnit = 500.0;

        @JsonProperty("daily_history")
        @Builder.Default
        private List<DailyData> dailyHistory = new ArrayList<>();

        // Feature 2: model tốt nhất từ lịch sử accuracy — null nếu chưa có đủ dữ liệu
        @JsonProperty("preferred_model")
        private String preferredModel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyData {

        @JsonProperty("date")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate date;

        @JsonProperty("quantity_out")
        @Builder.Default
        private int quantityOut = 0;

        @JsonProperty("quantity_in")
        @Builder.Default
        private int quantityIn = 0;
    }
}
