package com.example.construction_management.service;

import com.example.construction_management.dto.request.PaymentRequest;
import com.example.construction_management.dto.response.PaymentResponse;
import com.example.construction_management.dto.response.PaymentSummaryResponse;
import com.example.construction_management.entity.*;
import com.example.construction_management.enums.PaymentMethod;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.PaymentMapper;
import com.example.construction_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PaymentMapper paymentMapper;

    public List<PaymentSummaryResponse> getAllPayments() {
        return paymentMapper.toSummaryResponseList(paymentRepository.findAll());
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = findPaymentById(id);
        return paymentMapper.toResponse(payment);
    }

    public List<PaymentSummaryResponse> getPaymentsByOrder(Long orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        return paymentMapper.toSummaryResponseList(
                paymentRepository.findByOrderId(orderId)
        );
    }

    public List<PaymentSummaryResponse> getPaymentsByCustomer(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new BusinessException(ErrorCode.CUSTOMER_NOT_FOUND);
        }
        return paymentMapper.toSummaryResponseList(
                paymentRepository.findByCustomerId(customerId)
        );
    }

    public List<PaymentSummaryResponse> getPaymentsByDateRange(
            LocalDateTime start, LocalDateTime end) {
        return paymentMapper.toSummaryResponseList(
                paymentRepository.findByPaymentDateBetween(start, end)
        );
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        // 1. Validate order exists
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new  BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 2. Validate payment amount
        if (request.getAmount().compareTo(order.getRemainingDebt()) > 0) {
            throw new IllegalArgumentException(
                    String.format("Số tiền thanh toán (%s) vượt quá công nợ còn lại (%s)",
                            request.getAmount(), order.getRemainingDebt())
            );
        }

        // 3. Get current user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new  BusinessException(ErrorCode.USER_NOT_FOUND));

        // 4. Create payment
        Payment payment = Payment.builder()
                .order(order)
                .customer(order.getCustomer())
                .amount(request.getAmount())
                .paymentDate(request.getPaymentDate())
                .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()))
                .reference(request.getReference())
                .note(request.getNote())
                .createdBy(user)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // 5. Update order payment info
        updateOrderPaymentInfo(order, request.getAmount());

        // 6. Update customer debt
        updateCustomerDebt(order.getCustomer(), request.getAmount().negate());

        return paymentMapper.toResponse(savedPayment);
    }

    @Transactional
    public void deletePayment(Long id) {
        Payment payment = findPaymentById(id);

        // Rollback order payment info
        Order order = payment.getOrder();
        updateOrderPaymentInfo(order, payment.getAmount().negate());

        // Rollback customer debt
        updateCustomerDebt(payment.getCustomer(), payment.getAmount());

        paymentRepository.deleteById(id);
    }

    // Helper methods
    private Payment findPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_EXITS));
    }

    private void updateOrderPaymentInfo(Order order, BigDecimal paymentAmount) {
        // Update paid amount
        order.setPaidAmount(order.getPaidAmount().add(paymentAmount));

        // Update remaining debt
        order.setRemainingDebt(order.getTotal().subtract(order.getPaidAmount()));

        // Update payment status
        order.updatePaymentStatus();

        orderRepository.save(order);
    }

    private void updateCustomerDebt(Customer customer, BigDecimal debtChange) {
        BigDecimal currentDebt = customer.getDebt() != null
                ? customer.getDebt()
                : BigDecimal.ZERO;

        customer.setDebt(currentDebt.add(debtChange));
        customerRepository.save(customer);
    }
}