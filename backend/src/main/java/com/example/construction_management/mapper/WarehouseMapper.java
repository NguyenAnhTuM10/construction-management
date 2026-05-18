// WarehouseMapper.java
package com.example.construction_management.mapper;

import com.example.construction_management.dto.request.WarehouseRequest;
import com.example.construction_management.dto.response.WarehouseResponse;
import com.example.construction_management.entity.Warehouse;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {
    WarehouseResponse toResponse(Warehouse warehouse);

    List<WarehouseResponse> toResponseList(List<Warehouse> warehouses);

    Warehouse toEntity(WarehouseRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(@MappingTarget Warehouse warehouse, WarehouseRequest request);
}