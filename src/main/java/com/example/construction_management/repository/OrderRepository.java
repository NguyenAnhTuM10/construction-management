package com.example.construction_management.repository;

import com.example.construction_management.entity.Order;
import com.example.construction_management.entity.OrderItem;
import com.example.construction_management.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByEmployeeId(Long employeeId);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByCreatedDateBetween(LocalDateTime start, LocalDateTime end);
    

    @Query("SELECT o FROM Order o WHERE o.customer.id = :customerId AND o.status = :status")
    List<Order> findByCustomerIdAndStatus(@Param("customerId") Long customerId,
                                          @Param("status") OrderStatus status);


    // Revenue queries
    @Query("SELECT SUM(o.total) FROM Order o WHERE o.status = :status")
    BigDecimal sumTotalByStatus(@Param("status") OrderStatus status);

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.status = :status " +
            "AND o.createdDate BETWEEN :start AND :end")
    BigDecimal sumTotalByStatusAndDateRange(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Revenue report
    @Query("SELECT SUM(o.total), COUNT(o), COUNT(DISTINCT o.customer.id) " +
            "FROM Order o WHERE o.status = :status " +
            "AND o.createdDate BETWEEN :start AND :end")
    List<Object[]> getRevenueReport(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Revenue by employee
    @Query("SELECT o.employee.id, o.employee.name, o.employee.department.name, " +
            "SUM(o.total), COUNT(o) " +
            "FROM Order o " +
            "WHERE o.status = :status " +
            "AND (:start IS NULL OR o.createdDate >= :start) " +
            "AND (:end IS NULL OR o.createdDate <= :end) " +
            "GROUP BY o.employee.id, o.employee.name, o.employee.department.name " +
            "ORDER BY SUM(o.total) DESC")
    List<Object[]> getRevenueByEmployee(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Revenue by customer
    @Query("SELECT o.customer.id, o.customer.name, o.customer.email, o.customer.phone, " +
            "SUM(o.total), COUNT(o), o.customer.debt " +
            "FROM Order o " +
            "WHERE o.status = :status " +
            "AND (:start IS NULL OR o.createdDate >= :start) " +
            "AND (:end IS NULL OR o.createdDate <= :end) " +
            "GROUP BY o.customer.id, o.customer.name, o.customer.email, o.customer.phone, o.customer.debt " +
            "ORDER BY SUM(o.total) DESC")
    List<Object[]> getRevenueByCustomer(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Revenue by product
    @Query("SELECT oi.product.id, oi.product.code, oi.product.name, oi.product.category.name, " +
            "SUM(oi.quantity), SUM(oi.subtotal) " +
            "FROM OrderItem oi " +
            "JOIN oi.order o " +
            "WHERE o.status = :status " +
            "AND (:start IS NULL OR o.createdDate >= :start) " +
            "AND (:end IS NULL OR o.createdDate <= :end) " +
            "GROUP BY oi.product.id, oi.product.code, oi.product.name, oi.product.category.name " +
            "ORDER BY SUM(oi.subtotal) DESC")
    List<Object[]> getRevenueByProduct(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Monthly revenue
    @Query("SELECT MONTH(o.createdDate), SUM(o.total), COUNT(o) " +
            "FROM Order o " +
            "WHERE o.status = :status AND YEAR(o.createdDate) = :year " +
            "GROUP BY MONTH(o.createdDate) " +
            "ORDER BY MONTH(o.createdDate)")
    List<Object[]> getMonthlyRevenue(
            @Param("status") OrderStatus status,
            @Param("year") Integer year);

    Long countByStatus(OrderStatus orderStatus);
}

