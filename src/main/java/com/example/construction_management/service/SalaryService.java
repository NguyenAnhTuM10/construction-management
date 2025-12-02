package com.example.construction_management.service;


import com.example.construction_management.dto.request.SalaryCreateRequest;
import com.example.construction_management.dto.request.SalaryUpdateRequest;
import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.dto.response.SalaryStatisticsResponse;
import com.example.construction_management.dto.response.SalarySummaryResponse;
import com.example.construction_management.entity.Employee;
import com.example.construction_management.entity.Salary;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.SalaryMapper;
import com.example.construction_management.repository.EmployeeRepository;
import com.example.construction_management.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service xử lý business logic cho Salary
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryMapper salaryMapper;

    /**
     * Lấy tất cả bảng lương
     */
    @Transactional(readOnly = true)
    public List<SalarySummaryResponse> getAllSalaries() {
        log.info("Getting all salaries");
        List<Salary> salaries = salaryRepository.findAll();
        return salaryMapper.toSummaryResponseList(salaries);
    }

    /**
     * Lấy chi tiết bảng lương theo ID
     */
    @Transactional(readOnly = true)
    public SalaryResponse getSalaryById(Long id) {
        log.info("Getting salary by id: {}", id);
        Salary salary = findSalaryById(id);
        return salaryMapper.toResponse(salary);
    }

    /**
     * Lấy bảng lương của nhân viên
     */
    @Transactional(readOnly = true)
    public List<SalarySummaryResponse> getSalariesByEmployee(Long employeeId) {
        log.info("Getting salaries by employee: {}", employeeId);

        // Validate employee exists
        if (!employeeRepository.existsById(employeeId)) {
            throw new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND );
        }

        List<Salary> salaries = salaryRepository.findByEmployeeId(employeeId);
        return salaryMapper.toSummaryResponseList(salaries);
    }

    /**
     * Lấy bảng lương theo tháng
     */
    @Transactional(readOnly = true)
    public List<SalarySummaryResponse> getSalariesByMonth(Integer year, Integer month) {
        log.info("Getting salaries by month: {}/{}", year, month);

        validateYearMonth(year, month);

        List<Salary> salaries = salaryRepository.findByYearAndMonth(year, month);
        return salaryMapper.toSummaryResponseList(salaries);
    }

    /**
     * Lấy bảng lương chưa thanh toán
     */
    @Transactional(readOnly = true)
    public List<SalarySummaryResponse> getUnpaidSalaries() {
        log.info("Getting unpaid salaries");
        List<Salary> salaries = salaryRepository.findByIsPaid(false);
        return salaryMapper.toSummaryResponseList(salaries);
    }

    /**
     * Tạo bảng lương mới
     */
    public SalaryResponse createSalary(SalaryCreateRequest request) {
        log.info("Creating salary for employee: {} - {}/{}",
                request.getEmployeeId(), request.getYear(), request.getMonth());

        // Validate employee
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        // Validate year/month
        validateYearMonth(request.getYear(), request.getMonth());

        // Check duplicate
        if (salaryRepository.existsByEmployeeIdAndYearAndMonth(
                request.getEmployeeId(), request.getYear(), request.getMonth())) {
            throw new BusinessException(
                    ErrorCode.DUPLICATE_RESOURCE
            );
        }

        // Create salary (lấy basicSalary từ Employee)
        Salary salary = Salary.builder()
                .employee(employee)
                .year(request.getYear())
                .month(request.getMonth())
                .workDays(request.getWorkDays())
                .basicSalary(employee.getSalary())
                .bonus(request.getBonus() != null ? request.getBonus() : BigDecimal.ZERO)
                .deduction(request.getDeduction() != null ? request.getDeduction() : BigDecimal.ZERO)
                .note(request.getNote())
                .isPaid(false)
                .createdDate(LocalDateTime.now())
                .build();

        // totalSalary sẽ tự động tính bởi @PrePersist

        Salary savedSalary = salaryRepository.save(salary);
        log.info("Salary created successfully with id: {}", savedSalary.getId());

        return salaryMapper.toResponse(savedSalary);
    }

    /**
     * Cập nhật bảng lương
     */
    public SalaryResponse updateSalary(Long id, SalaryUpdateRequest request) {
        log.info("Updating salary id: {}", id);

        Salary salary = findSalaryById(id);

        // Chỉ cho phép cập nhật khi chưa thanh toán
        if (salary.getIsPaid()) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR
            );
        }

        // Update fields
        if (request.getWorkDays() != null) {
            salary.setWorkDays(request.getWorkDays());
        }
        if (request.getBonus() != null) {
            salary.setBonus(request.getBonus());
        }
        if (request.getDeduction() != null) {
            salary.setDeduction(request.getDeduction());
        }
        if (request.getNote() != null) {
            salary.setNote(request.getNote());
        }

        // totalSalary sẽ tự động tính lại bởi @PreUpdate

        Salary updatedSalary = salaryRepository.save(salary);
        log.info("Salary updated successfully: {}", id);

        return salaryMapper.toResponse(updatedSalary);
    }

    /**
     * Đánh dấu đã thanh toán
     */
    public SalaryResponse markAsPaid(Long id) {
        log.info("Marking salary as paid: {}", id);

        Salary salary = findSalaryById(id);

        if (salary.getIsPaid()) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR

            );
        }

        salary.setIsPaid(true);
        salary.setPaidDate(LocalDateTime.now());

        Salary updatedSalary = salaryRepository.save(salary);
        log.info("Salary marked as paid: {}", id);

        return salaryMapper.toResponse(updatedSalary);
    }

    /**
     * Hủy thanh toán (rollback)
     */
    public SalaryResponse markAsUnpaid(Long id) {
        log.info("Marking salary as unpaid: {}", id);

        Salary salary = findSalaryById(id);

        if (!salary.getIsPaid()) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR
            );
        }

        salary.setIsPaid(false);
        salary.setPaidDate(null);

        Salary updatedSalary = salaryRepository.save(salary);
        log.info("Salary marked as unpaid: {}", id);

        return salaryMapper.toResponse(updatedSalary);
    }

    /**
     * Xóa bảng lương (chỉ khi chưa thanh toán)
     */
    public void deleteSalary(Long id) {
        log.info("Deleting salary id: {}", id);

        Salary salary = findSalaryById(id);

        if (salary.getIsPaid()) {
            throw new BusinessException(
                    ErrorCode.BUSINESS_ERROR
            );
        }

        salaryRepository.deleteById(id);
        log.info("Salary deleted successfully: {}", id);
    }

    /**
     * Thống kê lương theo tháng
     */
    @Transactional(readOnly = true)
    public SalaryStatisticsResponse getStatisticsByMonth(Integer year, Integer month) {
        log.info("Getting salary statistics for: {}/{}", year, month);

        validateYearMonth(year, month);

        List<Salary> salaries = salaryRepository.findByYearAndMonth(year, month);

        BigDecimal totalSalary = salaries.stream()
                .map(Salary::getTotalSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = salaries.stream()
                .filter(Salary::getIsPaid)
                .map(Salary::getTotalSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalUnpaid = salaries.stream()
                .filter(s -> !s.getIsPaid())
                .map(Salary::getTotalSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long paidRecords = salaries.stream().filter(Salary::getIsPaid).count();
        long unpaidRecords = salaries.stream().filter(s -> !s.getIsPaid()).count();

        return SalaryStatisticsResponse.builder()
                .year(year)
                .month(month)
                .totalSalary(totalSalary)
                .totalPaid(totalPaid)
                .totalUnpaid(totalUnpaid)
                .totalRecords((long) salaries.size())
                .paidRecords(paidRecords)
                .unpaidRecords(unpaidRecords)
                .build();
    }

    /**
     * Helper: Tìm salary hoặc throw exception
     */
    private Salary findSalaryById(Long id) {
        return salaryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND
                ));
    }

    /**
     * Helper: Validate year và month
     */
    private void validateYearMonth(Integer year, Integer month) {
        if (year < 2000 || year > 2100) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST
            );
        }
        if (month < 1 || month > 12) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST
            );
        }
    }
}