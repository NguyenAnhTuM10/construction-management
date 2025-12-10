package com.example.construction_management.entity;



import com.example.construction_management.enums.OrderStatus;
import com.example.construction_management.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
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
    private BigDecimal total = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    private LocalDateTime createdDate = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;





    // ========== PAYMENT FIELDS (NEW) ==========

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingDebt = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    // Helper methods
    @PrePersist
    public void prePersist() {
        if (remainingDebt == null || remainingDebt.compareTo(BigDecimal.ZERO) == 0) {
            this.remainingDebt = this.total;
        }
    }

    public void updatePaymentStatus() {
        if (paidAmount.compareTo(BigDecimal.ZERO) == 0) {
            this.paymentStatus = PaymentStatus.UNPAID;
        } else if (paidAmount.compareTo(total) >= 0) {
            this.paymentStatus = PaymentStatus.PAID;
            this.remainingDebt = BigDecimal.ZERO;
        } else {
            this.paymentStatus = PaymentStatus.PARTIAL;
        }
    }



    
}
