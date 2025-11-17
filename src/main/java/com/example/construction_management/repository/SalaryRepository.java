package com.example.construction_management.repository;

import com.example.construction_management.entity.Employee;
import com.example.construction_management.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    List<Salary> findByEmployeeId(Long employeeId);
    Optional<Salary> findByEmployeeIdAndMonth(Long employee_id, LocalDate month);
    List<Salary> findByMonth(java.time.LocalDate month);

}