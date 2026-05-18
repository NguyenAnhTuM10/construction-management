package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueByProductResponse {
    private Long productId;
    private String productCode;
    private String productName;
    private String categoryName;
    private Integer totalQuantitySold;
    private BigDecimal totalRevenue;
    private BigDecimal averagePrice;
}