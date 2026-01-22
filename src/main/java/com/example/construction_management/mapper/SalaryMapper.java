package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.entity.Salary;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SalaryMapper {

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "departmentName", source = "employee.department.name")
    SalaryResponse toResponse(Salary salary);

    List<SalaryResponse> toResponseList(List<Salary> salaries);
}