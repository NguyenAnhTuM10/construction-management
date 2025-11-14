package com.example.construction_management.handler;



import com.example.construction_management.exception.InvalidTokenException;
import com.example.construction_management.exception.UserNotFoundException;
import com.example.construction_management.exception.UserNotAuthenticatedException;
import com.example.construction_management.dto.APIResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
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
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<APIResponse<Void>> handleRuntimeException(RuntimeException ex) {
        // QUAN TRỌNG: Nên log ex.getMessage() và stack trace ở đây
        ex.printStackTrace();
        ex.getMessage();
        String message = "An unexpected server error occurred.";
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(APIResponse.error(message));
    }

    // GlobalExceptionHandler.java (thêm phương thức này vào bên trong class)
// ...



    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<APIResponse<Void>> handleBadCredentialsException(BadCredentialsException ex) {
        // Thông báo lỗi rõ ràng cho người dùng
        String message = "Invalid username or password.";

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED) // HTTP 401
                .body(APIResponse.error(message));
    }

// ...
}