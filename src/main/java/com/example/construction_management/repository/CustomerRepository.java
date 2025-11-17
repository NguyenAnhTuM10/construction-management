package com.example.construction_management.repository;

import com.example.construction_management.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer,Long> {
    List<Customer> findByDebtGreaterThan(java.math.BigDecimal debt);
}
