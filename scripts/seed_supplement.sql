-- ============================================================
--  SEED SUPPLEMENT — Tình huống kho đáng báo động
--  Chạy SAU seed_data.sql
--  Mục đích: tạo đủ scenario CRITICAL / HIGH / MEDIUM / LOW
--            để demo tính năng cảnh báo tồn kho AI
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES 'utf8mb4';

-- ============================================================
-- A. CẬP NHẬT TỒN KHO — tạo tình huống báo động
-- ============================================================

-- CRITICAL: Sơn Dulux WeatherShield 18L (id=8) — stock 12, safety_stock 20
UPDATE products           SET stock    = 12 WHERE id = 8;
UPDATE inventory_balances SET quantity = 12 WHERE product_id = 8  AND warehouse_id = 1;

-- CRITICAL: CB MCB LS BKN 20A 2P (id=14) — stock 18, safety_stock 20
UPDATE products           SET stock    = 18 WHERE id = 14;
UPDATE inventory_balances SET quantity = 18 WHERE product_id = 14 AND warehouse_id = 1;

-- HIGH: Tôn Lạnh Mạ Kẽm 0.3mm (id=7) — stock 35, còn ~5 ngày
UPDATE products           SET stock    = 35 WHERE id = 7;
UPDATE inventory_balances SET quantity = 35 WHERE product_id = 7  AND warehouse_id = 1;

-- HIGH: Đá Dăm 1x2 (id=3) — stock 60, còn ~4 ngày
UPDATE products           SET stock    = 60 WHERE id = 3;
UPDATE inventory_balances SET quantity = 60 WHERE product_id = 3  AND warehouse_id = 1;

-- HIGH: Xẻng Thi Công Cán Gỗ (id=20) — stock 30, còn ~3 ngày
UPDATE products           SET stock    = 30 WHERE id = 20;
UPDATE inventory_balances SET quantity = 30 WHERE product_id = 20 AND warehouse_id = 1;

-- MEDIUM: Sơn Jotun Majestic 5L (id=9) — stock 28, còn ~9 ngày
UPDATE products           SET stock    = 28 WHERE id = 9;
UPDATE inventory_balances SET quantity = 28 WHERE product_id = 9  AND warehouse_id = 1;

-- ============================================================
-- B. CẬP NHẬT FORECAST CŨ cho product đã có prediction
-- ============================================================

-- Product 8: MEDIUM 27 ngày → CRITICAL 0 ngày (stock đã hết dưới safety stock)
UPDATE forecast_predictions SET
    predicted_demand7days   = 105,
    avg_daily_demand        = 15.0,
    current_stock           = 12,
    safety_stock            = 20,
    reorder_point           = 75,
    recommended_reorder_qty = 200,
    eoq                     = 178,
    stockout_risk           = 'CRITICAL',
    confidence_score        = 0.91,
    days_until_stockout     = 0,
    model_used              = 'HOLT_WINTERS',
    daily_forecast_json     = '[16,15,14,15,15,16,14]'
WHERE product_id = 8;

-- Product 9: MEDIUM 31 ngày → MEDIUM 9 ngày (tệ hơn, sắp chạm ngưỡng)
UPDATE forecast_predictions SET
    current_stock           = 28,
    days_until_stockout     = 9,
    daily_forecast_json     = '[3,3,4,3,3,3,2]'
WHERE product_id = 9;

-- ============================================================
-- C. FORECAST MỚI cho các sản phẩm chưa có dự báo
-- ============================================================

INSERT INTO forecast_predictions
    (id, product_id, forecast_date, predicted_demand7days, avg_daily_demand,
     current_stock, safety_stock, reorder_point, recommended_reorder_qty, eoq,
     stockout_risk, confidence_score, days_until_stockout,
     model_used, daily_forecast_json, created_at)
