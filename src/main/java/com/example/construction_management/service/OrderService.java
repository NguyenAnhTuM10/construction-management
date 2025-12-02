package com.example.construction_management.service;



import com.example.construction_management.dto.request.OrderCreateRequest;
import com.example.construction_management.dto.request.OrderItemRequest;
import com.example.construction_management.dto.request.OrderStatusUpdateRequest;
import com.example.construction_management.dto.request.OrderUpdateRequest;
import com.example.construction_management.dto.response.OrderResponse;
import com.example.construction_management.dto.response.OrderSummaryResponse;
import com.example.construction_management.entity.*;
import com.example.construction_management.enums.OrderStatus;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.OrderMapper;
import com.example.construction_management.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service xử lý business logic cho Order
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;

    /**
     * Lấy tất cả đơn hàng (summary)
     */
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getAllOrders() {
        log.info("Getting all orders");
        List<Order> orders = orderRepository.findAll();
        return orderMapper.toSummaryResponseList(orders);
    }

    /**
     * Lấy chi tiết đơn hàng theo ID
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        log.info("Getting order by id: {}", id);
        Order order = findOrderById(id);
        return orderMapper.toResponse(order);
    }

    /**
     * Lấy đơn hàng theo khách hàng
     */
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getOrdersByCustomer(Long customerId) {
        log.info("Getting orders by customer: {}", customerId);
        List<Order> orders = orderRepository.findByCustomerId(customerId);
        return orderMapper.toSummaryResponseList(orders);
    }

    /**
     * Lấy đơn hàng theo nhân viên
     */
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getOrdersByEmployee(Long employeeId) {
        log.info("Getting orders by employee: {}", employeeId);
        List<Order> orders = orderRepository.findByEmployeeId(employeeId);
        return orderMapper.toSummaryResponseList(orders);
    }

    /**
     * Lấy đơn hàng theo trạng thái
     */
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getOrdersByStatus(OrderStatus status) {
        log.info("Getting orders by status: {}", status);
        List<Order> orders = orderRepository.findByStatus(status);
        return orderMapper.toSummaryResponseList(orders);
    }

    /**
     * Lấy đơn hàng theo khoảng thời gian
     */
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        log.info("Getting orders between {} and {}", start, end);
        List<Order> orders = orderRepository.findByCreatedDateBetween(start, end);
        return orderMapper.toSummaryResponseList(orders);
    }

    /**
     * Tạo đơn hàng mới
     */
    public OrderResponse createOrder(OrderCreateRequest request) {
        log.info("Creating new order for customer: {}", request.getCustomerId());

        // Validate customer
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CUSTOMER_NOT_FOUND));

        // Validate employee
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.EMPLOYEE_NOT_FOUND

                ));

        // Tạo Order
        Order order = Order.builder()
                .customer(customer)
                .employee(employee)
                .status(OrderStatus.PENDING)
                .createdDate(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        // Tạo OrderItems và tính tổng
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

            // Kiểm tra tồn kho
            if (product.getStock() < itemRequest.getQuantity()) {
                throw new BusinessException(
                        ErrorCode.INSUFFICIENT_STOCK

                );
            }

            // Tạo OrderItem
            BigDecimal subtotal = itemRequest.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .price(itemRequest.getPrice())
                    .subtotal(subtotal)
                    .build();

            order.getItems().add(orderItem);
            total = total.add(subtotal);

            // Giảm tồn kho
            product.setStock(product.getStock() - itemRequest.getQuantity());
            productRepository.save(product);
        }

        order.setTotal(total);
        Order savedOrder = orderRepository.save(order);

        log.info("Order created successfully with id: {}", savedOrder.getId());
        return orderMapper.toResponse(savedOrder);
    }

    /**
     * Cập nhật đơn hàng
     */
    public OrderResponse updateOrder(Long id, OrderUpdateRequest request) {
        log.info("Updating order id: {}", id);

        Order order = findOrderById(id);

        // Chỉ cho phép cập nhật khi status = PENDING
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR

            );
        }

        // Update customer nếu có
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CUSTOMER_NOT_FOUND));
            order.setCustomer(customer);
        }

        // Update employee nếu có
        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new BusinessException(
                            ErrorCode.RESOURCE_NOT_FOUND

                    ));
            order.setEmployee(employee);
        }

        // Update items nếu có
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            // Hoàn lại tồn kho cũ
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
                productRepository.save(product);
            }

            // Xóa items cũ
            order.getItems().clear();

            // Tạo items mới
            BigDecimal total = BigDecimal.ZERO;
            for (OrderItemRequest itemRequest : request.getItems()) {
                Product product = productRepository.findById(itemRequest.getProductId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

                if (product.getStock() < itemRequest.getQuantity()) {
                    throw new BusinessException(
                            ErrorCode.INSUFFICIENT_STOCK

                    );
                }

                BigDecimal subtotal = itemRequest.getPrice()
                        .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .quantity(itemRequest.getQuantity())
                        .price(itemRequest.getPrice())
                        .subtotal(subtotal)
                        .build();

                order.getItems().add(orderItem);
                total = total.add(subtotal);

                product.setStock(product.getStock() - itemRequest.getQuantity());
                productRepository.save(product);
            }

            order.setTotal(total);
        }

        Order updatedOrder = orderRepository.save(order);
        log.info("Order updated successfully: {}", id);
        return orderMapper.toResponse(updatedOrder);
    }

    /**
     * Cập nhật trạng thái đơn hàng
     */
    public OrderResponse updateOrderStatus(Long id, OrderStatusUpdateRequest request) {
        log.info("Updating order status id: {} to {}", id, request.getStatus());

        Order order = findOrderById(id);

        // Validate chuyển trạng thái hợp lệ
        validateStatusTransition(order.getStatus(), request.getStatus());

        order.setStatus(request.getStatus());
        Order updatedOrder = orderRepository.save(order);

        log.info("Order status updated successfully: {}", id);
        return orderMapper.toResponse(updatedOrder);
    }

    /**
     * Hủy đơn hàng
     */
    public OrderResponse cancelOrder(Long id) {
        log.info("Cancelling order id: {}", id);

        Order order = findOrderById(id);

        // Chỉ cho phép hủy khi status = PENDING hoặc CONFIRMED
        if (order.getStatus() != OrderStatus.PENDING &&
                order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR

            );
        }

        // Hoàn lại tồn kho
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelledOrder = orderRepository.save(order);

        log.info("Order cancelled successfully: {}", id);
        return orderMapper.toResponse(cancelledOrder);
    }

    /**
     * Xóa đơn hàng (chỉ khi status = CANCELLED)
     */
    public void deleteOrder(Long id) {
        log.info("Deleting order id: {}", id);

        Order order = findOrderById(id);

        if (order.getStatus() != OrderStatus.CANCELLED) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR

            );
        }

        orderRepository.deleteById(id);
        log.info("Order deleted successfully: {}", id);
    }

    /**
     * Helper: Tìm order hoặc throw exception
     */
    private Order findOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND

                ));
    }

    /**
     * Helper: Validate chuyển trạng thái hợp lệ
     */
    private void validateStatusTransition(OrderStatus current, OrderStatus newStatus) {
        // Không cho phép chuyển từ CANCELLED hoặc COMPLETED
        if (current == OrderStatus.CANCELLED || current == OrderStatus.COMPLETED) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR

            );
        }

        // Validate flow: PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> COMPLETED
        boolean isValid = switch (current) {
            case PENDING -> newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED;
            case CONFIRMED -> newStatus == OrderStatus.PROCESSING || newStatus == OrderStatus.CANCELLED;
            case PROCESSING -> newStatus == OrderStatus.SHIPPING;
            case SHIPPING -> newStatus == OrderStatus.COMPLETED;
            default -> false;
        };

        if (!isValid) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR

            );
        }
    }
}