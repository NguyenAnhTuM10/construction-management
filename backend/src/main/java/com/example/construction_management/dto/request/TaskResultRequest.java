package com.example.construction_management.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskResultRequest {
    @Size(max = 5000, message = "Kết quả tối đa 5000 ký tự")
    private String result;  // ✅ Bỏ @NotBlank

    private String note;

    private Integer progress;

    private String status;  // ✅ Thêm field status
}