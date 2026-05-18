package com.example.construction_management.service;

import com.example.construction_management.dto.request.UpdateUserRoleRequest;

import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.Role;
import com.example.construction_management.entity.User;
// Import các class exception mới
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;

import com.example.construction_management.mapper.UserMapper;
import com.example.construction_management.repository.RoleRepository;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse updateUserRole(UpdateUserRoleRequest request) {
        // 1. Lấy user
        User user = userRepository.findById(request.getUserId())
                // ✅ Thay thế RuntimeException bằng BusinessException
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. Lấy role
        Role role = roleRepository.findByName(request.getRoleName().toUpperCase())
                // ✅ Thay thế RuntimeException bằng BusinessException
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));

        // 3. Update role
        user.setRole(role);
        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }

    public List<UserResponse> getUsers()
    {
        return userMapper.toUserResponseList(userRepository.findAll());
    }



    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }





    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Không cho phép xóa Admin
        if ("ADMIN".equals(user.getRole().getName())) {
            throw new BusinessException(ErrorCode.CANNOT_DELETE_ADMIN);
        }

        userRepository.delete(user);
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Mã hóa password mới
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);

        userRepository.save(user);
    }

    @Transactional
    public UserResponse toggleLock(Long userId, Boolean locked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Không cho phép khóa Admin
        if (locked && "ADMIN".equals(user.getRole().getName())) {
            throw new BusinessException(ErrorCode.CANNOT_LOCK_ADMIN);
        }

        user.setLocked(locked);
        User savedUser = userRepository.save(user);

        return userMapper.toUserResponse(savedUser);
    }

    /**
     * Map User entity to UserResponse DTO
     */


}