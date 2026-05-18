# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Run the application
./mvnw spring-boot:run

# Build (skip tests)
./mvnw clean package -DskipTests

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=ConstructionManagementApplicationTests

# Compile only (useful to catch annotation processor errors)
./mvnw compile
```

**Prerequisites:** MySQL running on `localhost:3306`, database `construction_db`, user `root` / password `1234`.

The app starts on `http://localhost:8080/construction`. Swagger UI: `http://localhost:8080/construction/swagger-ui.html`.

## Architecture Overview

Pure REST API backend (no frontend in this repo). All responses use a shared `ApiResponse<T>` wrapper.

### Layer flow
```
Controller → Service → Repository (Spring Data JPA) → MySQL
                  ↕
              Mapper (MapStruct: Entity ↔ DTO)
```

### Security model
Stateless JWT auth. `JwtAuthenticationFilter` validates the Bearer token on every request. Role-based access is enforced both at the `SecurityConfig` route level and via `@PreAuthorize` on methods. Four roles: `ADMIN`, `SALE`, `ACCOUNTANT`, `USER`. `DataInitializer` seeds default users and departments on first startup.

Default seed accounts:
- `admin1` / `admin123`
- `sale1` / `sale123`
- `accountant1` / `accountant123`

### Core domain modules

**Inventory** — Central to the system. `InventoryTransaction` (IN/OUT, with `TransactionReason`: PURCHASE/SALE/RETURN/ADJUST) drives stock changes. `InventoryBalance` is the running balance per product per warehouse. `InventoryAuditLog` records every mutation. When completing a transaction, `InventoryTransactionService` calls `InventoryBalanceService` to update balances atomically.

**Orders** — `Order` → `OrderItem` (line items) → `Payment`. Status lifecycle: `PENDING → CONFIRMED → SHIPPED → DELIVERED` or `CANCELLED`. Orders link to `Customer` and optionally to a `User` (salesperson).

**HR/Payroll** — `Employee` belongs to a `Department`. `Salary` is a monthly record linked to `SalaryConfig` (base pay rules). `Task` has `TaskPriority` enum and status tracking assigned to employees.

**Auth** — `User` holds one `Role`. `RefreshToken` is persisted in DB; logout invalidates it. JWT secret and expiry live in `application.yaml`.

### Annotation processor ordering (important)
`pom.xml` configures annotation processor order deliberately: **Lombok must come before MapStruct**. Do not reorder these in `<annotationProcessorPaths>`. The build uses `--enable-preview` for Java 21 preview features.

### Error handling
All business errors throw `BusinessException(ErrorCode)`. `ErrorCode` enum maps each error to an HTTP status and a numeric code. The global exception handler (`handler/`) converts these to `ApiResponse` error responses. Note: some `ErrorCode` entries share the same numeric code (known technical debt, do not add more duplicates).

### Key conventions
- DTOs are split into `dto/request/` and `dto/response/` packages.
- MapStruct mappers use `@Mapper(componentModel = "spring")` and are injected as Spring beans.
- `@Transactional` is applied at the service method level, not the class level.
- Vietnamese is used in user-facing error messages and some comments; this is intentional.