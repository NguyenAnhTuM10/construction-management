// WarehouseResponse.java
package com.example.construction_management.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseResponse {
    private Long id;
    private String code;
    private String name;
    private String address;
    private Boolean active;
}