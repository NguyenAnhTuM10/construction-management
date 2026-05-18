# CV Refactor Plan — Construction Management System

> Mục tiêu: nâng project đồ án lên mức đủ mạnh để ghi vào CV intern/fresher Java Backend.

---

## Hiện trạng project

| Thông số | Giá trị |
|----------|---------|
| Java | 21 (preview features) |
| Spring Boot | 3.5.7 |
| Database | MySQL 8 |
| Tổng số class | 183 |
| Entities | 20 |
| REST Controllers | 19 |
| API Endpoints | 100+ |
| Custom @Query | 31 |
| DTOs | 68 |
| MapStruct Mappers | 13 |

---

## Những gì đã tốt (giữ nguyên, hiểu để trả lời PV)

- [x] **JWT Auth** — stateless, access token 24h + refresh token 7 ngày, HMAC-SHA256
- [x] **RBAC** — 4 roles (ADMIN/SALE/ACCOUNTANT/USER), Spring Security 6 + `@PreAuthorize`
- [x] **JPA Auditing** — `@EnableJpaAuditing`, `@CreatedDate`, `@LastModifiedDate` trên 9 entities
- [x] **BigDecimal** — dùng đúng cho toàn bộ dữ liệu tài chính (`precision=15, scale=2`)
- [x] **@Transactional** — tách biệt `readOnly=true` cho read / write operations
- [x] **JPA Lifecycle Callbacks** — `@PrePersist/@PreUpdate` tự tính subtotal, remainingDebt
- [x] **Composite Unique Constraints** — Salary(`employee_id, month, year`), InventoryBalance(`warehouse_id, product_id`)
- [x] **FetchType.LAZY** — đúng chỗ trên các quan hệ ManyToOne
- [x] **Global Exception Handler** — `@ControllerAdvice` + `ErrorCode` enum 45+ loại lỗi
- [x] **OpenAPI / Swagger UI** — tài liệu API đầy đủ
- [x] **State machine** — Inventory transaction PENDING → COMPLETED → CANCELLED
- [x] **Business logic phức tạp** — kho, đơn hàng, thanh toán một phần, tính lương

---

## Những gì cần bổ sung (refactor list)

### Ưu tiên cao — Hay bị hỏi phỏng vấn fresher

- [ ] **Pagination** — thêm `Pageable` vào các endpoint trả List lớn
  - Target: `GET /orders`, `GET /products`, `GET /customers`, `GET /employees`
  - Cách làm: repository extends `JpaRepository` → thêm `findAll(Pageable)`, controller nhận `@RequestParam int page, int size`
  - Ghi CV: *"Implemented pagination with Spring Data Pageable for large dataset endpoints"*

- [ ] **Database Indexing** — thêm `@Index` vào các cột hay query
  - Target:
    - `orders.status`, `orders.customer_id`, `orders.created_date`
    - `inventory_transactions.warehouse_id`, `inventory_transactions.status`
    - `products.category_id`
    - `employees.department_id`
  - Ghi CV: *"Added database indexes on high-frequency query columns to optimize read performance"*

- [ ] **Input Validation** — thêm `@Valid` + annotation validation vào Request DTOs
  - Target: `OrderCreateRequest`, `PaymentRequest`, `RegisterRequest`, `EmployeeCreateRequest`
  - Dùng: `@NotNull`, `@NotBlank`, `@Min`, `@Max`, `@Email`, `@Size`
  - Ghi CV: *"Applied Jakarta Bean Validation on all request DTOs with global error handling"*

---

### Ưu tiên trung bình — Tạo ấn tượng thêm

- [ ] **N+1 Query Fix** — thêm JOIN FETCH vào các query có LAZY loading
  - Hiện tại: có `FetchType.LAZY` nhưng không có JOIN FETCH → tiềm ẩn N+1
  - Target: OrderRepository (Order + OrderItems + Customer), InventoryTransactionRepository
  - Ghi CV: *"Resolved N+1 query problems using JOIN FETCH in JPQL queries"*

- [ ] **Soft Delete** — thêm `isDeleted` / `deletedAt` thay vì xóa cứng
  - Target: `Customer`, `Product`, `Employee`
  - Dùng: `@SQLRestriction("is_deleted = false")` (Spring Boot 3+), set flag thay vì `deleteById`
  - Ghi CV: *"Implemented soft delete to preserve historical data integrity"*

