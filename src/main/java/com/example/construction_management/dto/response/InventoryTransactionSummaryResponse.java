// InventoryTransactionSummaryResponse.java
package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionSummaryResponse {
    private Long id;
    private String transactionCode;
    private String warehouseName;
    private String type;
    private String reason;
    private LocalDateTime transactionDate;
    private String status;
    private BigDecimal totalAmount;
    private Integer itemCount;
}