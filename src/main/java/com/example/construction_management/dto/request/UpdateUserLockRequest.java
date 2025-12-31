package com.example.construction_management.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserLockRequest {
    
    @NotNull(message = "Locked status is required")
    private Boolean locked;
}
