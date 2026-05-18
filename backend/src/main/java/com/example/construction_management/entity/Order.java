package com.example.construction_management.entity;

import com.example.construction_management.enums.OrderStatus;
import com.example.construction_management.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(name = "FK_order_customer"))
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "employee_id", foreignKey = @ForeignKey(name = "FK_order_employee"))
    private Employee employee;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;  // ✅ FIX: Thêm @Builder.Default

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // ========== PAYMENT FIELDS ==========

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingDebt = BigDecimal.ZERO;  // ✅ Đã có @Builder.Default

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    // ========== HELPER METHODS ==========

    /**
     * ✅ FIX: Cải thiện @PrePersist để đảm bảo remainingDebt luôn được set
     */
    @PrePersist
    public void prePersist() {
        // Đảm bảo total không null
        if (this.total == null) {
            this.total = BigDecimal.ZERO;
        }

        // Đảm bảo paidAmount không null
        if (this.paidAmount == null) {
            this.paidAmount = BigDecimal.ZERO;
        }

        // Tính remainingDebt nếu chưa có hoặc bằng 0
        if (this.remainingDebt == null || this.remainingDebt.compareTo(BigDecimal.ZERO) == 0) {
            this.remainingDebt = this.total.subtract(this.paidAmount);
        }

        // Đảm bảo paymentStatus không null
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.UNPAID;
        }
    }

    /**
     * ✅ FIX: Cập nhật payment status với null-safe
     */
    public void updatePaymentStatus() {
        // Ensure values are not null
        BigDecimal currentTotal = this.total != null ? this.total : BigDecimal.ZERO;
        BigDecimal currentPaidAmount = this.paidAmount != null ? this.paidAmount : BigDecimal.ZERO;

        // Calculate remaining debt
        this.remainingDebt = currentTotal.subtract(currentPaidAmount);

        // Ensure remainingDebt is not negative
        if (this.remainingDebt.compareTo(BigDecimal.ZERO) < 0) {
            this.remainingDebt = BigDecimal.ZERO;
        }

        // Update status based on paid amount
        if (currentPaidAmount.compareTo(BigDecimal.ZERO) == 0) {
            this.paymentStatus = PaymentStatus.UNPAID;
        } else if (currentPaidAmount.compareTo(currentTotal) >= 0) {
            this.paymentStatus = PaymentStatus.PAID;
            this.remainingDebt = BigDecimal.ZERO;
        } else {
            this.paymentStatus = PaymentStatus.PARTIAL;
        }
    }

    /**
     * Thêm payment vào order
     */
    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setOrder(this);
    }

    /**
     * ✅ THÊM: Helper method để lấy remainingDebt an toàn
     */
    public BigDecimal getRemainingDebtSafe() {
        if (this.remainingDebt != null) {
            return this.remainingDebt;
        }
        BigDecimal currentTotal = this.total != null ? this.total : BigDecimal.ZERO;
        BigDecimal currentPaidAmount = this.paidAmount != null ? this.paidAmount : BigDecimal.ZERO;
        return currentTotal.subtract(currentPaidAmount);
    }
}