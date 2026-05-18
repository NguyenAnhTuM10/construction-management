package com.example.construction_management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "salary_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class SalaryConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // KPI Config
    @Column(nullable = false)
    @Builder.Default
    private Double kpiBonusPercent = 10.0; // % thưởng KPI (10% = 0.1)

    @Column(nullable = false)
    @Builder.Default
    private Double salesCommissionPercent = 1.0; // % hoa hồng doanh số

    // Overtime Config
    @Column(nullable = false)
    @Builder.Default
    private Double overtimeRate = 1.5; // Hệ số lương tăng ca (1.5x)

    // Allowances
    @Column(nullable = false)
    @Builder.Default
    private Long mealAllowance = 1000000L; // Phụ cấp ăn trưa

    @Column(nullable = false)
    @Builder.Default
    private Long transportAllowance = 500000L; // Phụ cấp đi lại

    @Column(nullable = false)
    @Builder.Default
    private Long phoneAllowance = 300000L; // Phụ cấp điện thoại (Trưởng phòng+)

    // Deductions
    @Column(nullable = false)
    @Builder.Default
    private Double insurancePercent = 10.5; // % BHXH, BHYT, BHTN

    @Column(nullable = false)
    @Builder.Default
    private Long latePenaltyPerTime = 100000L; // Phạt đi muộn mỗi lần

    // Tax config (simplified)
    @Column(nullable = false)
    @Builder.Default
    private Long taxDeduction = 11000000L; // Giảm trừ gia cảnh

    @Column(nullable = false)
    @Builder.Default
    private Double taxRate = 10.0; // Thuế suất (simplified 10%)

    // Active flag
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(length = 500)
    private String note;

    // Audit
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;
}