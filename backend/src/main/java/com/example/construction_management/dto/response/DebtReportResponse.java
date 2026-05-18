package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebtReportResponse {
    private Long customerId;
    private String customerName;
    private String email;
    private String phone;
    private BigDecimal totalDebt;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
    private Long totalOrders;
    private Boolean isOverLimit;
}