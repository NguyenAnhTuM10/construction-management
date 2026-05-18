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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryBalanceService {
    private final InventoryBalanceRepository balanceRepository;
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

    /**
     * Cập nhật số lượng tồn kho trong một kho cụ thể
     * Đồng thời cập nhật tổng stock trong Product
     */
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

        int newQuantity = balance.getQuantity() + quantityChange;

        if (newQuantity < 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK);
        }

        // Tính giá trung bình khi nhập kho
        if (quantityChange > 0 && unitPrice != null) {
            BigDecimal oldValue = balance.getAverageCost().multiply(BigDecimal.valueOf(balance.getQuantity()));
            BigDecimal newValue = unitPrice.multiply(BigDecimal.valueOf(quantityChange));
            BigDecimal totalValue = oldValue.add(newValue);

            if (newQuantity > 0) {
                balance.setAverageCost(totalValue.divide(BigDecimal.valueOf(newQuantity), 2, RoundingMode.HALF_UP));
            }
        }

        balance.setQuantity(newQuantity);
        balanceRepository.save(balance);

        // Cập nhật tồn kho tổng trong Product
        syncProductStock(productId);

        log.info("Cập nhật tồn kho: Kho={}, Sản phẩm={}, Thay đổi={}, Số lượng mới={}",
                warehouseId, productId, quantityChange, newQuantity);
    }

    /**
     * Đồng bộ lại stock trong Product dựa trên tổng InventoryBalance từ tất cả các kho
     * @param productId ID của sản phẩm cần đồng bộ
     */
    @Transactional
    public void syncProductStock(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        // Tính tổng số lượng từ tất cả các kho
        Integer totalStock = balanceRepository.sumQuantityByProductId(productId);

        int oldStock = product.getStock() != null ? product.getStock() : 0;
        int newStock = totalStock != null ? totalStock : 0;

        if (oldStock != newStock) {
            product.setStock(newStock);
            productRepository.save(product);
            log.info("Đồng bộ tồn kho sản phẩm {}: {} -> {}", productId, oldStock, newStock);
        }
    }

    /**
     * Đồng bộ stock cho TẤT CẢ sản phẩm
     * Sử dụng khi cần reconcile toàn bộ dữ liệu (ví dụ: sau khi import, migration)
     * @return Số lượng sản phẩm đã được cập nhật
     */
    @Transactional
    public int syncAllProductStocks() {
        List<Product> products = productRepository.findAll();
        int updatedCount = 0;

        for (Product product : products) {
            Integer totalStock = balanceRepository.sumQuantityByProductId(product.getId());
            int newStock = totalStock != null ? totalStock : 0;
            int oldStock = product.getStock() != null ? product.getStock() : 0;

            if (oldStock != newStock) {
                product.setStock(newStock);
                updatedCount++;
                log.info("Đồng bộ sản phẩm {}: {} -> {}", product.getId(), oldStock, newStock);
            }
        }

        if (updatedCount > 0) {
            productRepository.saveAll(products);
        }

        log.info("Hoàn thành đồng bộ tồn kho: {}/{} sản phẩm được cập nhật", updatedCount, products.size());
        return updatedCount;
    }

    /**
     * Kiểm tra và báo cáo các sản phẩm có stock không khớp với tổng balance
     * @return Danh sách các sản phẩm có sự chênh lệch
     */
    public List<StockDiscrepancy> checkStockDiscrepancies() {
        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(product -> {
                    Integer totalBalance = balanceRepository.sumQuantityByProductId(product.getId());
                    int balanceStock = totalBalance != null ? totalBalance : 0;
                    int productStock = product.getStock() != null ? product.getStock() : 0;

                    if (balanceStock != productStock) {
                        return new StockDiscrepancy(
                                product.getId(),
                                product.getCode(),
                                product.getName(),
                                productStock,
                                balanceStock,
                                balanceStock - productStock
                        );
                    }
                    return null;
                })
                .filter(d -> d != null)
                .toList();
    }

    /**
     * Lấy tổng số lượng tồn kho của một sản phẩm trên tất cả các kho
     */
    public Integer getTotalStockByProduct(Long productId) {
        Integer total = balanceRepository.sumQuantityByProductId(productId);
        return total != null ? total : 0;
    }

    /**
     * Xóa tất cả balance của một sản phẩm và reset stock về 0
     */
    @Transactional
    public void clearProductBalances(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        balanceRepository.deleteByProductId(productId);
        product.setStock(0);
        productRepository.save(product);

        log.info("Đã xóa tất cả tồn kho của sản phẩm {}", productId);
    }

    /**
     * Record class để lưu thông tin chênh lệch tồn kho
     */
    public record StockDiscrepancy(
            Long productId,
            String productCode,
            String productName,
            Integer productStock,
            Integer balanceStock,
            Integer difference
    ) {}
}