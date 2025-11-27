package com.example.construction_management.dto.response;

import com.example.construction_management.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long employeeId;
    private String employeeName;
    private BigDecimal total;
    private OrderStatus status;
    private String statusDescription;
    private LocalDateTime createdDate;
    private List<OrderItemResponse> items;
}