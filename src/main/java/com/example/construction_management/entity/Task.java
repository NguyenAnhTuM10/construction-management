package com.example.construction_management.entity;

import com.example.construction_management.enums.TaskPriority;
import com.example.construction_management.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title; // Tiêu đề công việc

    @Column(columnDefinition = "TEXT")
    private String description; // Mô tả chi tiết

    @ManyToOne
    @JoinColumn(name = "assigned_to", nullable = false)
    private Employee assignedTo; // Nhân viên được giao

    @ManyToOne
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy; // Admin giao việc

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(nullable = false)
    private LocalDateTime deadline; // Hạn hoàn thành

    @Column(columnDefinition = "TEXT")
    private String result; // Kết quả công việc (nhân viên điền)

    private LocalDateTime completedDate; // Ngày hoàn thành

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;
}