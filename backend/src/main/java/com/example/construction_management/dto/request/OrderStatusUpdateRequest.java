package com.example.construction_management.dto.request;

import com.example.construction_management.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusUpdateRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private OrderStatus status;
}