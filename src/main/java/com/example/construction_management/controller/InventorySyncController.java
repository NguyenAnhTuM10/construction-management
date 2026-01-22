package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.service.InventoryBalanceService;
import com.example.construction_management.service.InventoryBalanceService.StockDiscrepancy;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory/sync")
@RequiredArgsConstructor
@Tag(name = "Inventory Sync", description = "Endpoints để đồng bộ tồn kho giữa InventoryBalance và Product")
public class InventorySyncController {

    private final InventoryBalanceService balanceService;

    /**
     * Đồng bộ tồn kho cho một sản phẩm cụ thể
     */
    @PostMapping("/product/{productId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    @Operation(summary = "Đồng bộ tồn kho cho một sản phẩm",
            description = "Tính lại tổng tồn kho của sản phẩm dựa trên tất cả các kho")
    public ResponseEntity<ApiResponse<String>> syncProductStock(@PathVariable Long productId) {
        balanceService.syncProductStock(productId);
        Integer totalStock = balanceService.getTotalStockByProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã đồng bộ tồn kho cho sản phẩm ID: " + productId + ", Tổng tồn kho: " + totalStock));
    }

    /**
     * Đồng bộ tồn kho cho TẤT CẢ sản phẩm
     */
    @PostMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Đồng bộ tồn kho cho tất cả sản phẩm",
            description = "Tính lại tổng tồn kho cho tất cả sản phẩm dựa trên dữ liệu từ các kho")
    public ResponseEntity<ApiResponse<SyncResult>> syncAllStocks() {
        int updatedCount = balanceService.syncAllProductStocks();
        return ResponseEntity.ok(ApiResponse.success(
                new SyncResult(updatedCount, "Đã đồng bộ tồn kho cho tất cả sản phẩm")));
    }

    /**
     * Kiểm tra các sản phẩm có tồn kho không khớp
     */
    @GetMapping("/check")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    @Operation(summary = "Kiểm tra chênh lệch tồn kho",
            description = "Liệt kê các sản phẩm có tồn kho trong Product không khớp với tổng InventoryBalance")
    public ResponseEntity<ApiResponse<List<StockDiscrepancy>>> checkDiscrepancies() {
        List<StockDiscrepancy> discrepancies = balanceService.checkStockDiscrepancies();
        return ResponseEntity.ok(ApiResponse.success(discrepancies));
    }

    /**
     * Lấy tổng tồn kho của một sản phẩm từ tất cả các kho
     */
    @GetMapping("/product/{productId}/total")
    @Operation(summary = "Lấy tổng tồn kho của sản phẩm",
            description = "Tính tổng số lượng tồn kho của sản phẩm từ tất cả các kho")
    public ResponseEntity<ApiResponse<ProductStockInfo>> getTotalStock(@PathVariable Long productId) {
        Integer totalStock = balanceService.getTotalStockByProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(
                new ProductStockInfo(productId, totalStock)));
    }

    /**
     * Record để trả về kết quả đồng bộ
     */
    public record SyncResult(int updatedCount, String message) {}

    /**
     * Record để trả về thông tin tồn kho
     */
    public record ProductStockInfo(Long productId, Integer totalStock) {}
}