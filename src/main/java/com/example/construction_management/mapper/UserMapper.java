package com.example.construction_management.mapper;


import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "role.name", target = "role")
    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.name", target = "employeeName")
    @Mapping(source = "employee.department.name", target = "departmentName")
    UserResponse toUserResponse(User user);



}