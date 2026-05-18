package com.example.construction_management.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_audit_logs")
public class InventoryAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private Integer oldQuantity;

    @Column(nullable = false)
    private Integer newQuantity;

    @Column(nullable = false)
    private Integer changeQuantity;

    @ManyToOne
    @JoinColumn(name = "transaction_id")
    private InventoryTransaction transaction;

    @ManyToOne
    @JoinColumn(name = "changed_by")
    private Employee changedBy;

    @CreatedDate
    private LocalDateTime changedDate;

    private String reason;
}
