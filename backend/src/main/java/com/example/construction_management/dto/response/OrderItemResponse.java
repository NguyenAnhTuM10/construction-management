package com.example.construction_management.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class OrderItemResponse
{
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
}
