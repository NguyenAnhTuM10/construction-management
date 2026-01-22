package com.example.construction_management.service;

import com.example.construction_management.dto.request.ProductCreateUpdateDTO;
import com.example.construction_management.entity.Category;
import com.example.construction_management.entity.Product;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.ProductMapper;
import com.example.construction_management.repository.CategoryRepository;
import com.example.construction_management.repository.InventoryBalanceRepository;
import com.example.construction_management.repository.ProductRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductService {

    ProductRepository productRepository;
    CategoryRepository categoryRepository;
    ProductMapper productMapper;
    InventoryBalanceRepository balanceRepository;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    /**
     * Tạo sản phẩm mới
     * Stock luôn được khởi tạo = 0 vì chưa có nhập kho
     */
    @Transactional
    public Product create(ProductCreateUpdateDTO dto) {
        // Tìm Category dựa trên ID trong DTO
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        Product product = productMapper.toProduct(dto);
        product.setCategory(category);

        // Đảm bảo stock được khởi tạo = 0 (sản phẩm mới chưa có tồn kho)
        product.setStock(0);

        // Đảm bảo giá mặc định = 0 nếu không được set
        if (product.getBuyPrice() == null) {
            product.setBuyPrice(BigDecimal.ZERO);
        }
        if (product.getSellPrice() == null) {
            product.setSellPrice(BigDecimal.ZERO);
        }

        Product savedProduct = productRepository.save(product);
        log.info("Tạo sản phẩm mới: ID={}, Code={}, Name={}",
                savedProduct.getId(), savedProduct.getCode(), savedProduct.getName());

        return savedProduct;
    }

    /**
     * Cập nhật thông tin sản phẩm
     * KHÔNG cho phép cập nhật stock trực tiếp - phải thông qua InventoryTransaction
     */
    @Transactional
    public Product update(Long id, ProductCreateUpdateDTO dto) {
        Product existingProduct = findById(id);

        // Lưu lại stock hiện tại (không cho phép thay đổi qua API update)
        Integer currentStock = existingProduct.getStock();

        productMapper.updateProduct(dto, existingProduct);

        // Khôi phục lại stock (không cho phép thay đổi trực tiếp)
        existingProduct.setStock(currentStock);

        // Cập nhật Category nếu có
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
            existingProduct.setCategory(category);
        }

        Product updatedProduct = productRepository.save(existingProduct);
        log.info("Cập nhật sản phẩm: ID={}, Code={}", updatedProduct.getId(), updatedProduct.getCode());

        return updatedProduct;
    }

    /**
     * Xóa sản phẩm
     * Chỉ cho phép xóa nếu không còn tồn kho
     */
    @Transactional
    public void delete(Long id) {
        Product product = findById(id);

        // Kiểm tra xem sản phẩm còn tồn kho không
        Integer totalStock = balanceRepository.sumQuantityByProductId(id);
        if (totalStock != null && totalStock > 0) {
            throw new BusinessException(ErrorCode.CANNOT_DELETE_PRODUCT_WITH_STOCK);
        }

        // Xóa tất cả balance records của sản phẩm này (nếu có)
        balanceRepository.deleteByProductId(id);

        productRepository.deleteById(id);
        log.info("Xóa sản phẩm: ID={}, Code={}", id, product.getCode());
    }

    /**
     * Lấy số lượng tồn kho thực tế của sản phẩm (tính từ tất cả các kho)
     */
    public Integer getActualStock(Long productId) {
        Integer totalStock = balanceRepository.sumQuantityByProductId(productId);
        return totalStock != null ? totalStock : 0;
    }

    /**
     * Kiểm tra xem stock trong Product có khớp với tổng balance không
     */
    public boolean isStockSynced(Long productId) {
        Product product = findById(productId);
        Integer actualStock = getActualStock(productId);
        Integer productStock = product.getStock() != null ? product.getStock() : 0;
        return productStock.equals(actualStock);
    }
}