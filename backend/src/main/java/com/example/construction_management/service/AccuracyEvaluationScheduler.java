package com.example.construction_management.service;

import com.example.construction_management.entity.ForecastPrediction;
import com.example.construction_management.repository.ForecastPredictionRepository;
import com.example.construction_management.repository.InventoryTransactionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccuracyEvaluationScheduler {

    private final ForecastPredictionRepository forecastPredictionRepository;
    private final InventoryTransactionItemRepository transactionItemRepository;

    // Chạy lúc 2:30 AM — sau forecast job 2:00 AM
    @Scheduled(cron = "0 30 2 * * ?")
    @Transactional
    public void evaluateAccuracy() {
        LocalDate targetDate = LocalDate.now().minusDays(7);
        List<ForecastPrediction> toEvaluate =
                forecastPredictionRepository.findByForecastDateAndMapeIsNull(targetDate);

        if (toEvaluate.isEmpty()) {
            log.info("[ACCURACY] No predictions to evaluate for {}", targetDate);
            return;
        }

        log.info("[ACCURACY] Evaluating {} predictions for {}", toEvaluate.size(), targetDate);

        for (ForecastPrediction fp : toEvaluate) {
            LocalDateTime from = targetDate.atStartOfDay();
            LocalDateTime to   = targetDate.plusDays(7).atStartOfDay();

            Long actualRaw = transactionItemRepository.sumOutQtyBetween(
                    fp.getProduct().getId(), from, to);
            int actual    = actualRaw != null ? actualRaw.intValue() : 0;
            int predicted = fp.getPredictedDemand7Days() != null ? fp.getPredictedDemand7Days() : 0;

            double mae  = Math.abs(predicted - actual);
            Double mape = actual > 0
                    ? mae / actual * 100.0
                    : (predicted == 0 ? 0.0 : null); // undefined khi actual=0 nhưng predicted>0

            fp.setActualDemand7Days(actual);
            fp.setMae(mae);
            fp.setMape(mape);

            log.debug("[ACCURACY] product={} predicted={} actual={} MAPE={}",
                    fp.getProduct().getId(), predicted, actual,
                    mape != null ? String.format("%.1f%%", mape) : "N/A");
        }

        forecastPredictionRepository.saveAll(toEvaluate);
        log.info("[ACCURACY] Evaluation complete for {}", targetDate);
    }
}
