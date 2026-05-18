package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.response.*;
import com.example.construction_management.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Business reports and analytics")
public class ReportController {
    private final ReportService reportService;
// ========== REVENUE REPORTS ==========

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get revenue report by month")
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenueReport(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getRevenueReport(year, month)));
    }

    @GetMapping("/revenue/by-employee")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get revenue by employee")
    public ResponseEntity<ApiResponse<List<RevenueByEmployeeResponse>>> getRevenueByEmployee(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getRevenueByEmployee(year, month)));
    }

    @GetMapping("/revenue/by-customer")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get revenue by customer")
    public ResponseEntity<ApiResponse<List<RevenueByCustomerResponse>>> getRevenueByCustomer(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getRevenueByCustomer(year, month)));
    }

    @GetMapping("/revenue/by-product")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get revenue by product")
    public ResponseEntity<ApiResponse<List<RevenueByProductResponse>>> getRevenueByProduct(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getRevenueByProduct(year, month)));
    }

    @GetMapping("/revenue/monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get monthly revenue for a year")
    public ResponseEntity<ApiResponse<List<MonthlyRevenueResponse>>> getMonthlyRevenue(
            @RequestParam Integer year) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getMonthlyRevenue(year)));
    }

// ========== INVENTORY REPORTS ==========

    @GetMapping("/inventory/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get inventory summary")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> getInventorySummary() {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getInventorySummary()));
    }

    @GetMapping("/inventory/by-warehouse")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get inventory by warehouse")
    public ResponseEntity<ApiResponse<List<InventoryByWarehouseResponse>>> getInventoryByWarehouse() {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getInventoryByWarehouse()));
    }

// ========== DEBT REPORTS ==========

    @GetMapping("/debt/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get customer debt report")
    public ResponseEntity<ApiResponse<List<DebtReportResponse>>> getCustomerDebtReport() {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getCustomerDebtReport()));
    }

    @GetMapping("/debt/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get overdue debt report (customers over credit limit)")
    public ResponseEntity<ApiResponse<List<DebtReportResponse>>> getOverdueDebtReport() {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getOverdueDebtReport()));
    }

}