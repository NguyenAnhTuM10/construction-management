// InventoryTransactionResponse.java
package com.example.construction_management.dto.response;

import com.example.construction_management.dto.response.InventoryTransactionItemResponse;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionResponse {
    private Long id;
    private String transactionCode;
    private Long warehouseId;
    private String warehouseName;
    private String type;
    private String reason;
    private Long supplierId;
    private String supplierName;
    private Long orderId;
    private LocalDateTime transactionDate;
    private String status;
    private BigDecimal totalAmount;
    private String note;
    private String createdByUsername;
    private LocalDateTime createdDate;
    private List<InventoryTransactionItemResponse> items;
}
