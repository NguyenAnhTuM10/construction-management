package com.example.construction_management.controller;

import com.example.construction_management.dto.APIResponse;
import com.example.construction_management.dto.request.LoginRequest;
import com.example.construction_management.dto.request.LogoutRequest;
import com.example.construction_management.dto.request.RegisterRequest;
import com.example.construction_management.dto.response.LoginResponse;
import com.example.construction_management.dto.request.RefreshTokenRequest;
import com.example.construction_management.dto.response.RegisterResponse;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.InvalidTokenException;
import com.example.construction_management.exception.UserNotAuthenticatedException;
import com.example.construction_management.exception.UserNotFoundException;
import com.example.construction_management.repository.UserRepository;
import com.example.construction_management.security.JwtTokenProvider;
import com.example.construction_management.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, token refresh and user info")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuthService  authService;



    @PostMapping("/login")
    public ResponseEntity<APIResponse<LoginResponse>> login(@RequestBody LoginRequest loginRequest)
    {
        LoginResponse loginResponse = authService.login(loginRequest);

        return ResponseEntity.ok(APIResponse.success(loginResponse, "Login Successfully"));

    }

    @PostMapping("/refresh")
    public ResponseEntity<APIResponse<LoginResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {
        try {
            LoginResponse response = authService.refreshToken(request);
            return ResponseEntity.ok(APIResponse.success(response, "Token refreshed"));
        } catch (InvalidTokenException | UserNotFoundException e) {
            // Bắt Custom Exception và trả về lỗi 400
            return ResponseEntity.badRequest()
                    .body(APIResponse.error(e.getMessage()));
        } catch (Exception e) {
            // Bắt các lỗi khác (ví dụ: lỗi trong authenticationManager)
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Failed to refresh token: " + e.getMessage()));
        }
    }

    // --- Endpoint Get Current User Info ---
    @GetMapping("/me")
    public ResponseEntity<APIResponse<User>> getCurrentUser() {
        try {
            // Lấy Authentication object từ context tại Controller
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println(authentication);
            // Chuyển đối tượng Authentication cho Service xử lý
            User user = authService.getCurrentUser(authentication);

            return ResponseEntity.ok(APIResponse.success(user, "User info retrieved"));
        } catch (UserNotAuthenticatedException | UserNotFoundException e) {
            return ResponseEntity.badRequest()
                    .body(APIResponse.error(e.getMessage()));
        } catch (Exception e) {
            // Log lỗi (thay thế e.printStackTrace())
            // logger.error("Error retrieving user info", e);
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Failed to get user info: " + e.getMessage()));
        }
    }

    // AuthController.java (thêm phương thức này)


    @PostMapping("/register")
    public ResponseEntity<APIResponse<RegisterResponse>> registerUser(
            @Valid @RequestBody RegisterRequest registerRequest) {

        RegisterResponse response = authService.register(registerRequest);

        // Trả về 201 Created là chuẩn hơn cho hành động tạo tài nguyên
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(APIResponse.success(response, "User registered successfully"));

        // Lưu ý: GlobalExceptionHandler sẽ xử lý UserAlreadyExistsException (400 Bad Request)
    }

    // --- Endpoint Logout ---
    @PostMapping("/logout")
    public ResponseEntity<APIResponse<Void>> logout(@RequestBody LogoutRequest request) {
        String token  = request.getRefreshToken();
        authService.logout(token);
        return ResponseEntity.ok(APIResponse.success(null, "Logged out successfully"));
    }
}