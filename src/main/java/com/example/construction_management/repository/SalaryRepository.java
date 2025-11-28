package com.example.construction_management.repository;

import com.example.construction_management.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {

    /**
     * Tìm lương của nhân viên trong tháng cụ thể
     */
    Optional<Salary> findByEmployeeIdAndYearAndMonth(Long employeeId, Integer year, Integer month);

    /**
     * Tìm tất cả lương của nhân viên
     */
    List<Salary> findByEmployeeId(Long employeeId);

    /**
     * Tìm lương theo tháng
     */
    List<Salary> findByYearAndMonth(Integer year, Integer month);

    /**
     * Tìm lương chưa thanh toán
     */
    List<Salary> findByIsPaid(Boolean isPaid);

    /**
     * Tìm lương chưa thanh toán của nhân viên
     */
    List<Salary> findByEmployeeIdAndIsPaid(Long employeeId, Boolean isPaid);

    /**
     * Kiểm tra đã tồn tại bảng lương cho nhân viên trong tháng chưa
     */
    boolean existsByEmployeeIdAndYearAndMonth(Long employeeId, Integer year, Integer month);

    /**
     * Tính tổng lương của tháng
     */
    @Query("SELECT SUM(s.totalSalary) FROM Salary s WHERE s.year = :year AND s.month = :month")
    BigDecimal sumTotalSalaryByMonth(@Param("year") Integer year, @Param("month") Integer month);

    /**
     * Tính tổng lương chưa thanh toán
     */
    @Query("SELECT SUM(s.totalSalary) FROM Salary s WHERE s.isPaid = false")
    BigDecimal sumUnpaidSalary();

    /**
     * Đếm số bảng lương chưa thanh toán
     */
    long countByIsPaid(Boolean isPaid);
}