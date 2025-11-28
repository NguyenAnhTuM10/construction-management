package com.example.construction_management.controller;


import com.example.construction_management.dto.ApiResponse;

import com.example.construction_management.dto.request.SalaryCreateRequest;
import com.example.construction_management.dto.request.SalaryUpdateRequest;
import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.dto.response.SalaryStatisticsResponse;
import com.example.construction_management.dto.response.SalarySummaryResponse;
import com.example.construction_management.service.SalaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Salary
 */
@RestController
@RequestMapping("/api/salaries")
@RequiredArgsConstructor
public class SalaryController {

    private final SalaryService salaryService;

    /**
     * Lấy tất cả bảng lương
     * GET /api/salaries
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<SalarySummaryResponse>> getAllSalaries() {
        List<SalarySummaryResponse> salaries = salaryService.getAllSalaries();
        return ApiResponse.success(salaries, "Lấy danh sách bảng lương thành công");
    }

    /**
     * Lấy chi tiết bảng lương theo ID
     * GET /api/salaries/{id}
     */
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<SalaryResponse> getSalaryById(@PathVariable Long id) {
        SalaryResponse salary = salaryService.getSalaryById(id);
        return ApiResponse.success(salary, "Lấy thông tin bảng lương thành công");
    }

    /**
     * Lấy bảng lương của nhân viên
     * GET /api/salaries/employee/{employeeId}
     */
    @GetMapping("/employee/{employeeId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<SalarySummaryResponse>> getSalariesByEmployee(
            @PathVariable Long employeeId) {
        List<SalarySummaryResponse> salaries = salaryService.getSalariesByEmployee(employeeId);
        return ApiResponse.success(salaries, "Lấy bảng lương theo nhân viên thành công");
    }

    /**
     * Lấy bảng lương theo tháng
     * GET /api/salaries/month?year=2025&month=1
     */
    @GetMapping("/month")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<SalarySummaryResponse>> getSalariesByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        List<SalarySummaryResponse> salaries = salaryService.getSalariesByMonth(year, month);
        return ApiResponse.success(salaries, "Lấy bảng lương theo tháng thành công");
    }

    /**
     * Lấy bảng lương chưa thanh toán
     * GET /api/salaries/unpaid
     */
    @GetMapping("/unpaid")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<SalarySummaryResponse>> getUnpaidSalaries() {
        List<SalarySummaryResponse> salaries = salaryService.getUnpaidSalaries();
        return ApiResponse.success(salaries, "Lấy bảng lương chưa thanh toán thành công");
    }

    /**
     * Thống kê lương theo tháng
     * GET /api/salaries/statistics?year=2025&month=1
     */
    @GetMapping("/statistics")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<SalaryStatisticsResponse> getStatisticsByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        SalaryStatisticsResponse statistics = salaryService.getStatisticsByMonth(year, month);
        return ApiResponse.success(statistics, "Lấy thống kê lương thành công");
    }

    /**
     * Tạo bảng lương mới
     * POST /api/salaries
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SalaryResponse> createSalary(
            @Valid @RequestBody SalaryCreateRequest request) {
        SalaryResponse salary = salaryService.createSalary(request);
        return ApiResponse.success(salary, "Tạo bảng lương thành công");
    }

    /**
     * Cập nhật bảng lương
     * PUT /api/salaries/{id}
     */
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<SalaryResponse> updateSalary(
            @PathVariable Long id,
            @Valid @RequestBody SalaryUpdateRequest request) {
        SalaryResponse salary = salaryService.updateSalary(id, request);
        return ApiResponse.success(salary, "Cập nhật bảng lương thành công");
    }

    /**
     * Đánh dấu đã thanh toán
     * POST /api/salaries/{id}/pay
     */
    @PostMapping("/{id}/pay")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<SalaryResponse> markAsPaid(@PathVariable Long id) {
        SalaryResponse salary = salaryService.markAsPaid(id);
        return ApiResponse.success(salary, "Đánh dấu đã thanh toán thành công");
    }

    /**
     * Hủy thanh toán
     * POST /api/salaries/{id}/unpay
     */
    @PostMapping("/{id}/unpay")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<SalaryResponse> markAsUnpaid(@PathVariable Long id) {
        SalaryResponse salary = salaryService.markAsUnpaid(id);
        return ApiResponse.success(salary, "Hủy thanh toán thành công");
    }

    /**
     * Xóa bảng lương (chỉ khi chưa thanh toán)
     * DELETE /api/salaries/{id}
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteSalary(@PathVariable Long id) {
        salaryService.deleteSalary(id);
        return ApiResponse.success("Xóa bảng lương thành công");
    }
}