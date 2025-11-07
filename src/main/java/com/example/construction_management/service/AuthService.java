package com.example.construction_management.service;


import com.example.construction_management.dto.request.LoginRequest;
import com.example.construction_management.dto.request.RefreshTokenRequest;
import com.example.construction_management.dto.response.LoginResponse;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.InvalidTokenException;
import com.example.construction_management.exception.UserNotAuthenticatedException;
import com.example.construction_management.exception.UserNotFoundException;
import com.example.construction_management.repository.UserRepository;
import com.example.construction_management.security.JwtTokenProvider;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.apache.catalina.Authenticator;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;

        public LoginResponse login(LoginRequest loginRequest) {

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

                return response;


        }



    // 1. Logic Refresh Token
    // AuthService.java (Phương thức refreshToken)

    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        // 1. Validate refresh token (Nếu lỗi sẽ ném InvalidTokenException)
        if (!tokenProvider.validateToken(refreshToken) || !tokenProvider.isRefreshToken(refreshToken)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        // 2. Get username
        String username = tokenProvider.getUsernameFromToken(refreshToken);

        // 3. Tải UserDetails và xác minh người dùng (Nếu lỗi sẽ ném UsernameNotFoundException)
        // Tải thông tin UserDetails, sử dụng logic tìm kiếm database trong CustomUserDetailsService của bạn.
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Lấy đối tượng User đầy đủ cho response
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + username));


        // 4. TẠO Authentication thủ công (Không cần mật khẩu)
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null, // Credentials (mật khẩu) là null
                userDetails.getAuthorities() // Sử dụng quyền hạn từ UserDetails đã tải
        );

        // 5. Generate new tokens
        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        // Chuẩn doanh nghiệp thường là cấp lại cả refresh token để tránh token bị đánh cắp lâu dài.
        String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

        String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .username(user.getUsername())
                .role(roleName)
                .build();
    }


    // 2. Logic Get Current User Info
    public User getCurrentUser(Authentication authentication) {

        // Kiểm tra cơ bản
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UserNotAuthenticatedException("User not authenticated"); // Sử dụng Custom Exception
        }

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found in database: " + username));

        return user;
    }

    // 3. Logic Logout
    public void logout() {
        SecurityContextHolder.clearContext();
    }



}