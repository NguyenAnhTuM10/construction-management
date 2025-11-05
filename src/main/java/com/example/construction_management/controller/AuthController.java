package com.example.construction_management.controller;

import com.example.construction_management.dto.APIResponse;
import com.example.construction_management.dto.request.LoginRequest;
import com.example.construction_management.dto.response.LoginResponse;
import com.example.construction_management.dto.request.RefreshTokenRequest;
import com.example.construction_management.entity.User;
import com.example.construction_management.repository.UserRepository;
import com.example.construction_management.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, token refresh and user info")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<APIResponse<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate tokens
            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            // Get user info
            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";



            LoginResponse response = LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .username(user.getUsername())
                    .role(roleName)
                    .build();


            return ResponseEntity.ok(APIResponse.success(response, "Login successful"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Invalid username or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<APIResponse<LoginResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();

            // Validate refresh token
            if (!tokenProvider.validateToken(refreshToken) ||
                    !tokenProvider.isRefreshToken(refreshToken)) {
                return ResponseEntity.badRequest()
                        .body(APIResponse.error("Invalid refresh token"));
            }

            // Get username from token
            String username = tokenProvider.getUsernameFromToken(refreshToken);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create authentication
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, null)
            );

            // Generate new tokens
            String newAccessToken = tokenProvider.generateAccessToken(authentication);
            String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

            String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";


            LoginResponse response = LoginResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .username(user.getUsername())
                    .role(roleName)
                    .build();


            return ResponseEntity.ok(APIResponse.success(response, "Token refreshed"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Failed to refresh token"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<APIResponse<User>> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(APIResponse.success(user, "User info retrieved"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(APIResponse.error("Failed to get user info"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<APIResponse<Void>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(APIResponse.success(null, "Logged out successfully"));
    }
}