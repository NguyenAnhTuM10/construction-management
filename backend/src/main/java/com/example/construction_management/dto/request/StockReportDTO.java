package com.example.construction_management.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockReportDTO {
    private Integer productId;
    private String productCode;
    private String productName;
    private String categoryName;
    private Integer currentStock;
    private String unit;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal stockValue; // currentStock * buyPrice
}