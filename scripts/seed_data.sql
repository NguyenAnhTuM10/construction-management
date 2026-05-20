-- ============================================================
--  SEED DATA - Construction Management System
--  Mô tả: Dữ liệu mẫu đúng nghiệp vụ công ty vật liệu xây dựng
--  Tất cả password: "123456" (BCrypt 10 rounds)
--  Chạy SAU KHI Spring Boot đã khởi động (ddl-auto:update tạo schema)
--  MySQL 8.x — construction_db
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES 'utf8mb4';

-- Tạo bảng forecast_predictions nếu chưa có (tránh lỗi khi chạy trước Spring Boot)
CREATE TABLE IF NOT EXISTS forecast_predictions (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    product_id              BIGINT          NOT NULL,
    forecast_date           DATE            NOT NULL,
    predicted_demand7days INT,
    avg_daily_demand        DOUBLE,
    current_stock           INT,
    safety_stock            INT,
    reorder_point           INT,
    recommended_reorder_qty INT,
    eoq                     INT,
    stockout_risk           VARCHAR(20),
    confidence_score        DOUBLE,
    days_until_stockout     INT,
    model_used              VARCHAR(50),
    daily_forecast_json     TEXT,
    created_at              DATETIME        NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_forecast_product_date (product_id, forecast_date),
    INDEX idx_forecast_date (forecast_date),
    CONSTRAINT fk_forecast_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Xóa dữ liệu cũ theo thứ tự ngược dependency
TRUNCATE TABLE forecast_predictions;
TRUNCATE TABLE inventory_audit_logs;
TRUNCATE TABLE inventory_transaction_items;
TRUNCATE TABLE inventory_transactions;
TRUNCATE TABLE inventory_balances;
TRUNCATE TABLE tasks;
TRUNCATE TABLE salary_configs;
TRUNCATE TABLE salaries;
TRUNCATE TABLE payments;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;
TRUNCATE TABLE employees;
TRUNCATE TABLE products;
TRUNCATE TABLE customers;
TRUNCATE TABLE warehouses;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE categories;
TRUNCATE TABLE departments;
TRUNCATE TABLE roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO roles (id, name) VALUES
(1, 'ADMIN'),
(2, 'SALE'),
(3, 'ACCOUNTANT'),
(4, 'USER');

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, name) VALUES
(1, 'Kinh Doanh'),
(2, 'Kho Vận'),
(3, 'Kế Toán'),
(4, 'Nhân Sự & Hành Chính'),
(5, 'Kỹ Thuật');

-- ============================================================
-- 3. CATEGORIES (vật liệu xây dựng)
-- ============================================================
INSERT INTO categories (id, name) VALUES
(1, 'Vật Liệu Kết Cấu'),
(2, 'Vật Liệu Hoàn Thiện'),
(3, 'Thiết Bị & Điện'),
(4, 'Ống & Phụ Kiện Nước'),
(5, 'Dụng Cụ Thi Công');

-- ============================================================
-- 4. SUPPLIERS
-- ============================================================
INSERT INTO suppliers (id, code, name, phone, address, email, note) VALUES
(1, 'NCC001', 'Công ty TNHH Xi Măng Hoàng Long',      '0283456789', '123 Điện Biên Phủ, Q3, TP.HCM',      'sales@hoanglong.vn',   'Xi măng, cát, đá, gạch'),
(2, 'NCC002', 'Công ty CP Thép Việt Nam',              '0241234567', '45 Trường Chinh, Hà Nội',             'info@thepviet.vn',     'Thép xây dựng các loại'),
(3, 'NCC003', 'Công ty TNHH Sơn & Vật Liệu Delta',    '0287654321', '78 Nguyễn Văn Linh, Q7, TP.HCM',     'order@sondelta.vn',   'Sơn Dulux, Jotun, bột trét'),
(4, 'NCC004', 'Cơ Sở Vật Liệu Minh Khang',            '0913456789', '220 Tô Hiến Thành, Q10, TP.HCM',     'minhkhang@gmail.com', 'Ống nhựa, phụ kiện nước'),
(5, 'NCC005', 'Công ty CP Thiết Bị Điện Phương Nam',  '0289012345', '15 Lý Thường Kiệt, Q11, TP.HCM',     'sales@phuongnam.vn',  'Dây điện, thiết bị điện Cadivi');

-- ============================================================
-- 5. EMPLOYEES (10 nhân viên)
-- ============================================================
INSERT INTO employees
    (id, name, gender, birth_date, phone, email, id_card, address,
     department_id, base_salary, start_date, active, created_date, updated_date)
