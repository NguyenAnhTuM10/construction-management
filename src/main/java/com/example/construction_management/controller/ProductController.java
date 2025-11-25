package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.CategoryDTO;
import com.example.construction_management.dto.request.ProductCreateUpdateDTO;
import com.example.construction_management.entity.Product;
import com.example.construction_management.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@PreAuthorize("hasAnyRole('ADMIN')")
public class ProductController {

    private final ProductService productService;

    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // GET /api/products
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<Product>> getAllProducts() {
        List<Product> products = productService.findAll();
        // Không logic, chỉ gọi service và đóng gói kết quả
        return ApiResponse.success(products);
    }

    // GET /api/products/{id}
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Product> getProductById(@PathVariable Long id) {
        Product product = productService.findById(id); // Service ném lỗi nếu không tìm thấy
        return ApiResponse.success(product);
    }

    // POST /api/products
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED) // HTTP Status 201 cho Tạo thành công
    public ApiResponse<Product> createProduct(@RequestBody ProductCreateUpdateDTO request) {
        Product savedProduct = productService.create(request); // Logic ở Service
        return ApiResponse.success(savedProduct, "Product created successfully.");
    }

    // PUT /api/products/{id}
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody  ProductCreateUpdateDTO request) {
        Product updatedProduct = productService.update(id, request); // Logic ở Service
        return ApiResponse.success(updatedProduct, "Product updated successfully.");
    }

    // DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // HTTP Status 204 cho Xóa thành công
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id); // Logic ở Service
        // Trả về ApiResponse.success() với Void (hoặc null data)
        return ApiResponse.success("Product deleted successfully.");
    }
}