package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.EmployeeRequest;
import com.example.construction_management.dto.response.EmployeeResponse;
import com.example.construction_management.service.EmployeeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/employees")
@Tag(name = "Employee Management", description = "Endpoints for managing employee records (Admin/Manager only)")
@PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')") // Bảo vệ toàn bộ Controller
public class EmployeeController {

    private final EmployeeService employeeService;

    // GET /employees
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees() {
        List<EmployeeResponse> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(ApiResponse.success(employees, "Employee list retrieved successfully"));
    }

    // GET /employees/{id}
    @GetMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(@PathVariable Long employeeId) {
        // Lỗi USER_NOT_FOUND sẽ được GlobalExceptionHandler xử lý
        EmployeeResponse employee = employeeService.getEmployeeById(employeeId);
        return ResponseEntity.ok(ApiResponse.success(employee, "Employee retrieved successfully"));
    }

    // POST /employees
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        // Validation lỗi sẽ được GlobalExceptionHandler xử lý
        EmployeeResponse newEmployee = employeeService.createEmployee(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(newEmployee, "Employee created successfully"));
    }

    // PUT /employees/{id}
    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long employeeId,
            @Valid @RequestBody EmployeeRequest request) {

        EmployeeResponse updatedEmployee = employeeService.updateEmployee(employeeId, request);
        return ResponseEntity.ok(ApiResponse.success(updatedEmployee, "Employee updated successfully"));
    }

    // DELETE /employees/{id}
    @DeleteMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long employeeId) {
        // Lỗi USER_NOT_FOUND sẽ được GlobalExceptionHandler xử lý
        employeeService.deleteEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success(null, "Employee deleted successfully"));
    }
}