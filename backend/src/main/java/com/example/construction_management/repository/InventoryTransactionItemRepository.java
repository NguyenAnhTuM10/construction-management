package com.example.construction_management.repository;

import com.example.construction_management.entity.InventoryTransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionItemRepository extends JpaRepository<InventoryTransactionItem, Long> {

    /**
     * Lấy tổng số lượng xuất kho theo ngày cho một sản phẩm.
     * Trả về Object[]{java.sql.Date, Long} — cần cast trong service.
     */
    @Query(value = """
            SELECT DATE(t.transaction_date) AS day, SUM(ti.quantity) AS total_qty
            FROM inventory_transaction_items ti
            JOIN inventory_transactions t ON ti.transaction_id = t.id
            WHERE ti.product_id = :productId
              AND t.type = 'OUT'
              AND t.status = 'COMPLETED'
              AND t.transaction_date >= :startDate
            GROUP BY DATE(t.transaction_date)
            ORDER BY DATE(t.transaction_date)
            """, nativeQuery = true)
    List<Object[]> findDailyOutQuantityByProduct(
            @Param("productId") Long productId,
            @Param("startDate") LocalDateTime startDate
    );

    /**
     * Lấy danh sách product_id có giao dịch xuất kho COMPLETED từ ngày startDate.
     * Dùng để xác định sản phẩm nào cần forecast.
     */
    @Query(value = """
            SELECT DISTINCT ti.product_id
            FROM inventory_transaction_items ti
            JOIN inventory_transactions t ON ti.transaction_id = t.id
            WHERE t.type = 'OUT'
              AND t.status = 'COMPLETED'
              AND t.transaction_date >= :startDate
            """, nativeQuery = true)
    List<Long> findProductIdsWithRecentOutActivity(@Param("startDate") LocalDateTime startDate);
}