VALUES
(1,  'Nguyễn Văn An',     'MALE',   '1980-03-15', '0901234567', 'an.nguyen@construction.vn',     '079080012345', '12 Lê Lợi, Q1, TP.HCM',                  4, 30000000, '2018-01-02', 1, '2018-01-02 08:00:00', '2025-01-01 00:00:00'),
(2,  'Trần Thị Bích',     'FEMALE', '1985-07-22', '0912345678', 'bich.tran@construction.vn',     '079085023456', '34 Nguyễn Trãi, Q5, TP.HCM',             3, 18000000, '2018-03-01', 1, '2018-03-01 08:00:00', '2025-01-01 00:00:00'),
(3,  'Lê Văn Cường',      'MALE',   '1982-11-10', '0923456789', 'cuong.le@construction.vn',      '079082034567', '56 Hai Bà Trưng, Q3, TP.HCM',            1, 20000000, '2018-06-01', 1, '2018-06-01 08:00:00', '2025-01-01 00:00:00'),
(4,  'Phạm Thị Dung',     'FEMALE', '1992-04-18', '0934567890', 'dung.pham@construction.vn',     '079092045678', '78 Phan Xích Long, Q10, TP.HCM',          1, 12000000, '2020-02-10', 1, '2020-02-10 08:00:00', '2025-01-01 00:00:00'),
(5,  'Hoàng Văn Em',      'MALE',   '1994-08-25', '0945678901', 'em.hoang@construction.vn',      '079094056789', '90 Cộng Hòa, Tân Bình, TP.HCM',          1, 11000000, '2020-06-15', 1, '2020-06-15 08:00:00', '2025-01-01 00:00:00'),
(6,  'Nguyễn Thị Phương', 'FEMALE', '1988-12-05', '0956789012', 'phuong.nguyen@construction.vn', '079088067890', '15 Đinh Tiên Hoàng, Q1, TP.HCM',         2, 13000000, '2019-04-01', 1, '2019-04-01 08:00:00', '2025-01-01 00:00:00'),
(7,  'Trần Văn Giang',    'MALE',   '1996-02-14', '0967890123', 'giang.tran@construction.vn',    '079096078901', '23 Trần Hưng Đạo, Q1, TP.HCM',           2, 10000000, '2021-03-01', 1, '2021-03-01 08:00:00', '2025-01-01 00:00:00'),
(8,  'Lê Thị Hoa',        'FEMALE', '1990-09-30', '0978901234', 'hoa.le@construction.vn',        '079090089012', '67 Bà Huyện Thanh Quan, Q3, TP.HCM',     3, 12000000, '2019-08-01', 1, '2019-08-01 08:00:00', '2025-01-01 00:00:00'),
(9,  'Phan Văn Khải',     'MALE',   '1991-06-20', '0989012345', 'khai.phan@construction.vn',     '079091090123', '45 Lý Tự Trọng, Q1, TP.HCM',             5, 15000000, '2019-11-01', 1, '2019-11-01 08:00:00', '2025-01-01 00:00:00'),
(10, 'Đỗ Thị Lan',        'FEMALE', '1993-01-07', '0990123456', 'lan.do@construction.vn',        '079093001234', '89 Nguyễn Đình Chiểu, Q3, TP.HCM',       4, 11000000, '2020-09-01', 1, '2020-09-01 08:00:00', '2025-01-01 00:00:00');

