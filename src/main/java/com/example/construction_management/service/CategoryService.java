package com.example.construction_management.service;

import com.example.construction_management.dto.request.CategoryDTO;
import com.example.construction_management.entity.Category;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.CategoryMapper;
import com.example.construction_management.repository.CategoryRepository;
import com.example.construction_management.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ProductRepository productRepository;


    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND, "Chỉ có thể xóa đơn hàng đã bị hủy"));
    }

    public Category create(CategoryDTO dto) {
        Category category = categoryMapper.toCategory(dto);
        return categoryRepository.save(category);
    }

    public Category update(Long id, CategoryDTO dto) {
        Category existingCategory = findById(id);
        existingCategory.setName(dto.getName());
        return categoryRepository.save(existingCategory);
    }


    @Transactional
    public void delete(Long id) {
        Category category = findById(id);

        // 1. ✅ LOGIC MỚI: Chỉ thực hiện một truy vấn COUNT(*) trên bảng Product
        long productCount = productRepository.countByCategory_Id(id);

        if (productCount > 0) {
            throw new RuntimeException("Cannot delete Category ID " + id +
                    ". There are " + productCount +
                    " products associated with it.");
        }

        categoryRepository.delete(category);

    }

}

