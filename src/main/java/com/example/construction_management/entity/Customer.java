package com.example.construction_management.entity;



import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    private String email;
    private String phone;
    private String address;

    @Column(precision = 12, scale = 2)
    private BigDecimal debt = BigDecimal.ZERO;
}
