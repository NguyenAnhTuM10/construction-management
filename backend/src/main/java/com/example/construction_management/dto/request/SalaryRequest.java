package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryRequest {

    @NotNull(message = "Employee ID không được để trống")
    private Long employeeId;

    @NotNull(message = "Tháng không được để trống")
    @Min(value = 1, message = "Tháng phải từ 1-12")
    @Max(value = 12, message = "Tháng phải từ 1-12")
    private Integer month;

    @NotNull(message = "Năm không được để trống")
    @Min(value = 2020, message = "Năm không hợp lệ")
    private Integer year;

    @Min(value = 1, message = "Ngày công chuẩn tối thiểu là 1")
    @Max(value = 31, message = "Ngày công chuẩn tối đa là 31")
    private Integer workDays = 22;

    @Min(value = 0, message = "Ngày công thực tế không được âm")
    private Integer actualWorkDays = 22;

    @Min(value = 0)
    private Integer leaveDays = 0;

    @Min(value = 0)
    private Double overtimeHours = 0.0;

    @DecimalMin(value = "0", message = "Thưởng không được âm")
    private BigDecimal bonus;

    @DecimalMin(value = "0", message = "Phụ cấp không được âm")
    private BigDecimal allowance;

    @DecimalMin(value = "0", message = "Khấu trừ không được âm")
    private BigDecimal deduction;

    private String note;
}