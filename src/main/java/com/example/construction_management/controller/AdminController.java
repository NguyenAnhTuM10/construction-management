package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.ResetPasswordRequest;
import com.example.construction_management.dto.request.UpdateUserLockRequest;
import com.example.construction_management.dto.request.UpdateUserRoleRequest;
import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "Endpoints for admin to manage users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    /**
     * Lấy danh sách tất cả users
     */
    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Get list of all users in the system")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> response = adminService.getUsers();
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin user theo ID
     */
    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID", description = "Get user details by user ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = adminService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "User retrieved successfully"));
    }

    /**
     * Cập nhật role của user
     */
    @PutMapping("/role")
    @Operation(summary = "Update user role", description = "Update role for a specific user")
    public ResponseEntity<UserResponse> updateUserRole(
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        UserResponse response = adminService.updateUserRole(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa user
     */
    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete user", description = "Delete a user by ID. Cannot delete ADMIN users.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    /**
     * Reset password cho user
     */
    @PostMapping("/users/{id}/reset-password")
    @Operation(summary = "Reset user password", description = "Reset password for a specific user")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        adminService.resetPassword(id, request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }

    /**
     * Khóa/Mở khóa tài khoản user
     */
    @PatchMapping("/users/{id}/lock")
    @Operation(summary = "Lock/Unlock user", description = "Lock or unlock a user account")
    public ResponseEntity<ApiResponse<UserResponse>> toggleLock(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserLockRequest request
    ) {
        UserResponse response = adminService.toggleLock(id, request.getLocked());
        String message = request.getLocked() ? "User locked successfully" : "User unlocked successfully";
        return ResponseEntity.ok(ApiResponse.success(response, message));
    }
}
