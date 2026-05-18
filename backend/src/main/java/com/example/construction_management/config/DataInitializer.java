package com.example.construction_management.config;

import com.example.construction_management.entity.Department;
import com.example.construction_management.entity.Role;
import com.example.construction_management.entity.User;
import com.example.construction_management.repository.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {

        // --- 1️⃣ Khởi tạo 4 Role cơ bản nếu chưa có ---
        List<String> defaultRoles = Arrays.asList("ADMIN", "SALE", "ACCOUNTANT", "USER");

        for (String roleName : defaultRoles) {
            roleRepository.findByName(roleName)
                    .orElseGet(() -> {
                        Role newRole = Role.builder().name(roleName).build();
                        roleRepository.save(newRole);
                        System.out.println("✅ Created role: " + roleName);
                        return newRole;
                    });
        }

        // --- 2️⃣ Tạo các tài khoản mặc định ---
        initAdminUser();
        initSaleUser();
        initAccountantUser();

        System.out.println("🚀 Data initialization completed successfully.");

        initDepartments();
    }

    private void initAdminUser() {
        String username = "admin1";

        if (userRepository.findByUsername(username).isEmpty()) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

            User adminUser = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@gmail.com")
                    .role(adminRole)
                    .build();

            userRepository.save(adminUser);
            System.out.println("👑 Created default admin: username='admin1', password='admin123'");
        } else {
            System.out.println("ℹ️ Admin user already exists, skipping initialization.");
        }
    }

    private void initSaleUser() {
        String username = "sale1";

        if (userRepository.findByUsername(username).isEmpty()) {
            Role saleRole = roleRepository.findByName("SALE")
                    .orElseThrow(() -> new RuntimeException("SALE role not found"));

            User saleUser = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode("sale123"))
                    .email("sale@gmail.com")
                    .role(saleRole)
                    .build();

            userRepository.save(saleUser);
            System.out.println("💼 Created default sale: username='sale1', password='sale123'");
        } else {
            System.out.println("ℹ️ Sale user already exists, skipping initialization.");
        }
    }

    private void initAccountantUser() {
        String username = "accountant1";

        if (userRepository.findByUsername(username).isEmpty()) {
            Role accountantRole = roleRepository.findByName("ACCOUNTANT")
                    .orElseThrow(() -> new RuntimeException("ACCOUNTANT role not found"));

            User accountantUser = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode("accountant123"))
                    .email("accountant@gmail.com")
                    .role(accountantRole)
                    .build();

            userRepository.save(accountantUser);
            System.out.println("📊 Created default accountant: username='accountant1', password='accountant123'");
        } else {
            System.out.println("ℹ️ Accountant user already exists, skipping initialization.");
        }
    }

    private void initDepartments() {
        List<String> deps = List.of(
                "MANAGEMENT",
                "SALES",
                "ACCOUNTING",
                "WAREHOUSE",
                "HUMAN RECOURSES"
        );

        deps.forEach(d -> {
            if (!departmentRepository.existsByName(d)) {
                Department dep = new Department();
                dep.setName(d);
                departmentRepository.save(dep);
            }
        });
    }
}