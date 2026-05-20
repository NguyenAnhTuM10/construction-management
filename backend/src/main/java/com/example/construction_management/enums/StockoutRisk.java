package com.example.construction_management.enums;

public enum StockoutRisk {
    LOW,       // > 14 ngày trước khi hết hàng
    MEDIUM,    // 8–14 ngày
    HIGH,      // 4–7 ngày
    CRITICAL   // <= 3 ngày
}
