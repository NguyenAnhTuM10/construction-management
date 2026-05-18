package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueByCustomerResponse {
    private Long customerId;
    private String customerName;
    private String email;
    private String phone;
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private BigDecimal currentDebt;
}