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

    // ========== EMPLOYEE INFO ==========
    private Long employeeId;
    private String employeeCode;      // ✅ THÊM
    private String employeeName;
    private String departmentName;
    private String positionName;      // ✅ THÊM

    // ========== KỲ LƯƠNG ==========
    private Integer month;
    private Integer year;

    // ========== NGÀY CÔNG ==========
    private Integer workDays;         // Ngày công chuẩn
    private Integer actualWorkDays;   // Ngày công thực tế
    private Integer leaveDays;        // Ngày nghỉ phép
    private Double overtimeHours;     // Giờ tăng ca

    // ========== THU NHẬP ==========
    private BigDecimal baseSalary;    // Lương cơ bản
    private BigDecimal bonus;         // Tổng thưởng (KPI + doanh số + khác)
    private BigDecimal allowance;     // Tổng phụ cấp
    private BigDecimal overtimePay;   // Lương tăng ca

    // ========== KHẤU TRỪ ==========
    private BigDecimal deduction;     // Tổng khấu trừ (BHXH + thuế + phạt)

    // ========== TỔNG ==========
    private BigDecimal totalSalary;   // Thực lĩnh

    // ========== TRẠNG THÁI ==========
    private Boolean isPaid;
    private LocalDate paidDate;

    // ========== KHÁC ==========
    private String note;
    private LocalDateTime createdDate;
}