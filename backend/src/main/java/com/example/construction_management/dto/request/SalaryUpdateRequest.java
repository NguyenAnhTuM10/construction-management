package com.example.construction_management.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryUpdateRequest {

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