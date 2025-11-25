package com.example.construction_management.dto.request;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductCreateUpdateDTO {
    private String code;
    private String name;
    private Long categoryId; // <--- Cần trường này để tìm Category
    private String unit;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private Integer stock;

}