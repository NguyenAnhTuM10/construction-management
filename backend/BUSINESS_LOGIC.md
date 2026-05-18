# Business Logic Documentation

Tài liệu này mô tả toàn bộ nghiệp vụ (business logic) của hệ thống quản lý xây dựng.
Dùng làm tài liệu tham chiếu khi thêm tính năng, fix bug, hoặc review code.

---

## Mục lục

1. [Domain Model Overview](#1-domain-model-overview)
2. [Module: Orders (Đơn hàng)](#2-module-orders)
3. [Module: Payment (Thanh toán)](#3-module-payment)
4. [Module: Inventory (Kho hàng)](#4-module-inventory)
5. [Module: HR & Payroll (Nhân sự & Lương)](#5-module-hr--payroll)
6. [Module: Task (Công việc)](#6-module-task)
7. [Module: Auth (Xác thực)](#7-module-auth)
8. [Module: Customer & Supplier](#8-module-customer--supplier)
9. [Module: Product & Category](#9-module-product--category)
10. [Module: Dashboard & Reporting](#10-module-dashboard--reporting)
11. [Error Code Reference](#11-error-code-reference)
12. [Cross-module Dependencies](#12-cross-module-dependencies)

---

## 1. Domain Model Overview

```
User ──────────────────── Employee ──── Department
 │                            │
 └── Role                     ├── Salary ── SalaryConfig
                              └── Task

Order ──── OrderItem ──── Product ──── Category
  │             │              │
  │             └── (snapshot price)  └── InventoryBalance ── Warehouse
  │
  ├── Payment ──── Customer
  └── Customer

InventoryTransaction ── InventoryTransactionItem ── Product
        │                                           └── Warehouse
        └── Supplier
```

**Nguyên tắc quan trọng:**
- `Product.stock` là giá trị cache — nguồn sự thật là `InventoryBalance`.
- `Order.paidAmount` và `Order.remainingDebt` là giá trị tính toán — nguồn sự thật là danh sách `Payment`.
- `Customer.debt` được cập nhật tự động khi tạo/xóa `Payment`.

---

## 2. Module: Orders

### 2.1 Entities

| Entity | Mô tả |
|---|---|
| `Order` | Đơn hàng, aggregate root của module |
| `OrderItem` | Dòng sản phẩm trong đơn, snapshot giá tại thời điểm tạo |
| `Payment` | Lần thanh toán cho đơn hàng |

### 2.2 Vòng đời đơn hàng (Order Status Machine)

```
PENDING ──→ CONFIRMED ──→ PROCESSING ──→ SHIPPING ──→ COMPLETED
    │              │
    └──────────────┴──→ CANCELLED
```

| Trạng thái | Ý nghĩa | Được phép chuyển sang |
|---|---|---|
| `PENDING` | Vừa tạo, chưa xác nhận | CONFIRMED, CANCELLED |
| `CONFIRMED` | Đã xác nhận | PROCESSING, CANCELLED |
| `PROCESSING` | Đang chuẩn bị hàng | SHIPPING |
| `SHIPPING` | Đang giao | COMPLETED |
| `COMPLETED` | Đã giao thành công | _(không thể đổi)_ |
| `CANCELLED` | Đã hủy | _(không thể đổi)_ |

**Ràng buộc hủy đơn:** Chỉ hủy được khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED`.

### 2.3 Payment Status (Trạng thái thanh toán)

| Trạng thái | Điều kiện |
|---|---|
| `UNPAID` | `paidAmount == 0` |
| `PARTIAL` | `0 < paidAmount < total` |
| `PAID` | `paidAmount >= total` |

### 2.4 Quy tắc nghiệp vụ

**Tạo đơn hàng:**
1. Kiểm tra tồn kho đủ cho từng sản phẩm (nếu không đủ → `INSUFFICIENT_STOCK`).
2. Trừ `Product.stock` cho từng `OrderItem`.
3. Tính `OrderItem.subtotal = quantity × price` (snapshot giá tại thời điểm tạo).
4. Khởi tạo `Order.remainingDebt = total`, `paidAmount = 0`, `paymentStatus = UNPAID`.
5. Trạng thái mặc định: `PENDING`.

**Cập nhật đơn hàng:**
- Chỉ được phép khi đơn đang ở `PENDING`.
- Hoàn trả tồn kho cũ → trừ tồn kho mới theo items đã cập nhật.

**Hủy đơn hàng:**
- Chỉ được phép từ `PENDING` hoặc `CONFIRMED`.
- Hoàn trả toàn bộ `Product.stock` cho tất cả items.

**Xóa đơn hàng:**
- Chỉ được phép khi đơn đang ở `CANCELLED`.

---

## 3. Module: Payment

### 3.1 Quy tắc nghiệp vụ

**Tạo thanh toán:**
1. Số tiền phải > 0.
2. Số tiền không được vượt quá `Order.remainingDebt`.
3. Cập nhật `Order.paidAmount += amount`.
4. Cập nhật `Order.remainingDebt = total - paidAmount`.
5. Cập nhật `Order.paymentStatus` theo logic trên.
6. Giảm `Customer.debt -= amount`.

**Xóa thanh toán:**
- Đảo ngược hoàn toàn: giảm `paidAmount`, tăng `remainingDebt`, cập nhật `paymentStatus`, tăng `Customer.debt`.

### 3.2 Payment Methods

`CASH` | `BANK_TRANSFER` | `CHEQUE`

---

## 4. Module: Inventory

### 4.1 Entities

| Entity | Mô tả |
|---|---|
| `InventoryTransaction` | Phiếu nhập/xuất kho |
| `InventoryTransactionItem` | Dòng sản phẩm trong phiếu |
| `InventoryBalance` | Số dư tồn kho theo (warehouse, product) |
| `InventoryAuditLog` | Log mọi thay đổi tồn kho |
| `Warehouse` | Kho chứa |

### 4.2 Loại giao dịch

| Type | Reason | Ý nghĩa |
|---|---|---|
| `IN` | `PURCHASE` | Nhập kho mua hàng |
| `IN` | `RETURN` | Nhập kho hàng trả lại |
| `IN` | `ADJUST` | Điều chỉnh tăng tồn kho |
| `OUT` | `SALE` | Xuất kho bán hàng |
| `OUT` | `RETURN` | Xuất kho trả nhà cung cấp |
| `OUT` | `ADJUST` | Điều chỉnh giảm tồn kho |

**Mã phiếu tự động:** `PN###` cho phiếu nhập (IN), `PX###` cho phiếu xuất (OUT).

### 4.3 Vòng đời phiếu kho (Transaction Status Machine)

```
PENDING ──→ COMPLETED
    └──→ CANCELLED
```

| Trạng thái | Ý nghĩa | Side effects |
|---|---|---|
| `PENDING` | Đang soạn thảo | Không ảnh hưởng tồn kho |
| `COMPLETED` | Đã duyệt | Cập nhật `InventoryBalance` và `Product.stock` |
| `CANCELLED` | Đã hủy | Không ảnh hưởng (chưa từng áp dụng) |

**Ràng buộc quan trọng:**
- `COMPLETED` → không thể hủy (`CANNOT_CANCEL_COMPLETED_TRANSACTION`).
- `CANCELLED` → không thể hoàn thành (`CANNOT_COMPLETE_CANCELLED_TRANSACTION`).
- Không thể xóa phiếu đã `COMPLETED`.

### 4.4 Cập nhật tồn kho khi hoàn thành phiếu

**Phiếu NHẬP (IN):**
```
InventoryBalance.quantity += itemQuantity

// Giá vốn trung bình (Weighted Average Cost):
oldValue   = averageCost × oldQuantity
newValue   = unitPrice × itemQuantity
averageCost = (oldValue + newValue) / (oldQuantity + itemQuantity)
```

**Phiếu XUẤT (OUT):**
```
// Kiểm tra trước:
if (InventoryBalance.quantity < itemQuantity) → INSUFFICIENT_STOCK

InventoryBalance.quantity -= itemQuantity
// averageCost không thay đổi khi xuất
```

Sau khi cập nhật `InventoryBalance`, hệ thống tự đồng bộ `Product.stock`:
```
Product.stock = SUM(InventoryBalance.quantity) WHERE product_id = product.id
```

### 4.5 Đồng bộ tồn kho (Stock Sync)

Vì `Product.stock` là cache của `InventoryBalance`:
- `syncProductStock(productId)` — đồng bộ một sản phẩm.
- `syncAllProductStocks()` — đồng bộ toàn bộ (dùng khi có dữ liệu không nhất quán).
- `checkStockDiscrepancies()` — báo cáo sản phẩm có tồn kho không khớp.

---

## 5. Module: HR & Payroll

### 5.1 Entities

| Entity | Mô tả |
|---|---|
| `Employee` | Nhân viên |
| `Department` | Phòng ban |
| `Salary` | Bảng lương tháng |
| `SalaryConfig` | Cấu hình lương (overtime rate, allowances...) |

### 5.2 Trạng thái nhân viên

- `active = true && endDate == null` → Đang làm việc (`isCurrentlyEmployed()`).
- `active = false` hoặc `endDate != null` → Đã nghỉ việc.

### 5.3 Công thức tính lương

```
dailyRate        = baseSalary / standardWorkDays
actualBaseSalary = dailyRate × actualWorkDays

hourlyRate       = baseSalary / standardWorkDays / 8
overtimePay      = hourlyRate × overtimeRate(1.5) × overtimeHours

totalSalary      = actualBaseSalary + bonus + allowance + overtimePay - deductions
```

Tất cả giá trị `null` được coi là `BigDecimal.ZERO` (null-safe).

### 5.4 Quy tắc nghiệp vụ lương

**Tạo bảng lương:**
1. Kiểm tra nhân viên tồn tại.
2. Kiểm tra chưa có bảng lương cho cùng `(employee, month, year)` → `SALARY_ALREADY_EXISTS`.
3. Tự động tính `overtimePay` và `totalSalary`.
4. Khởi tạo `isPaid = false`, `paidDate = null`.

**Cập nhật bảng lương:**
- Chỉ được phép khi `isPaid = false` (nếu đã thanh toán → `SALARY_ALREADY_PAID`).
- Tự động tính lại `overtimePay` và `totalSalary`.

**Đánh dấu đã trả lương:**
- Đặt `isPaid = true`, `paidDate = LocalDate.now()`.

**Xóa bảng lương:**
- Chỉ được phép khi `isPaid = false`.

### 5.5 Salary Status (Enum — định nghĩa nhưng chưa implement đầy đủ)

`DRAFT` → `PENDING` → `APPROVED` → `PAID`

### 5.6 Quản lý nhân viên

- Xóa nhân viên: Tự động hủy liên kết `User.employee = null` (không cascade xóa User).
- `getEmployeesWithoutAccount()` — tìm nhân viên chưa có tài khoản, dùng khi đăng ký User mới.

---

## 6. Module: Task

### 6.1 Vòng đời công việc (Task Status Machine)

```
TODO ──→ IN_PROGRESS ──→ REVIEW ──→ COMPLETED
  │           │              │
  └───────────┴──────────────┴──→ CANCELLED
```

| Trạng thái | Ý nghĩa |
|---|---|
| `TODO` | Đã giao, chưa bắt đầu |
| `IN_PROGRESS` | Đang thực hiện |
| `REVIEW` | Đã nộp kết quả, chờ duyệt |
| `COMPLETED` | Đã hoàn thành (auto-set `completedDate`) |
| `CANCELLED` | Đã hủy (từ bất kỳ trạng thái nào) |

### 6.2 Quy tắc nghiệp vụ

- **Bắt đầu task:** Chỉ nhân viên được giao (`assignedTo`) mới được chuyển `TODO → IN_PROGRESS`.
- **Nộp kết quả:** Chỉ admin hoặc nhân viên được giao mới được submit.
- **Progress:** Giá trị 0–100. Khi status chuyển sang `COMPLETED`, tự động đặt `progress = 100`.
- **completedDate:** Tự động set `LocalDateTime.now()` khi status = `COMPLETED`.

### 6.3 Task Priority

`LOW` | `MEDIUM` | `HIGH` | `URGENT`

### 6.4 Queries tiện ích

- `getOverdueTasks()` — `deadline < now()`
- `getUpcomingTasks()` — `deadline` trong vòng 3 ngày tới

---

## 7. Module: Auth

### 7.1 Cơ chế xác thực

**Stateless JWT** với 2 loại token:
- **Access Token** — ngắn hạn, dùng cho mọi request.
- **Refresh Token** — 7 ngày, lưu trong DB, dùng để lấy access token mới.

### 7.2 Luồng đăng nhập

```
1. Xác thực username/password qua Spring AuthenticationManager
2. Generate JWT access token + refresh token
3. Lưu refresh token vào DB (thay thế token cũ nếu có — 1 token/user)
4. Trả về cả 2 token + thông tin user
```

### 7.3 Luồng làm mới token (Refresh)

```
1. Validate cú pháp và loại token (phải là refresh token)
2. Kiểm tra token tồn tại trong DB
3. Kiểm tra chưa bị revoke và chưa hết hạn
4. Revoke token cũ (revoked = true)
5. Generate cặp token mới, lưu refresh token mới vào DB
```

### 7.4 Đăng ký tài khoản

```
1. Kiểm tra username chưa tồn tại                         → USER_EXISTED
2. Nếu có employeeId: kiểm tra nhân viên chưa có tài khoản → EMPLOYEE_ALREADY_HAS_ACCOUNT
3. Mã hóa password (BCrypt)
4. Lưu User với role được chỉ định (mặc định: USER)
5. Đồng bộ 2 chiều: user.employee = employee, employee.user = user
```

### 7.5 Đăng xuất

- Revoke refresh token trong DB (`revoked = true`).
- Xóa SecurityContext.

### 7.6 Phân quyền (Roles)

| Role | Quyền chính |
|---|---|
| `ADMIN` | Toàn quyền: xem/tạo/sửa/xóa, giao task, duyệt lương |
| `SALE` | Quản lý đơn hàng, khách hàng |
| `ACCOUNTANT` | Quản lý thanh toán, lương, báo cáo tài chính |
| `USER` | Xem task được giao, submit kết quả |

**Ràng buộc đặc biệt:**
- Không thể xóa tài khoản Admin (`CANNOT_DELETE_ADMIN`).
- Không thể khóa tài khoản Admin (`CANNOT_LOCK_ADMIN`).

---

## 8. Module: Customer & Supplier

### 8.1 Customer (Khách hàng)

- `email` và `phone` là unique.
- `Customer.debt` được cập nhật tự động:
  - Tăng khi tạo đơn hàng mới (hoặc khi payment bị xóa).
  - Giảm khi tạo payment cho đơn của customer đó.

### 8.2 Supplier (Nhà cung cấp)

- `code` là unique.
- Liên kết với `InventoryTransaction` (nhập hàng từ nhà cung cấp).
- Không có logic nghiệp vụ phức tạp — lookup entity.

---

## 9. Module: Product & Category

### 9.1 Quy tắc Product

- `code` là unique.
- `stock` **không thể cập nhật trực tiếp** qua Product API — chỉ thay đổi qua `InventoryTransaction`.
- Không thể xóa sản phẩm còn tồn kho (`stock > 0` → `CANNOT_DELETE_PRODUCT_WITH_STOCK`).
- `buyPrice` / `sellPrice`: Giá mua / giá bán. Giá trong `OrderItem` là snapshot tại thời điểm đặt hàng.

### 9.2 Quy tắc Category

- `name` là unique.

---

## 10. Module: Dashboard & Reporting

| Nhóm | Chỉ số |
|---|---|
| Đơn hàng | Tổng, đang xử lý (PENDING), hoàn thành, đã hủy |
| Doanh thu | Tổng (tất cả đơn COMPLETED), doanh thu tháng hiện tại |
| Khách hàng | Tổng số, tổng công nợ |
| Tồn kho | Số sản phẩm, sắp hết hàng (<10), hết hàng (=0) |
| Nhân sự | Tổng nhân viên |
| Công việc | Đang hoạt động (TODO + IN_PROGRESS), quá hạn, hoàn thành |
| Lương | Tổng lương chưa thanh toán, số bảng lương chưa trả |

---

## 11. Error Code Reference

| Code | Tên | HTTP | Mô tả |
|---|---|---|---|
| 1001 | USER_NOT_FOUND | 404 | Không tìm thấy user |
| 1003 | ROLE_NOT_FOUND | 404 | Không tìm thấy role |
| 1005 | EMPLOYEE_NOT_FOUND | 404 | Không tìm thấy nhân viên |
| 1006 | SUPPLIER_NOT_FOUND | 404 | Không tìm thấy nhà cung cấp |
| 1007 | CATEGORY_NOT_FOUND | 404 | Không tìm thấy danh mục |
| 1008 | PRODUCT_NOT_FOUND | 404 | Không tìm thấy sản phẩm |
| 1009 | ORDER_NOT_FOUND | 404 | Không tìm thấy đơn hàng |
| 1010 | CUSTOMER_NOT_FOUND | 404 | Không tìm thấy khách hàng |
| 1011 | WAREHOUSE_NOT_EXISTED | 404 | Không tìm thấy kho |
| 1012 | BALANCE_NOT_EXISTED | 404 | Không có tồn kho trong kho này |
| 1013 | TRANSACTION_NOT_FOUND | 404 | Không tìm thấy phiếu kho |
| 1014 | TASK_NOT_EXITS | 404 | Không tìm thấy công việc |
| 2001 | USER_EXISTED | 400 | Username đã tồn tại |
| 2004 | EMPLOYEE_ALREADY_HAS_ACCOUNT | 400 | Nhân viên đã có tài khoản |
| 2005 | CUSTOMER_EMAIL_EXISTS | 400 | Email khách hàng đã tồn tại |
| 2006 | CUSTOMER_PHONE_EXISTS | 400 | Số điện thoại đã tồn tại |
| 3001 | USER_UNAUTHENTICATED | 401 | Chưa đăng nhập |
| 3002 | USER_UNAUTHORIZE | 403 | Không có quyền |
| 3003 | WRONG_PASSWORD | 400 | Sai mật khẩu hiện tại |
| 3004 | NOT_MATHES_PASSWORD | 400 | Mật khẩu mới không khớp |
| 3005 | INVALID_CREDENTIALS | 401 | Sai thông tin đăng nhập |
| 4001 | CANNOT_DELETE_ADMIN | 400 | Không thể xóa admin |
| 4002 | CANNOT_LOCK_ADMIN | 400 | Không thể khóa admin |
| 5003 | INSUFFICIENT_STOCK | 400 | Không đủ hàng trong kho |
| 5004 | INVALID_ORDER_STATUS | 400 | Trạng thái đơn không hợp lệ |
| 5005 | ORDER_CANNOT_BE_MODIFIED | 400 | Đơn hàng không thể sửa |
| 7002 | TRANSACTION_ALREADY_COMPLETED | 400 | Phiếu đã hoàn thành |
| 7003 | TRANSACTION_ALREADY_CANCELLED | 400 | Phiếu đã hủy |
| 7004 | CANNOT_COMPLETE_CANCELLED_TRANSACTION | 400 | Không thể hoàn thành phiếu đã hủy |
| 7005 | CANNOT_CANCEL_COMPLETED_TRANSACTION | 400 | Không thể hủy phiếu đã hoàn thành |
| 7006 | CANNOT_DELETE_COMPLETED_TRANSACTION | 400 | Không thể xóa phiếu đã hoàn thành |
| 8004 | NEGATIVE_STOCK_NOT_ALLOWED | 400 | Không cho phép tồn kho âm |

> **Lưu ý:** Một số `ErrorCode` dùng chung numeric code — đây là technical debt đã biết, không thêm duplicate mới.

---

## 12. Cross-module Dependencies

```
Tạo Order
  └─→ [Inventory] Trừ Product.stock cho từng OrderItem
  └─→ [Customer] Ghi nhận customer trên đơn

Hủy Order
  └─→ [Inventory] Hoàn trả Product.stock

Tạo Payment
  └─→ [Order] Cập nhật paidAmount, remainingDebt, paymentStatus
  └─→ [Customer] Giảm Customer.debt

Xóa Payment
  └─→ [Order] Đảo ngược paidAmount, remainingDebt, paymentStatus
  └─→ [Customer] Tăng Customer.debt

Hoàn thành InventoryTransaction (→ COMPLETED)
  └─→ [Inventory] Cập nhật InventoryBalance (quantity + averageCost)
  └─→ [Product] Đồng bộ Product.stock

Đăng ký User với employeeId
  └─→ [Employee] Thiết lập liên kết 2 chiều User ↔ Employee

Xóa Employee
  └─→ [User] Hủy liên kết User.employee = null (không xóa User)

Task → COMPLETED
  └─→ Auto-set completedDate = now(), progress = 100
```
