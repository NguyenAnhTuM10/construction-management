package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRequest {
    @NotBlank(message = "Mã nhà cung cấp không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    @Size(max = 200)
    private String name;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Size(max = 500)
    private String address;

    @Email
    @Size(max = 100)
    private String email;

    private String note;
}