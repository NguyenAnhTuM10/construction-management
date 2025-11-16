package com.example.construction_management.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Generic API Response wrapper
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class APIResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private Integer statusCode;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ==================== SUCCESS ====================

    public static <T> APIResponse<T> success(T data, String message) {
        return APIResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> APIResponse<T> success(T data) {
        return success(data, "Success");
    }

    public static <T> APIResponse<T> success(String message) {
        return APIResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    public static <T> APIResponse<T> success() {
        return success("Success");
    }

    // ==================== ERROR ====================

    public static <T> APIResponse<T> error(String message) {
        return APIResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }

    public static <T> APIResponse<T> error(String message, Integer statusCode) {
        return APIResponse.<T>builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .build();
    }

    public static <T> APIResponse<T> errorWithData(String message, T data) {
        return APIResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> APIResponse<T> errorWithData(String message, T data, Integer statusCode) {
        return APIResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .statusCode(statusCode)
                .build();
    }
}