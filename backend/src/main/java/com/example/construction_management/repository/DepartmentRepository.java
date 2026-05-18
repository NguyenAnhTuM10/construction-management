package com.example.construction_management.repository;

import com.example.construction_management.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Tìm department theo tên
     * @param name tên department
     * @return Optional<Department>
     */
    Optional<Department> findByName(String name);

    /**
     * Kiểm tra department có tồn tại theo tên không
     * @param name tên department
     * @return true nếu tồn tại
     */
    boolean existsByName(String name);
}