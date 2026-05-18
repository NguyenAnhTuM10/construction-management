

// InventoryTransactionRepository.java
package com.example.construction_management.repository;

import com.example.construction_management.entity.InventoryTransaction;

import com.example.construction_management.enums.TransactionStatus;
import com.example.construction_management.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByWarehouseId(Long warehouseId);

    List<InventoryTransaction> findByType(TransactionType type);

    List<InventoryTransaction> findByStatus(TransactionStatus status);

    List<InventoryTransaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT MAX(t.transactionCode) FROM InventoryTransaction t WHERE t.transactionCode LIKE ?1%")
    String findMaxTransactionCodeByPrefix(String prefix);
}


