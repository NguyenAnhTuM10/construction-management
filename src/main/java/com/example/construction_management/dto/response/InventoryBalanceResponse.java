// InventoryBalanceResponse.java
package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBalanceResponse {
    private Long id;
    private Long warehouseId;
    private String warehouseCode;
    private String warehouseName;
    private Long productId;
    private String productCode;
    private String productName;
    private String unit;
    private Integer quantity;
    private BigDecimal averageCost;
    private BigDecimal totalValue;
    private LocalDateTime lastUpdated;
}