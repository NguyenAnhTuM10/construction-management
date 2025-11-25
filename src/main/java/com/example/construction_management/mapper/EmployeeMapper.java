package com.example.construction_management.mapper;

import com.example.construction_management.dto.request.EmployeeRequest;
import com.example.construction_management.dto.response.EmployeeResponse;
import com.example.construction_management.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;

@Mapper(componentModel = "spring")

public interface EmployeeMapper {

    Employee toEmployee(EmployeeRequest request);

    @Mapping(target = "departmentName", source = "department.name")
    EmployeeResponse toResponse(Employee employee);


    @Mapping(target = "id", ignore = true) // Không bao giờ cập nhật ID
    @Mapping(target = "department", ignore = true) // Xử lý department riêng trong Service
    void updateEmployeeFromRequest(EmployeeRequest request, @MappingTarget Employee employee);
}
