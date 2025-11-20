package com.example.construction_management.handler;



import com.example.construction_management.exception.InvalidTokenException;
import com.example.construction_management.exception.UserNotFoundException;
import com.example.construction_management.exception.UserNotAuthenticatedException;
import com.example.construction_management.dto.APIResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Xử lý lỗi khi Refresh Token không hợp lệ.
     * Ánh xạ tới HTTP 400 Bad Request.
     */
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<APIResponse<Void>> handleInvalidTokenException(InvalidTokenException ex) {
        // Ghi lại lỗi nếu cần thiết
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(APIResponse.error(ex.getMessage()));
    }

    /**
     * Xử lý lỗi khi người dùng không tìm thấy trong database.
     * Ánh xạ tới HTTP 404 Not Found.
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<APIResponse<Void>> handleUserNotFoundException(UserNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(APIResponse.error(ex.getMessage()));
    }

    /**
     * Xử lý lỗi khi truy cập yêu cầu xác thực nhưng người dùng chưa đăng nhập.
     * Ánh xạ tới HTTP 401 Unauthorized.
     */
    @ExceptionHandler(UserNotAuthenticatedException.class)
    public ResponseEntity<APIResponse<Void>> handleUserNotAuthenticatedException(UserNotAuthenticatedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(APIResponse.error(ex.getMessage()));
    }

    /**
     * Xử lý lỗi chung (Catch-all for other RuntimeExceptions).
     * Ánh xạ tới HTTP 500 Internal Server Error.
     */



    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<APIResponse<Void>> handleBadCredentialsException(BadCredentialsException ex) {
        // Thông báo lỗi rõ ràng cho người dùng
        String message = "Invalid username or password.";

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED) // HTTP 401
                .body(APIResponse.error(message));
    }

    // ✅ Xử lý validation errors (quan trọng!)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(APIResponse.errorWithData("Validation failed", errors));
    }

    // ✅ Xử lý Access Denied (403)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<APIResponse<Void>> handleAccessDeniedException(
            AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(APIResponse.error("You don't have permission to access this resource"));
    }

    // ✅ Xử lý DataIntegrityViolationException (conflict, duplicate)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<APIResponse<Void>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex) {
        log.error("Data integrity violation", ex);
        String message = "Data conflict occurred (e.g., duplicate key)";
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(APIResponse.error(message));
    }

    // ⚠️ QUAN TRỌNG: Log chi tiết hơn
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<APIResponse<Void>> handleRuntimeException(RuntimeException ex) {
        log.error("Unexpected error occurred", ex); // Dùng log framework




        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(APIResponse.error(ex.getMessage()));
    }
}

// ...
