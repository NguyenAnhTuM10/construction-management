// InventoryBalanceRepository.java
package com.example.construction_management.repository;

import com.example.construction_management.entity.InventoryBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {
    Optional<InventoryBalance> findByWarehouseIdAndProductId(Long warehouseId, Long productId);

    List<InventoryBalance> findByWarehouseId(Long warehouseId);

    List<InventoryBalance> findByProductId(Long productId);

    @Query("SELECT b FROM InventoryBalance b WHERE b.quantity < ?1")
    List<InventoryBalance> findLowStockProducts(Integer threshold);
}