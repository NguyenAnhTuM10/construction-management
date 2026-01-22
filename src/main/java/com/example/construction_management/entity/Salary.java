package com.example.construction_management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salaries", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "month", "year"}, name = "UK_salary_employee_period")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;


    // ========== KỲ LƯƠNG ==========
    @Column(nullable = false)
    private Integer month;  // 1-12

    @Column(nullable = false)
    private Integer year;   // 2024, 2025...

    // ========== NGÀY CÔNG ==========
    @Column(nullable = false)
    @Builder.Default
    private Integer workDays = 22;  // Ngày công chuẩn

    @Column(nullable = false)
    @Builder.Default
    private Integer actualWorkDays = 22;  // Ngày công thực tế

    @Builder.Default
    private Integer leaveDays = 0;  // Ngày nghỉ phép

    @Builder.Default
    private Double overtimeHours = 0.0;  // Giờ tăng ca

    // ========== LƯƠNG & THU NHẬP ==========
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary;  // Lương cơ bản (copy từ Employee)

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;  // Thưởng (KPI, doanh số, etc.)

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowance = BigDecimal.ZERO;  // Phụ cấp

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal overtimePay = BigDecimal.ZERO;  // Lương tăng ca

    // ========== KHẤU TRỪ ==========
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal deduction = BigDecimal.ZERO;  // Tổng khấu trừ (BHXH, thuế, phạt...)

    // ========== TỔNG LƯƠNG ==========
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalSalary;  // Thực lĩnh

    // ========== TRẠNG THÁI ==========
    @Builder.Default
    private Boolean isPaid = false;  // Đã trả lương chưa

    private LocalDate paidDate;  // Ngày trả lương

    // ========== GHI CHÚ ==========
    @Column(length = 500)
    private String note;

    // ========== AUDIT ==========
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime updatedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;  // Người tạo bảng lương

    // ========== HELPER METHODS ==========

    /**
     * Tính tổng lương
     */
    public void calculateTotalSalary() {
        BigDecimal dailyRate = this.baseSalary.divide(BigDecimal.valueOf(workDays), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal actualBaseSalary = dailyRate.multiply(BigDecimal.valueOf(actualWorkDays));

        this.totalSalary = actualBaseSalary
                .add(this.bonus != null ? this.bonus : BigDecimal.ZERO)
                .add(this.allowance != null ? this.allowance : BigDecimal.ZERO)
                .add(this.overtimePay != null ? this.overtimePay : BigDecimal.ZERO)
                .subtract(this.deduction != null ? this.deduction : BigDecimal.ZERO);
    }

    /**
     * Lấy tên nhân viên
     */
    public String getEmployeeName() {
        return employee != null ? employee.getName() : null;
    }

    /**
     * Lấy tên phòng ban
     */
    public String getDepartmentName() {
        return employee != null ? employee.getDepartmentName() : null;
    }
}