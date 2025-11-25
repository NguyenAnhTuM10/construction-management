package com.example.construction_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO dùng để người dùng đổi mật khẩu.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "PASSWORD_INVALID")
    private String oldPassword;

    @NotBlank(message = "PASSWORD_INVALID")
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String newPassword;

    @NotBlank(message = "PASSWORD_INVALID")
    private String confirmPassword;
}