VALUES
-- CRITICAL: CB MCB LS BKN 20A 2P (id=14) — stock 18 < safety_stock 20
(9,  14, '2025-05-20',  49,  7.0,  18, 20,  55, 200, 178, 'CRITICAL', 0.90,  0, 'HOLT_WINTERS',      '[7,7,8,7,6,7,7]',        '2025-05-20 00:05:00'),
-- HIGH: Xẻng Thi Công Cán Gỗ (id=20) — còn 3 ngày
(10, 20, '2025-05-20',  56,  8.0,  30, 15,  45, 100,  89, 'HIGH',     0.85,  3, 'LINEAR_REGRESSION', '[8,8,9,8,7,8,8]',        '2025-05-20 00:05:00'),
-- HIGH: Tôn Lạnh Mạ Kẽm 0.3mm (id=7) — còn 5 ngày
(11,  7, '2025-05-20',  42,  6.0,  35, 12,  40, 150, 134, 'HIGH',     0.88,  5, 'HOLT_WINTERS',      '[6,6,7,5,6,6,6]',        '2025-05-20 00:05:00'),
-- HIGH: Đá Dăm 1x2 (id=3) — còn 4 ngày
(12,  3, '2025-05-20',  84, 12.0,  60, 25,  85, 250, 224, 'HIGH',     0.86,  4, 'HOLT_WINTERS',      '[12,13,11,12,12,12,12]', '2025-05-20 00:05:00'),
-- MEDIUM: Cát Xây Dựng (id=2) — còn 13 ngày
(13,  2, '2025-05-20',  56,  8.0, 130, 20,  60, 200, 178, 'MEDIUM',   0.82, 13, 'SMA',               '[8,8,9,7,8,8,8]',        '2025-05-20 00:05:00'),
-- LOW: Bột Trát Tường Việt Mỹ 25kg (id=10)
(14, 10, '2025-05-20',  35,  5.0, 240, 15,  55, 150, 134, 'LOW',      0.80, 45, 'SMA',               '[5,5,5,5,5,5,5]',        '2025-05-20 00:05:00'),
-- LOW: Gạch Men Ceramic 60x60 (id=11)
(15, 11, '2025-05-20',  28,  4.0, 400, 12,  42, 100,  89, 'LOW',      0.83, 97, 'SMA',               '[4,4,4,4,4,4,4]',        '2025-05-20 00:05:00'),
-- LOW: Dây Điện Đơn Cadivi 2.5mm (id=13)
(16, 13, '2025-05-20',  70, 10.0, 450, 30, 100, 250, 224, 'LOW',      0.84, 42, 'HOLT_WINTERS',      '[10,10,11,9,10,10,10]',  '2025-05-20 00:05:00'),
-- LOW: Ổ Cắm Điện Âm Tường Simon (id=15)
(17, 15, '2025-05-20',  21,  3.0, 400,  9,  30, 100,  89, 'LOW',      0.79,130, 'LINEAR_REGRESSION', '[3,3,3,3,3,3,3]',        '2025-05-20 00:05:00'),
-- LOW: Ống Nhựa PVC Tiền Phong D34 3m (id=17)
(18, 17, '2025-05-20',  49,  7.0, 380, 21,  70, 200, 178, 'LOW',      0.81, 51, 'SMA',               '[7,7,7,7,7,7,7]',        '2025-05-20 00:05:00'),
-- LOW: Khớp Nối Thẳng PVC D21 (id=18)
(19, 18, '2025-05-20',  63,  9.0,1700, 27,  90, 200, 179, 'LOW',      0.83,185, 'SMA',               '[9,9,9,9,9,9,9]',        '2025-05-20 00:05:00'),
-- LOW: Van Khóa Cầu Inox D21 (id=19)
(20, 19, '2025-05-20',  14,  2.0, 350,  6,  20,  80,  71, 'LOW',      0.77,175, 'LINEAR_REGRESSION', '[2,2,2,2,2,2,2]',        '2025-05-20 00:05:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Tóm tắt sau supplement:
--   CRITICAL : Sơn Dulux WeatherShield (stock 12, 0 ngày)
--              CB MCB LS BKN 20A 2P   (stock 18, 0 ngày)
--   HIGH     : Đá Dăm 1x2             (stock 60, 4 ngày)
--              Tôn Lạnh Mạ Kẽm 0.3mm  (stock 35, 5 ngày)
--              Xẻng Thi Công Cán Gỗ   (stock 30, 3 ngày)
--   MEDIUM   : Sơn Jotun Majestic 5L  (stock 28, 9 ngày)
--              Cát Xây Dựng           (stock 130, 13 ngày)
--   LOW      : 13 sản phẩm còn lại
-- ============================================================
