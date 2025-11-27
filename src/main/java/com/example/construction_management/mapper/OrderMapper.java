package com.example.construction_management.mapper;




import com.example.construction_management.dto.response.OrderItemResponse;
import com.example.construction_management.dto.response.OrderResponse;
import com.example.construction_management.dto.response.OrderSummaryResponse;
import com.example.construction_management.entity.Order;
import com.example.construction_management.entity.OrderItem;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * MapStruct Mapper cho Order và OrderItem
 */
@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface OrderMapper {

    /**
     * Convert OrderItem Entity sang Response
     */
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productCode", source = "product.code")
    @Mapping(target = "productName", source = "product.name")
    OrderItemResponse toItemResponse(OrderItem item);

    /**
     * Convert List OrderItem sang List Response
     */
    List<OrderItemResponse> toItemResponseList(List<OrderItem> items);

    /**
     * Convert Order Entity sang OrderResponse (đầy đủ)
     */
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "statusDescription", source = "status.description")
    @Mapping(target = "items", source = "items")
    OrderResponse toResponse(Order order);

    /**
     * Convert Order Entity sang OrderSummaryResponse (không có items)
     */
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "statusDescription", source = "status.description")
    @Mapping(target = "itemCount", expression = "java(getItemCount(order))")
    OrderSummaryResponse toSummaryResponse(Order order);

    /**
     * Convert List Order sang List Summary Response
     */
    List<OrderSummaryResponse> toSummaryResponseList(List<Order> orders);

    /**
     * Helper: Đếm số lượng items
     */
    default Integer getItemCount(Order order) {
        return order.getItems() != null ? order.getItems().size() : 0;
    }

    /**
     * Helper: Tính subtotal cho OrderItem
     */
    default BigDecimal calculateSubtotal(Integer quantity, BigDecimal price) {
        if (quantity == null || price == null) {
            return BigDecimal.ZERO;
        }
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}