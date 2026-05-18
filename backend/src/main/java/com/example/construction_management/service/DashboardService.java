package com.example.construction_management.service;

import com.example.construction_management.dto.response.DashboardSummaryResponse;

import com.example.construction_management.enums.OrderStatus;
import com.example.construction_management.enums.TaskStatus;
import com.example.construction_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final TaskRepository taskRepository;
    private final SalaryRepository salaryRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;

    public DashboardSummaryResponse getDashboardSummary() {
        // Current month
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        return DashboardSummaryResponse.builder()
                // Doanh thu & Đơn hàng
                .totalRevenue(calculateTotalRevenue())
                .monthlyRevenue(calculateMonthlyRevenue(startOfMonth, endOfMonth))
                .totalOrders(orderRepository.count())
                .pendingOrders(orderRepository.countByStatus(OrderStatus.PENDING))
                .completedOrders(orderRepository.countByStatus(OrderStatus.COMPLETED))
                .cancelledOrders(orderRepository.countByStatus(OrderStatus.CANCELLED))

                // Khách hàng
                .totalCustomers(customerRepository.count())
                .totalCustomerDebt(calculateTotalCustomerDebt())

                // Sản phẩm & Tồn kho
                .totalProducts(productRepository.count())
                .lowStockProducts(inventoryBalanceRepository.countLowStockProducts(10))
                .outOfStockProducts(inventoryBalanceRepository.countOutOfStockProducts())

                // Nhân viên & Công việc
                .totalEmployees(employeeRepository.count())
                .activeTasks(taskRepository.countByStatus(TaskStatus.TODO) +
                        taskRepository.countByStatus(TaskStatus.IN_PROGRESS))
                .overdueTasks((long) taskRepository.findOverdueTasks(LocalDateTime.now()).size())
                .completedTasks(taskRepository.countByStatus(TaskStatus.COMPLETED))

                // Lương
                .totalUnpaidSalary(calculateTotalUnpaidSalary())
                .unpaidSalaryCount(salaryRepository.countByIsPaid(false))
                .build();
    }

    private BigDecimal calculateTotalRevenue() {
        BigDecimal total = orderRepository.sumTotalByStatus(OrderStatus.COMPLETED);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal calculateMonthlyRevenue(LocalDateTime start, LocalDateTime end) {
        BigDecimal total = orderRepository.sumTotalByStatusAndDateRange(
                OrderStatus.COMPLETED, start, end);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal calculateTotalCustomerDebt() {
        BigDecimal total = customerRepository.sumTotalDebt();
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal calculateTotalUnpaidSalary() {
        BigDecimal total = salaryRepository.sumTotalSalaryByIsPaid(false);
        return total != null ? total : BigDecimal.ZERO;
    }
}