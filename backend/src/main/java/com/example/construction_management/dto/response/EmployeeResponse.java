package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {

    private Long id;
    private String name;
    private String gender;
    private LocalDate birthDate;
    private String phone;
    private String email;
    private String idCard;
    private String address;

    // Department info
    private Long departmentId;
    private String departmentName;

    // Salary info
    private BigDecimal baseSalary;

    private LocalDate startDate;
    private LocalDate endDate;
    private String note;
    private Boolean active;

    // User info (nếu có liên kết)
    private Long userId;
    private String username;
    private Boolean hasUserAccount;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}