- [ ] **Custom Validator** — tạo ít nhất 1 custom constraint annotation
  - Ví dụ: `@ValidOrderStatus`, `@FutureDate` cho dueDate của Task
  - Ghi CV: *"Created custom Bean Validation constraint for business rule enforcement"*

---

### Ưu tiên thấp — Nice to have nếu có thời gian

- [ ] **Caching** — `@Cacheable` với Spring Cache (in-memory Caffeine, không cần Redis)
  - Target: `GET /categories`, `GET /products` (ít thay đổi, hay được gọi)
  - Ghi CV: *"Added application-level caching with Spring Cache + Caffeine for read-heavy endpoints"*

- [ ] **@Async** — xử lý bất đồng bộ cho tác vụ nặng
  - Target: gửi thông báo khi lương được duyệt, sync inventory
  - Ghi CV: *"Used @Async for non-blocking background processing"*

- [ ] **Unit Tests** — viết test cho ít nhất 2-3 service
  - Target: `OrderService`, `InventoryTransactionService`, `AuthService`
  - Dùng: JUnit 5 + Mockito
  - Ghi CV: *"Wrote unit tests with JUnit 5 and Mockito for core business services"*

---

## CV bullet points mẫu (cập nhật sau khi hoàn thành refactor)

```
Construction Management System  |  Java 21, Spring Boot 3.5.7, MySQL  |  [GitHub]
Personal Project / Academic

• Built a RESTful backend (100+ endpoints) managing inventory, orders, payroll, and
  reporting for a construction material company.
• Implemented stateless JWT authentication (access/refresh token) with role-based
  access control (4 roles) using Spring Security 6.
• Applied Spring Data JPA best practices: FetchType.LAZY, JOIN FETCH to prevent N+1
  queries, @Transactional with readOnly optimization, and database indexes.
• Designed dual-layer inventory tracking with real-time stock balance and full audit
  trail using a state-machine transaction model (PENDING → COMPLETED → CANCELLED).
• Used BigDecimal for all financial data, JPA Auditing for entity lifecycle tracking,
  and @PrePersist/@PreUpdate for automatic field computation.
• Added pagination on high-traffic endpoints and Bean Validation on all request DTOs
  with centralized error handling (45+ error codes).
```

---

## Những câu phỏng vấn hay gặp — cần chuẩn bị

| Câu hỏi | Trả lời tóm tắt |
|---------|----------------|
| JWT hoạt động thế nào? | Client gửi POST /auth/login → server trả access token (24h) + refresh token (7 ngày). Mỗi request sau đó gửi Bearer token trong header. Filter validate chữ ký HMAC-SHA256. |
| Tại sao cần refresh token? | Access token ngắn hạn (bảo mật), refresh token dài hạn để lấy access token mới mà không cần login lại. Logout thì xóa refresh token khỏi DB. |
| @Transactional readOnly làm gì? | Hibernate tắt dirty checking, không flush snapshot → tiết kiệm memory và CPU cho các query chỉ đọc. |
| FetchType.LAZY vs EAGER? | LAZY: chỉ load khi truy cập field → tránh load dữ liệu thừa. EAGER: load ngay cùng entity → dễ bị N+1 nếu không dùng JOIN FETCH. |
| N+1 query là gì? | Query 1 lần lấy N order, sau đó N lần nữa mỗi lần lấy customer của từng order → N+1 query. Fix bằng JOIN FETCH. |
| BigDecimal thay vì double vì sao? | double/float không biểu diễn chính xác số thập phân (0.1 + 0.2 ≠ 0.3 trong IEEE 754). Tiền tệ cần chính xác tuyệt đối → BigDecimal. |
| Giải thích flow tạo đơn hàng? | POST /orders → validate request → tạo Order + OrderItems → tính total → set status PENDING → lưu DB. Khi confirm → cập nhật inventory balance. |
| Inventory balance cập nhật thế nào? | Khi InventoryTransaction COMPLETED → gọi InventoryBalanceService update số lượng + average cost theo warehouse/product. Tất cả trong 1 @Transactional. |