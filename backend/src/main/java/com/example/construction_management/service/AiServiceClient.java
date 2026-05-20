package com.example.construction_management.service;

import com.example.construction_management.dto.request.AiForecastRequestDTO;
import com.example.construction_management.dto.response.AiForecastResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

/**
 * HTTP client gọi đến FastAPI AI service.
 *
 * Tại sao dùng WebClient thay vì RestTemplate?
 * - RestTemplate đã deprecated trong Spring 6
 * - WebClient hỗ trợ cả sync (.block()) và async (.subscribe())
 * - Ở đây dùng .block() vì ForecastService không cần non-blocking
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    @Value("${ai-service.timeout-seconds:60}")
    private int timeoutSeconds;

    public AiForecastResponseDTO callForecast(AiForecastRequestDTO request) {
        log.info("Calling AI service /api/v1/forecast with {} products", request.getProducts().size());

        try {
            AiForecastResponseDTO response = aiServiceWebClient.post()
                    .uri("/api/v1/forecast")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiForecastResponseDTO.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();

            log.info("AI service responded: {} results", response != null ? response.getProductsProcessed() : 0);
            return response;

        } catch (WebClientResponseException e) {
            log.error("AI service HTTP error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI service returned error: " + e.getStatusCode(), e);
        } catch (Exception e) {
            log.error("Failed to reach AI service: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable. Check if ai-service container is running.", e);
        }
    }
}
