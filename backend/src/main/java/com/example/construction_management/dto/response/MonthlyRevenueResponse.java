package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyRevenueResponse {
    private Integer year;
    private Integer month;
    private String monthName; // "2024-12"
    private BigDecimal revenue;
    private Long orderCount;
}