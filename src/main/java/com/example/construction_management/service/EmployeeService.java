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
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Query;
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
        // Tìm Department
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DEPARTMENT_NOT_FOUND));





        // Map và tạo Employee
        Employee employee = Employee.builder()
                .name(request.getName())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .phone(request.getPhone())
                .email(request.getEmail())
                .idCard(request.getIdCard())
                .address(request.getAddress())
                .department(department)
                .baseSalary(request.getBaseSalary())
                .startDate(request.getStartDate())
                .active(true)
                .build();

        Employee saved = employeeRepository.save(employee);
        return employeeMapper.toResponse(saved);
    }
    /**
     * Cập nhật thông tin nhân viên
     * Logic: Tìm Department mới (nếu có) -> Update department_id trong Employee

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

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEmployeesWithoutAccount() {
        log.info("Fetching employees without account");
        return employeeRepository.findEmployeesWithoutAccount().stream()
                .map(employeeMapper::toResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    public EmployeeResponse updateEmployee(Long employeeId, EmployeeRequest request) {
        // 1️⃣ Kiểm tra tồn tại nhân viên
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        // 2️⃣ Kiểm tra phòng ban hợp lệ
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phòng ban với ID: " + request.getDepartmentId()));

        // 3️⃣ Cập nhật các trường
        employee.setName(request.getName());
        employee.setGender(request.getGender());
        employee.setBirthDate(request.getBirthDate());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setIdCard(request.getIdCard());
        employee.setAddress(request.getAddress());
        employee.setDepartment(department);
        employee.setBaseSalary(request.getBaseSalary());
        employee.setStartDate(request.getStartDate());
        employee.setEndDate(request.getEndDate());
        employee.setNote(request.getNote());
        employee.setActive(request.getActive());

        // 4️⃣ Lưu lại
        Employee saved = employeeRepository.save(employee);

        // 5️⃣ Trả về DTO phản hồi
        return toResponse(saved);
    }

    private EmployeeResponse toResponse(Employee employee) {
        return EmployeeResponse.builder()
                .id(employee.getId())
                .name(employee.getName())
                .gender(employee.getGender())
                .birthDate(employee.getBirthDate())
                .phone(employee.getPhone())
                .email(employee.getEmail())
                .idCard(employee.getIdCard())
                .address(employee.getAddress())
                .departmentId(employee.getDepartment().getId())
                .departmentName(employee.getDepartment().getName())
                .baseSalary(employee.getBaseSalary())
                .startDate(employee.getStartDate())
                .endDate(employee.getEndDate())
                .note(employee.getNote())
                .active(employee.getActive())
                .build();
    }




}