package com.example.construction_management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entity Employee - Nhân viên
 */
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 20)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", foreignKey = @ForeignKey(name = "FK_employee_department"))
    private Department department;

    /**
     * Lương cơ bản hiện tại của nhân viên
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal salary = BigDecimal.ZERO;

    /**
     * Ngày vào làm
     */
    @Column(nullable = false)
    private LocalDate hireDate;
}