package com.example.construction_management.service;

import com.example.construction_management.dto.response.*;

import com.example.construction_management.enums.OrderStatus;
import com.example.construction_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;

    // ========== REVENUE REPORTS ==========

    public RevenueReportResponse getRevenueReport(Integer year, Integer month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        List<Object[]> results = orderRepository.getRevenueReport(
                OrderStatus.COMPLETED, startDate, endDate);

        if (results.isEmpty()) {
            return RevenueReportResponse.builder()
                    .year(year)
                    .month(month)
                    .startDate(startDate.toLocalDate())
                    .endDate(endDate.toLocalDate())
                    .totalRevenue(BigDecimal.ZERO)
                    .totalOrders(0L)
                    .averageOrderValue(BigDecimal.ZERO)
                    .totalCustomers(0L)
                    .build();
        }

        Object[] result = results.get(0);
        BigDecimal totalRevenue = (BigDecimal) result[0];
        Long totalOrders = (Long) result[1];
        Long totalCustomers = (Long) result[2];

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return RevenueReportResponse.builder()
                .year(year)
                .month(month)
                .startDate(startDate.toLocalDate())
                .endDate(endDate.toLocalDate())
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .averageOrderValue(avgOrderValue)
                .totalCustomers(totalCustomers)
                .build();
    }

    public List<RevenueByEmployeeResponse> getRevenueByEmployee(Integer year, Integer month) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (year != null && month != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1).atStartOfDay();
            endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        }

        List<Object[]> results = orderRepository.getRevenueByEmployee(
                OrderStatus.COMPLETED, startDate, endDate);

        return results.stream()
                .map(row -> {
                    Long employeeId = (Long) row[0];
                    String employeeName = (String) row[1];
                    String departmentName = (String) row[2];
                    BigDecimal totalRevenue = (BigDecimal) row[3];
                    Long totalOrders = (Long) row[4];

                    BigDecimal avgOrderValue = totalOrders > 0
                            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    return RevenueByEmployeeResponse.builder()
                            .employeeId(employeeId)
                            .employeeName(employeeName)
                            .departmentName(departmentName)
                            .totalRevenue(totalRevenue)
                            .totalOrders(totalOrders)
                            .averageOrderValue(avgOrderValue)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<RevenueByCustomerResponse> getRevenueByCustomer(Integer year, Integer month) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (year != null && month != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1).atStartOfDay();
            endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        }

        List<Object[]> results = orderRepository.getRevenueByCustomer(
                OrderStatus.COMPLETED, startDate, endDate);

        return results.stream()
                .map(row -> RevenueByCustomerResponse.builder()
                        .customerId((Long) row[0])
                        .customerName((String) row[1])
                        .email((String) row[2])
                        .phone((String) row[3])
                        .totalRevenue((BigDecimal) row[4])
                        .totalOrders((Long) row[5])
                        .currentDebt((BigDecimal) row[6])
                        .build())
                .collect(Collectors.toList());
    }

    public List<RevenueByProductResponse> getRevenueByProduct(Integer year, Integer month) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (year != null && month != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1).atStartOfDay();
            endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        }

        List<Object[]> results = orderRepository.getRevenueByProduct(
                OrderStatus.COMPLETED, startDate, endDate);

        return results.stream()
                .map(row -> {
                    Integer totalQty = ((Number) row[4]).intValue();
                    BigDecimal totalRevenue = (BigDecimal) row[5];

                    BigDecimal avgPrice = totalQty > 0
                            ? totalRevenue.divide(BigDecimal.valueOf(totalQty), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    return RevenueByProductResponse.builder()
                            .productId((Long) row[0])
                            .productCode((String) row[1])
                            .productName((String) row[2])
                            .categoryName((String) row[3])
                            .totalQuantitySold(totalQty)
                            .totalRevenue(totalRevenue)
                            .averagePrice(avgPrice)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<MonthlyRevenueResponse> getMonthlyRevenue(Integer year) {
        List<Object[]> results = orderRepository.getMonthlyRevenue(OrderStatus.COMPLETED, year);

        return results.stream()
                .map(row -> MonthlyRevenueResponse.builder()
                        .year(year)
                        .month((Integer) row[0])
                        .monthName(year + "-" + String.format("%02d", (Integer) row[0]))
                        .revenue((BigDecimal) row[1])
                        .orderCount((Long) row[2])
                        .build())
                .collect(Collectors.toList());
    }

    // ========== INVENTORY REPORTS ==========

    public InventoryReportResponse getInventorySummary() {
        Long totalProducts = productRepository.count();


        List<Object[]> stockResults = inventoryBalanceRepository.getInventorySummary();

        Integer totalQuantity = 0;
        BigDecimal totalValue = BigDecimal.ZERO;

        if (!stockResults.isEmpty()) {
            Object[] result = stockResults.get(0);
            totalQuantity = result[0] != null ? ((Number) result[0]).intValue() : 0;
            totalValue = result[1] != null ? (BigDecimal) result[1] : BigDecimal.ZERO;
        }

        Long lowStockProducts = inventoryBalanceRepository.countLowStockProducts(10);
        Long outOfStockProducts = inventoryBalanceRepository.countOutOfStockProducts();

        return InventoryReportResponse.builder()
                .totalProducts(totalProducts)

                .totalQuantity(totalQuantity)
                .totalValue(totalValue)
                .lowStockProducts(lowStockProducts)
                .outOfStockProducts(outOfStockProducts)
                .build();
    }

    public List<InventoryByWarehouseResponse> getInventoryByWarehouse() {
        List<Object[]> results = inventoryBalanceRepository.getInventoryByWarehouse();

        return results.stream()
                .map(row -> {
                    Integer totalQty = row[3] != null ? ((Number) row[3]).intValue() : 0;
                    BigDecimal totalValue = row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO;

                    return InventoryByWarehouseResponse.builder()
                            .warehouseId((Long) row[0])
                            .warehouseCode((String) row[1])
                            .warehouseName((String) row[2])
                            .productCount((Long) row[5])
                            .totalQuantity(totalQty)
                            .totalValue(totalValue)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ========== DEBT REPORTS ==========

    public List<DebtReportResponse> getCustomerDebtReport() {
        List<Object[]> results = customerRepository.getCustomerDebtReport();

        return results.stream()
                .map(row -> {
                    BigDecimal debt = (BigDecimal) row[4];
                    BigDecimal creditLimit = (BigDecimal) row[5];
                    BigDecimal availableCredit = creditLimit.subtract(debt);
                    Boolean isOverLimit = debt.compareTo(creditLimit) > 0;

                    return DebtReportResponse.builder()
                            .customerId((Long) row[0])
                            .customerName((String) row[1])
                            .email((String) row[2])
                            .phone((String) row[3])
                            .totalDebt(debt)
                            .creditLimit(creditLimit)
                            .availableCredit(availableCredit)
                            .totalOrders((Long) row[6])
                            .isOverLimit(isOverLimit)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<DebtReportResponse> getOverdueDebtReport() {
        List<DebtReportResponse> allDebts = getCustomerDebtReport();

        return allDebts.stream()
                .filter(debt -> debt.getTotalDebt().compareTo(BigDecimal.ZERO) > 0)
                .filter(DebtReportResponse::getIsOverLimit)
                .collect(Collectors.toList());
    }
}