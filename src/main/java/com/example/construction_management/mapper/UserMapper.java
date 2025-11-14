package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper class để convert giữa User Entity và DTOs
 */
@Component
public class UserMapper {

    /**
     * Convert User Entity sang UserInfoResponse DTO
     *
     * @param user User entity
     * @return UserInfoResponse DTO (không chứa password và refresh token)
     */
    public UserResponse toUserInfoResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .build();
    }

    /**
     * Convert User Entity sang UserInfoResponse với thông tin Employee (nếu có)
     * Mở rộng cho tương lai khi cần thêm thông tin Employee
     */
    public UserResponse toUserInfoResponseWithEmployee(User user) {
        if (user == null) {
            return null;
        }

        UserResponse response = toUserInfoResponse(user);

        // TODO: Thêm logic map Employee info nếu cần
        // if (user.getEmployee() != null) {
        //     response.setEmployeeId(user.getEmployee().getId());
        //     response.setEmployeeName(user.getEmployee().getName());
        // }

        return response;
    }
}