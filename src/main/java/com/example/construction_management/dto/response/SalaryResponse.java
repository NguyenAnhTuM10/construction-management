package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private Integer year;
    private Integer month;
    private Integer workDays;
    private BigDecimal basicSalary;
    private BigDecimal bonus;
    private BigDecimal deduction;
    private BigDecimal totalSalary;
    private Boolean isPaid;
    private LocalDateTime paidDate;
    private String note;
    private LocalDateTime createdDate;
}