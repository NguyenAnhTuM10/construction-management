package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusUpdateRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // TODO, IN_PROGRESS, COMPLETED, CANCELLED
}