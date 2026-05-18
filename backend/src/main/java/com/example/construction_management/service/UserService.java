package com.example.construction_management.service;

import com.example.construction_management.dto.request.UpdatePersonalDataRequest;
import com.example.construction_management.dto.request.ChangePasswordRequest;
import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.UserMapper;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    // ✅ 1. Lấy thông tin cá nhân (Current User - By ID)
    public UserResponse getPersonalData(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(user);
    }



    // 💡 PHƯƠNG THỨC MỚI: Lấy thông tin cá nhân bằng Username (dễ dàng dùng từ Authentication object)
    public UserResponse getPersonalDataByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(user);
    }

    // ✅ 2. Cập nhật thông tin cá nhân
    @Transactional
    public UserResponse updatePersonalData(String username, UpdatePersonalDataRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra Conflict (ví dụ: email đã tồn tại)
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.USER_EXISTED);
        }

        // Cập nhật các trường
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        // ... Cập nhật các trường khác như name, phone (thông qua Entity Employee liên kết)

        // Nếu User có liên kết với Employee (1-1), bạn cần cập nhật thông tin Employee ở đây
        // if (user.getEmployee() != null) { 
        //    user.getEmployee().setPhone(request.getPhone());
        //    // employeeRepository.save(user.getEmployee()); // Có thể cần nếu @Transactional không tự flush
        // }

        User updatedUser = userRepository.save(user);
        return userMapper.toUserResponse(updatedUser);
    }

    // ✅ 3. Đổi mật khẩu
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 1. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.WRONG_PASSWORD);
        }

        // 2. Kiểm tra mật khẩu mới
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(ErrorCode.NOT_MATHES_PASSWORD);
        }

        // Cần thêm validation cho độ dài mật khẩu mới (Nếu chưa có trong DTO)

        // 3. Mã hóa và lưu mật khẩu mới
        String newEncodedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPassword(newEncodedPassword);

        userRepository.save(user);
    }
}