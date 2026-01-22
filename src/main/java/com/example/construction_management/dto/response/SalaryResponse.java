package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryResponse {

    private Long id;

    // Employee info
    private Long employeeId;
    private String employeeName;
    private String departmentName;

    // Kỳ lương
    private Integer month;
    private Integer year;

    // Ngày công
    private Integer workDays;
    private Integer actualWorkDays;
    private Integer leaveDays;
    private Double overtimeHours;

    // Thu nhập
    private BigDecimal baseSalary;
    private BigDecimal bonus;
    private BigDecimal allowance;
    private BigDecimal overtimePay;

    // Khấu trừ
    private BigDecimal deduction;

    // Tổng
    private BigDecimal totalSalary;

    // Trạng thái
    private Boolean isPaid;
    private LocalDate paidDate;

    private String note;
    private LocalDateTime createdDate;
}