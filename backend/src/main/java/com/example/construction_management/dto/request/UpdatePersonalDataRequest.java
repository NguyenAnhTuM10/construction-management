package com.example.construction_management.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO dùng để người dùng cập nhật thông tin cá nhân (self-service).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePersonalDataRequest {

    @Email(message = "EMAIL_INVALID")
    private String email;

    // Các trường liên quan đến Employee (ví dụ: Phone)
    private String phone;

    private String name;


}

//