package com.example.construction_management.service;

import com.example.construction_management.dto.request.AiForecastRequestDTO;
import com.example.construction_management.dto.response.AiForecastResponseDTO;
import com.example.construction_management.dto.response.ForecastPredictionResponse;
import com.example.construction_management.entity.ForecastPrediction;
import com.example.construction_management.entity.Product;
import com.example.construction_management.enums.StockoutRisk;
import com.example.construction_management.repository.ForecastPredictionRepository;
import com.example.construction_management.repository.InventoryTransactionItemRepository;
import com.example.construction_management.repository.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastService {

    private final AiServiceClient aiServiceClient;
    private final ForecastPredictionRepository forecastPredictionRepository;
    private final InventoryTransactionItemRepository transactionItemRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    /**
     * Chạy toàn bộ pipeline forecast:
     * 1. Lấy danh sách sản phẩm có giao dịch xuất kho 90 ngày gần đây
     * 2. Build daily history cho từng sản phẩm
     * 3. Gọi AI service
     * 4. Lưu kết quả vào database
     */
    @Transactional
    public void runForecast() {
        log.info("=== Starting forecast pipeline ===");

        LocalDateTime since = LocalDateTime.now().minusDays(90);
        List<Long> productIds = transactionItemRepository.findProductIdsWithRecentOutActivity(since);

        if (productIds.isEmpty()) {
            log.warn("No products with recent OUT activity — skipping forecast");
            return;
        }
        log.info("Found {} products with recent activity", productIds.size());

        List<AiForecastRequestDTO.ProductForecastInput> inputs = productIds.stream()
                .map(pid -> buildProductInput(pid, since))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (inputs.isEmpty()) {
            log.warn("All products failed to build input — aborting forecast");
            return;
        }

        AiForecastRequestDTO request = AiForecastRequestDTO.builder()
                .forecastHorizonDays(7)
                .products(inputs)
                .build();

        AiForecastResponseDTO response = aiServiceClient.callForecast(request);

        LocalDate today = LocalDate.now();
        List<ForecastPrediction> predictions = response.getResults().stream()
                .map(result -> mapResultToEntity(result, today))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        forecastPredictionRepository.saveAll(predictions);
        log.info("=== Forecast complete: {} predictions saved ===", predictions.size());
    }

    public List<ForecastPredictionResponse> getLatestPredictions() {
        return forecastPredictionRepository.findLatestForecasts()
                .stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    public ForecastPredictionResponse getLatestPredictionForProduct(Long productId) {
        return forecastPredictionRepository
                .findTopByProductIdOrderByForecastDateDesc(productId)
                .map(this::mapEntityToResponse)
                .orElse(null);
    }

    // ─────────────────────────── Private helpers ────────────────────────────

    private AiForecastRequestDTO.ProductForecastInput buildProductInput(Long productId, LocalDateTime since) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) return null;

        Product product = productOpt.get();

        List<Object[]> rawRows = transactionItemRepository.findDailyOutQuantityByProduct(productId, since);

        List<AiForecastRequestDTO.DailyData> dailyHistory = rawRows.stream()
                .map(row -> AiForecastRequestDTO.DailyData.builder()
                        .date(((Date) row[0]).toLocalDate())
                        .quantityOut(((Number) row[1]).intValue())
                        .quantityIn(0)
                        .build())
                .collect(Collectors.toList());

        return AiForecastRequestDTO.ProductForecastInput.builder()
                .productId(product.getId())
                .productName(product.getName())
                .unit(product.getUnit() != null ? product.getUnit() : "unit")
                .currentStock(product.getStock() != null ? product.getStock() : 0)
                .dailyHistory(dailyHistory)
                .preferredModel(getBestModelForProduct(productId))
                .build();
    }

    // Feature 2: chọn model có MAPE thấp nhất trong lịch sử (cần >= 3 mẫu đánh giá)
    private String getBestModelForProduct(Long productId) {
        List<Object[]> rows = forecastPredictionRepository.findModelAccuracyByProduct(productId);
        if (rows.isEmpty()) return null;
        Object[] best = rows.get(0);
        long sampleCount = ((Number) best[2]).longValue();
        return sampleCount >= 3 ? (String) best[0] : null;
    }

    private ForecastPrediction mapResultToEntity(AiForecastResponseDTO.ProductForecastResult result, LocalDate forecastDate) {
        Optional<Product> productOpt = productRepository.findById(result.getProductId());
        if (productOpt.isEmpty()) {
            log.warn("Product {} not found — skipping prediction", result.getProductId());
            return null;
        }

        String dailyJson;
        try {
            dailyJson = objectMapper.writeValueAsString(result.getDailyForecast());
        } catch (JsonProcessingException e) {
            dailyJson = "[]";
        }

        String modelScoresJson;
        try {
            Map<String, Double> scores = result.getModelScores();
            modelScoresJson = (scores != null && !scores.isEmpty())
                    ? objectMapper.writeValueAsString(scores)
                    : "{}";
        } catch (JsonProcessingException e) {
            modelScoresJson = "{}";
        }

        Product product = productOpt.get();
        return ForecastPrediction.builder()
                .product(product)
                .forecastDate(forecastDate)
                .predictedDemand7Days(result.getPredictedDemand7Days())
                .avgDailyDemand(result.getAvgDailyDemand())
                .currentStock(product.getStock())
                .safetyStock(result.getSafetyStock())
                .reorderPoint(result.getReorderPoint())
                .recommendedReorderQty(result.getRecommendedReorderQty())
                .eoq(result.getEoq())
                .stockoutRisk(StockoutRisk.valueOf(result.getStockoutRisk()))
                .confidenceScore(result.getConfidenceScore())
                .daysUntilStockout(result.getDaysUntilStockout())
                .modelUsed(result.getModelUsed())
                .dailyForecastJson(dailyJson)
                .modelScoresJson(modelScoresJson)
                .build();
    }

    private ForecastPredictionResponse mapEntityToResponse(ForecastPrediction fp) {
        List<Integer> dailyForecast;
        try {
            dailyForecast = fp.getDailyForecastJson() != null
                    ? objectMapper.readValue(fp.getDailyForecastJson(), new TypeReference<>() {})
                    : Collections.emptyList();
        } catch (JsonProcessingException e) {
            dailyForecast = Collections.emptyList();
        }

        Map<String, Double> modelScores;
        try {
            String json = fp.getModelScoresJson();
            modelScores = (json != null && !json.isBlank() && !json.equals("{}"))
                    ? objectMapper.readValue(json, new TypeReference<>() {})
                    : Collections.emptyMap();
        } catch (JsonProcessingException e) {
            modelScores = Collections.emptyMap();
        }

        return ForecastPredictionResponse.builder()
                .id(fp.getId())
                .productId(fp.getProduct().getId())
                .productName(fp.getProduct().getName())
                .productCode(fp.getProduct().getCode())
                .unit(fp.getProduct().getUnit())
                .forecastDate(fp.getForecastDate())
                .predictedDemand7Days(fp.getPredictedDemand7Days())
                .avgDailyDemand(fp.getAvgDailyDemand())
                .currentStock(fp.getCurrentStock())
                .safetyStock(fp.getSafetyStock())
                .reorderPoint(fp.getReorderPoint())
                .recommendedReorderQty(fp.getRecommendedReorderQty())
                .eoq(fp.getEoq())
                .stockoutRisk(fp.getStockoutRisk())
                .confidenceScore(fp.getConfidenceScore())
                .daysUntilStockout(fp.getDaysUntilStockout())
                .modelUsed(fp.getModelUsed())
                .modelScores(modelScores)
                .dailyForecast(dailyForecast)
                .createdAt(fp.getCreatedAt())
                .actualDemand7Days(fp.getActualDemand7Days())
                .mape(fp.getMape())
                .mae(fp.getMae())
                .build();
    }
}
