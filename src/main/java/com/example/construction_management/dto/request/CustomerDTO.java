package com.example.construction_management.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CustomerDTO {
    private Integer id;

    @NotBlank(message = "Customer name is required")
    @Size(max = 100)
    private String name;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String address;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal debt;
}