package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.SalaryRequest;
import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.service.SalaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/salaries")
@RequiredArgsConstructor
@Tag(name = "Salary Management", description = "Quản lý bảng lương")
//@PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
public class SalaryController {

    private final SalaryService salaryService;

    @GetMapping
    @Operation(summary = "Lấy tất cả bảng lương")
    public ResponseEntity<ApiResponse<List<SalaryResponse>>> getAllSalaries() {
        return ResponseEntity.ok(ApiResponse.success(salaryService.getAllSalaries()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy bảng lương theo ID")
    public ResponseEntity<ApiResponse<SalaryResponse>> getSalaryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salaryService.getSalaryById(id)));
    }

    @GetMapping("/period")
    @Operation(summary = "Lấy bảng lương theo kỳ")
    public ResponseEntity<ApiResponse<List<SalaryResponse>>> getSalariesByPeriod(
            @RequestParam Integer month,
            @RequestParam Integer year) {
        return ResponseEntity.ok(ApiResponse.success(salaryService.getSalariesByPeriod(month, year)));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Lấy bảng lương theo nhân viên")
    public ResponseEntity<ApiResponse<List<SalaryResponse>>> getSalariesByEmployee(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(salaryService.getSalariesByEmployee(employeeId)));
    }

    @PostMapping
    @Operation(summary = "Tạo bảng lương mới")
    public ResponseEntity<ApiResponse<SalaryResponse>> createSalary(
            @Valid @RequestBody SalaryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(salaryService.createSalary(request), "Tạo bảng lương thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật bảng lương")
    public ResponseEntity<ApiResponse<SalaryResponse>> updateSalary(
            @PathVariable Long id,
            @Valid @RequestBody SalaryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(salaryService.updateSalary(id, request), "Cập nhật thành công"));
    }

    @PatchMapping("/{id}/pay")
    @Operation(summary = "Đánh dấu đã trả lương")
    public ResponseEntity<ApiResponse<SalaryResponse>> markAsPaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salaryService.markAsPaid(id), "Đã đánh dấu trả lương"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bảng lương")
    public ResponseEntity<ApiResponse<Void>> deleteSalary(@PathVariable Long id) {
        salaryService.deleteSalary(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa bảng lương"));
    }
}