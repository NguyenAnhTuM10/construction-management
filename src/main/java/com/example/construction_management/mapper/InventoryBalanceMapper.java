
// InventoryBalanceMapper.java
package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.InventoryBalanceResponse;
import com.example.construction_management.entity.InventoryBalance;
import org.mapstruct.*;

        import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public interface InventoryBalanceMapper {

    @Mapping(target = "warehouseId", source = "warehouse.id")
    @Mapping(target = "warehouseCode", source = "warehouse.code")
    @Mapping(target = "warehouseName", source = "warehouse.name")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productCode", source = "product.code")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "unit", source = "product.unit")
    @Mapping(target = "totalValue", expression = "java(calculateTotalValue(balance))")
    InventoryBalanceResponse toResponse(InventoryBalance balance);

    List<InventoryBalanceResponse> toResponseList(List<InventoryBalance> balances);

    default BigDecimal calculateTotalValue(InventoryBalance balance) {
        if (balance.getQuantity() == null || balance.getAverageCost() == null) {
            return BigDecimal.ZERO;
        }
        return balance.getAverageCost().multiply(BigDecimal.valueOf(balance.getQuantity()));
    }
}