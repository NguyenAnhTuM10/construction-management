package com.example.construction_management.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LogoutRequest {
    @NotBlank(message = "Refresh token must not be empty")
    private String refreshToken;
}