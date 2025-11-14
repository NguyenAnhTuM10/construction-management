package com.example.construction_management.entity;



import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Refresh Token thực tế (cần index để tìm kiếm nhanh)
    @Column(nullable = false, unique = true)
    private String token;

    // Thời điểm hết hạn
    @Column(nullable = false)
    private Instant expiryDate;

    // Trạng thái: true nếu token đã bị thu hồi/logout
    @Builder.Default
    private boolean revoked = false;

    // Liên kết với User
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id",unique = true)
    @JsonIgnore
    private User user;

}