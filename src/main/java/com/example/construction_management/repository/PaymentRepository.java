package com.example.construction_management.repository;

import com.example.construction_management.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByCustomerId(Integer customerId);
    List<Payment> findByPaymentDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate BETWEEN :start AND :end")
    java.math.BigDecimal sumAmountByPaymentDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}