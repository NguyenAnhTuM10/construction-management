package com.example.construction_management.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductDTO
{
    private Integer id;

    @NotBlank(message = "Product code is required")
    @Size(max = 50)
    String code;

    @NotBlank(message = "Product name is required")
    @Size(max = 100)
    String name;

    Integer categoryId;
    String categoryName;

    @Size(max = 50)
    String unit;

    @DecimalMin(value = "0.0", inclusive = true)
    BigDecimal buyPrice;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal sellPrice;

    @Min(0)
    private Integer stock;





}