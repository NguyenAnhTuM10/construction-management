

// InventoryTransactionMapper.java
package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.*;
import com.example.construction_management.entity.*;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InventoryTransactionMapper {

    @Mapping(target = "warehouseId", source = "warehouse.id")
    @Mapping(target = "warehouseName", source = "warehouse.name")
    @Mapping(target = "supplierId", source = "supplier.id")
    @Mapping(target = "supplierName", source = "supplier.name")
    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    InventoryTransactionResponse toResponse(InventoryTransaction transaction);

    @Mapping(target = "warehouseName", source = "warehouse.name")
    @Mapping(target = "itemCount", expression = "java(transaction.getItems() != null ? transaction.getItems().size() : 0)")
    InventoryTransactionSummaryResponse toSummaryResponse(InventoryTransaction transaction);

    List<InventoryTransactionSummaryResponse> toSummaryResponseList(List<InventoryTransaction> transactions);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productCode", source = "product.code")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "unit", source = "product.unit")
    InventoryTransactionItemResponse toItemResponse(InventoryTransactionItem item);

    List<InventoryTransactionItemResponse> toItemResponseList(List<InventoryTransactionItem> items);
}
