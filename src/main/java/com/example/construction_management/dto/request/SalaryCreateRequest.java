package com.example.construction_management.dto.request;


import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO tạo bảng lương mới
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryCreateRequest {

    @NotNull(message = "ID nhân viên không được để trống")
    private Long employeeId;

    @NotNull(message = "Năm không được để trống")
    @Min(value = 2000, message = "Năm phải >= 2000")
    @Max(value = 2100, message = "Năm phải <= 2100")
    private Integer year;

    @NotNull(message = "Tháng không được để trống")
    @Min(value = 1, message = "Tháng phải từ 1-12")
    @Max(value = 12, message = "Tháng phải từ 1-12")
    private Integer month;

    @NotNull(message = "Số ngày công không được để trống")
    @Min(value = 0, message = "Số ngày công phải >= 0")
    @Max(value = 31, message = "Số ngày công phải <= 31")
    private Integer workDays;

    @DecimalMin(value = "0.0", inclusive = true, message = "Thưởng phải >= 0")
    private BigDecimal bonus;

    @DecimalMin(value = "0.0", inclusive = true, message = "Khấu trừ phải >= 0")
    private BigDecimal deduction;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;
}