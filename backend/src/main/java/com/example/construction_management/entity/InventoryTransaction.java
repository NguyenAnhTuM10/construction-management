package com.example.construction_management.entity;

import com.example.construction_management.enums.TransactionReason;
import com.example.construction_management.enums.TransactionStatus;
import com.example.construction_management.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class InventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String transactionCode; // PN001, PX001

    @ManyToOne
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // IN, OUT

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionReason reason; // PURCHASE, SALE, RETURN, ADJUST

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false)
    private LocalDateTime transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING; // PENDING, COMPLETED, CANCELLED

    @Column(precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private String note;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InventoryTransactionItem> items = new ArrayList<>();

    // Helper method
    public void addItem(InventoryTransactionItem item) {
        items.add(item);
        item.setTransaction(this);
    }

    public void calculateTotal() {
        this.totalAmount = items.stream()
                .map(InventoryTransactionItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}