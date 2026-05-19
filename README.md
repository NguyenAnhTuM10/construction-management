# Construction Management System

A full-stack business management platform for construction material companies, covering order processing, inventory control, HR & payroll, task tracking, and financial reporting.

**Live API:** https://construction-management-production-2769.up.railway.app/construction/swagger-ui.html

---

## Tech Stack

**Backend**
- Java 21 · Spring Boot 3.5 · Spring Security 6 (stateless JWT)
- Spring Data JPA · MySQL 8 · MapStruct · Springdoc OpenAPI

**Frontend**
- React 18 · Vite · Ant Design 5 · Recharts · React Router 6 · Axios

**Infrastructure**
- Docker / Docker Compose
- Railway (backend + DB) · Nginx (frontend serving)

---

## Features

| Module | Highlights |
|---|---|
| **Authentication** | JWT access + refresh token, role-based access (ADMIN / SALE / ACCOUNTANT / USER), BCrypt passwords |
| **Orders** | Full order lifecycle (PENDING → CONFIRMED → PROCESSING → SHIPPING → COMPLETED / CANCELLED), stock auto-deduction on create, stock restore on cancel |
| **Payments** | Partial & full payment tracking, real-time debt calculation per customer, support for CASH / BANK\_TRANSFER / CHEQUE |
| **Inventory** | Multi-warehouse stock management, IN/OUT transactions with weighted-average cost (WAC), audit log on every mutation |
| **HR & Payroll** | Employee & department management, monthly salary with overtime calculation (1.5× rate), pay status workflow |
| **Task Management** | Task assignment per employee, priority levels (LOW → URGENT), status machine with auto-complete timestamp |
| **Dashboard** | Aggregated KPIs: revenue, customer debt, low-stock alerts, overdue tasks, unpaid salaries |
| **Products & Categories** | Product catalog with unique codes, buy/sell price, stock protected from direct edits |
| **Customers & Suppliers** | Customer debt lifecycle tied to orders & payments; supplier lookup for inbound transactions |

---

## Architecture

```
React (Ant Design) ──[Axios / REST]──► Spring Boot ──► MySQL
                                           │
                                    Spring Security
                                    (JWT filter, RBAC)
                                           │
                            ┌──────────────┼──────────────┐
                         Service      MapStruct         JPA
                         layer         mappers        repositories
```

**Request flow:** `Controller → Service → Repository → MySQL`  
**Security:** Every request passes through `JwtAuthenticationFilter` before reaching business logic. Role enforcement is applied both at route level (`SecurityConfig`) and method level (`@PreAuthorize`).

**Domain rules worth noting:**
- `Product.stock` is a cache — source of truth is `InventoryBalance` per (warehouse, product).
- `Order.paidAmount` / `remainingDebt` are derived from the `Payment` list, not stored independently.
- `Customer.debt` updates automatically on every payment create/delete.

---

## Domain Model

```
User ──── Employee ──── Department
 │             │
 └── Role      ├── Salary ── SalaryConfig
               └── Task

Order ──── OrderItem ──── Product ──── Category
  │                           │
  ├── Payment                 └── InventoryBalance ── Warehouse
  └── Customer

InventoryTransaction ── InventoryTransactionItem ── Product
        └── Supplier
```

---

## Running Locally

### With Docker Compose (recommended)

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/construction |
| Swagger UI | http://localhost:8080/construction/swagger-ui.html |

### Manual setup

**Prerequisites:** Java 21, Maven, MySQL 8 running on `localhost:3306`

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE construction_db;"

# 2. Start backend
cd backend
./mvnw spring-boot:run

# 3. Start frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Default credentials seeded on first startup:

| Username | Password | Role |
|---|---|---|
| `admin1` | `admin123` | ADMIN |
| `sale1` | `sale123` | SALE |
| `accountant1` | `accountant123` | ACCOUNTANT |

---

## API Documentation

Interactive docs (JWT auth supported) available via Swagger UI at `/construction/swagger-ui.html`.

Key endpoint groups:

| Prefix | Description |
|---|---|
| `POST /construction/auth/**` | Login, register, refresh token, logout |
| `/construction/orders/**` | Order CRUD & status transitions |
| `/construction/inventory/**` | Warehouse transactions & balance queries |
| `/construction/employees/**` | HR management |
| `/construction/salaries/**` | Payroll (ADMIN / ACCOUNTANT) |
| `/construction/dashboard/**` | Aggregated KPIs |

All responses follow a unified envelope:
```json
{
  "code": 200,
  "message": "Success",
  "result": { ... }
}
```

---

## Project Structure

```
construction-management/
├── backend/                   # Spring Boot application
│   └── src/main/java/
│       └── .../
│           ├── config/        # Security, OpenAPI, JWT config
│           ├── controller/    # REST controllers
│           ├── service/       # Business logic
│           ├── repository/    # Spring Data JPA
│           ├── entity/        # JPA entities
│           ├── dto/           # Request / Response DTOs
│           ├── mapper/        # MapStruct mappers
│           ├── enums/         # Domain enums
│           ├── exception/     # BusinessException + ErrorCode
│           └── security/      # JWT filter, UserDetailsService
├── frontend/                  # React + Vite application
│   └── src/
├── docker-compose.yaml
└── README.md
```

---

## Environment Variables (Production)

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | JDBC URL for MySQL |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` | Secret key for signing JWTs |
