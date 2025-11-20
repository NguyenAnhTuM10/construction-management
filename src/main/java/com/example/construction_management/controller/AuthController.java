package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.LoginRequest;
import com.example.construction_management.dto.request.LogoutRequest;
import com.example.construction_management.dto.request.RegisterRequest;
import com.example.construction_management.dto.response.LoginResponse;
import com.example.construction_management.dto.request.RefreshTokenRequest;
import com.example.construction_management.dto.response.RegisterResponse;
import com.example.construction_management.entity.User;
import com.example.construction_management.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, token refresh and user info")
public class AuthController {

    // Loại bỏ các dependency không cần thiết cho Controller (AuthenticationManager, JwtTokenProvider, UserRepository)
    // Nếu logic liên quan đã được di chuyển vào AuthService
    private final AuthService  authService;

    // ✅ 1. Endpoint Login: Sạch sẽ (Lỗi được xử lý bởi GlobalExceptionHandler)
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest loginRequest)
    {
        // Service ném BusinessException nếu login thất bại (VD: USER_NOT_FOUND, PASSWORD_INVALID)
        LoginResponse loginResponse = authService.login(loginRequest);

        // Trả về thành công
        return ResponseEntity.ok(ApiResponse.success(loginResponse, "Login Successfully"));
    }

    // ✅ 2. Endpoint Refresh Token: Sạch sẽ
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {

        // Service ném BusinessException nếu token không hợp lệ hoặc user không tồn tại
        LoginResponse response = authService.refreshToken(request);

        // Trả về thành công
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed"));
    }

    // ✅ 3. Endpoint Get Current User Info: Sạch sẽ
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {

        // Lấy Authentication object
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Service ném BusinessException nếu user không authenticated hoặc không tìm thấy
        User user = authService.getCurrentUser(authentication);

        // Trả về thành công
        return ResponseEntity.ok(ApiResponse.success(user, "User info retrieved"));
    }

    // ✅ 4. Endpoint Register User: Sạch sẽ
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerUser(
            @Valid @RequestBody RegisterRequest registerRequest) {

        // Service ném BusinessException nếu user đã tồn tại (USER_EXISTED)
        RegisterResponse response = authService.register(registerRequest);

        // Trả về 201 Created là chuẩn hơn cho hành động tạo tài nguyên
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
    }

    // ✅ 5. Endpoint Logout: Sạch sẽ
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody LogoutRequest request) {
        // Service xử lý việc vô hiệu hóa Refresh Token (nếu token không hợp lệ, sẽ ném BusinessException)
        String token  = request.getRefreshToken();
        authService.logout(token);

        // Trả về thành công
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
}