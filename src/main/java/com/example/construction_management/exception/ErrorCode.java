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
    WRONG_PASSWORD(1009, "Wrong Password", HttpStatus.UNAUTHORIZED),
    NOT_MATHES_PASSWORD(1010, "New pass not matches with confirm pass",HttpStatus.UNAUTHORIZED),
    DEPARTMENT_NOT_FOUND(1011, "Department Not Found", HttpStatus.NOT_FOUND),




    // Employee related errors
    EMPLOYEE_NOT_FOUND(2001, "Employee not found", HttpStatus.NOT_FOUND),
    EMPLOYEE_HAS_LINKED_ACCOUNT(2002, "Cannot delete employee with linked user account", HttpStatus.BAD_REQUEST),
    EMPLOYEE_HAS_ORDERS(2003, "Cannot delete employee with existing orders", HttpStatus.BAD_REQUEST),

    // Department related errors
    DEPARTMENT_ALREADY_EXISTS(3002, "Department already exists", HttpStatus.BAD_REQUEST),

    // Category related errors
    CATEGORY_NOT_FOUND(4001, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_ALREADY_EXISTS(4002, "Category already exists", HttpStatus.BAD_REQUEST),

    // Product related errors
    PRODUCT_NOT_FOUND(5001, "Product not found", HttpStatus.NOT_FOUND),
    PRODUCT_CODE_EXISTS(5002, "Product code already exists", HttpStatus.BAD_REQUEST),

    // Order related errors
    ORDER_NOT_FOUND(6001, "Order not found", HttpStatus.NOT_FOUND),

    BUSINESS_ERROR(6001, "Lỗi nghiệp vụ", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(6002, "Không đủ hàng trong kho", HttpStatus.BAD_REQUEST),
    INVALID_PRICE(6003, "Giá không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_ORDER_STATUS(6004, "Trạng thái đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_CANNOT_BE_MODIFIED(6005, "Đơn hàng không thể chỉnh sửa", HttpStatus.BAD_REQUEST),


    // Customer related errors
    CUSTOMER_NOT_FOUND(7001, "Customer not found", HttpStatus.NOT_FOUND),


    RESOURCE_NOT_FOUND(8001, "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND),

    // ========== DUPLICATE ERRORS (3xxx) ==========
    DUPLICATE_RESOURCE(9001, "Tài nguyên đã tồn tại", HttpStatus.CONFLICT),
    CUSTOMER_EMAIL_EXISTS(9002, "Email khách hàng đã tồn tại", HttpStatus.CONFLICT),
    CUSTOMER_PHONE_EXISTS(9003, "Số điện thoại đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_NAME_EXISTS(9005, "Tên danh mục đã tồn tại", HttpStatus.CONFLICT),
    // General errors
    INVALID_INPUT(9006, "Invalid input data", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(9007, "Invalid request", HttpStatus.BAD_REQUEST),
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
