package com.example.construction_management.service;

import com.example.construction_management.dto.request.InventoryTransactionItemRequest;
import com.example.construction_management.dto.request.InventoryTransactionRequest;
import com.example.construction_management.dto.response.InventoryTransactionResponse;
import com.example.construction_management.dto.response.InventoryTransactionSummaryResponse;
import com.example.construction_management.entity.*;
import com.example.construction_management.enums.TransactionReason;
import com.example.construction_management.enums.TransactionStatus;
import com.example.construction_management.enums.TransactionType;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.InventoryTransactionMapper;
import com.example.construction_management.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryTransactionService {
    private final InventoryTransactionRepository transactionRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryTransactionMapper transactionMapper;
    private final InventoryBalanceService inventoryBalanceService;

    public List<InventoryTransactionSummaryResponse> getAllTransactions() {
        return transactionMapper.toSummaryResponseList(transactionRepository.findAll());
    }

    public InventoryTransactionResponse getTransactionById(Long id) {
        InventoryTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));
        return transactionMapper.toResponse(transaction);
    }

    public List<InventoryTransactionSummaryResponse> getTransactionsByWarehouse(Long warehouseId) {
        return transactionMapper.toSummaryResponseList(
                transactionRepository.findByWarehouseId(warehouseId)
        );
    }

    public List<InventoryTransactionSummaryResponse> getTransactionsByType(String type) {
        TransactionType transactionType = TransactionType.valueOf(type);
        return transactionMapper.toSummaryResponseList(
                transactionRepository.findByType(transactionType)
        );
    }

    public List<InventoryTransactionSummaryResponse> getTransactionsByStatus(String status) {
        TransactionStatus transactionStatus = TransactionStatus.valueOf(status);
        return transactionMapper.toSummaryResponseList(
                transactionRepository.findByStatus(transactionStatus)
        );
    }

    public List<InventoryTransactionSummaryResponse> getTransactionsByDateRange(
            LocalDateTime start, LocalDateTime end) {
        return transactionMapper.toSummaryResponseList(
                transactionRepository.findByTransactionDateBetween(start, end)
        );
    }

    @Transactional
    public InventoryTransactionResponse createTransaction(InventoryTransactionRequest request) {
        // Validate warehouse
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WAREHOUSE_NOT_EXISTED));

        // Create transaction
        InventoryTransaction transaction = InventoryTransaction.builder()
                .transactionCode(generateTransactionCode(request.getType()))
                .warehouse(warehouse)
                .type(TransactionType.valueOf(request.getType()))
                .reason(TransactionReason.valueOf(request.getReason()))
                .transactionDate(request.getTransactionDate())
                .status(TransactionStatus.PENDING)
                .note(request.getNote())
                .build();

        // Set supplier if exists
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.SUPPLIER_NOT_FOUND));
            transaction.setSupplier(supplier);
        }

        // Set order if exists
        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
            transaction.setOrder(order);
        }

        // Set created by
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_EXISTED));
        transaction.setCreatedBy(user);

        // Add items
        for (InventoryTransactionItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

            InventoryTransactionItem item = InventoryTransactionItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(itemRequest.getUnitPrice())
                    .note(itemRequest.getNote())
                    .build();

            item.calculateSubtotal();
            transaction.addItem(item);
        }

        // Calculate total
        transaction.calculateTotal();

        // Save
        InventoryTransaction savedTransaction = transactionRepository.save(transaction);

        log.info("Tạo giao dịch mới: Code={}, Type={}, Warehouse={}",
                savedTransaction.getTransactionCode(),
                savedTransaction.getType(),
                warehouse.getName());

        return transactionMapper.toResponse(savedTransaction);
    }

    @Transactional
    public InventoryTransactionResponse completeTransaction(Long id) {
        InventoryTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        // Validate transaction status
        if (transaction.getStatus() == TransactionStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.TRANSACTION_ALREADY_COMPLETED);
        }

        if (transaction.getStatus() == TransactionStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.CANNOT_COMPLETE_CANCELLED_TRANSACTION);
        }

        // Validate stock before processing OUT transaction
        if (transaction.getType() == TransactionType.OUT) {
            for (InventoryTransactionItem item : transaction.getItems()) {
                Integer currentStock = inventoryBalanceService.getTotalStockByProduct(item.getProduct().getId());
                if (currentStock < item.getQuantity()) {
                    log.warn("Không đủ tồn kho cho sản phẩm {}: Cần={}, Hiện có={}",
                            item.getProduct().getCode(), item.getQuantity(), currentStock);
                    throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK);
                }
            }
        }

        // Update inventory balance for each item
        for (InventoryTransactionItem item : transaction.getItems()) {
            int quantityChange = transaction.getType() == TransactionType.IN
                    ? item.getQuantity()
                    : -item.getQuantity();

            inventoryBalanceService.updateBalance(
                    transaction.getWarehouse().getId(),
                    item.getProduct().getId(),
                    quantityChange,
                    item.getUnitPrice()
            );
        }

        transaction.setStatus(TransactionStatus.COMPLETED);
        InventoryTransaction savedTransaction = transactionRepository.save(transaction);

        log.info("Hoàn thành giao dịch: Code={}, Type={}",
                transaction.getTransactionCode(), transaction.getType());

        return transactionMapper.toResponse(savedTransaction);
    }

    @Transactional
    public InventoryTransactionResponse cancelTransaction(Long id) {
        InventoryTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (transaction.getStatus() == TransactionStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.CANNOT_CANCEL_COMPLETED_TRANSACTION);
        }

        if (transaction.getStatus() == TransactionStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.TRANSACTION_ALREADY_CANCELLED);
        }

        transaction.setStatus(TransactionStatus.CANCELLED);
        InventoryTransaction savedTransaction = transactionRepository.save(transaction);

        log.info("Hủy giao dịch: Code={}", transaction.getTransactionCode());

        return transactionMapper.toResponse(savedTransaction);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        InventoryTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (transaction.getStatus() == TransactionStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.CANNOT_DELETE_COMPLETED_TRANSACTION);
        }

        transactionRepository.deleteById(id);
        log.info("Xóa giao dịch: Code={}", transaction.getTransactionCode());
    }

    private String generateTransactionCode(String type) {
        String prefix = type.equals("IN") ? "PN" : "PX";
        String maxCode = transactionRepository.findMaxTransactionCodeByPrefix(prefix);

        if (maxCode == null) {
            return prefix + "001";
        }

        int number = Integer.parseInt(maxCode.substring(2)) + 1;
        return prefix + String.format("%03d", number);
    }
}