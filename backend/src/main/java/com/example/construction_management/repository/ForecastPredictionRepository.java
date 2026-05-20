package com.example.construction_management.repository;

import com.example.construction_management.entity.ForecastPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastPredictionRepository extends JpaRepository<ForecastPrediction, Long> {

    Optional<ForecastPrediction> findTopByProductIdOrderByForecastDateDesc(Long productId);

    boolean existsByProductIdAndForecastDate(Long productId, LocalDate forecastDate);

    /**
     * Lấy toàn bộ dự báo mới nhất (ngày forecast_date lớn nhất),
     * sắp xếp theo mức độ nguy hiểm giảm dần.
     */
    @Query("SELECT fp FROM ForecastPrediction fp " +
           "JOIN FETCH fp.product " +
           "WHERE fp.forecastDate = (" +
           "  SELECT MAX(fp2.forecastDate) FROM ForecastPrediction fp2" +
           ") " +
           "ORDER BY fp.stockoutRisk DESC, fp.daysUntilStockout ASC")
    List<ForecastPrediction> findLatestForecasts();
}
