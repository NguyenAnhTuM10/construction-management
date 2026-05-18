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
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(mappedBy = "employee")
    private User user;  // ✅ QUAN TRỌNG: phải có mappedBy

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 10)
    private String gender; // MALE, FEMALE

    private LocalDate birthDate;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String idCard; // CCCD/CMND

    @Column(length = 500)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", foreignKey = @ForeignKey(name = "FK_employee_department"))
    private Department department;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;


    private LocalDate startDate; // Ngày vào làm

    private LocalDate endDate; // Ngày nghỉ việc (nếu có)

    @Column(length = 500)
    private String note;

    @Builder.Default
    private Boolean active = true;

    @CreatedDate

    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime updatedDate;

    // ========== HELPER METHODS ==========

    /**
     * Kiểm tra nhân viên còn làm việc không
     */
    public boolean isCurrentlyEmployed() {
        return active && endDate == null;
    }

    /**
     * Lấy tên phòng ban
     */
    public String getDepartmentName() {
        return department != null ? department.getName() : null;
    }
}