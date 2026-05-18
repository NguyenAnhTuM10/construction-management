package com.example.construction_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

// DepartmentDTO
@Data
public class DepartmentDTO {
    private Long id;
    private String name;
}
