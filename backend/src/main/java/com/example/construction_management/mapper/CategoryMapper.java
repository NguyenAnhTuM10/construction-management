package com.example.construction_management.mapper;

import com.example.construction_management.dto.request.CategoryDTO;
import com.example.construction_management.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper
{
    Category toCategory(CategoryDTO dto);
    CategoryDTO toCategoryDTO(Category category);

}
