package com.example.construction_management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity Salary - Bảng lương tháng
 */
@Entity
@Table(name = "salaries",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_salary_employee_month",
                columnNames = {"employee_id", "year", "month"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false,
            foreignKey = @ForeignKey(name = "FK_salary_employee"))
    private Employee employee;

    /**
     * Năm tính lương (VD: 2025)
     */
    @Column(nullable = false)
    private Integer year;

    /**
     * Tháng tính lương (1-12)
     */
    @Column(nullable = false)
    private Integer month;

    /**
     * Số ngày công trong tháng (chỉ để ghi nhận)
     */
    @Column(nullable = false)
    private Integer workDays;

    /**
     * Lương cơ bản (copy từ Employee tại thời điểm tạo)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    /**
     * Thưởng (nếu có)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal bonus = BigDecimal.ZERO;

    /**
     * Khấu trừ (bảo hiểm, thuế, phạt...)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deduction = BigDecimal.ZERO;

    /**
     * Tổng lương = basicSalary + bonus - deduction
     * Lưu vào DB để query dễ dàng
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSalary = BigDecimal.ZERO;

    /**
     * Đã thanh toán chưa
     */
    @Column(nullable = false)
    private Boolean isPaid = false;

    /**
     * Ngày thanh toán (nếu đã thanh toán)
     */
    private LocalDateTime paidDate;

    /**
     * Ghi chú
     */
    @Column(length = 500)
    private String note;

    /**
     * Ngày tạo bảng lương
     */
    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();


    /**
     * Tính tổng lương trước khi persist và update
     */
    @PrePersist
    @PreUpdate
    public void calculateTotalSalary() {
        this.totalSalary = this.basicSalary
                .add(this.bonus)
                .subtract(this.deduction);
    }
}