package com.example.construction_management.exception;




import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // Mã lỗi chung (Fallback)
    INVALID_KEY_ENUM(9999, "Validation failed for an argument", HttpStatus.BAD_REQUEST),
    ERROR_500_INTERNAL_SERVER(9998, "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),

    USER_EXISTED(1001, "User Existed",HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "username must be at least 3 characters",HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "password must be at least 8 charaters long ERROR CODE",HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "user not found", HttpStatus.NOT_FOUND),
    USER_NOT_EXISTED(1006, "User NOT Existed", HttpStatus.NOT_FOUND),
    USER_UNAUTHENTICATED(1007, "User Not Authenticated",HttpStatus.UNAUTHORIZED),
    USER_UNAUTHORIZE(1009, "User Have Not Permission",HttpStatus.FORBIDDEN),
    ROLE_NOT_FOUND(1008, "Role Not Found", HttpStatus.NOT_FOUND),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    // constructor
    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = httpStatusCode;
    }

}
