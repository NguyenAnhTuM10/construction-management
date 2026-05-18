package com.example.construction_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateUserRoleRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Role name is required")
    private String roleName;
}
