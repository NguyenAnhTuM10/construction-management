// WarehouseRequest.java
package com.example.construction_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseRequest {
    @NotBlank(message = "Mã kho không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên kho không được để trống")
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String address;

    private Boolean active = true;
}

