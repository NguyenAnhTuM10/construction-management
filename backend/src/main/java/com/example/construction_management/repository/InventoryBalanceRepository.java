// InventoryBalanceRepository.java
package com.example.construction_management.repository;

import com.example.construction_management.entity.InventoryBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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


    @Query("SELECT COUNT(ib) FROM InventoryBalance ib WHERE ib.quantity < :threshold")
    Long countLowStockProducts(@Param("threshold") Integer threshold);

    @Query("SELECT COUNT(ib) FROM InventoryBalance ib WHERE ib.quantity = 0")
    Long countOutOfStockProducts();

    @Query("SELECT SUM(ib.quantity), SUM(ib.quantity * ib.averageCost) FROM InventoryBalance ib")
    List<Object[]> getInventorySummary();

    @Query("SELECT ib.warehouse.id, ib.warehouse.code, ib.warehouse.name, " +
            "SUM(ib.quantity), SUM(ib.quantity * ib.averageCost), COUNT(ib) " +
            "FROM InventoryBalance ib " +
            "GROUP BY ib.warehouse.id, ib.warehouse.code, ib.warehouse.name " +
            "ORDER BY ib.warehouse.name")
    List<Object[]> getInventoryByWarehouse();




    /**
     * Tính tổng số lượng tồn kho của một sản phẩm trên tất cả các kho
     */
    @Query("SELECT COALESCE(SUM(ib.quantity), 0) FROM InventoryBalance ib WHERE ib.product.id = :productId")
    Integer sumQuantityByProductId(@Param("productId") Long productId);

    /**
     * Lấy danh sách tồn kho theo danh sách product IDs
     */
    @Query("SELECT ib FROM InventoryBalance ib WHERE ib.product.id IN :productIds")
    List<InventoryBalance> findByProductIdIn(@Param("productIds") List<Long> productIds);

    /**
     * Xóa tất cả balance của một product
     */
    void deleteByProductId(Long productId);

    /**
     * Xóa tất cả balance của một warehouse
     */
    void deleteByWarehouseId(Long warehouseId);
}