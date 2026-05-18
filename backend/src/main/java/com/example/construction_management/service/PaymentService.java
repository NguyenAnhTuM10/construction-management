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
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // ✅ FIX: Tính remainingDebt an toàn, xử lý null
        BigDecimal remainingDebt = calculateRemainingDebt(order);

        // 2. Validate payment amount
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("Số tiền thanh toán không được để trống");
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }

        if (request.getAmount().compareTo(remainingDebt) > 0) {
            throw new IllegalArgumentException(
                    String.format("Số tiền thanh toán (%s) vượt quá công nợ còn lại (%s)",
                            request.getAmount(), remainingDebt)
            );
        }

        // 3. Get current user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 4. Create payment
        Payment payment = Payment.builder()
                .order(order)
                .customer(order.getCustomer())
                .amount(request.getAmount())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now())
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

    // ==================== HELPER METHODS ====================

    private Payment findPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_EXITS));
    }

    /**
     * ✅ FIX: Tính remainingDebt an toàn, xử lý trường hợp null
     */
    private BigDecimal calculateRemainingDebt(Order order) {
        // Nếu remainingDebt đã có giá trị, sử dụng nó
        if (order.getRemainingDebt() != null) {
            return order.getRemainingDebt();
        }

        // Nếu null, tính từ total - paidAmount
        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        BigDecimal paidAmount = order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO;

        return total.subtract(paidAmount);
    }

    /**
     * ✅ FIX: Update order payment info với null-safe
     */
    private void updateOrderPaymentInfo(Order order, BigDecimal paymentAmount) {
        // Ensure paidAmount is not null
        BigDecimal currentPaidAmount = order.getPaidAmount() != null
                ? order.getPaidAmount()
                : BigDecimal.ZERO;

        // Ensure total is not null
        BigDecimal total = order.getTotal() != null
                ? order.getTotal()
                : BigDecimal.ZERO;

        // Update paid amount
        BigDecimal newPaidAmount = currentPaidAmount.add(paymentAmount);
        order.setPaidAmount(newPaidAmount);

        // Update remaining debt
        BigDecimal newRemainingDebt = total.subtract(newPaidAmount);
        // Đảm bảo remainingDebt không âm
        if (newRemainingDebt.compareTo(BigDecimal.ZERO) < 0) {
            newRemainingDebt = BigDecimal.ZERO;
        }
        order.setRemainingDebt(newRemainingDebt);

        // Update payment status
        order.updatePaymentStatus();

        orderRepository.save(order);
    }

    /**
     * ✅ FIX: Update customer debt với null-safe
     */
    private void updateCustomerDebt(Customer customer, BigDecimal debtChange) {
        if (customer == null) {
            return;
        }

        BigDecimal currentDebt = customer.getDebt() != null
                ? customer.getDebt()
                : BigDecimal.ZERO;

        BigDecimal newDebt = currentDebt.add(debtChange);
        // Đảm bảo debt không âm
        if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
            newDebt = BigDecimal.ZERO;
        }

        customer.setDebt(newDebt);
        customerRepository.save(customer);
    }
}