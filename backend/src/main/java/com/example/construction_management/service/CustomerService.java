package com.example.construction_management.service;

import com.example.construction_management.dto.request.CustomerCreateRequest;
import com.example.construction_management.dto.response.CustomerResponse;
import com.example.construction_management.dto.request.CustomerUpdateRequest;
import com.example.construction_management.entity.Customer;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.CustomerMapper;
import com.example.construction_management.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý business logic cho Customer
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    /**
     * Lấy tất cả khách hàng
     */
    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers() {
        log.info("Getting all customers");
        List<Customer> customers = customerRepository.findAll();
        return customerMapper.toResponseList(customers);
    }

    /**
     * Lấy khách hàng theo ID
     */
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        log.info("Getting customer by id: {}", id);
        Customer customer = findCustomerById(id);
        return customerMapper.toResponse(customer);
    }

    /**
     * Tìm kiếm khách hàng theo tên
     */
    @Transactional(readOnly = true)
    public List<CustomerResponse> searchCustomers(String keyword) {
        log.info("Searching customers with keyword: {}", keyword);
        List<Customer> customers = customerRepository.findByNameContainingIgnoreCase(keyword);
        return customerMapper.toResponseList(customers);
    }

    /**
     * Tạo khách hàng mới
     */
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        log.info("Creating new customer: {}", request.getName());

        // Validate email unique
        if (request.getEmail() != null && customerRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(
                    ErrorCode.CUSTOMER_EMAIL_EXISTS);
        }

        // Validate phone unique
        if (request.getPhone() != null && customerRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(
                    ErrorCode.CUSTOMER_PHONE_EXISTS);
        }

        // Map DTO to Entity và save
        Customer customer = customerMapper.toEntity(request);
        Customer savedCustomer = customerRepository.save(customer);

        log.info("Customer created successfully with id: {}", savedCustomer.getId());
        return customerMapper.toResponse(savedCustomer);
    }

    /**
     * Cập nhật khách hàng
     */
    public CustomerResponse updateCustomer(Long id, CustomerUpdateRequest request) {
        log.info("Updating customer id: {}", id);

        // Tìm customer
        Customer customer = findCustomerById(id);

        // Validate email unique (nếu thay đổi)
        if (request.getEmail() != null && !request.getEmail().equals(customer.getEmail())) {
            customerRepository.findByEmail(request.getEmail())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new BusinessException(
                                    ErrorCode.CUSTOMER_EMAIL_EXISTS);
                        }
                    });
        }

        // Validate phone unique (nếu thay đổi)
        if (request.getPhone() != null && !request.getPhone().equals(customer.getPhone())) {
            customerRepository.findByPhone(request.getPhone())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new BusinessException(
                                    ErrorCode.CUSTOMER_PHONE_EXISTS);
                        }
                    });
        }

        // Update entity từ request
        customerMapper.updateEntityFromRequest(request, customer);
        Customer updatedCustomer = customerRepository.save(customer);

        log.info("Customer updated successfully: {}", id);
        return customerMapper.toResponse(updatedCustomer);
    }

    /**
     * Xóa khách hàng
     */
    public void deleteCustomer(Long id) {
        log.info("Deleting customer id: {}", id);

        // Check tồn tại
        if (!customerRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.CUSTOMER_NOT_FOUND);
        }

        customerRepository.deleteById(id);
        log.info("Customer deleted successfully: {}", id);
    }

    /**
     * Helper method: Tìm customer hoặc throw exception
     */
    private Customer findCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.CUSTOMER_NOT_FOUND));
    }
}