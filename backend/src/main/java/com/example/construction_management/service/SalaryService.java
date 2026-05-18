package com.example.construction_management.service;

import com.example.construction_management.dto.request.SalaryRequest;
import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.entity.Employee;
import com.example.construction_management.entity.Salary;
import com.example.construction_management.entity.User;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.SalaryMapper;
import com.example.construction_management.repository.EmployeeRepository;
import com.example.construction_management.repository.SalaryRepository;
import com.example.construction_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final SalaryMapper salaryMapper;

    // Hệ số tăng ca mặc định
    private static final double OVERTIME_RATE = 1.5;

    /**
     * Lấy tất cả bảng lương
     */
    @Transactional(readOnly = true)
    public List<SalaryResponse> getAllSalaries() {
        return salaryMapper.toResponseList(salaryRepository.findAll());
    }

    /**
     * Lấy bảng lương theo ID
     */
    @Transactional(readOnly = true)
    public SalaryResponse getSalaryById(Long id) {
        Salary salary = salaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALARY_NOT_FOUND));
        return salaryMapper.toResponse(salary);
    }

    /**
     * Lấy bảng lương theo kỳ
     */
    @Transactional(readOnly = true)
    public List<SalaryResponse> getSalariesByPeriod(Integer month, Integer year) {
        return salaryMapper.toResponseList(salaryRepository.findByMonthAndYear(month, year));
    }

    /**
     * Lấy bảng lương theo nhân viên
     */
    @Transactional(readOnly = true)
    public List<SalaryResponse> getSalariesByEmployee(Long employeeId) {
        return salaryMapper.toResponseList(salaryRepository.findByEmployeeId(employeeId));
    }

    /**
     * Tạo bảng lương mới
     */
    @Transactional
    public SalaryResponse createSalary(SalaryRequest request) {
        // Kiểm tra nhân viên tồn tại
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        // Kiểm tra đã có bảng lương cho kỳ này chưa
        if (salaryRepository.existsByEmployeeIdAndMonthAndYear(
                request.getEmployeeId(), request.getMonth(), request.getYear())) {
            throw new BusinessException(ErrorCode.SALARY_ALREADY_EXISTS);
        }

        // Lấy user hiện tại
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);

        // Tính lương tăng ca
        BigDecimal overtimePay = calculateOvertimePay(
                employee.getBaseSalary(),
                request.getWorkDays(),
                request.getOvertimeHours()
        );

        // Tạo bảng lương
        Salary salary = Salary.builder()
                .employee(employee)
                .month(request.getMonth())
                .year(request.getYear())
                .workDays(request.getWorkDays())
                .actualWorkDays(request.getActualWorkDays())
                .leaveDays(request.getLeaveDays())
                .overtimeHours(request.getOvertimeHours())
                .baseSalary(employee.getBaseSalary())
                .bonus(request.getBonus() != null ? request.getBonus() : BigDecimal.ZERO)
                .allowance(request.getAllowance() != null ? request.getAllowance() : BigDecimal.ZERO)
                .overtimePay(overtimePay)
                .deduction(request.getDeduction() != null ? request.getDeduction() : BigDecimal.ZERO)
                .isPaid(false)
                .note(request.getNote())
                .createdBy(currentUser)
                .build();

        // Tính tổng lương
        salary.calculateTotalSalary();

        Salary saved = salaryRepository.save(salary);
        log.info("Created salary for employee {} - period {}/{}",
                employee.getName(), request.getMonth(), request.getYear());

        return salaryMapper.toResponse(saved);
    }

    /**
     * Cập nhật bảng lương
     */
    @Transactional
    public SalaryResponse updateSalary(Long id, SalaryRequest request) {
        Salary salary = salaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALARY_NOT_FOUND));

        // Không cho sửa nếu đã trả lương
        if (salary.getIsPaid()) {
            throw new BusinessException(ErrorCode.SALARY_ALREADY_PAID);
        }

        // Cập nhật thông tin
        salary.setWorkDays(request.getWorkDays());
        salary.setActualWorkDays(request.getActualWorkDays());
        salary.setLeaveDays(request.getLeaveDays());
        salary.setOvertimeHours(request.getOvertimeHours());
        salary.setBonus(request.getBonus() != null ? request.getBonus() : BigDecimal.ZERO);
        salary.setAllowance(request.getAllowance() != null ? request.getAllowance() : BigDecimal.ZERO);
        salary.setDeduction(request.getDeduction() != null ? request.getDeduction() : BigDecimal.ZERO);
        salary.setNote(request.getNote());

        // Tính lại lương tăng ca
        BigDecimal overtimePay = calculateOvertimePay(
                salary.getBaseSalary(),
                request.getWorkDays(),
                request.getOvertimeHours()
        );
        salary.setOvertimePay(overtimePay);

        // Tính lại tổng lương
        salary.calculateTotalSalary();

        return salaryMapper.toResponse(salaryRepository.save(salary));
    }

    /**
     * Đánh dấu đã trả lương
     */
    @Transactional
    public SalaryResponse markAsPaid(Long id) {
        Salary salary = salaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALARY_NOT_FOUND));

        if (salary.getIsPaid()) {
            throw new BusinessException(ErrorCode.SALARY_ALREADY_PAID);
        }

        salary.setIsPaid(true);
        salary.setPaidDate(LocalDate.now());

        log.info("Marked salary as paid: {} - {}/{}",
                salary.getEmployeeName(), salary.getMonth(), salary.getYear());

        return salaryMapper.toResponse(salaryRepository.save(salary));
    }

    /**
     * Xóa bảng lương
     */
    @Transactional
    public void deleteSalary(Long id) {
        Salary salary = salaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALARY_NOT_FOUND));

        // Không cho xóa nếu đã trả lương
        if (salary.getIsPaid()) {
            throw new BusinessException(ErrorCode.SALARY_ALREADY_PAID);
        }

        salaryRepository.delete(salary);
        log.info("Deleted salary: {} - {}/{}",
                salary.getEmployeeName(), salary.getMonth(), salary.getYear());
    }

    /**
     * Tính lương tăng ca
     */
    private BigDecimal calculateOvertimePay(BigDecimal baseSalary, Integer workDays, Double overtimeHours) {
        if (overtimeHours == null || overtimeHours <= 0) {
            return BigDecimal.ZERO;
        }

        // Lương giờ = Lương cơ bản / số ngày / 8 giờ
        BigDecimal hourlyRate = baseSalary
                .divide(BigDecimal.valueOf(workDays), 2, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);

        // Lương tăng ca = Lương giờ x Hệ số x Số giờ
        return hourlyRate
                .multiply(BigDecimal.valueOf(OVERTIME_RATE))
                .multiply(BigDecimal.valueOf(overtimeHours))
                .setScale(0, RoundingMode.HALF_UP);
    }
}