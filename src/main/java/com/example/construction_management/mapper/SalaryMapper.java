package com.example.construction_management.mapper;


import com.example.construction_management.dto.response.SalaryResponse;
import com.example.construction_management.dto.response.SalarySummaryResponse;
import com.example.construction_management.entity.Salary;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct Mapper cho Salary
 */
@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface SalaryMapper {

    /**
     * Convert Salary Entity sang Response đầy đủ
     */
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "departmentName", source = "employee.department.name")
    SalaryResponse toResponse(Salary salary);

    /**
     * Convert Salary Entity sang Summary Response
     */
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.name")
    SalarySummaryResponse toSummaryResponse(Salary salary);

    /**
     * Convert List Entity sang List Summary Response
     */
    List<SalarySummaryResponse> toSummaryResponseList(List<Salary> salaries);
}