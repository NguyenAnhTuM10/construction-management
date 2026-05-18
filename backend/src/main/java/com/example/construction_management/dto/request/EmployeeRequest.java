package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequest {

    @NotBlank(message = "Tên không được để trống")
    @Size(min = 2, max = 100, message = "Tên phải từ 2-100 ký tự")
    private String name;

    private String gender; // MALE, FEMALE

    private LocalDate birthDate;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Email(message = "Email không hợp lệ")
    private String email;

    @Pattern(regexp = "^[0-9]{9,12}$", message = "Số CCCD/CMND không hợp lệ")
    private String idCard;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    @NotNull(message = "Phòng ban không được để trống")
    private Long departmentId;

    @NotNull(message = "Lương cơ bản không được để trống")
    @DecimalMin(value = "0", message = "Lương không được âm")
    private BigDecimal baseSalary;

    @NotNull(message = "Ngày vào làm không được để trống")
    private LocalDate startDate;

    private LocalDate endDate;

    private String note;

    private Boolean active = true;
}