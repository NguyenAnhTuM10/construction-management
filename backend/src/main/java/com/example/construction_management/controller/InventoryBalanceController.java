package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.response.InventoryBalanceResponse;
import com.example.construction_management.service.InventoryBalanceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory/balances")
@RequiredArgsConstructor
@Tag(name = "Inventory Balance", description = "Endpoints for viewing inventory balances")
public class InventoryBalanceController {
    private final InventoryBalanceService balanceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryBalanceResponse>>> getAllBalances() {
        return ResponseEntity.ok(ApiResponse.success(balanceService.getAllBalances()));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ApiResponse<List<InventoryBalanceResponse>>> getBalancesByWarehouse(
            @PathVariable Long warehouseId) {
        return ResponseEntity.ok(ApiResponse.success(balanceService.getBalancesByWarehouse(warehouseId)));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<InventoryBalanceResponse>>> getBalancesByProduct(
            @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(balanceService.getBalancesByProduct(productId)));
    }

    @GetMapping("/warehouse/{warehouseId}/product/{productId}")
    public ResponseEntity<ApiResponse<InventoryBalanceResponse>> getBalance(
            @PathVariable Long warehouseId,
            @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(balanceService.getBalance(warehouseId, productId)));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<InventoryBalanceResponse>>> getLowStockProducts(
            @RequestParam(defaultValue = "10") Integer threshold) {
        return ResponseEntity.ok(ApiResponse.success(balanceService.getLowStockProducts(threshold)));
    }
}