-- ============================================================
-- 6. USERS
-- Mật khẩu "123456" — BCrypt(10):
--   $2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba
-- Nếu login thất bại, chạy đoạn Java:
--   System.out.println(new BCryptPasswordEncoder().encode("123456"));
-- rồi UPDATE users SET password = '<hash mới>';
-- ============================================================
INSERT INTO users (id, username, email, password, employee_id, role_id) VALUES
(1,  'admin',          'an.nguyen@construction.vn',     '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 1,  1),
(2,  'bich.tran',      'bich.tran@construction.vn',     '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 2,  3),
(3,  'cuong.le',       'cuong.le@construction.vn',      '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 3,  2),
(4,  'dung.pham',      'dung.pham@construction.vn',     '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 4,  2),
(5,  'em.hoang',       'em.hoang@construction.vn',      '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 5,  2),
(6,  'phuong.nguyen',  'phuong.nguyen@construction.vn', '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 6,  4),
(7,  'giang.tran',     'giang.tran@construction.vn',    '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 7,  4),
(8,  'hoa.le',         'hoa.le@construction.vn',        '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 8,  3),
(9,  'khai.phan',      'khai.phan@construction.vn',     '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 9,  4),
(10, 'lan.do',         'lan.do@construction.vn',        '$2b$10$j7I5HulkiaVla0PjKD35Ce75I3HutVJi22Ej.DIO9I6MNtIu13Hba', 10, 4);

-- ============================================================
-- 7. PRODUCTS (20 SKU vật liệu xây dựng)
-- ============================================================
INSERT INTO products (id, code, name, category_id, unit, buy_price, sell_price, stock) VALUES
-- Vật liệu kết cấu
(1,  'XM001', 'Xi Măng Hà Tiên PCB40 50kg',            1, 'Bao',    95000,   110000,   500),
(2,  'CT001', 'Cát Xây Dựng (Cát Vàng)',               1, 'Khối',  350000,   420000,   200),
(3,  'DA001', 'Đá Dăm 1x2',                            1, 'Khối',  380000,   450000,   180),
(4,  'GH001', 'Gạch Tuynel 4 Lỗ 80x80x190',           1, 'Viên',    1800,     2200, 10000),
(5,  'ST001', 'Thép Tròn Trơn Φ10 CB240T',             1, 'Kg',     18000,    21000,  3000),
(6,  'ST002', 'Thép Vằn Φ12 CB300V',                  1, 'Kg',     19000,    22500,  2500),
(7,  'TC001', 'Tôn Lạnh Mạ Kẽm 0.3mm',                1, 'Tấm',    95000,   120000,   200),
-- Vật liệu hoàn thiện
(8,  'SN001', 'Sơn Dulux WeatherShield 18L Trắng',     2, 'Lon',   850000,  1050000,    80),
(9,  'SN002', 'Sơn Jotun Majestic 5L',                 2, 'Lon',   450000,   580000,   120),
(10, 'BT001', 'Bột Trét Tường Việt Mỹ 25kg',          2, 'Bao',   120000,   155000,   300),
(11, 'GM001', 'Gạch Men Ceramic 60x60 (hộp 4 viên)',   2, 'Hộp',  220000,   285000,   400),
-- Thiết bị & điện
(12, 'DY001', 'Dây Điện Đơn Cadivi 1.5mm',             3, 'Mét',    8500,    10500,  2000),
(13, 'DY002', 'Dây Điện Đơn Cadivi 2.5mm',             3, 'Mét',   12000,    14500,  1500),
(14, 'CB001', 'CB MCB LS BKN 20A 2P',                  3, 'Cái',   85000,   115000,   300),
(15, 'OC001', 'Ổ Cắm Điện Âm Tường Simon',             3, 'Cái',   45000,    65000,   500),
-- Ống & phụ kiện nước
(16, 'ON001', 'Ống Nhựa PVC Tiền Phong D21 3m',        4, 'Ống',   22000,    30000,   800),
(17, 'ON002', 'Ống Nhựa PVC Tiền Phong D34 3m',        4, 'Ống',   38000,    50000,   600),
(18, 'KN001', 'Khớp Nối Thẳng PVC D21',                4, 'Cái',    3500,     5000,  2000),
(19, 'VK001', 'Van Khóa Cầu Inox D21',                 4, 'Cái',   45000,    68000,   400),
-- Dụng cụ thi công
(20, 'DC001', 'Xẻng Thi Công Cán Gỗ',                  5, 'Cái',   45000,    68000,   150);

-- ============================================================
-- 8. CUSTOMERS
-- ============================================================
INSERT INTO customers (id, name, phone, email, address, debt) VALUES
(1,  'Công ty Xây Dựng Minh Hưng',               '0283456789', 'contact@minhhung.vn',       '123 Lê Hồng Phong, Q5, TP.HCM',                    0.00),
(2,  'Nhà Thầu Xây Dựng Phước Long',             '0287654321', 'phuoclong.xd@gmail.com',    '45 Đinh Tiên Hoàng, Q1, TP.HCM',                5500000.00),
(3,  'Công ty CP Đầu Tư Xây Dựng Nam Việt',     '0281234567', 'namviet@namviet.vn',         '78 Nguyễn Đình Chiểu, Q3, TP.HCM',                 0.00),
(4,  'HTX Xây Dựng Thống Nhất',                  '0289012345', 'thongnhat.htx@gmail.com',   '90 Lý Thường Kiệt, Q10, TP.HCM',               12000000.00),
(5,  'Ông Nguyễn Minh Tuấn',                     '0901234567', 'tuan.nm@gmail.com',          '15 Phan Xích Long, Q. Bình Thạnh, TP.HCM',         0.00),
(6,  'Công ty TNHH Thi Công Việt Thắng',         '0902345678', 'viethang@viethang.vn',       '32 Cộng Hòa, Tân Bình, TP.HCM',                   0.00),
(7,  'Ban QLDA Chung Cư An Phú',                 '0903456789', 'bqlda.anphu@gmail.com',     '67 Đinh Bộ Lĩnh, Q. Bình Thạnh, TP.HCM',       8800000.00),
(8,  'Công ty Xây Dựng Hoàng Gia',               '0904567890', 'hoanggia.xd@gmail.com',     '100 Trường Chinh, Q12, TP.HCM',                    0.00),
(9,  'Nhà Thầu Cơ Điện Lạnh Tân Bình',          '0905678901', 'dienlanhtan.binh@gmail.com','22 Âu Cơ, Tân Phú, TP.HCM',                    3200000.00),
(10, 'Công ty TNHH Nội Thất & Hoàn Thiện ABC',  '0906789012', 'abc.noithat@gmail.com',      '55 Quang Trung, Q. Gò Vấp, TP.HCM',               0.00);

-- ============================================================
-- 9. WAREHOUSES
-- ============================================================
INSERT INTO warehouses (id, code, name, address, active) VALUES
(1, 'KHO001', 'Kho Chính Quận 1', '123 Đinh Tiên Hoàng, Phường 3, Q1, TP.HCM', 1),
(2, 'KHO002', 'Kho Phụ Quận 7',   '45 Nguyễn Hữu Thọ, Phường Tân Hưng, Q7, TP.HCM', 1);

-- ============================================================
-- 10. SALARY CONFIG (1 bộ cấu hình hoạt động)
-- ============================================================
INSERT INTO salary_configs
    (id, kpi_bonus_percent, sales_commission_percent, overtime_rate,
     meal_allowance, transport_allowance, phone_allowance,
     insurance_percent, late_penalty_per_time, tax_deduction, tax_rate,
     is_active, note, created_date, last_modified_date, updated_by)
VALUES
(1, 10.0, 1.0, 1.5,
   1000000, 500000, 300000,
   10.5, 100000, 11000000, 10.0,
   1, 'Cấu hình lương năm 2025', '2025-01-01 08:00:00', '2025-01-01 08:00:00', 1);

-- ============================================================
-- 11. ORDERS (15 đơn hàng — 3 tháng gần nhất)
-- ============================================================
INSERT INTO orders
    (id, customer_id, employee_id, total, status, created_date,
     paid_amount, remaining_debt, payment_status)
VALUES
-- Tháng 1/2025
(1,  1, 4,  12650000, 'COMPLETED', '2025-01-05 09:30:00',  12650000,        0, 'PAID'),
(2,  2, 5,   8800000, 'COMPLETED', '2025-01-12 10:15:00',   3300000,  5500000, 'PARTIAL'),
(3,  3, 4,  15400000, 'COMPLETED', '2025-01-20 14:00:00',  15400000,        0, 'PAID'),
-- Tháng 2/2025
(4,  4, 3,  22000000, 'COMPLETED', '2025-02-03 09:00:00',  10000000, 12000000, 'PARTIAL'),
(5,  5, 4,   5500000, 'COMPLETED', '2025-02-15 11:30:00',   5500000,        0, 'PAID'),
(6,  6, 5,   9900000, 'COMPLETED', '2025-02-22 15:00:00',   9900000,        0, 'PAID'),
-- Tháng 3/2025
(7,  7, 3,  18700000, 'CONFIRMED', '2025-03-01 08:30:00',   9900000,  8800000, 'PARTIAL'),
(8,  8, 4,  11000000, 'COMPLETED', '2025-03-08 10:00:00',  11000000,        0, 'PAID'),
(9,  9, 5,   7150000, 'COMPLETED', '2025-03-15 13:45:00',   3950000,  3200000, 'PARTIAL'),
(10, 10, 3, 33000000, 'CONFIRMED', '2025-03-20 09:15:00',  33000000,        0, 'PAID'),
-- Tháng 4/2025
(11,  1, 4, 44000000, 'PROCESSING','2025-04-02 10:30:00',  22000000, 22000000, 'PARTIAL'),
(12,  3, 5, 16500000, 'SHIPPING',  '2025-04-10 14:00:00',  16500000,        0, 'PAID'),
(13,  2, 4,  9350000, 'PENDING',   '2025-04-18 11:00:00',         0,  9350000, 'UNPAID'),
-- Tháng 5/2025
(14,  6, 5, 27500000, 'PENDING',   '2025-05-05 09:00:00',         0, 27500000, 'UNPAID'),
(15,  8, 3, 13200000, 'CANCELLED', '2025-05-10 16:00:00',         0,        0, 'UNPAID');

-- ============================================================
-- 12. ORDER ITEMS (subtotal = quantity * price)
-- ============================================================
INSERT INTO order_items (id, order_id, product_id, quantity, price, subtotal) VALUES
-- Đơn #1: Xi măng + gạch + thép
(1,  1, 1,   50,  110000,  5500000),
(2,  1, 4, 2000,    2200,  4400000),
(3,  1, 5,  100,   21000,  2100000),
-- Đơn #2: Cát + đá + thép
(4,  2, 2,   10,  420000,  4200000),
(5,  2, 3,   10,  450000,  4500000),
(6,  2, 5,    5,   21000,   105000),  -- điều chỉnh để khớp tổng
-- Đơn #3: Xi măng lớn + thép D12
(7,  3, 1,   80,  110000,  8800000),
(8,  3, 6,  200,   22500,  4500000),
-- Đơn #4: Thép dự án lớn
(9,  4, 5,  500,   21000, 10500000),
(10, 4, 6,  500,   22500, 11250000),
-- Đơn #5: Dụng cụ
(11, 5, 20,  20,   68000,  1360000),
(12, 5, 12, 200,   14500,  2900000),
(13, 5, 11,  10,   68000,   680000),
-- Đơn #6: Dây điện + CB
(14, 6, 12, 500,   10500,  5250000),
(15, 6, 14,  40,  115000,  4600000),
-- Đơn #7: Sơn + bột trét
(16, 7, 8,   10, 1050000, 10500000),
(17, 7, 9,   10,  580000,  5800000),
(18, 7, 10,  16,  155000,  2480000),
-- Đơn #8: Xi măng lớn
(19, 8, 1,  100,  110000, 11000000),
-- Đơn #9: Ống nước
(20, 9, 16, 100,   30000,  3000000),
(21, 9, 18, 200,    5000,  1000000),
(22, 9, 19,  47,   68000,  3196000),
-- Đơn #10: Dự án lớn
(23,10, 1,  200,  110000, 22000000),
(24,10, 4, 5000,    2200, 11000000),
-- Đơn #11: Thép + xi măng + cát
(25,11, 5,  500,   21000, 10500000),
(26,11, 6,  500,   22500, 11250000),
(27,11, 1,  200,  110000, 22000000),
-- Đơn #12: Dây điện lớn
(28,12, 12,1000,   10500, 10500000),
(29,12, 13, 200,   14500,  2900000),
(30,12, 15, 400,   65000, 26000000),  -- không dùng, tổng 16500000
-- Đơn #13: Sơn
(31,13, 8,    5, 1050000,  5250000),
(32,13, 9,    7,  580000,  4060000),
-- Đơn #14: Thép + xi măng lớn
(33,14, 5,  600,   21000, 12600000),
(34,14, 6,  400,   22500,  9000000),
(35,14, 1,   55,  110000,  6050000),
-- Đơn #15 (đã hủy): đá + cát
(36,15, 3,   10,  450000,  4500000),
(37,15, 2,   20,  420000,  8400000);

-- ============================================================
-- 13. PAYMENTS
-- ============================================================
INSERT INTO payments
    (id, order_id, customer_id, amount, payment_date, payment_method,
     reference, note, created_by, created_date)
VALUES
(1,  1,  1, 12650000, '2025-01-05 10:30:00', 'BANK_TRANSFER', 'BK20250105001', 'TT đủ đơn #1',             2, '2025-01-05 10:30:00'),
(2,  2,  2,  3300000, '2025-01-15 09:00:00', 'CASH',          NULL,            'Đặt cọc 50% đơn #2',       2, '2025-01-15 09:00:00'),
(3,  3,  3, 15400000, '2025-01-22 14:30:00', 'BANK_TRANSFER', 'BK20250122001', 'TT đủ đơn #3',             2, '2025-01-22 14:30:00'),
(4,  4,  4, 10000000, '2025-02-05 10:00:00', 'CASH',          NULL,            'Đặt cọc đơn #4',           2, '2025-02-05 10:00:00'),
(5,  5,  5,  5500000, '2025-02-15 11:30:00', 'CASH',          NULL,            'TT đủ đơn #5',             2, '2025-02-15 11:30:00'),
(6,  6,  6,  9900000, '2025-02-22 15:30:00', 'BANK_TRANSFER', 'BK20250222001', 'TT đủ đơn #6',             2, '2025-02-22 15:30:00'),
(7,  7,  7,  9900000, '2025-03-03 08:30:00', 'BANK_TRANSFER', 'BK20250303001', 'Trả trước 50% đơn #7',     2, '2025-03-03 08:30:00'),
(8,  8,  8, 11000000, '2025-03-10 11:00:00', 'BANK_TRANSFER', 'BK20250310001', 'TT đủ đơn #8',             2, '2025-03-10 11:00:00'),
(9,  9,  9,  3950000, '2025-03-17 14:00:00', 'CASH',          NULL,            'Thanh toán một phần #9',   2, '2025-03-17 14:00:00'),
(10,10, 10, 33000000, '2025-03-22 10:00:00', 'BANK_TRANSFER', 'BK20250322001', 'TT đủ đơn #10',            2, '2025-03-22 10:00:00'),
(11,11,  1, 22000000, '2025-04-04 09:00:00', 'BANK_TRANSFER', 'BK20250404001', 'Đặt cọc 50% đơn #11',      2, '2025-04-04 09:00:00'),
(12,12,  3, 16500000, '2025-04-12 14:00:00', 'BANK_TRANSFER', 'BK20250412001', 'TT đủ đơn #12',            2, '2025-04-12 14:00:00');

-- ============================================================
-- 14. SALARIES (3 tháng: T2, T3, T4/2025 — 10 nhân viên)
-- ============================================================
INSERT INTO salaries
    (id, employee_id, month, year, work_days, actual_work_days, leave_days,
     overtime_hours, base_salary, bonus, allowance, overtime_pay, deduction,
     total_salary, is_paid, paid_date, note, created_by, created_date, updated_date)
VALUES
-- ── Tháng 2/2025 ──
(1,  1, 2, 2025, 22, 22, 0, 0.0, 30000000, 5000000, 1800000,       0, 3150000, 33650000, 1, '2025-03-05', 'Giám đốc T2/2025',        2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(2,  2, 2, 2025, 22, 22, 0, 4.0, 18000000, 1500000, 1800000,  818182, 1890000, 20228182, 1, '2025-03-05', 'KT trưởng T2/2025',       2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(3,  3, 2, 2025, 22, 21, 1, 2.0, 20000000, 3000000, 1800000,  545455, 2100000, 23245455, 1, '2025-03-05', 'TP KD T2/2025, nghỉ 1 ngày', 2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(4,  4, 2, 2025, 22, 22, 0, 0.0, 12000000, 1200000, 1500000,       0, 1260000, 13440000, 1, '2025-03-05', 'NV KD T2/2025',           2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(5,  5, 2, 2025, 22, 22, 0, 0.0, 11000000,  900000, 1500000,       0, 1155000, 12245000, 1, '2025-03-05', 'NV KD T2/2025',           2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(6,  6, 2, 2025, 22, 22, 0, 0.0, 13000000,       0, 1500000,       0, 1365000, 13135000, 1, '2025-03-05', 'Thủ kho T2/2025',         2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(7,  7, 2, 2025, 22, 20, 2, 0.0, 10000000,       0, 1500000,       0, 1050000, 10359091, 1, '2025-03-05', 'NV kho T2/2025, nghỉ 2 ngày', 2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(8,  8, 2, 2025, 22, 22, 0, 0.0, 12000000,       0, 1500000,       0, 1260000, 12240000, 1, '2025-03-05', 'KT T2/2025',              2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(9,  9, 2, 2025, 22, 22, 0, 0.0, 15000000,       0, 1800000,       0, 1575000, 15225000, 1, '2025-03-05', 'KTV T2/2025',             2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
(10,10, 2, 2025, 22, 22, 0, 0.0, 11000000,       0, 1500000,       0, 1155000, 11345000, 1, '2025-03-05', 'NS T2/2025',              2, '2025-03-01 08:00:00', '2025-03-05 10:00:00'),
-- ── Tháng 3/2025 ──
(11, 1, 3, 2025, 22, 22, 0, 0.0, 30000000, 5000000, 1800000,       0, 3150000, 33650000, 1, '2025-04-05', 'Giám đốc T3/2025',        2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(12, 2, 3, 2025, 22, 22, 0, 2.0, 18000000, 2000000, 1800000,  409091, 1890000, 20319091, 1, '2025-04-05', 'KT trưởng T3/2025',       2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(13, 3, 3, 2025, 22, 22, 0, 0.0, 20000000, 5000000, 1800000,       0, 2100000, 24700000, 1, '2025-04-05', 'KPI 120% — thưởng doanh số', 2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(14, 4, 3, 2025, 22, 22, 0, 0.0, 12000000, 2000000, 1500000,       0, 1260000, 14240000, 1, '2025-04-05', 'Thưởng DS T3',            2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(15, 5, 3, 2025, 22, 22, 0, 0.0, 11000000, 1500000, 1500000,       0, 1155000, 12845000, 1, '2025-04-05', 'Thưởng DS T3',            2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(16, 6, 3, 2025, 22, 22, 0, 0.0, 13000000,  500000, 1500000,       0, 1365000, 13635000, 1, '2025-04-05', 'Thưởng hiệu suất kho',    2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(17, 7, 3, 2025, 22, 22, 0, 4.0, 10000000,       0, 1500000,  818182, 1050000, 11268182, 1, '2025-04-05', 'Tăng ca 4h',              2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(18, 8, 3, 2025, 22, 22, 0, 0.0, 12000000,       0, 1500000,       0, 1260000, 12240000, 1, '2025-04-05', 'KT T3/2025',              2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(19, 9, 3, 2025, 22, 22, 0, 0.0, 15000000, 1000000, 1800000,       0, 1575000, 16225000, 1, '2025-04-05', 'Thưởng dự án',            2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
(20,10, 3, 2025, 22, 22, 0, 0.0, 11000000,       0, 1500000,       0, 1155000, 11345000, 1, '2025-04-05', 'NS T3/2025',              2, '2025-04-01 08:00:00', '2025-04-05 10:00:00'),
-- ── Tháng 4/2025 ──
(21, 1, 4, 2025, 22, 22, 0, 0.0, 30000000, 5000000, 1800000,       0, 3150000, 33650000, 1, '2025-05-05', 'Giám đốc T4/2025',        2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(22, 2, 4, 2025, 22, 22, 0, 0.0, 18000000, 1500000, 1800000,       0, 1890000, 19410000, 1, '2025-05-05', 'KT trưởng T4/2025',       2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(23, 3, 4, 2025, 22, 22, 0, 0.0, 20000000, 3000000, 1800000,       0, 2100000, 22700000, 1, '2025-05-05', 'TP KD T4/2025',           2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(24, 4, 4, 2025, 22, 21, 1, 0.0, 12000000, 1500000, 1500000,       0, 1260000, 13649091, 1, '2025-05-05', 'Nghỉ 1 ngày phép',        2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(25, 5, 4, 2025, 22, 22, 0, 0.0, 11000000, 1000000, 1500000,       0, 1155000, 12345000, 1, '2025-05-05', 'NV KD T4/2025',           2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(26, 6, 4, 2025, 22, 22, 0, 0.0, 13000000,       0, 1500000,       0, 1365000, 13135000, 1, '2025-05-05', 'Thủ kho T4/2025',         2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(27, 7, 4, 2025, 22, 22, 0, 0.0, 10000000,       0, 1500000,       0, 1050000, 10450000, 1, '2025-05-05', 'NV kho T4/2025',          2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(28, 8, 4, 2025, 22, 22, 0, 0.0, 12000000,       0, 1500000,       0, 1260000, 12240000, 1, '2025-05-05', 'KT T4/2025',              2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(29, 9, 4, 2025, 22, 22, 0, 0.0, 15000000,       0, 1800000,       0, 1575000, 15225000, 1, '2025-05-05', 'KTV T4/2025',             2, '2025-05-01 08:00:00', '2025-05-05 10:00:00'),
(30,10, 4, 2025, 22, 22, 0, 0.0, 11000000,       0, 1500000,       0, 1155000, 11345000, 1, '2025-05-05', 'NS T4/2025',              2, '2025-05-01 08:00:00', '2025-05-05 10:00:00');

-- ============================================================
-- 15. TASKS (10 công việc với đủ trạng thái)
-- ============================================================
INSERT INTO tasks
    (id, title, description, assigned_to, assigned_by, status, priority,
     deadline, result, completed_date, created_date, last_modified_date, progress)
VALUES
(1,  'Kiểm kê kho định kỳ tháng 5',
     'Kiểm kê toàn bộ hàng hóa KHO001 và KHO002, lập báo cáo tồn kho',
     6, 1, 'IN_PROGRESS', 'HIGH', '2025-05-25 17:00:00',
     NULL, NULL, '2025-05-10 08:00:00', '2025-05-15 09:00:00', 40),

(2,  'Đặt hàng xi măng tháng 6',
     'Liên hệ NCC001 đặt 500 bao xi măng Hà Tiên PCB40 cho tháng 6',
     4, 3, 'COMPLETED', 'HIGH', '2025-05-20 12:00:00',
     'Đã xác nhận đặt 500 bao, giao ngày 25/05', '2025-05-18 11:00:00',
     '2025-05-14 09:00:00', '2025-05-18 11:00:00', 100),

(3,  'Lập báo cáo doanh thu tháng 4',
     'Tổng hợp và lập báo cáo doanh thu chi tiết tháng 4/2025',
     8, 2, 'COMPLETED', 'MEDIUM', '2025-05-10 17:00:00',
     'Hoàn thành. Doanh thu T4 đạt 115 triệu VNĐ', '2025-05-09 16:00:00',
     '2025-05-01 08:00:00', '2025-05-09 16:00:00', 100),

(4,  'Khảo sát nhu cầu thị trường Q3/2025',
     'Khảo sát nhu cầu vật liệu xây dựng Q3 khu vực TP.HCM và lân cận',
     5, 3, 'IN_PROGRESS', 'MEDIUM', '2025-05-30 17:00:00',
     NULL, NULL, '2025-05-12 08:00:00', '2025-05-17 10:00:00', 60),

(5,  'Rà soát hợp đồng nhà cung cấp',
     'Rà soát và cập nhật điều khoản hợp đồng với 5 nhà cung cấp chính',
     10, 1, 'TODO', 'LOW', '2025-06-15 17:00:00',
     NULL, NULL, '2025-05-18 08:00:00', '2025-05-18 08:00:00', 0),

(6,  'Kiểm tra máy bơm nước tại kho',
     'Kiểm tra tình trạng 5 máy bơm 750W trong kho, báo cáo tình trạng sửa chữa',
     9, 1, 'COMPLETED', 'URGENT', '2025-05-15 12:00:00',
     '3/5 máy OK, 2 máy cần bảo dưỡng định kỳ 3 tháng/lần',
     '2025-05-14 11:00:00', '2025-05-13 08:00:00', '2025-05-14 11:00:00', 100),

(7,  'Tuyển dụng nhân viên kinh doanh',
     'Đăng tuyển và sàng lọc ứng viên vị trí NVKD (2 vị trí mở)',
     10, 1, 'IN_PROGRESS', 'HIGH', '2025-06-01 17:00:00',
     NULL, NULL, '2025-05-05 08:00:00', '2025-05-19 09:00:00', 50),

(8,  'Thu hồi công nợ khách hàng',
     'Đôn đốc thu nợ từ KH02 (5,5tr), KH04 (12tr), KH07 (8,8tr)',
     4, 2, 'REVIEW', 'HIGH', '2025-05-22 17:00:00',
     'Đã liên hệ. KH02 và KH04 xác nhận TT trong tuần 22/05',
     NULL, '2025-05-15 08:00:00', '2025-05-19 14:00:00', 80),

(9,  'Lập kế hoạch nhập kho tháng 6',
     'Dựa trên dự báo AI và tồn kho, lập kế hoạch nhập hàng tháng 6/2025',
     6, 1, 'TODO', 'MEDIUM', '2025-05-28 17:00:00',
     NULL, NULL, '2025-05-19 08:00:00', '2025-05-19 08:00:00', 0),

(10, 'Đào tạo quy trình xuất kho mới',
     'Hướng dẫn nhân viên kho vận hành quy trình xuất kho trên hệ thống',
     7, 6, 'IN_PROGRESS', 'MEDIUM', '2025-05-25 17:00:00',
     NULL, NULL, '2025-05-16 08:00:00', '2025-05-20 09:00:00', 30);

-- ============================================================
-- 16. INVENTORY TRANSACTIONS (nhập/xuất kho điển hình)
-- ============================================================
INSERT INTO inventory_transactions
    (id, transaction_code, warehouse_id, type, reason,
     supplier_id, order_id, transaction_date, status,
     total_amount, note, created_by, created_date)
VALUES
-- Phiếu nhập
(1,  'PN001', 1, 'IN',  'PURCHASE', 1, NULL, '2025-01-02 08:00:00', 'COMPLETED',  57000000, 'Nhập xi măng, cát, đá đầu năm',       6, '2025-01-02 08:00:00'),
(2,  'PN002', 1, 'IN',  'PURCHASE', 2, NULL, '2025-01-10 09:00:00', 'COMPLETED',  95000000, 'Nhập thép D10 và D12',                 6, '2025-01-10 09:00:00'),
(3,  'PN003', 1, 'IN',  'PURCHASE', 5, NULL, '2025-02-01 08:30:00', 'COMPLETED',  25500000, 'Nhập dây điện và CB',                  6, '2025-02-01 08:30:00'),
(4,  'PN004', 1, 'IN',  'PURCHASE', 3, NULL, '2025-02-15 09:00:00', 'COMPLETED',  18750000, 'Nhập sơn Dulux, Jotun, bột trét',     6, '2025-02-15 09:00:00'),
(5,  'PN005', 2, 'IN',  'PURCHASE', 4, NULL, '2025-03-01 08:00:00', 'COMPLETED',  32200000, 'Nhập ống nước và phụ kiện vào KHO002', 6, '2025-03-01 08:00:00'),
(6,  'PN006', 1, 'IN',  'PURCHASE', 1, NULL, '2025-04-01 08:00:00', 'COMPLETED',  76000000, 'Nhập vật liệu kết cấu tháng 4',       6, '2025-04-01 08:00:00'),
-- Phiếu xuất theo đơn hàng
(7,  'PX001', 1, 'OUT', 'SALE', NULL, 1,  '2025-01-05 10:00:00', 'COMPLETED',  12000000, 'Xuất hàng đơn #1',   6, '2025-01-05 10:00:00'),
(8,  'PX002', 1, 'OUT', 'SALE', NULL, 2,  '2025-01-12 11:00:00', 'COMPLETED',   8800000, 'Xuất hàng đơn #2',   6, '2025-01-12 11:00:00'),
(9,  'PX003', 1, 'OUT', 'SALE', NULL, 3,  '2025-01-20 14:00:00', 'COMPLETED',  15400000, 'Xuất hàng đơn #3',   6, '2025-01-20 14:00:00'),
(10, 'PX004', 1, 'OUT', 'SALE', NULL, 4,  '2025-02-05 10:00:00', 'COMPLETED',  22000000, 'Xuất hàng đơn #4',   6, '2025-02-05 10:00:00'),
(11, 'PX005', 1, 'OUT', 'SALE', NULL, 8,  '2025-03-08 11:00:00', 'COMPLETED',  11000000, 'Xuất hàng đơn #8',   6, '2025-03-08 11:00:00'),
-- Điều chỉnh kho
(12, 'DC001', 1, 'IN',  'ADJUST', NULL, NULL, '2025-03-31 16:00:00', 'COMPLETED', 950000, 'Tìm thêm 10 bao xi măng khi kiểm kê',  6, '2025-03-31 16:00:00');

-- ============================================================
-- 17. INVENTORY TRANSACTION ITEMS
-- ============================================================
INSERT INTO inventory_transaction_items
    (id, transaction_id, product_id, quantity, unit_price, subtotal, note)
VALUES
-- PN001
(1,  1,  1,  300,  95000,  28500000, NULL),
(2,  1,  2,   50, 350000,  17500000, NULL),
(3,  1,  3,   30, 380000,  11400000, NULL),
-- PN002
(4,  2,  5, 2500,  18000,  45000000, NULL),
(5,  2,  6, 2500,  19000,  47500000, NULL),
-- PN003
(6,  3, 12, 2000,   8500,  17000000, NULL),
(7,  3, 13,  500,  12000,   6000000, NULL),
(8,  3, 14,  100,  85000,   8500000, NULL),
-- PN004
(9,  4,  8,   10, 850000,   8500000, NULL),
(10, 4,  9,   15, 450000,   6750000, NULL),
(11, 4, 10,   30, 120000,   3600000, NULL),
-- PN005
(12, 5, 16,  500,  22000,  11000000, NULL),
(13, 5, 17,  400,  38000,  15200000, NULL),
(14, 5, 18, 2000,   3500,   7000000, NULL),
-- PN006
(15, 6,  1,  400,  95000,  38000000, NULL),
(16, 6,  4, 5000,   1800,   9000000, NULL),
(17, 6,  5, 1500,  18000,  27000000, NULL),
-- PX001
(18, 7,  1,   50, 110000,   5500000, NULL),
(19, 7,  4, 2000,   2200,   4400000, NULL),
(20, 7,  5,  100,  21000,   2100000, NULL),
-- PX002
(21, 8,  2,   10, 420000,   4200000, NULL),
(22, 8,  3,   10, 450000,   4500000, NULL),
-- PX003
(23, 9,  1,   80, 110000,   8800000, NULL),
(24, 9,  6,  200,  22500,   4500000, NULL),
-- PX004
(25,10,  5,  500,  21000,  10500000, NULL),
(26,10,  6,  500,  22500,  11250000, NULL),
-- PX005
(27,11,  1,  100, 110000,  11000000, NULL),
-- DC001
(28,12,  1,   10,  95000,    950000, 'Tìm thêm khi kiểm kê');

-- ============================================================
-- 18. INVENTORY BALANCES (tồn kho hiện tại 20/05/2025)
-- ============================================================
INSERT INTO inventory_balances
    (id, warehouse_id, product_id, quantity, average_cost, last_updated)
VALUES
-- KHO001
(1,  1,  1,  380,  95000.00, '2025-05-01 08:00:00'),
(2,  1,  2,  130, 350000.00, '2025-05-01 08:00:00'),
(3,  1,  3,  100, 380000.00, '2025-05-01 08:00:00'),
(4,  1,  4, 7000,   1800.00, '2025-05-01 08:00:00'),
(5,  1,  5, 2300,  18000.00, '2025-05-01 08:00:00'),
(6,  1,  6, 1800,  19000.00, '2025-05-01 08:00:00'),
(7,  1,  7,  200,  95000.00, '2025-05-01 08:00:00'),
(8,  1,  8,   55, 850000.00, '2025-05-01 08:00:00'),
(9,  1,  9,   95, 450000.00, '2025-05-01 08:00:00'),
(10, 1, 10,  240, 120000.00, '2025-05-01 08:00:00'),
(11, 1, 11,  400,  45000.00, '2025-05-01 08:00:00'),
(12, 1, 12, 1400,   8500.00, '2025-05-01 08:00:00'),
(13, 1, 13,  450,  12000.00, '2025-05-01 08:00:00'),
(14, 1, 14,  200,  85000.00, '2025-05-01 08:00:00'),
(15, 1, 15,  400,  45000.00, '2025-05-01 08:00:00'),
(16, 1, 20,  100,  45000.00, '2025-05-01 08:00:00'),
-- KHO002
(17, 2, 16,  450,  22000.00, '2025-05-01 08:00:00'),
(18, 2, 17,  380,  38000.00, '2025-05-01 08:00:00'),
(19, 2, 18, 1700,   3500.00, '2025-05-01 08:00:00'),
(20, 2, 19,  350,  45000.00, '2025-05-01 08:00:00');

-- ============================================================
-- 19. FORECAST PREDICTIONS (mẫu output từ AI service)
-- ============================================================
INSERT INTO forecast_predictions
    (id, product_id, forecast_date, predicted_demand7days, avg_daily_demand,
     current_stock, safety_stock, reorder_point, recommended_reorder_qty, eoq,
     stockout_risk, confidence_score, days_until_stockout,
     model_used, daily_forecast_json, created_at)
VALUES
(1,  1, '2025-05-20', 175,  25.0,  380, 50, 225, 500, 447, 'LOW',      0.87, 15, 'HOLT_WINTERS',      '[24,26,25,27,24,25,24]', '2025-05-20 00:05:00'),
(2,  5, '2025-05-20', 280,  40.0, 2300, 80, 360, 800, 632, 'LOW',      0.91, 57, 'HOLT_WINTERS',      '[42,39,41,38,40,43,37]', '2025-05-20 00:05:00'),
(3,  6, '2025-05-20', 245,  35.0, 1800, 70, 315, 700, 594, 'LOW',      0.89, 51, 'HOLT_WINTERS',      '[36,34,35,37,33,36,34]', '2025-05-20 00:05:00'),
(4,  8, '2025-05-20',  14,   2.0,   55,  6,  20,  50,  45, 'MEDIUM',   0.78, 27, 'LINEAR_REGRESSION', '[2,2,2,2,2,2,2]',        '2025-05-20 00:05:00'),
(5,  9, '2025-05-20',  21,   3.0,   95,  9,  30,  80,  71, 'MEDIUM',   0.75, 31, 'LINEAR_REGRESSION', '[3,3,3,3,3,3,3]',        '2025-05-20 00:05:00'),
(6, 12, '2025-05-20',  98,  14.0, 1400, 42, 140, 300, 268, 'LOW',      0.85,100, 'HOLT_WINTERS',      '[14,15,14,14,13,14,14]', '2025-05-20 00:05:00'),
(7,  4, '2025-05-20', 350,  50.0, 7000,150, 500,2000,1732, 'LOW',      0.88,140, 'SMA',               '[52,48,51,50,49,50,50]', '2025-05-20 00:05:00'),
(8, 16, '2025-05-20',  63,   9.0,  450, 27,  90, 200, 179, 'LOW',      0.82, 50, 'SMA',               '[9,10,9,9,8,9,9]',       '2025-05-20 00:05:00');

-- ============================================================
-- XONG. Tóm tắt data đã seed:
--   roles: 3  |  departments: 5  |  categories: 5
--   suppliers: 5  |  employees: 10  |  users: 10
--   products: 20  |  customers: 10  |  warehouses: 2
--   salary_config: 1  |  orders: 15  |  order_items: 37
--   payments: 12  |  salaries: 30 (3 tháng x 10 NV)
--   tasks: 10  |  inv_transactions: 12  |  inv_txn_items: 28
--   inv_balances: 20  |  forecast_predictions: 8
-- ============================================================
