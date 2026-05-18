package com.example.construction_management.mapper;



import com.example.construction_management.dto.request.CustomerCreateRequest;
import com.example.construction_management.dto.response.CustomerResponse;
import com.example.construction_management.dto.request.CustomerUpdateRequest;
import com.example.construction_management.entity.Customer;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * MapStruct Mapper cho Customer
 */
@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface CustomerMapper {

    /**
     * Convert từ CreateRequest sang Entity
     * Nếu debt = null thì set = 0
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "debt", expression = "java(getDebtOrDefault(request.getDebt()))")
    Customer toEntity(CustomerCreateRequest request);

    /**
     * Convert từ Entity sang Response
     */
    CustomerResponse toResponse(Customer customer);

    /**
     * Convert List Entity sang List Response
     */
    List<CustomerResponse> toResponseList(List<Customer> customers);

    /**
     * Update Entity từ UpdateRequest
     * Chỉ update các field không null
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "debt", expression = "java(getDebtOrDefault(request.getDebt()))")
    void updateEntityFromRequest(CustomerUpdateRequest request, @MappingTarget Customer customer);

    /**
     * Helper method: nếu debt = null thì trả về BigDecimal.ZERO
     */
    default BigDecimal getDebtOrDefault(BigDecimal debt) {
        return debt != null ? debt : BigDecimal.ZERO;
    }
}