package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;

    // Order info
    private Long orderId;
    private BigDecimal orderTotal;
    private BigDecimal orderPaidAmount;
    private BigDecimal orderRemainingDebt;
    private String orderPaymentStatus;

    // Customer info
    private Long customerId;
    private String customerName;

    // Payment info
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String reference;
    private String note;

    // Created by
    private String createdByUsername;
    private LocalDateTime createdDate;
}