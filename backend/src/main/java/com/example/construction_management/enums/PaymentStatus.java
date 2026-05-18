package com.example.construction_management.enums;



import lombok.Getter;

/**
 * Trạng thái thanh toán
 */
@Getter
public enum PaymentStatus {
    UNPAID,   // Chưa thanh toán
    PARTIAL,  // Thanh toán một phần
    PAID      // Đã thanh toán đủ
}