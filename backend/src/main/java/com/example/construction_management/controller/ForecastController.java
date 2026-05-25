package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.response.ForecastPredictionResponse;
import com.example.construction_management.service.ForecastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forecast")
@RequiredArgsConstructor
@Slf4j
public class ForecastController {

    private final ForecastService forecastService;

    /**
     * Lấy kết quả dự báo mới nhất cho tất cả sản phẩm.
     * Frontend dùng endpoint này để hiển thị forecast dashboard.
     */
    @GetMapping("/latest")
    public ApiResponse<List<ForecastPredictionResponse>> getLatestForecasts() {
        return ApiResponse.success(forecastService.getLatestPredictions());
    }

    /**
     * Lấy dự báo mới nhất cho 1 sản phẩm cụ thể.
     */
    @GetMapping("/product/{productId}")
    public ApiResponse<ForecastPredictionResponse> getProductForecast(@PathVariable Long productId) {
        ForecastPredictionResponse result = forecastService.getLatestPredictionForProduct(productId);
        if (result == null) {
            return ApiResponse.success("Chưa có dữ liệu dự báo cho sản phẩm này");
        }
        return ApiResponse.success(result);
    }

    /**
     * Lịch sử 5 lần dự báo gần nhất + accuracy của 1 sản phẩm.
     * FE dùng để hiển thị panel "Tự học model".
     */
    @GetMapping("/product/{productId}/history")
    public ApiResponse<List<ForecastPredictionResponse>> getProductHistory(@PathVariable Long productId) {
        return ApiResponse.success(forecastService.getProductHistory(productId));
    }

    /**
     * Trigger forecast thủ công — dùng để test hoặc khi cần forecast gấp.
     * Chỉ dành cho ADMIN (cấu hình trong SecurityConfig).
     */
    @PostMapping("/trigger")
    public ApiResponse<String> triggerForecast() {
        log.info("Manual forecast trigger requested");
        forecastService.runForecast();
        return ApiResponse.success("Forecast đã chạy xong. Kiểm tra /forecast/latest để xem kết quả.");
    }
}
