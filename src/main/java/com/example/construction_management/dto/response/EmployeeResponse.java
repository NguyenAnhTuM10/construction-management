package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO chứa thông tin chi tiết của nhân viên.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {

    private Long id;
    private String name;
    private String phone;
    private String departmentName;
    private BigDecimal salary;
    private LocalDate hireDate;
}