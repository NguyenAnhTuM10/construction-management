package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    @NotNull(message = "Order ID không được để trống")
    private Long orderId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Ngày thanh toán không được để trống")
    private LocalDateTime paymentDate;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // CASH, BANK_TRANSFER, CHEQUE

    @Size(max = 100)
    private String reference;

    @Size(max = 1000)
    private String note;
}