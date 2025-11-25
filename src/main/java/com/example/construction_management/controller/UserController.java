package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.ChangePasswordRequest;
import com.example.construction_management.dto.request.UpdatePersonalDataRequest;
import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.security.JwtTokenProvider;
import com.example.construction_management.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@Tag(name = "User Self-Service", description = "Endpoints for user to manage their own profile and password")
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // GET /users/me - Lấy thông tin cá nhân
    @GetMapping("/me")
    // ✅ Sử dụng Injection: Spring Security sẽ tự động truyền Authentication object vào
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(Authentication authentication) {

        // 1. Lấy username (principal) từ đối tượng Authentication
        String username = authentication.getName();

        // 2. Gọi Service bằng username
        // Giả định UserService đã được bổ sung phương thức getPersonalDataByUsername(String username)
        UserResponse userResponse = userService.getPersonalDataByUsername(username);

        return ResponseEntity.ok(ApiResponse.success(userResponse, "Personal info retrieved successfully"));
    }

    // PUT /users/me - Cập nhật thông tin cá nhân
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyInfo(
            @Valid @RequestBody UpdatePersonalDataRequest request,
            Authentication authentication) {

     String  username = authentication.getName();

        UserResponse updatedUser = userService.updatePersonalData(username, request);

        return ResponseEntity.ok(ApiResponse.success(updatedUser, "Personal info updated successfully"));
    }

    // POST /users/me/change-password - Đổi mật khẩu
    @PostMapping("/me/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        System.out.println("auth" + authentication);

        String username  = authentication.getName();




        userService.changePassword(username, request);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}