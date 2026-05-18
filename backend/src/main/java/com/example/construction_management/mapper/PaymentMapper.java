package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.PaymentResponse;
import com.example.construction_management.dto.response.PaymentSummaryResponse;
import com.example.construction_management.entity.Payment;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderTotal", source = "order.total")
    @Mapping(target = "orderPaidAmount", source = "order.paidAmount")
    @Mapping(target = "orderRemainingDebt", source = "order.remainingDebt")
    @Mapping(target = "orderPaymentStatus", source = "order.paymentStatus")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    PaymentResponse toResponse(Payment payment);

    List<PaymentResponse> toResponseList(List<Payment> payments);

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    PaymentSummaryResponse toSummaryResponse(Payment payment);

    List<PaymentSummaryResponse> toSummaryResponseList(List<Payment> payments);
}