package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReportResponse {
    private Long totalProducts;
    private Long activeProducts;
    private Integer totalQuantity;
    private BigDecimal totalValue;
    private Long lowStockProducts;
    private Long outOfStockProducts;
}