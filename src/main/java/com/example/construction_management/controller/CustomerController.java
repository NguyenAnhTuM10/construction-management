package com.example.construction_management.controller;




import com.example.construction_management.dto.APIResponse;
import com.example.construction_management.dto.request.CustomerDTO;
import com.example.construction_management.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE', 'ACCOUNTANT')")
    public ResponseEntity<APIResponse<List<CustomerDTO>>> getAllCustomers() {
        List<CustomerDTO> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(APIResponse.success(customers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE', 'ACCOUNTANT')")
    public ResponseEntity<APIResponse<CustomerDTO>> getCustomerById(@PathVariable Long id) {
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(APIResponse.success(customer));
    }

    @GetMapping("/debt")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE', 'ACCOUNTANT')")
    public ResponseEntity<APIResponse<List<CustomerDTO>>> getCustomersWithDebt() {
        List<CustomerDTO> customers = customerService.getCustomersWithDebt();
        return ResponseEntity.ok(APIResponse.success(customers));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE')")
    public ResponseEntity<APIResponse<CustomerDTO>> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
        CustomerDTO created = customerService.createCustomer(customerDTO);
        return ResponseEntity.ok(APIResponse.success(created, "Customer created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALE')")
    public ResponseEntity<APIResponse<CustomerDTO>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerDTO customerDTO) {
        CustomerDTO updated = customerService.updateCustomer(id, customerDTO);
        return ResponseEntity.ok(APIResponse.success(updated, "Customer updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(APIResponse.success(null, "Customer deleted successfully"));
    }
}