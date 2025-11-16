package com.example.construction_management.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EmployeeDTO {
    private Integer id;

    @NotBlank(message = "Employee name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 20)
    private String phone;

    private Integer departmentId;
    private String departmentName;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal salary;

    private LocalDate hireDate;
}