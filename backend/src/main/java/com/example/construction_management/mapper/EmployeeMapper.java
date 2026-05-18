package com.example.construction_management.mapper;

import com.example.construction_management.dto.request.EmployeeRequest;
import com.example.construction_management.dto.response.EmployeeResponse;
import com.example.construction_management.entity.Employee;
import com.example.construction_management.entity.User;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    Employee toEntity(EmployeeRequest request);

    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.name")
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "hasUserAccount", ignore = true)
    EmployeeResponse toResponse(Employee employee);

    List<EmployeeResponse> toResponseList(List<Employee> employees);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(EmployeeRequest request, @MappingTarget Employee employee);

    // Custom method để map với thông tin User
    default EmployeeResponse toResponseWithUser(Employee employee, User user) {
        EmployeeResponse response = toResponse(employee);
        if (user != null) {
            response.setUserId(user.getId());
            response.setUsername(user.getUsername());
            response.setHasUserAccount(true);
        } else {
            response.setHasUserAccount(false);
        }
        return response;
    }
}