package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;

import com.example.construction_management.dto.request.OrderCreateRequest;
import com.example.construction_management.dto.request.OrderStatusUpdateRequest;
import com.example.construction_management.dto.request.OrderUpdateRequest;
import com.example.construction_management.dto.response.OrderResponse;
import com.example.construction_management.dto.response.OrderSummaryResponse;
import com.example.construction_management.enums.OrderStatus;
import com.example.construction_management.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST Controller cho Order
 */
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Lấy tất cả đơn hàng
     * GET /api/orders
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<OrderSummaryResponse>> getAllOrders() {
        List<OrderSummaryResponse> orders = orderService.getAllOrders();
        return ApiResponse.success(orders, "Lấy danh sách đơn hàng thành công");
    }

    /**
     * Lấy chi tiết đơn hàng theo ID
     * GET /api/orders/{id}
     */
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<OrderResponse> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ApiResponse.success(order, "Lấy thông tin đơn hàng thành công");
    }

    /**
     * Lấy đơn hàng theo khách hàng
     * GET /api/orders/customer/{customerId}
     */
    @GetMapping("/customer/{customerId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<OrderSummaryResponse>> getOrdersByCustomer(
            @PathVariable Long customerId) {
        List<OrderSummaryResponse> orders = orderService.getOrdersByCustomer(customerId);
        return ApiResponse.success(orders, "Lấy đơn hàng theo khách hàng thành công");
    }

    /**
     * Lấy đơn hàng theo nhân viên
     * GET /api/orders/employee/{employeeId}
     */
    @GetMapping("/employee/{employeeId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<OrderSummaryResponse>> getOrdersByEmployee(
            @PathVariable Long employeeId) {
        List<OrderSummaryResponse> orders = orderService.getOrdersByEmployee(employeeId);
        return ApiResponse.success(orders, "Lấy đơn hàng theo nhân viên thành công");
    }

    /**
     * Lấy đơn hàng theo trạng thái
     * GET /api/orders/status/{status}
     */
    @GetMapping("/status/{status}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<OrderSummaryResponse>> getOrdersByStatus(
            @PathVariable OrderStatus status) {
        List<OrderSummaryResponse> orders = orderService.getOrdersByStatus(status);
        return ApiResponse.success(orders, "Lấy đơn hàng theo trạng thái thành công");
    }

    /**
     * Lấy đơn hàng theo khoảng thời gian
     * GET /api/orders/date-range?start=2024-01-01T00:00:00&end=2024-12-31T23:59:59
     */
    @GetMapping("/date-range")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<OrderSummaryResponse>> getOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<OrderSummaryResponse> orders = orderService.getOrdersByDateRange(start, end);
        return ApiResponse.success(orders, "Lấy đơn hàng theo thời gian thành công");
    }

    /**
     * Tạo đơn hàng mới
     * POST /api/orders
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderResponse> createOrder(
            @Valid @RequestBody OrderCreateRequest request) {
        OrderResponse order = orderService.createOrder(request);
        return ApiResponse.success(order, "Tạo đơn hàng thành công");
    }

    /**
     * Cập nhật đơn hàng
     * PUT /api/orders/{id}
     */
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<OrderResponse> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderUpdateRequest request) {
        OrderResponse order = orderService.updateOrder(id, request);
        return ApiResponse.success(order, "Cập nhật đơn hàng thành công");
    }

    /**
     * Cập nhật trạng thái đơn hàng
     * PATCH /api/orders/{id}/status
     */
    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponse order = orderService.updateOrderStatus(id, request);
        return ApiResponse.success(order, "Cập nhật trạng thái đơn hàng thành công");
    }

    /**
     * Hủy đơn hàng
     * POST /api/orders/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<OrderResponse> cancelOrder(@PathVariable Long id) {
        OrderResponse order = orderService.cancelOrder(id);
        return ApiResponse.success(order, "Hủy đơn hàng thành công");
    }

    /**
     * Xóa đơn hàng (chỉ khi đã hủy)
     * DELETE /api/orders/{id}
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ApiResponse.success("Xóa đơn hàng thành công");
    }
}