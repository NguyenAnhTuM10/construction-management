package com.example.construction_management.repository;

import com.example.construction_management.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByCode(String code);
    List<Product> findByCategory_Id(Long categoryId);
    List<Product> findByStockLessThan(Integer threshold);

    Long countByCategory_Id(Long categoryId);

}