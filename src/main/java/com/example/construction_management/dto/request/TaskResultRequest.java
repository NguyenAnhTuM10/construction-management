package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskResultRequest {
    @NotBlank(message = "Kết quả công việc không được để trống")
    @Size(max = 5000)
    private String result;
}