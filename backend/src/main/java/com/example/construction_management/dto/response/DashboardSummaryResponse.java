package com.example.construction_management.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    // Doanh thu & Đơn hàng
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;
    private Long totalOrders;
    private Long pendingOrders;
    private Long completedOrders;
    private Long cancelledOrders;

    // Khách hàng
    private Long totalCustomers;
    private BigDecimal totalCustomerDebt;

    // Sản phẩm & Tồn kho
    private Long totalProducts;
    private Long lowStockProducts;
    private Long outOfStockProducts;

    // Nhân viên & Công việc
    private Long totalEmployees;
    private Long activeTasks;
    private Long overdueTasks;
    private Long completedTasks;

    // Lương
    private BigDecimal totalUnpaidSalary;
    private Long unpaidSalaryCount;
}