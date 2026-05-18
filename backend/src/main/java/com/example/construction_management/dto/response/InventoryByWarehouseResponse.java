package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryByWarehouseResponse {
    private Long warehouseId;
    private String warehouseCode;
    private String warehouseName;
    private Long productCount;
    private Integer totalQuantity;
    private BigDecimal totalValue;
}