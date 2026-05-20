package com.example.construction_management.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Nightly scheduler — tự động chạy forecast mỗi ngày lúc 2:00 AM.
 *
 * Tại sao 2:00 AM?
 * - Sau khi mọi giao dịch trong ngày đã được nhập xong
 * - Trước khi nhân viên kho đến làm vào buổi sáng (~7-8 AM)
 * - Load server thấp nhất
 *
 * Cron expression: "0 0 2 * * ?"
 *   giây phút giờ ngày-trong-tháng tháng ngày-trong-tuần
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ForecastScheduler {

    private final ForecastService forecastService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void runNightlyForecast() {
        log.info("[SCHEDULER] Nightly forecast job started");
        try {
            forecastService.runForecast();
            log.info("[SCHEDULER] Nightly forecast job completed successfully");
        } catch (Exception e) {
            // Bắt lỗi tại đây để scheduler không crash — lần sau vẫn chạy tiếp được
            log.error("[SCHEDULER] Nightly forecast job failed: {}", e.getMessage(), e);
        }
    }
}
