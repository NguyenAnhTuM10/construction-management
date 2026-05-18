package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.CategoryDTO;
import com.example.construction_management.entity.Category;
import com.example.construction_management.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@PreAuthorize("hasAnyRole('ADMIN')")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // GET /api/categories
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.findAll();
        return ApiResponse.success(categories);
    }

    // GET /api/categories/{id}
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Category> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.findById(id);
        return ApiResponse.success(category);
    }

    // POST /api/categories
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Category> createCategory(@RequestBody CategoryDTO dto) {
        Category savedCategory = categoryService.create(dto);
        return ApiResponse.success(savedCategory, "Category created successfully.");
    }

    // PUT /api/categories/{id}
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Category> updateCategory(@PathVariable Long id, @RequestBody CategoryDTO dto) {
        Category updatedCategory = categoryService.update(id, dto);
        return ApiResponse.success(updatedCategory, "Category updated successfully.");
    }

    // DELETE /api/categories/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.success("Category deleted successfully.");
    }
}