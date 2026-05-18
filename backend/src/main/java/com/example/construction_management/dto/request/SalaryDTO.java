package com.example.construction_management.dto.request;



import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryDTO {

    private Long id;

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private String employeeName;

    private String departmentName;

    @NotNull(message = "Month is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate month;

    // Hiển thị tháng dạng "2024-01" cho frontend
    private String monthDisplay;

    @NotNull(message = "Basic salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Basic salary must be >= 0")
    @Digits(integer = 10, fraction = 2, message = "Basic salary must have max 10 integer digits and 2 fraction digits")
    private BigDecimal basicSalary;

    @DecimalMin(value = "0.0", inclusive = true, message = "Bonus must be >= 0")
    @Digits(integer = 10, fraction = 2, message = "Bonus must have max 10 integer digits and 2 fraction digits")
    private BigDecimal bonus;

    // Read-only field - tự động tính từ backend
    private BigDecimal total;

    // Metadata
    private LocalDate createdDate;

    private LocalDate updatedDate;

    /**
     * Helper method to format month display
     */
    public void setMonth(LocalDate month) {
        this.month = month;
        if (month != null) {
            this.monthDisplay = month.getYear() + "-" + String.format("%02d", month.getMonthValue());
        }
    }

    /**
     * Calculate total if not set
     */
    public BigDecimal getTotal() {
        if (total != null) {
            return total;
        }

        BigDecimal base = basicSalary != null ? basicSalary : BigDecimal.ZERO;
        BigDecimal bonusAmount = bonus != null ? bonus : BigDecimal.ZERO;

        return base.add(bonusAmount);
    }
}