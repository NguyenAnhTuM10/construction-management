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

    // Lịch sử 5 ngày gần nhất — mỗi ngày chỉ lấy 1 bản ghi mới nhất (id lớn nhất)
    @Query("SELECT fp FROM ForecastPrediction fp " +
           "JOIN FETCH fp.product " +
           "WHERE fp.id IN (" +
           "  SELECT MAX(fp2.id) FROM ForecastPrediction fp2 " +
           "  WHERE fp2.product.id = :productId " +
           "  GROUP BY fp2.forecastDate" +
           ") " +
           "ORDER BY fp.forecastDate DESC")
    List<ForecastPrediction> findHistoryByProductId(@Param("productId") Long productId);

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
     * Lấy 1 bản ghi mới nhất (id lớn nhất) cho mỗi sản phẩm,
     * sắp xếp theo mức độ nguy hiểm giảm dần.
     *
     * Tại sao dùng MAX(id) thay vì MAX(forecastDate)?
     * Cùng ngày có thể trigger nhiều lần → nhiều bản ghi cùng forecastDate.
     * ID tự tăng đảm bảo lấy đúng lần chạy mới nhất.
     */
    @Query("SELECT fp FROM ForecastPrediction fp " +
           "JOIN FETCH fp.product " +
           "WHERE fp.id IN (" +
           "  SELECT MAX(fp2.id) FROM ForecastPrediction fp2 " +
           "  GROUP BY fp2.product.id" +
           ") " +
           "ORDER BY fp.stockoutRisk DESC, fp.daysUntilStockout ASC")
    List<ForecastPrediction> findLatestForecasts();
}
