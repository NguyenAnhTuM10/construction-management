package com.example.construction_management.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long id;
    String username;
    String email;
    String role; // Chỉ trả về tên role, không cần toàn bộ object
    // Không bao gồm password và refreshToken vì lý do bảo mật
}