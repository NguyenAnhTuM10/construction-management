package com.example.construction_management.service;

import com.example.construction_management.dto.response.InventoryBalanceResponse;
import com.example.construction_management.entity.InventoryBalance;
import com.example.construction_management.entity.Product;
import com.example.construction_management.entity.Warehouse;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.InventoryBalanceMapper;
import com.example.construction_management.repository.InventoryBalanceRepository;
import com.example.construction_management.repository.ProductRepository;
import com.example.construction_management.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryBalanceService {
    private final InventoryBalanceRepository  balanceRepository;
    private final ProductRepository productRepository;
    private final InventoryBalanceMapper balanceMapper;
    private final WarehouseRepository warehouseRepository;


    public List<InventoryBalanceResponse> getAllBalances() {
        return balanceMapper.toResponseList(balanceRepository.findAll());
    }

    public List<InventoryBalanceResponse> getBalancesByWarehouse(Long warehouseId) {
        return balanceMapper.toResponseList(balanceRepository.findByWarehouseId(warehouseId));
    }

    public List<InventoryBalanceResponse> getBalancesByProduct(Long productId) {
        return balanceMapper.toResponseList(balanceRepository.findByProductId(productId));
    }

    public InventoryBalanceResponse getBalance(Long warehouseId, Long productId) {
        InventoryBalance balance = balanceRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WAREHOUSE_NOT_EXISTED));
        return balanceMapper.toResponse(balance);
    }

    public List<InventoryBalanceResponse> getLowStockProducts(Integer threshold) {
        return balanceMapper.toResponseList(balanceRepository.findLowStockProducts(threshold));
    }

    @Transactional
    public void updateBalance(Long warehouseId, Long productId, Integer quantityChange, BigDecimal unitPrice) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WAREHOUSE_NOT_EXISTED));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        InventoryBalance balance = balanceRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> {
                    InventoryBalance newBalance = InventoryBalance.builder()
                            .warehouse(warehouse)
                            .product(product)
                            .quantity(0)
                            .averageCost(BigDecimal.ZERO)
                            .build();
                    return balanceRepository.save(newBalance);
                });

        // Calculate new quantity
        int newQuantity = balance.getQuantity() + quantityChange;

        if (newQuantity < 0) {
            throw new IllegalStateException("Số lượng tồn kho không đủ");
        }

        // Calculate new average cost (only for IN transactions)
        if (quantityChange > 0) {
            BigDecimal oldValue = balance.getAverageCost().multiply(BigDecimal.valueOf(balance.getQuantity()));
            BigDecimal newValue = unitPrice.multiply(BigDecimal.valueOf(quantityChange));
            BigDecimal totalValue = oldValue.add(newValue);

            if (newQuantity > 0) {
                balance.setAverageCost(totalValue.divide(BigDecimal.valueOf(newQuantity), 2, RoundingMode.HALF_UP));
            }
        }

        balance.setQuantity(newQuantity);
        balanceRepository.save(balance);
    }
}



