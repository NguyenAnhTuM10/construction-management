package com.example.construction_management.service;

import com.example.construction_management.dto.request.WarehouseRequest;
import com.example.construction_management.dto.response.WarehouseResponse;
import com.example.construction_management.entity.Warehouse;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.WarehouseMapper;
import com.example.construction_management.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;
    private final WarehouseMapper warehouseMapper;

    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseMapper.toResponseList(warehouseRepository.findAll());
    }

    public WarehouseResponse getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WAREHOUSE_NOT_EXISTED));
        return warehouseMapper.toResponse(warehouse);
    }

    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã kho đã tồn tại");
        }

        Warehouse warehouse = warehouseMapper.toEntity(request);
        return warehouseMapper.toResponse(warehouseRepository.save(warehouse));
    }

    @Transactional
    public WarehouseResponse updateWarehouse(Long id, WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WAREHOUSE_NOT_EXISTED));

        warehouseMapper.updateEntity(warehouse, request);
        return warehouseMapper.toResponse(warehouseRepository.save(warehouse));
    }

    @Transactional
    public void deleteWarehouse(Long id) {
        if (!warehouseRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.WAREHOUSE_NOT_EXISTED);
        }
        warehouseRepository.deleteById(id);
    }
}