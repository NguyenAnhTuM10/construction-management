package com.example.construction_management.entity;



import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "FK_product_category"))
    private Category category;

    private String unit;

    @Column(precision = 12, scale = 2)
    private BigDecimal buyPrice = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal sellPrice = BigDecimal.ZERO;

    private Integer stock = 0;
}
