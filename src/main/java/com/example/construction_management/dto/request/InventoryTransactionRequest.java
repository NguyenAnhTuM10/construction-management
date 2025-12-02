// InventoryTransactionRequest.java
package com.example.construction_management.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionRequest {
    @NotNull(message = "Warehouse ID không được để trống")
    private Long warehouseId;

    @NotBlank(message = "Loại giao dịch không được để trống")
    private String type; // IN, OUT

    @NotBlank(message = "Lý do không được để trống")
    private String reason; // PURCHASE, SALE, RETURN, ADJUST

    private Long supplierId;

    private Long orderId;

    @NotNull(message = "Ngày giao dịch không được để trống")
    private LocalDateTime transactionDate;

    private String note;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    @Valid
    private List<InventoryTransactionItemRequest> items;
}






