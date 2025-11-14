package com.example.construction_management.dto.response;

// Giả định đặt trong package com.example.construction_management.dto

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {
    private Long id;
    private String username;
    private String email;
}