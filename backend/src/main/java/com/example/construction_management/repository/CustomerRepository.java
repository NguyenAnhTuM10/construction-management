    package com.example.construction_management.repository;

    import com.example.construction_management.entity.Customer;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Query;

    import java.math.BigDecimal;
    import java.util.List;
    import java.util.Optional;

    public interface CustomerRepository extends JpaRepository<Customer,Long> {
        List<Customer> findByDebtGreaterThan(java.math.BigDecimal debt);
        Optional<Customer> findByEmail(String email);
        Optional<Customer> findByPhone(String phone);
        List<Customer> findByNameContainingIgnoreCase(String name);
        boolean existsByEmail(String email);
        boolean existsByPhone(String phone);

        @Query("SELECT SUM(c.debt) FROM Customer c")
        BigDecimal sumTotalDebt();

        @Query("SELECT c.id, c.name, c.email, c.phone, c.debt, " +
                "COALESCE((SELECT SUM(o.total) FROM Order o WHERE o.customer.id = c.id), 0), " +
                "COUNT(o) " +
                "FROM Customer c " +
                "LEFT JOIN Order o ON o.customer.id = c.id " +
                "GROUP BY c.id, c.name, c.email, c.phone, c.debt " +
                "ORDER BY c.debt DESC")
        List<Object[]> getCustomerDebtReport();
    }
