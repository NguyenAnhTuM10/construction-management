package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.*;
import com.example.construction_management.entity.*;
import com.example.construction_management.enums.OrderStatus;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "statusDescription", expression = "java(getStatusDescription(order.getStatus()))")
    @Mapping(target = "paymentCount", expression = "java(order.getPayments() != null ? order.getPayments().size() : 0)")
    OrderResponse toResponse(Order order);

    List<OrderResponse> toResponseList(List<Order> orders);

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "statusDescription", expression = "java(getStatusDescription(order.getStatus()))")
    @Mapping(target = "itemCount", expression = "java(order.getItems() != null ? order.getItems().size() : 0)")
    OrderSummaryResponse toSummaryResponse(Order order);

    List<OrderSummaryResponse> toSummaryResponseList(List<Order> orders);

    default String getStatusDescription(OrderStatus status) {
        if (status == null) return "";
        switch (status) {
            case PENDING: return "Chờ xử lý";
            case CONFIRMED: return "Đã xác nhận";
            case PROCESSING: return "Đang xử lý";
            case SHIPPING: return "Đang giao hàng";
            case COMPLETED: return "Hoàn thành";
            case CANCELLED: return "Đã hủy";
            default: return status.toString();
        }
    }
}