package com.example.construction_management.config;



import com.example.construction_management.entity.Role;
import com.example.construction_management.entity.User;
import com.example.construction_management.repository.RoleRepository;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) throws Exception {

        // --- 1️⃣ Khởi tạo 3 Role cơ bản nếu chưa có ---
        List<String> defaultRoles = Arrays.asList("ADMIN", "SALE", "ACCOUNTANT","USER");

        for (String roleName : defaultRoles) {
            roleRepository.findByName(roleName)
                    .orElseGet(() -> {
                        Role newRole = Role.builder().name(roleName).build();
                        roleRepository.save(newRole);
                        System.out.println("✅ Created role: " + roleName);
                        return newRole;
                    });
        }

        // --- 2️⃣ Tạo tài khoản admin mặc định nếu chưa có ---
        String adminUsername = "admin";

        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

            User adminUser = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode("admin123"))
                    .role(adminRole)
                    .build();

            userRepository.save(adminUser);
            System.out.println("👑 Created default admin: username='admin', password='admin123'");
        } else {
            System.out.println("ℹ️ Admin user already exists, skipping initialization.");
        }

        System.out.println("🚀 Data initialization completed successfully.");
    }
}
