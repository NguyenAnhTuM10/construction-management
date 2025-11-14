package com.example.construction_management.repository;



import com.example.construction_management.entity.RefreshToken;
import com.example.construction_management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // Tìm kiếm một Refresh Token cụ thể
    Optional<RefreshToken> findByToken(String token);

    // Xóa tất cả token của một User (dùng cho các trường hợp reset bảo mật)
    void deleteByUser(User user);

    Optional<RefreshToken> findByUser(User user);
}