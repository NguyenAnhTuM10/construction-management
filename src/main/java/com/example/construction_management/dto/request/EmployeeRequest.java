package com.example.construction_management.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO dùng để tạo hoặc cập nhật thông tin nhân viên (dành cho Admin/Manager).
 * Giả định: Các trường validation message sẽ được ánh xạ tới ErrorCode.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequest {

    @NotBlank(message = "USERNAME_INVALID") // Sử dụng ErrorCode cho validation message
    private String name;

    private String phone;

    // Giả định: Department ID
    @NotNull(message = "Department not exists") // Dùng tạm ROLE_NOT_FOUND để kiểm tra Department ID
    private String departmentName;

    @NotNull(message = "SALARY_INVALID")
    @DecimalMin(value = "0.00", inclusive = false, message = "SALARY_INVALID")
    private BigDecimal salary;

    @NotNull(message = "HIRE_DATE_INVALID")
    @PastOrPresent(message = "HIRE_DATE_INVALID")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate hireDate;
}