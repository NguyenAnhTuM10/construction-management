package com.example.construction_management.repository;

import com.example.construction_management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByCustomerId(Integer customerId);
    List<Order> findByEmployeeId(Integer employeeId);
    List<Order> findByStatus(String status);
    List<Order> findByCreatedDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status = 'paid' AND o.createdDate BETWEEN :start AND :end")
    java.math.BigDecimal sumTotalByCreatedDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'pending'")
    Long countPendingOrders();
}