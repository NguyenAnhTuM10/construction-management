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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;

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
}