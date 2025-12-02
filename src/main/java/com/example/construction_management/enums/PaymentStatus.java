package com.example.construction_management.enums;



import lombok.Getter;

/**
 * Trạng thái thanh toán
 */
@Getter
public enum PaymentStatus {
    PENDING("Đang chờ thanh toán"),
    SUCCESS("Thanh toán thành công"),
    FAILED("Thanh toán thất bại"),
    CANCELLED("Đã hủy"),
    REFUNDED("Đã hoàn tiền");

    private final String description;

    PaymentStatus(String description) {
        this.description = description;
    }
}