package com.example.construction_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryDTO {
    private Integer id;

    @NotBlank(message = "Category name is required")
    @Size(max = 100)
    private String name;
}