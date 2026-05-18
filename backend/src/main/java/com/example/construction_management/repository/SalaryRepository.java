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

    // Tìm theo kỳ lương
    List<Salary> findByMonthAndYear(Integer month, Integer year);

    // Tìm theo nhân viên
    List<Salary> findByEmployeeId(Long employeeId);

    // Tìm theo nhân viên và kỳ lương
    Optional<Salary> findByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    // Kiểm tra đã có bảng lương chưa
    boolean existsByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    // Lấy danh sách chưa trả lương
    List<Salary> findByIsPaidFalse();

    // Lấy danh sách đã trả lương theo kỳ
    List<Salary> findByMonthAndYearAndIsPaidTrue(Integer month, Integer year);

    // Thống kê tổng lương theo kỳ
    @Query("SELECT SUM(s.totalSalary) FROM Salary s WHERE s.month = :month AND s.year = :year")
    BigDecimal sumTotalSalaryByPeriod(@Param("month") Integer month, @Param("year") Integer year);

    // ✅ Đếm số bảng lương theo trạng thái thanh toán
    long countByIsPaid(Boolean isPaid);

    // ✅ Tính tổng lương theo trạng thái thanh toán (chưa trả / đã trả)
    @Query("SELECT SUM(s.totalSalary) FROM Salary s WHERE s.isPaid = :isPaid")
    BigDecimal sumTotalSalaryByIsPaid(@Param("isPaid") Boolean isPaid);

    // ✅ Bonus: Tính tổng lương chưa trả (shortcut)
    @Query("SELECT SUM(s.totalSalary) FROM Salary s WHERE s.isPaid = false")
    BigDecimal sumUnpaidSalary();
}