package com.example.construction_management.service;

import com.example.construction_management.dto.request.UpdateUserRoleRequest;

import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.Role;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.RoleNotFoundException;
import com.example.construction_management.exception.UserNotFoundException;
import com.example.construction_management.mapper.UserMapper;
import com.example.construction_management.repository.RoleRepository;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;

    @Transactional
//    @PreAuthorize("hasRole('ADMIN')") // Chỉ admin mới có quyền

    public UserResponse updateUserRole(UpdateUserRoleRequest request) {
        // 1. Lấy user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));

        // 2. Lấy role
        Role role = roleRepository.findByName(request.getRoleName().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRoleName()));

        // 3. Update role
        user.setRole(role);
        userRepository.save(user);

       return userMapper.toUserResponse(user);
    }
}
