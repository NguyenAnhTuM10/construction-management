package com.example.construction_management.dto.response;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalarySummaryResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Integer year;
    private Integer month;
    private Integer workDays;
    private BigDecimal totalSalary;
    private Boolean isPaid;
    private LocalDateTime createdDate;
}