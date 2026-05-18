package com.example.construction_management.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RevenueReportDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer employeeId;
    private String employeeName;
    private Integer totalOrders;
    private Integer paidOrders;
    private Integer pendingOrders;
    private BigDecimal totalRevenue;
    private BigDecimal pendingAmount;
}