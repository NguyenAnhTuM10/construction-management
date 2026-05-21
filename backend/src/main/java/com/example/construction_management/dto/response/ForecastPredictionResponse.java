package com.example.construction_management.dto.response;

import com.example.construction_management.enums.StockoutRisk;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastPredictionResponse {

    private Long id;

    // Thông tin sản phẩm
    private Long productId;
    private String productName;
    private String productCode;
    private String unit;

    // Kết quả dự báo
    private LocalDate forecastDate;
    private Integer predictedDemand7Days;
    private Double avgDailyDemand;
    private List<Integer> dailyForecast;

    // Trạng thái tồn kho
    private Integer currentStock;
    private Integer safetyStock;
    private Integer reorderPoint;
    private Integer recommendedReorderQty;
    private Integer eoq;

    // Đánh giá rủi ro
    private StockoutRisk stockoutRisk;
    private Integer daysUntilStockout;

    // Metadata
    private Double confidenceScore;
    private String modelUsed;
    private LocalDateTime createdAt;

    // Accuracy (null nếu chưa đủ 7 ngày để đánh giá)
    private Integer actualDemand7Days;
    private Double mape;
    private Double mae;
}
