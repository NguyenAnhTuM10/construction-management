package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateRequest {
    @Size(max = 200)
    private String title;

    @Size(max = 5000)
    private String description;

    private Long assignedTo;

    private String priority;

    @Future(message = "Hạn hoàn thành phải trong tương lai")
    private LocalDateTime deadline;
}