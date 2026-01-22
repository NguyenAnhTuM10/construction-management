package com.example.construction_management.repository;

import com.example.construction_management.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Find by active status
    List<Employee> findByActiveTrue();

    List<Employee> findByActiveFalse();

    // Find by department
    List<Employee> findByDepartmentId(Long departmentId);

    List<Employee> findByDepartmentIdAndActiveTrue(Long departmentId);

    // Search by name
    List<Employee> findByNameContainingIgnoreCase(String name);

    // Find by unique fields
    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByPhone(String phone);

    Optional<Employee> findByIdCard(String idCard);

    // Check exists
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByIdCard(String idCard);

    // Count by department
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId AND e.active = true")
    Long countByDepartmentId(@Param("departmentId") Long departmentId);

    // Statistics
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.active = true")
    Long countActiveEmployees();

    @Query("SELECT AVG(e.baseSalary) FROM Employee e WHERE e.active = true")
    Double getAverageBaseSalary();

    // ✅ THÊM MỚI: Lấy nhân viên chưa có tài khoản
    @Query("SELECT e FROM Employee e WHERE e.id NOT IN " +
            "(SELECT u.employee.id FROM User u WHERE u.employee IS NOT NULL) " +
            "AND e.active = true")
    List<Employee> findEmployeesWithoutAccount();
}