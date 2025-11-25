package com.example.construction_management.service;

import com.example.construction_management.dto.request.EmployeeRequest;
import com.example.construction_management.dto.response.EmployeeResponse;
import com.example.construction_management.entity.Department;
import com.example.construction_management.entity.Employee;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.EmployeeMapper;
import com.example.construction_management.repository.DepartmentRepository;
import com.example.construction_management.repository.EmployeeRepository;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final EmployeeMapper employeeMapper;

    /**
     * Lấy tất cả nhân viên
     */
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        log.info("Fetching all employees");
        return employeeRepository.findAll().stream()
                .map(employeeMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin nhân viên theo ID
     */
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long employeeId) {
        log.info("Fetching employee with id: {}", employeeId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> {
                    log.error("Employee not found with id: {}", employeeId);
                    return new BusinessException(ErrorCode.USER_NOT_FOUND);
                });

        return employeeMapper.toResponse(employee);
    }

    /**
     * Tạo nhân viên mới
     * Logic: Tìm Department có sẵn theo tên -> Lấy ID -> Gán vào department_id của Employee
     */
    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        log.info("Creating new employee: {}", request.getName());

        // Bước 1: Tìm Department CÓ SẴN trong database theo tên
        // Nếu không tìm thấy -> throw exception
        Department existingDepartment = findDepartmentByName(request.getDepartmentName());
        log.info("Found existing department with id: {} and name: {}",
                existingDepartment.getId(), existingDepartment.getName());

        // Bước 2: Map request -> Employee entity (chưa có department)
        Employee newEmployee = employeeMapper.toEmployee(request);

        // Bước 3: Gán Department object vào Employee
        // JPA sẽ TỰ ĐỘNG lấy existingDepartment.getId()
        // và INSERT vào cột department_id trong bảng employees
        newEmployee.setDepartment(existingDepartment);

        // Bước 4: Lưu Employee vào database
        // SQL: INSERT INTO employees (name, phone, salary, hire_date, department_id)
        //      VALUES ('John', '0123...', 5000.00, '2024-01-01', 5) <- ID của department
        Employee savedEmployee = employeeRepository.save(newEmployee);
        log.info("Employee created successfully with id: {} under department_id: {}",
                savedEmployee.getId(), savedEmployee.getDepartment().getId());

        return employeeMapper.toResponse(savedEmployee);
    }

    /**
     * Cập nhật thông tin nhân viên
     * Logic: Tìm Department mới (nếu có) -> Update department_id trong Employee
     */
    @Transactional
    public EmployeeResponse updateEmployee(Long employeeId, EmployeeRequest request) {
        log.info("Updating employee with id: {}", employeeId);

        // Tìm employee hiện tại trong DB
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> {
                    log.error("Employee not found with id: {}", employeeId);
                    return new BusinessException(ErrorCode.USER_NOT_FOUND);
                });

        // Cập nhật các trường cơ bản
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            employee.setName(request.getName());
        }

        if (request.getPhone() != null) {
            employee.setPhone(request.getPhone());
        }

        if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }

        if (request.getHireDate() != null) {
            employee.setHireDate(request.getHireDate());
        }

        // Cập nhật department_id nếu có thay đổi
        if (request.getDepartmentName() != null && !request.getDepartmentName().trim().isEmpty()) {
            String currentDeptName = employee.getDepartment() != null
                    ? employee.getDepartment().getName()
                    : null;

            // Chỉ update nếu tên department thay đổi
            if (!request.getDepartmentName().equals(currentDeptName)) {
                // Tìm Department CÓ SẴN theo tên mới
                Department existingNewDepartment = findDepartmentByName(request.getDepartmentName());

                // Gán Department object -> JPA tự động update department_id
                employee.setDepartment(existingNewDepartment);

                log.info("Department updated from '{}' (id={}) to '{}' (id={})",
                        currentDeptName,
                        employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                        existingNewDepartment.getName(),
                        existingNewDepartment.getId());
            }
        }

        // Save sẽ UPDATE cột department_id trong bảng employees
        // SQL: UPDATE employees SET department_id = ? WHERE id = ?
        Employee updatedEmployee = employeeRepository.save(employee);
        log.info("Employee updated successfully with id: {}", employeeId);

        return employeeMapper.toResponse(updatedEmployee);
    }

    /**
     * Xóa nhân viên
     */
    @Transactional
    public void deleteEmployee(Long employeeId) {
        log.info("Deleting employee with id: {}", employeeId);

        // Kiểm tra employee tồn tại
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> {
                    log.error("Employee not found with id: {}", employeeId);
                    return new BusinessException(ErrorCode.USER_NOT_FOUND);
                });

        // Kiểm tra và xử lý quan hệ với User
        User linkedUser = userRepository.findByEmployeeId(employeeId).orElse(null);
        if (linkedUser != null) {
            log.warn("Employee {} has linked user account. Unlinking user first.", employeeId);
            linkedUser.setEmployee(null);
            userRepository.save(linkedUser);
        }

        // Kiểm tra các quan hệ khác có thể gây lỗi
        // Note: Nếu có Orders hoặc Salaries liên quan, cần xử lý tùy theo business logic
        // Option 1: Không cho phép xóa nếu còn orders
        // Option 2: Set employee_id = null trong orders/salaries
        // Option 3: Cascade delete (không khuyến khích)

        employeeRepository.delete(employee);
        log.info("Employee deleted successfully with id: {}", employeeId);
    }

    /**
     * Helper method: Tìm Department theo tên
     */
    private Department findDepartmentByName(String departmentName) {
        if (departmentName == null || departmentName.trim().isEmpty()) {
            log.error("Department name is null or empty");
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        Department department = departmentRepository.findByName(departmentName.trim())
                .orElseThrow(() -> {
                    log.error("Department not found with name: {}", departmentName);
                    return new BusinessException(ErrorCode.DEPARTMENT_NOT_FOUND);
                });

        return department;
    }
}