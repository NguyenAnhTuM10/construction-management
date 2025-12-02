package com.example.construction_management.handler;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ✅ 1. Xử lý chính các lỗi nghiệp vụ (BusinessException)
    @ExceptionHandler(value = BusinessException.class)
    ResponseEntity<ApiResponse> handleBusinessException(BusinessException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        ;
        log.error("Business Exception: Code={}, Message={}", errorCode.getCode(), ex.getMessage());

        return ResponseEntity
                // HTTP Status Code từ ErrorCode
                .status(errorCode.getStatusCode())
                // Body được tạo bởi ApiResponse.error()
                .body(ApiResponse.error(errorCode));
    }

    // ✅ 2. Xử lý Access Denied (403 Forbidden)
    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ErrorCode errorCode = ErrorCode.USER_UNAUTHORIZE;
        log.warn("Access Denied: {}", ex.getMessage());

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(errorCode));
    }

    // ✅ 3. Xử lý Validation Errors (@Valid, @NotNull,...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(MethodArgumentNotValidException ex) {

        // Lấy thông báo lỗi đầu tiên (giả định là tên ENUM key)
        String enumKey = ex.getBindingResult().getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY_ENUM; // Fallback

        // Map chứa lỗi chi tiết (nếu cần)
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        try {
            // Cố gắng ánh xạ từ thông báo lỗi sang ErrorCode
            errorCode = ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error with no matching ErrorCode found, using default: {}", enumKey);
            // Nếu không tìm thấy ENUM, có thể trả về lỗi 400 chung với data chứa chi tiết lỗi
            return ResponseEntity
                    .status(errorCode.getStatusCode())
                    .body(ApiResponse.errorWithData(errorCode, errors));
        }

        // Nếu tìm thấy ENUM code
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(errorCode));
    }

    // ⚠️ 4. Xử lý chung cho tất cả các RuntimeException khác (500 Internal Server Error)
    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<ApiResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Unhandled Internal Server Error:", ex);
        ErrorCode errorCode = ErrorCode.ERROR_500_INTERNAL_SERVER;

        // Trả về lỗi 500 với thông báo chung
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(errorCode));
    }
}