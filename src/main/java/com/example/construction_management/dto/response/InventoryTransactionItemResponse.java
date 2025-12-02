
// InventoryTransactionItemResponse.java
package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionItemResponse {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private String unit;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String note;
}