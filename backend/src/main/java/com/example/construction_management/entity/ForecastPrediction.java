package com.example.construction_management.entity;

import com.example.construction_management.enums.StockoutRisk;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "forecast_predictions",
    indexes = {
        @Index(name = "idx_forecast_product_date", columnList = "product_id, forecast_date"),
        @Index(name = "idx_forecast_date", columnList = "forecast_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDate forecastDate;

    private Integer predictedDemand7Days;
    private Double avgDailyDemand;
    private Integer currentStock;
    private Integer safetyStock;
    private Integer reorderPoint;
    private Integer recommendedReorderQty;
    private Integer eoq;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StockoutRisk stockoutRisk;

    private Double confidenceScore;
    private Integer daysUntilStockout;

    @Column(length = 50)
    private String modelUsed;

    // JSON array: [45, 52, 48, 55, 50, 47, 53] — dự báo từng ngày trong 7 ngày tới
    @Column(columnDefinition = "TEXT")
    private String dailyForecastJson;

    // Accuracy tracking — điền sau 7 ngày bởi AccuracyEvaluationScheduler
    private Integer actualDemand7Days;
    private Double mape;
    private Double mae;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
