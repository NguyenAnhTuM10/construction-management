package com.example.construction_management.controller;

import com.example.construction_management.dto.request.UpdateUserRoleRequest;

import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PutMapping("/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        UserResponse response = adminService.updateUserRole(request);
        return ResponseEntity.ok(response);
    }
}
