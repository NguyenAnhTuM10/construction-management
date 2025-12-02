package com.example.construction_management.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    // -------------------------------------------------------------------------
    // 0xxx: Lỗi Chung (General/Fallback Errors)
    // -------------------------------------------------------------------------
    ERROR_500_INTERNAL_SERVER(9998, "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY_ENUM(9999, "Validation failed for an argument", HttpStatus.BAD_REQUEST),
    INVALID_INPUT(9006, "Invalid input data", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(9007, "Invalid request", HttpStatus.BAD_REQUEST),
    BUSINESS_ERROR(6001, "Lỗi nghiệp vụ", HttpStatus.BAD_REQUEST),
    INVALID_PRICE(6003, "Giá không hợp lệ", HttpStatus.BAD_REQUEST),

    // -------------------------------------------------------------------------
    // 1xxx: Lỗi Không Tìm Thấy (NOT_FOUND)
    // -------------------------------------------------------------------------
    RESOURCE_NOT_FOUND(1000, "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND(1001, "Người dùng không tìm thấy", HttpStatus.NOT_FOUND),
    USER_NOT_EXISTED(1002, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(1003, "Vai trò không tìm thấy", HttpStatus.NOT_FOUND),
    DEPARTMENT_NOT_FOUND(1004, "Phòng ban không tìm thấy", HttpStatus.NOT_FOUND),
    EMPLOYEE_NOT_FOUND(1005, "Nhân viên không tìm thấy", HttpStatus.NOT_FOUND),
    SUPPLIER_NOT_FOUND(1006, "Nhà cung cấp không tìm thấy", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(1007, "Danh mục không tìm thấy", HttpStatus.NOT_FOUND),
    PRODUCT_NOT_FOUND(1008, "Sản phẩm không tìm thấy", HttpStatus.NOT_FOUND),
    ORDER_NOT_FOUND(1009, "Đơn hàng không tìm thấy", HttpStatus.NOT_FOUND),
    CUSTOMER_NOT_FOUND(1010, "Khách hàng không tìm thấy", HttpStatus.NOT_FOUND),
    WAREHOUSE_NOT_EXISTED(1011, "kho không tồn tại", HttpStatus.NOT_FOUND ),
    BALANCE_NOT_EXISTED(1012, "tồn kho khôn tồn tại", HttpStatus.NOT_FOUND ),
    TRANSACTION_NOT_FOUND(1013, "giao dịch không tồn tại", HttpStatus.NOT_FOUND),

    // -------------------------------------------------------------------------
    // 2xxx: Lỗi Đã Tồn Tại / Trùng Lặp (EXISTS/DUPLICATE/CONFLICT)
    // -------------------------------------------------------------------------
    DUPLICATE_RESOURCE(2000, "Tài nguyên đã tồn tại", HttpStatus.CONFLICT),
    USER_EXISTED(2001, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    DEPARTMENT_ALREADY_EXISTS(2002, "Phòng ban đã tồn tại", HttpStatus.BAD_REQUEST),
    CATEGORY_ALREADY_EXISTS(2003, "Danh mục đã tồn tại", HttpStatus.BAD_REQUEST),
    PRODUCT_CODE_EXISTS(2004, "Mã sản phẩm đã tồn tại", HttpStatus.BAD_REQUEST),
    CUSTOMER_EMAIL_EXISTS(2005, "Email khách hàng đã tồn tại", HttpStatus.CONFLICT),
    CUSTOMER_PHONE_EXISTS(2006, "Số điện thoại khách hàng đã tồn tại", HttpStatus.CONFLICT),
    CATEGORY_NAME_EXISTS(2007, "Tên danh mục đã tồn tại", HttpStatus.CONFLICT),

    // -------------------------------------------------------------------------
    // 3xxx: Lỗi Xác Thực / Ủy Quyền (Authentication/Authorization)
    // -------------------------------------------------------------------------
    USER_UNAUTHENTICATED(3001, "Người dùng chưa xác thực (cần đăng nhập)", HttpStatus.UNAUTHORIZED),
    USER_UNAUTHORIZE(3002, "Người dùng không có quyền truy cập", HttpStatus.FORBIDDEN),
    WRONG_PASSWORD(3003, "Mật khẩu không đúng", HttpStatus.UNAUTHORIZED),
    NOT_MATHES_PASSWORD(3004, "Mật khẩu mới và mật khẩu xác nhận không khớp", HttpStatus.UNAUTHORIZED),

    // -------------------------------------------------------------------------
    // 4xxx: Lỗi Yêu Cầu Dữ Liệu Không Hợp Lệ (Validation/Bad Request)
    // -------------------------------------------------------------------------
    USERNAME_INVALID(4001, "Tên người dùng phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(4002, "Mật khẩu phải có ít nhất 8 ký tự", HttpStatus.BAD_REQUEST),

    // -------------------------------------------------------------------------
    // 5xxx: Lỗi Nghiệp Vụ Liên Quan đến Nhân Viên/Đơn Hàng
    // -------------------------------------------------------------------------
    EMPLOYEE_HAS_LINKED_ACCOUNT(5001, "Không thể xóa nhân viên có tài khoản người dùng liên kết", HttpStatus.BAD_REQUEST),
    EMPLOYEE_HAS_ORDERS(5002, "Không thể xóa nhân viên với các đơn hàng hiện có", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(5003, "Không đủ hàng trong kho", HttpStatus.BAD_REQUEST),
    INVALID_ORDER_STATUS(5004, "Trạng thái đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_CANNOT_BE_MODIFIED(5005, "Đơn hàng không thể chỉnh sửa", HttpStatus.BAD_REQUEST),

    ; // End of Enum constants

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