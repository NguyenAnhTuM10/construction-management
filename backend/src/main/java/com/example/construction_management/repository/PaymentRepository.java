package com.example.construction_management.repository;

import com.example.construction_management.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Tìm payment theo order
    List<Payment> findByOrderId(Long orderId);

    // Tìm payment theo customer
    List<Payment> findByCustomerId(Long customerId);

    // Tìm payment theo ngày
    List<Payment> findByPaymentDateBetween(LocalDateTime start, LocalDateTime end);

    // Tổng số tiền đã thanh toán của order
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.id = :orderId")
    BigDecimal sumAmountByOrderId(@Param("orderId") Long orderId);

    // Tổng số tiền đã thanh toán của customer
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.customer.id = :customerId")
    BigDecimal sumAmountByCustomerId(@Param("customerId") Long customerId);
}