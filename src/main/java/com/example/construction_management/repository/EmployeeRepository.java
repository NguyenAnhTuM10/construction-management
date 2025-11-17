package com.example.construction_management.repository;


import com.example.construction_management.entity.Department;
import com.example.construction_management.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee,Integer> {

    List<Employee> findByDepartment(Department department);
}
