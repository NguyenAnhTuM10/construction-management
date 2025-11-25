package com.example.construction_management.service;

import com.example.construction_management.dto.request.ProductCreateUpdateDTO; // ✅ Đã sửa import DTO
import com.example.construction_management.entity.Category;
import com.example.construction_management.entity.Product;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.ProductMapper;
import com.example.construction_management.repository.CategoryRepository;
import com.example.construction_management.repository.ProductRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductService {

    ProductRepository productRepository;
    CategoryRepository categoryRepository;
    ProductMapper  productMapper;



    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    @Transactional

    public Product create(ProductCreateUpdateDTO dto) {
        // 1. Tìm Category dựa trên ID trong DTO của Product
        Category category = categoryRepository.findById(dto.getCategoryId()) // ✅ Lấy Category ID
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

      Product product = productMapper.toProduct(dto);

      product.setCategory(category);

        // 3. Lưu và trả về
        return productRepository.save(product);
    }

    @Transactional

    public Product update(Long id, ProductCreateUpdateDTO dto) {
        Product existingProduct = findById(id);

        productMapper.updateProduct(dto, existingProduct);

        // 1. Tìm và thiết lập Category (nếu Category ID được cung cấp trong DTO)
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
            existingProduct.setCategory(category);
        }



        return productRepository.save(existingProduct);
    }

    public void delete(Long id) {
        productRepository.deleteById(id);
    }
}