package com.example.construction_management.mapper;

import com.example.construction_management.dto.request.DepartmentDTO;
import com.example.construction_management.dto.request.DepartmentRequest;
import com.example.construction_management.entity.Department;
import org.springframework.stereotype.Component;

@Component
public class DepartmentMapper {

    public DepartmentDTO toDTO(Department entity) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        return dto;
    }

    public Department toEntity(DepartmentRequest req) {
        Department dep = new Department();
        dep.setName(req.getName());
        return dep;
    }

    public void updateEntity(Department dep, DepartmentRequest req) {
        dep.setName(req.getName());
    }
}
