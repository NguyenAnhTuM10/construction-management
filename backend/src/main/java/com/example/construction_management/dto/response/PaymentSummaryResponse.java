package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSummaryResponse {
    private Long id;
    private Long orderId;
    private String customerName;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String createdByUsername;
}