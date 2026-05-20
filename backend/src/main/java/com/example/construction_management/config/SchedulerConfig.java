package com.example.construction_management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulerConfig {
    // Bật Spring Scheduling. ForecastScheduler dùng @Scheduled để chạy tự động mỗi đêm.
}
