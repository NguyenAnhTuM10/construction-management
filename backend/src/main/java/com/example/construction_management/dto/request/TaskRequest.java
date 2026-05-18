package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    @NotNull(message = "Nhân viên được giao không được để trống")
    private Long assignedTo; // Employee ID

    @NotBlank(message = "Mức độ ưu tiên không được để trống")
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @NotNull(message = "Hạn hoàn thành không được để trống")
    @Future(message = "Hạn hoàn thành phải trong tương lai")
    private LocalDateTime deadline;
}