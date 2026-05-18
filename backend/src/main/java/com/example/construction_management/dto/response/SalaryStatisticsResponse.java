package com.example.construction_management.dto.response;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryStatisticsResponse {
    private Integer year;
    private Integer month;
    private BigDecimal totalSalary;
    private BigDecimal totalPaid;
    private BigDecimal totalUnpaid;
    private Long totalRecords;
    private Long paidRecords;
    private Long unpaidRecords;
}