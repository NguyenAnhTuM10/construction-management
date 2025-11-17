package com.example.construction_management.service;



import com.example.construction_management.dto.request.SalaryDTO;
import com.example.construction_management.entity.Employee;
import com.example.construction_management.entity.Salary;
import com.example.construction_management.repository.EmployeeRepository;
import com.example.construction_management.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;

    public List<SalaryDTO> getAllSalaries() {
        return salaryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SalaryDTO getSalaryById(Long id) {
        Salary salary = salaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary not found with id: " + id));
        return convertToDTO(salary);
    }

    public List<SalaryDTO> getSalariesByEmployee(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new RuntimeException("Employee not found with id: " + employeeId);
        }
        return salaryRepository.findByEmployeeId(employeeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SalaryDTO> getSalariesByMonth(LocalDate month) {
        // Chuẩn hóa về ngày đầu tháng
        LocalDate firstDayOfMonth = month.withDayOfMonth(1);
        return salaryRepository.findByMonth(firstDayOfMonth).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SalaryDTO createSalary(SalaryDTO salaryDTO) {
        Employee employee = employeeRepository.findById(salaryDTO.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Chuẩn hóa tháng về ngày đầu tháng
        LocalDate month = salaryDTO.getMonth().withDayOfMonth(1);

        // Kiểm tra đã có lương cho tháng này chưa
        Optional<Salary> existingSalary = salaryRepository.findByEmployeeIdAndMonth(
                salaryDTO.getEmployeeId(), month);

        if (existingSalary.isPresent()) {
            throw new RuntimeException("Salary already exists for this employee and month");
        }

        // Sử dụng Builder pattern
        Salary salary = Salary.builder()
                .employee(employee)
                .month(month)
                .basicSalary(salaryDTO.getBasicSalary())
                .bonus(salaryDTO.getBonus() != null ? salaryDTO.getBonus() : java.math.BigDecimal.ZERO)
                .build();

        Salary saved = salaryRepository.save(salary);
        return convertToDTO(saved);
    }

    public SalaryDTO updateSalary(Long id, SalaryDTO salaryDTO) {
        Salary salary = salaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary not found with id: " + id));

        // Chỉ update basicSalary và bonus
        salary.setBasicSalary(salaryDTO.getBasicSalary());
        salary.setBonus(salaryDTO.getBonus() != null ? salaryDTO.getBonus() : java.math.BigDecimal.ZERO);

        Salary updated = salaryRepository.save(salary);
        return convertToDTO(updated);
    }

    public void deleteSalary(Long id) {
        if (!salaryRepository.existsById(id)) {
            throw new RuntimeException("Salary not found with id: " + id);
        }
        salaryRepository.deleteById(id);
    }

    private SalaryDTO convertToDTO(Salary salary) {
        SalaryDTO dto = new SalaryDTO();
        dto.setId(salary.getId());
        dto.setEmployeeId(salary.getEmployee().getId());
        dto.setEmployeeName(salary.getEmployee().getName());
        dto.setMonth(salary.getMonth());
        dto.setBasicSalary(salary.getBasicSalary());
        dto.setBonus(salary.getBonus());
        dto.setTotal(salary.getTotal()); // Sử dụng @Transient method
        return dto;
    }
}