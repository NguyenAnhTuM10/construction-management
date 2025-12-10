package com.example.construction_management.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;

    // Assigned to
    private Long assignedToId;
    private String assignedToName;
    private String assignedToDepartment;

    // Assigned by
    private Long assignedById;
    private String assignedByUsername;

    private String status;
    private String priority;
    private LocalDateTime deadline;
    private String result;
    private LocalDateTime completedDate;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;

    // Helper fields
    private Boolean isOverdue;
    private Long daysUntilDeadline;
}