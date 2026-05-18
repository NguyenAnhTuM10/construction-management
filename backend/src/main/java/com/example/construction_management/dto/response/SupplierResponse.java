package com.example.construction_management.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierResponse {
    private Long id;
    private String code;
    private String name;
    private String phone;
    private String address;
    private String email;
    private String note;
}