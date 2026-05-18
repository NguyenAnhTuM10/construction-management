package com.example.construction_management.dto.request;

import jakarta.validation.Valid;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderUpdateRequest {

    private Long customerId;
    private Long employeeId;

    @Valid
    private List<OrderItemRequest> items;
}