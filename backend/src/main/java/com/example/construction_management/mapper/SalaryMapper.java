package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.entity.Salary;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SalaryMapper {

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeCode", source = "employee.user.username")  // ✅ THÊM - hoặc dùng employee.code nếu có
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "departmentName", source = "employee.department.name")
    @Mapping(target = "positionName", expression = "java(getPositionName(salary))")  // ✅ THÊM
    SalaryResponse toResponse(Salary salary);

    List<SalaryResponse> toResponseList(List<Salary> salaries);

    /**
     * Helper method để lấy position name
     * Vì Employee entity không có trực tiếp position field,
     * có thể customize logic ở đây
     */
    default String getPositionName(Salary salary) {
        if (salary.getEmployee() == null) {
            return null;
        }
        // Option 1: Nếu Employee có position field
        // return salary.getEmployee().getPosition() != null
        //        ? salary.getEmployee().getPosition().getName() : null;

        // Option 2: Tạm thời return null hoặc default
        // Sau này có thể thêm Position entity vào Employee
        return null;
    }
}