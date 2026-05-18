package com.example.construction_management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * Entity OrderItem - Chi tiết sản phẩm trong đơn hàng
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "FK_item_order"))
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "FK_item_product"))
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    /**
     * Giá tại thời điểm đặt hàng (lưu lại để tránh thay đổi khi giá sản phẩm thay đổi)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /**
     * Thành tiền = quantity * price
     * Tự động tính trước khi save
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    /**
     * Tự động tính subtotal trước khi persist và update
     */
    @PrePersist
    @PreUpdate
    public void calculateSubtotal() {
        if (this.quantity != null && this.price != null) {
            this.subtotal = this.price.multiply(BigDecimal.valueOf(this.quantity));
        } else {
            this.subtotal = BigDecimal.ZERO;
        }
    }
}