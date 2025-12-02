// InventoryTransactionItemRepository.java
package com.example.construction_management.repository;

import com.example.construction_management.entity.InventoryTransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTransactionItemRepository extends JpaRepository<InventoryTransactionItem, Long> {
}
