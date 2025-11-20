package com.example.construction_management.service;


import com.example.construction_management.dto.request.LoginRequest;
import com.example.construction_management.dto.request.RefreshTokenRequest;
import com.example.construction_management.dto.request.RegisterRequest;
import com.example.construction_management.dto.response.LoginResponse;
import com.example.construction_management.dto.response.RegisterResponse;
import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.RefreshToken;
import com.example.construction_management.entity.Role;
import com.example.construction_management.entity.User;
// Import các class exception mới
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
// Loại bỏ các exception cũ: InvalidTokenException, UserNotAuthenticatedException, UserNotFoundException...

import com.example.construction_management.mapper.UserMapper;
import com.example.construction_management.repository.RefreshTokenRepository;
import com.example.construction_management.repository.RoleRepository;
import com.example.construction_management.repository.UserRepository;
import com.example.construction_management.security.JwtTokenProvider;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;


    public LoginResponse login(LoginRequest loginRequest) {

        // 1. Thực hiện xác thực.
        // LƯU Ý: Nếu xác thực thất bại (sai pass/user), Spring Security sẽ ném BadCredentialsException,
        // GlobalExceptionHandler sẽ bắt lỗi này và ánh xạ sang ErrorCode.PASSWORD_INVALID.
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

        // 2. Lấy thông tin người dùng. Nếu Auth thành công mà User không tồn tại (rất hiếm)
        User user = userRepository.findByUsername(loginRequest.getUsername())
                // ✅ Thay thế RuntimeException bằng BusinessException
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 3. Lưu Refresh Token
        saveRefreshToken(user, refreshToken);

        String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .role(roleName)
                .build();

        return response;
    }


    // --- 2. Refresh Token (Sử dụng BusinessException) ---
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String oldRefreshTokenString = request.getRefreshToken();

        // 1. Validate token cú pháp & loại token
        if (!tokenProvider.validateToken(oldRefreshTokenString) || !tokenProvider.isRefreshToken(oldRefreshTokenString)) {
            // ✅ Thay thế InvalidTokenException
            throw new BusinessException(ErrorCode.USER_UNAUTHENTICATED);
        }

        // 2. TÌM TOKEN TRONG DB VÀ KIỂM TRA REVOKED/EXPIRY
        RefreshToken oldRefreshTokenEntity = refreshTokenRepository.findByToken(oldRefreshTokenString)
                // ✅ Thay thế InvalidTokenException
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_UNAUTHENTICATED));

        if (oldRefreshTokenEntity.isRevoked() || oldRefreshTokenEntity.getExpiryDate().isBefore(Instant.now())) {
            // ✅ Thay thế InvalidTokenException
            throw new BusinessException(ErrorCode.USER_UNAUTHENTICATED);
        }

        // 3. Get username và Tải UserDetails
        String username = tokenProvider.getUsernameFromToken(oldRefreshTokenString);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        User user = oldRefreshTokenEntity.getUser();

        // 4. TẠO Authentication thủ công
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );

        // 5. Generate new tokens
        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        String newRefreshTokenString = tokenProvider.generateRefreshToken(authentication);

        // 6. REVOKE TOKEN CŨ VÀ LƯU TOKEN MỚI
        oldRefreshTokenEntity.setRevoked(true); // Vô hiệu hóa token cũ
        refreshTokenRepository.save(oldRefreshTokenEntity);

        saveRefreshToken(user, newRefreshTokenString); // Lưu token mới

        String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenString)
                .username(user.getUsername())
                .role(roleName)
                .build();
    }

    // --- 3. Get Current User Info (Sử dụng BusinessException) ---
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            // ✅ Thay thế UserNotAuthenticatedException
            throw new BusinessException(ErrorCode.USER_UNAUTHENTICATED);
        }

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                // ✅ Thay thế UserNotFoundException
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public UserResponse getCurrentUserInfo(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return userMapper.toUserResponse(user);
    }

    // --- 4. Register (Sử dụng BusinessException) ---
    public RegisterResponse register(RegisterRequest registerRequest) {

        // 1. Kiểm tra username/email đã tồn tại chưa
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            // ✅ Thay thế UserAlreadyExistsException
            throw new BusinessException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            // ✅ Thay thế UserAlreadyExistsException
            throw new BusinessException(ErrorCode.USER_EXISTED);
        }

        // 2. Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());

        // 3. Gán Role mặc định
        String requestedRole = registerRequest.getRoleName() != null ? registerRequest.getRoleName().toUpperCase() : "USER";

        // Tìm kiếm Role trong DB
        Role userRole = roleRepository.findByName(requestedRole)
                // ✅ Thay thế RoleNotFoundException
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));

        // 4. Tạo đối tượng User
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(encodedPassword);
        user.setRole(userRole);

        // 5. Lưu vào Database
        User savedUser = userRepository.save(user);

        // 6. Trả về Response
        return RegisterResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .build();
    }

    // --- 5. Logout (Không ném exception nghiệp vụ) ---
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            SecurityContextHolder.clearContext();
            return;
        }

        Optional<RefreshToken> tokenEntity = refreshTokenRepository.findByToken(refreshToken);

        if (tokenEntity.isPresent()) {
            RefreshToken rt = tokenEntity.get();
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        }
        SecurityContextHolder.clearContext();
    }

    private void saveRefreshToken(User user, String tokenString) {
        long REFRESH_TOKEN_EXPIRATION_MS = 604800000L;
        Instant expiryDate = Instant.now().plusMillis(REFRESH_TOKEN_EXPIRATION_MS);

        // BƯỚC 1: XÓA TOKEN CŨ TRƯỚC (nếu tồn tại)
        if (user.getRefreshToken() != null) {
            RefreshToken oldToken = user.getRefreshToken();

            // Ngắt liên kết 2 chiều
            user.setRefreshToken(null);
            oldToken.setUser(null);

            // XÓA TOKEN CŨ KHỎI DATABASE NGAY LẬP TỨC
            refreshTokenRepository.delete(oldToken);
            refreshTokenRepository.flush();
        }

        // BƯỚC 2: TẠO VÀ LƯU TOKEN MỚI
        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(tokenString)
                .expiryDate(expiryDate)
                .revoked(false)
                .user(user)
                .build();

        user.setRefreshToken(newRefreshToken);

        // Lưu token mới
        refreshTokenRepository.save(newRefreshToken);
    }
}