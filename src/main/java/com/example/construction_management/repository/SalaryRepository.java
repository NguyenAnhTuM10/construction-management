package com.example.construction_management.repository;

import com.example.construction_management.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Integer> {
//    List<Salary> findByEmployee(Integer employeeId);
//    Optional<Salary> findByEmployeeIdAndMonth(Integer employeeId, java.time.LocalDate month);
    List<Salary> findByMonth(java.time.LocalDate month);
}