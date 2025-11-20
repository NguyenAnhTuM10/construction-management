package com.example.construction_management.dto;

import com.example.construction_management.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;


import java.time.LocalDateTime;

/**
 * Generic API Response wrapper, giữ nguyên tất cả các trường.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    // ✅ Giữ nguyên các trường ban đầu
    private boolean success;
    private int code = 1000;
    private String message;
    private T data;
    private Integer statusCode;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ==================== SUCCESS BUILDERS ====================

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code(1000)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Success");
    }

    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code(1000)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> success() {
        return success("Success");
    }

    // ==================== ERROR BUILDERS (Đồng bộ với ErrorCode) ====================

    /**
     * ✅ Tạo response lỗi dựa trên ErrorCode (sử dụng cho BusinessException).
     */
    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                // Lấy HTTP status code từ ErrorCode
                .statusCode(errorCode.getStatusCode().value())
                .build();
    }

    /**
     * ✅ Tạo response lỗi kèm dữ liệu (ví dụ: validation errors Map)
     */
    public static <T> ApiResponse<T> errorWithData(ErrorCode errorCode, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(data)
                // Lấy HTTP status code từ ErrorCode
                .statusCode(errorCode.getStatusCode().value())
                .build();
    }
}