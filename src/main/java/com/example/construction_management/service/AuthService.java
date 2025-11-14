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
import com.example.construction_management.exception.*;
import com.example.construction_management.mapper.UserMapper;
import com.example.construction_management.repository.RefreshTokenRepository;
import com.example.construction_management.repository.RoleRepository;
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

    // Không cần final vì được gán giá trị sau khi construct


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

            // **LOGIC MỚI: LƯU REFRESH TOKEN VÀO DB**
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



    // 1. Logic Refresh Token
    // AuthService.java (Phương thức refreshToken)

    // --- 2. Refresh Token (Thêm logic kiểm tra và Revoke) ---
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String oldRefreshTokenString = request.getRefreshToken();

        // 1. Validate token cú pháp & loại token
        if (!tokenProvider.validateToken(oldRefreshTokenString) || !tokenProvider.isRefreshToken(oldRefreshTokenString)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        // **LOGIC MỚI: TÌM TOKEN TRONG DB VÀ KIỂM TRA REVOKED/EXPIRY**
        RefreshToken oldRefreshTokenEntity = refreshTokenRepository.findByToken(oldRefreshTokenString)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found in database."));

        if (oldRefreshTokenEntity.isRevoked() || oldRefreshTokenEntity.getExpiryDate().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token has been revoked or expired (Database check).");
        }

        // 2. Get username và Tải UserDetails
        String username = tokenProvider.getUsernameFromToken(oldRefreshTokenString);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        User user = oldRefreshTokenEntity.getUser(); // Dùng User từ Entity

        // 3. TẠO Authentication thủ công
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );

        // 4. Generate new tokens
        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        String newRefreshTokenString = tokenProvider.generateRefreshToken(authentication);

        // **LOGIC MỚI: REVOKE TOKEN CŨ VÀ LƯU TOKEN MỚI**
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

    // 2. Logic Get Current User Info
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UserNotAuthenticatedException("User not authenticated");
        }

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found in database: " + username));
    }

    public UserResponse getCurrentUserInfo(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return userMapper.toUserInfoResponse(user); // ← SỬ DỤNG MAPPER
    }


    public RegisterResponse register(RegisterRequest registerRequest) {

        // 1. Kiểm tra username/email đã tồn tại chưa
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new UserAlreadyExistsException("Username '" + registerRequest.getUsername() + "' is already taken!");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new UserAlreadyExistsException("Email '" + registerRequest.getEmail() + "' is already in use!");
        }

        // 2. Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());

        // 3. Gán Role mặc định (chuẩn doanh nghiệp thường gán ROLE_USER)
        // Giả định: Role là "USER" nếu không được chỉ định
        String requestedRole = registerRequest.getRoleName() != null ? registerRequest.getRoleName().toUpperCase() : "USER";

        // Tìm kiếm Role trong DB
        Role userRole = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new RoleNotFoundException("Error: Role '" + requestedRole + "' is not found."));

        // 4. Tạo đối tượng User
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(encodedPassword);
        user.setRole(userRole);
        // Thêm các trường khác nếu cần thiết (ví dụ: isEnabled=true)

        // 5. Lưu vào Database
        User savedUser = userRepository.save(user);

        // 6. Trả về Response
        return RegisterResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .build();
    }


    public void logout(String refreshToken) { // Cần truyền Refresh Token từ Header/Body
        if (refreshToken == null || refreshToken.isEmpty()) {
            // Chỉ xóa SecurityContext nếu không có token để thu hồi
            SecurityContextHolder.clearContext();
            return;
        }

        Optional<RefreshToken> tokenEntity = refreshTokenRepository.findByToken(refreshToken);

        if (tokenEntity.isPresent()) {
            // Vô hiệu hóa token trong DB
            RefreshToken rt = tokenEntity.get();
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        }
        // Xóa context (luôn thực hiện)
        SecurityContextHolder.clearContext();
    }

    // Trong AuthService.java

    // Trong AuthService.java

    // Trong AuthService.java

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
            refreshTokenRepository.flush(); // ← QUAN TRỌNG: Buộc DELETE thực thi ngay
        }

        // BƯỚC 2: TẠO VÀ LƯU TOKEN MỚI
        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(tokenString)
                .expiryDate(expiryDate)
                .revoked(false)
                .user(user) // ← Thiết lập liên kết ngay khi build
                .build();

        user.setRefreshToken(newRefreshToken);

        // Lưu token mới
        refreshTokenRepository.save(newRefreshToken);
    }
}



