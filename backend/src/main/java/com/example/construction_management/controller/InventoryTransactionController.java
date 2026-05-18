
package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.InventoryTransactionRequest;
import com.example.construction_management.dto.response.InventoryTransactionResponse;
import com.example.construction_management.dto.response.InventoryTransactionSummaryResponse;
import com.example.construction_management.service.InventoryTransactionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/inventory/transactions")
@RequiredArgsConstructor
@Tag(name = "Inventory Transaction", description = "Endpoints for managing inventory transactions")
public class InventoryTransactionController {
    private final InventoryTransactionService transactionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryTransactionSummaryResponse>>> getAllTransactions() {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getAllTransactions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryTransactionResponse>> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getTransactionById(id)));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ApiResponse<List<InventoryTransactionSummaryResponse>>> getTransactionsByWarehouse(
            @PathVariable Long warehouseId) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTransactionsByWarehouse(warehouseId)));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<InventoryTransactionSummaryResponse>>> getTransactionsByType(
            @PathVariable String type) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getTransactionsByType(type)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<InventoryTransactionSummaryResponse>>> getTransactionsByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getTransactionsByStatus(status)));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<InventoryTransactionSummaryResponse>>> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTransactionsByDateRange(start, end)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InventoryTransactionResponse>> createTransaction(
            @Valid @RequestBody InventoryTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(transactionService.createTransaction(request)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<InventoryTransactionResponse>> completeTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.completeTransaction(id)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<InventoryTransactionResponse>> cancelTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.cancelTransaction(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}