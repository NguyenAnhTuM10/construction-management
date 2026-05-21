package com.example.construction_management.repository;

import com.example.construction_management.entity.ForecastPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastPredictionRepository extends JpaRepository<ForecastPrediction, Long> {

    Optional<ForecastPrediction> findTopByProductIdOrderByForecastDateDesc(Long productId);

    boolean existsByProductIdAndForecastDate(Long productId, LocalDate forecastDate);

    // Feature 1: tìm predictions cần đánh giá accuracy (đã đủ 7 ngày, chưa có MAPE)
    List<ForecastPrediction> findByForecastDateAndMapeIsNull(LocalDate forecastDate);

    // Feature 2: lấy MAPE trung bình theo model cho 1 sản phẩm (chỉ lấy đã được đánh giá)
    @Query("SELECT fp.modelUsed, AVG(fp.mape), COUNT(fp) " +
           "FROM ForecastPrediction fp " +
           "WHERE fp.product.id = :productId AND fp.mape IS NOT NULL " +
           "GROUP BY fp.modelUsed " +
           "ORDER BY AVG(fp.mape) ASC")
    List<Object[]> findModelAccuracyByProduct(@Param("productId") Long productId);

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
