package com.example.construction_management.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSummaryResponse {
    private Long id;
    private String title;
    private String assignedToName;
    private String status;
    private String priority;
    private LocalDateTime deadline;
    private Boolean isOverdue;
    private Integer progress;  // ✅ Phải có field này
}