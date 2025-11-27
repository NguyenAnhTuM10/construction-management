package com.example.construction_management.repository;

import com.example.construction_management.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer,Long> {
    List<Customer> findByDebtGreaterThan(java.math.BigDecimal debt);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    List<Customer> findByNameContainingIgnoreCase(String name);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
