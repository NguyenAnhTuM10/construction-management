package com.example.construction_management.controller;




import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.CustomerCreateRequest;
import com.example.construction_management.dto.request.CustomerUpdateRequest;
import com.example.construction_management.dto.response.CustomerResponse;
import com.example.construction_management.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE', 'ACCOUNTANT')")
    public ApiResponse<List<CustomerResponse>> getAllCustomers() {
        List<CustomerResponse> customers = customerService.getAllCustomers();
        return ApiResponse.success(customers);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE', 'ACCOUNTANT')")
    public ApiResponse<CustomerResponse> getCustomerById(@PathVariable Long id) {
        CustomerResponse customer = customerService.getCustomerById(id);
        return ApiResponse.success(customer);
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE')")
    public ApiResponse<CustomerResponse> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerResponse created = customerService.createCustomer(request);
        return ApiResponse.success(created, "Customer created successfully");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE')")
    public ApiResponse<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerUpdateRequest request) {
        CustomerResponse updated = customerService.updateCustomer(id,  request);
        return ApiResponse.success(updated, "Customer updated successfully");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ApiResponse.success(null, "Customer deleted successfully");
    }
}