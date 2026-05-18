package com.example.construction_management.service;

import com.example.construction_management.dto.request.DepartmentDTO;
import com.example.construction_management.dto.request.DepartmentRequest;
import com.example.construction_management.entity.Department;
import com.example.construction_management.mapper.DepartmentMapper;
import com.example.construction_management.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper mapper;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAll() {
        return departmentRepository.findAll()
                .stream()
                .map(mapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getById(Long id) {
        Department dep = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        return mapper.toDTO(dep);
    }

    @Transactional
    public DepartmentDTO create(DepartmentRequest request) {
        Department dep = mapper.toEntity(request);
        departmentRepository.save(dep);
        return mapper.toDTO(dep);
    }

    @Transactional
    public DepartmentDTO update(Long id, DepartmentRequest request) {
        Department dep = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        mapper.updateEntity(dep, request);
        departmentRepository.save(dep);

        return mapper.toDTO(dep);
    }

    @Transactional
    public void delete(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Department not found");
        }
        departmentRepository.deleteById(id);
    }
}
