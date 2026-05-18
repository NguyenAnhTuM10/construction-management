package com.example.construction_management.mapper;

import com.example.construction_management.dto.request.ProductCreateUpdateDTO;
import com.example.construction_management.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toProduct(ProductCreateUpdateDTO dto);
    ProductCreateUpdateDTO toProductCreateUpdateDTO(Product product);

    void updateProduct(ProductCreateUpdateDTO dto, @MappingTarget Product product);

}
