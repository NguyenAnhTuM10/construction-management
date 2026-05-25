#!/usr/bin/env python3
"""
Seed dữ liệu demo đa dạng: 5 demand pattern khác nhau để AI service
chọn đúng model cho từng loại sản phẩm.

Thiết kế để 4 model đều có cơ hội thắng:

  PATTERN         HISTORY   MODEL THẮNG     LÝ DO
  ─────────────────────────────────────────────────────────────────
  seasonal        90 ngày   XGBoost         Calendar features bắt seasonality
  trend_only      45-55n    Holt-Winters    Trend rõ, không seasonal, XGBoost < 60n
  linear_new      15-20n    Linear Reg.     Sản phẩm mới, LR fit tốt với ít data
  lumpy           90 ngày   SMA             Không có pattern — SMA ổn định nhất
  noisy_seasonal  90 ngày   HW hoặc SMA     Noise cao, XGBoost overfit

Cài dependencies:
    pip install -r requirements-scripts.txt

Chạy reset + seed lại toàn bộ:
    python seed_historical_data.py --reset

Chạy thêm (không xóa data cũ):
    python seed_historical_data.py
"""

import argparse
import math
import random
import sys
from datetime import datetime, timedelta

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import numpy as np

try:
    import mysql.connector
except ImportError:
    print("ERROR: Chưa cài mysql-connector-python.")
    print("Chạy: pip install -r requirements-scripts.txt")
    sys.exit(1)


# ─────────────────── Categories ──────────────────────────────────────────────

CATEGORIES = [
    (1, "Vật liệu kết cấu"),
    (2, "Vật liệu hoàn thiện"),
    (3, "Thiết bị & Điện"),
]

# ─────────────────── Product Catalog ─────────────────────────────────────────
#
# (code, name, cat_id, unit, buy_price, sell_price, stock, history_days, pattern, base_demand)
#
# history_days: số ngày lịch sử tính từ HÔM NAY ngược về quá khứ
#   → Quyết định Spring Boot gửi bao nhiêu ngày cho AI service
#   → 90+ ngày: đủ cho XGBoost evaluation (>=60 days sau val split)
#   → 21-59 ngày: chỉ HW + LR cạnh tranh
#   → 14-20 ngày: chỉ LR + SMA cạnh tranh
#
# pattern: loại demand function (xem bên dưới)
# base_demand: nhu cầu cơ sở trung bình mỗi ngày

PRODUCTS = [
    # ══ XGBoost territory: 90+ ngày, seasonal + weekday pattern ══════════════
    # XGBoost thắng vì calendar features (ngày tuần, tháng) bắt đúng seasonality
    ("XM001", "Xi măng Hà Tiên PCB40 50kg",    1, "Bao",    65000,  80000,  500, 365, "seasonal",      16),
    ("ST001", "Thép tròn trơn Φ10 CB240T",      1, "Kg",    22000,  29000, 3000, 365, "seasonal",      90),
    ("GH001", "Gạch Tuynel 4 lỗ 80x80x190",    1, "Viên",    550,    750, 10000, 365, "seasonal",     700),
    ("BT001", "Bột trát tường Việt Mỹ 25kg",   1, "Bao",    40000,  55000,  300, 365, "seasonal",      18),
    ("TC001", "Tôn lạnh mạ kẽm 0.3mm",         1, "Tấm",   90000, 118000,   80, 365, "seasonal",       5),

    # ══ Holt-Winters territory: 25-55 ngày, TREND ONLY (không có seasonality) ═
    # Không có weekday/monthly pattern → XGBoost calendar features vô dụng
    # n < 60 → XGBoost không được evaluate → HW vs LR cạnh tranh → HW thắng khi trend rõ
    ("SHT001", "Sơn chống thấm Kova Cat-Tec",   2, "Thùng", 320000, 420000,  60,  48, "trend_up",       4),
    ("ONC001", "Ống nước PVC Bình Minh D60",     1, "Mét",   22000,  30000,  200,  42, "trend_down",    12),
    ("PLT001", "Phụ kiện ống nước combo D60",    1, "Bộ",    16000,  22000,  150,  55, "trend_up",       5),
    ("VXL001", "Vữa xây khô đóng gói 25kg",     1, "Bao",   28000,  38000,  400,  35, "trend_up",       9),

    # ══ Linear Regression territory: 14-20 ngày, sản phẩm MỚI ═══════════════
    # Mới ra thị trường → ít data → chỉ LR + SMA được evaluate → LR thắng (trend tuyến tính)
    ("GGR001", "Gạch granite 80x80 Viglacera",  2, "Hộp",  420000, 560000,  120,  18, "linear_new",    3),
    ("SLK001", "Sơn lót chống kiềm Dulux 18L",  2, "Lon",  175000, 235000,   60,  16, "linear_new",    2),
    ("NHB001", "Nhựa đường bitumen 60/70",       1, "Kg",    18000,  26000,  500,  20, "linear_new",   10),

    # ══ SMA territory: demand LUMPY (không đều, project-based) ═══════════════
    # 70-80% ngày không có đơn hàng → pattern không rõ → SMA ổn định nhất
    # XGBoost/HW/LR đều overfit trên lumpy data → SMA thắng MAE
    ("CLT001", "Cừ thép Larsen IV (cho thuê)",  1, "Mét",  420000, 580000,  300,  90, "lumpy",          8),
    ("BCM001", "Bê tông tươi M300 (dự án lớn)", 1, "M3",   920000,1220000,   50,  90, "lumpy",          5),
    ("GLC001", "Giàn giáo thép (cho thuê ngày)",1, "Bộ",    8000,  12000, 2000,  90, "lumpy",          20),

    # ══ Noisy seasonal: 90 ngày nhưng NOISE CAO ═══════════════════════════════
    # Seasonal pattern nhưng σ=50-60% → XGBoost overfit trên noisy validation
    # → HW hoặc SMA thắng tùy lần chạy (kết quả không hoàn toàn deterministic)
    ("CT001",  "Cát xây dựng (Cát vàng)",       1, "Khối", 175000, 240000,  200,  90, "noisy_seasonal", 8),
    ("DA001",  "Đá dăm 1x2",                    1, "Khối", 200000, 270000,   60,  90, "noisy_seasonal", 3),
    ("SN001",  "Sơn Dulux WeatherShield 18L",   2, "Lon",  270000, 350000,   30,  90, "noisy_seasonal", 5),
]


# ─────────────────── Demand Generators per Pattern ───────────────────────────

# Seasonality factors cho "seasonal" pattern
MONTHLY_FACTOR = {
    1: 0.60, 2: 0.35, 3: 1.25, 4: 1.30,
    5: 1.20, 6: 1.00, 7: 0.90, 8: 0.85,
    9: 1.00, 10: 1.15, 11: 1.20, 12: 1.00,
}
WEEKDAY_FACTOR = {
    0: 1.00,  # T2
    1: 1.05,  # T3
    2: 1.00,  # T4
    3: 1.00,  # T5
    4: 0.95,  # T6
    5: 0.60,  # T7
    6: 0.15,  # CN
}


def _demand_seasonal(base: float, date: datetime, day_index: int, rng: random.Random) -> int:
    """
    Pattern chuẩn: seasonality theo tháng + weekday effect + noise 20%.
    XGBoost thắng vì calendar features khớp hoàn toàn với generator này.
    """
    monthly   = MONTHLY_FACTOR.get(date.month, 1.0)
    weekday   = WEEKDAY_FACTOR.get(date.weekday(), 1.0)
    noise     = rng.gauss(1.0, 0.20)
    big_order = 2.5 if rng.random() < 0.03 else 1.0
    zero_day  = 0   if rng.random() < 0.05 else 1
    return max(0, int(round(base * monthly * weekday * noise * big_order * zero_day)))


def _demand_trend_up(base: float, date: datetime, day_index: int, rng: random.Random) -> int:
    """
    Tăng trưởng tuyến tính, KHÔNG có weekday/monthly seasonality.
    Noise 25%. Holt-Winters thắng vì:
    - XGBoost calendar features không có giá trị (không có weekday/monthly pattern)
    - HW bắt được trend tốt với n < 60 ngày
    """
    trend  = 1.0 + (day_index / 200.0) * 0.9   # tăng ~90% sau 200 ngày
    noise  = rng.gauss(1.0, 0.25)
    zero   = 0 if rng.random() < 0.04 else 1
    return max(0, int(round(base * trend * noise * zero)))


def _demand_trend_down(base: float, date: datetime, day_index: int, rng: random.Random) -> int:
    """
    Giảm dần (mùa vụ đang qua). Holt-Winters bắt declining trend tốt hơn LR/SMA.
    """
    trend = max(0.25, 1.0 - (day_index / 200.0) * 0.65)
    noise = rng.gauss(1.0, 0.22)
    zero  = 0 if rng.random() < 0.04 else 1
    return max(0, int(round(base * trend * noise * zero)))


def _demand_linear_new(base: float, date: datetime, day_index: int, rng: random.Random) -> int:
    """
    Sản phẩm mới: tăng tuyến tính từ 0, noise 30%.
    Linear Regression thắng vì:
    - Chỉ có 14-20 ngày → chỉ LR và SMA được evaluate
    - Data có trend tuyến tính rõ ràng → LR fit tốt hơn SMA
    """
    val   = base + day_index * 0.18
    noise = rng.gauss(1.0, 0.30)
    return max(0, int(round(val * noise)))


def _demand_lumpy(base: float, date: datetime, day_index: int, rng: random.Random) -> int:
    """
    Project-based: 78% ngày không có đơn, 22% ngày có đơn lớn (bulk orders).
    SMA thắng vì:
    - Không có pattern → XGBoost/HW/LR cố fit một trend không tồn tại → overfit
    - SMA chỉ lấy trung bình gần nhất → ổn định, ít bị kéo bởi spike
    """
    if rng.random() < 0.78:
        return 0
    multiplier = rng.uniform(3.5, 9.0)
    noise      = rng.gauss(1.0, 0.18)
    return max(1, int(round(base * multiplier * noise)))


def _demand_noisy_seasonal(base: float, date: datetime, day_index: int, rng: random.Random) -> int:
    """
    Seasonal như _demand_seasonal nhưng noise rất cao (σ=50%).
    XGBoost overfit trên 7-day val khi noise cao → HW hoặc SMA có thể thắng.
    """
    monthly   = MONTHLY_FACTOR.get(date.month, 1.0)
    weekday   = WEEKDAY_FACTOR.get(date.weekday(), 1.0)
    noise     = rng.gauss(1.0, 0.50)                    # Noise cao hơn seasonal
    big_order = 3.0 if rng.random() < 0.05 else 1.0     # Spike lớn hơn và thường hơn
    zero_day  = 0   if rng.random() < 0.12 else 1       # Zero day nhiều hơn
    return max(0, int(round(base * monthly * weekday * noise * big_order * zero_day)))


DEMAND_GENERATORS = {
    "seasonal":       _demand_seasonal,
    "trend_up":       _demand_trend_up,
    "trend_down":     _demand_trend_down,
    "linear_new":     _demand_linear_new,
    "lumpy":          _demand_lumpy,
    "noisy_seasonal": _demand_noisy_seasonal,
}

# Mô tả ngắn để in ra console
PATTERN_DESC = {
    "seasonal":       "Seasonal + weekday  → XGBoost",
    "trend_up":       "Trend tăng, no seasonal → HW",
    "trend_down":     "Trend giảm, no seasonal → HW",
    "linear_new":     "Sản phẩm mới (15-20d) → LR",
    "lumpy":          "Lumpy / project-based → SMA",
    "noisy_seasonal": "Seasonal noise cao  → HW/SMA",
}


# ─────────────────────────────── Main ────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed dữ liệu demo cho AI Forecast")
    parser.add_argument("--host",     default="localhost")
    parser.add_argument("--port",     type=int, default=3307)
    parser.add_argument("--database", default="construction_db")
    parser.add_argument("--user",     default="root")
    parser.add_argument("--password", default="1234")
    parser.add_argument("--reset",    action="store_true",
                        help="Xóa toàn bộ seed data trước khi chạy")
    parser.add_argument("--seed",     type=int, default=42,
                        help="Random seed để kết quả reproducible")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    np.random.seed(args.seed)

    print(f"Kết nối MySQL {args.host}:{args.port}/{args.database}...")
    conn = mysql.connector.connect(
        host=args.host, port=args.port, database=args.database,
        user=args.user, password=args.password, autocommit=False,
    )
    cur = conn.cursor()

    try:
        if args.reset:
            _reset_seed_data(cur, conn)

        warehouse_id = _ensure_warehouse(cur, conn)
        _ensure_categories(cur, conn)
        product_rows = _ensure_products(cur, conn)

        print("\n" + "─" * 70)
        print(f"{'Sản phẩm':<35} {'Pattern':<35} {'History':>7} {'Base':>5}")
        print("─" * 70)

        total_txn = _seed_all(cur, conn, product_rows, warehouse_id, rng)

        print("─" * 70)
        print(f"\nTổng: {total_txn} transactions cho {len(product_rows)} sản phẩm")
        print(f"\n{'='*60}")
        print("Xong! Trigger forecast:")
        print("  POST /construction/forecast/trigger  (JWT admin)")
        print("  GET  /construction/forecast/latest")
        print("\nDự kiến model distribution:")
        for code, _, _, _, _, _, _, hist, pattern, _ in PRODUCTS:
            expected = PATTERN_DESC.get(pattern, pattern)
            print(f"  {code:<10} {hist:>3}d  {expected}")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        cur.close()
        conn.close()


# ─────────────────────────── Helpers ─────────────────────────────────────────

def _reset_seed_data(cur, conn):
    print("Xóa seed data cũ...")
    codes = [p[0] for p in PRODUCTS]

    # Xóa transactions seed trước (an toàn, không có FK conflict)
    cur.execute("""
        DELETE ti FROM inventory_transaction_items ti
        JOIN inventory_transactions t ON ti.transaction_id = t.id
        WHERE t.transaction_code LIKE 'PX-SEED-%'
    """)
    cur.execute("DELETE FROM inventory_transactions WHERE transaction_code LIKE 'PX-SEED-%'")

    # Tắt FK check tạm để xóa products (có thể bị tham chiếu bởi order_items/forecast_predictions)
    cur.execute("SET FOREIGN_KEY_CHECKS = 0")
    if codes:
        placeholders = ",".join(["%s"] * len(codes))
        cur.execute(f"DELETE FROM products WHERE code IN ({placeholders})", codes)
    cur.execute("DELETE FROM categories WHERE id IN (1, 2, 3)")
    cur.execute("DELETE FROM warehouses WHERE code = 'KHO-MAIN'")
    cur.execute("SET FOREIGN_KEY_CHECKS = 1")

    conn.commit()
    print("Đã xóa data cũ.\n")


def _ensure_warehouse(cur, conn) -> int:
    cur.execute("SELECT id FROM warehouses WHERE code = 'KHO-MAIN' LIMIT 1")
    row = cur.fetchone()
    if row:
        print(f"Warehouse đã tồn tại (id={row[0]})")
        return row[0]
    cur.execute("""
        INSERT INTO warehouses (code, name, address, active)
        VALUES ('KHO-MAIN', 'Kho Chính', '123 Đường Xây Dựng, Q.1, TP.HCM', 1)
    """)
    conn.commit()
    wid = cur.lastrowid
    print(f"Tạo warehouse: Kho Chính (id={wid})")
    return wid


def _ensure_categories(cur, conn):
    for cat_id, cat_name in CATEGORIES:
        cur.execute("SELECT id FROM categories WHERE id = %s", (cat_id,))
        if not cur.fetchone():
            cur.execute("INSERT INTO categories (id, name) VALUES (%s, %s)", (cat_id, cat_name))
    conn.commit()


def _ensure_products(cur, conn):
    created = 0
    for code, name, cat_id, unit, buy, sell, stock, *_ in PRODUCTS:
        cur.execute("SELECT id FROM products WHERE code = %s", (code,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO products (code, name, category_id, unit, buy_price, sell_price, stock)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (code, name, cat_id, unit, buy, sell, stock))
            created += 1
    conn.commit()
    print(f"Products: {created} mới tạo, {len(PRODUCTS) - created} đã tồn tại\n")

    codes = [p[0] for p in PRODUCTS]
    placeholders = ",".join(["%s"] * len(codes))
    cur.execute(
        f"SELECT id, code, name, stock, sell_price FROM products WHERE code IN ({placeholders})",
        codes,
    )
    db_rows = {row[1]: row for row in cur.fetchall()}  # code → row

    # Trả về theo thứ tự PRODUCTS để khớp với config
    result = []
    for prod_def in PRODUCTS:
        code = prod_def[0]
        if code in db_rows:
            result.append(db_rows[code])
    return result


def _seed_all(cur, conn, product_rows, warehouse_id, rng) -> int:
    """
    Sinh transactions cho từng sản phẩm theo pattern và history_days riêng.
    end_date = hôm nay (để Spring Boot query 90 ngày gần nhất đúng)
    """
    end_date  = datetime.now().replace(hour=18, minute=0, second=0, microsecond=0)
    total_txn = 0

    # Map code → product definition
    prod_config = {p[0]: p for p in PRODUCTS}

    for prod_id, prod_code, prod_name, stock, sell_price in product_rows:
        cfg = prod_config.get(prod_code)
        if cfg is None:
            continue

        _, _, _, _, _, _, _, history_days, pattern, base_demand = cfg
        unit_price = float(sell_price) if sell_price else 10000.0
        gen_fn     = DEMAND_GENERATORS.get(pattern, _demand_seasonal)

        start_date = end_date - timedelta(days=history_days)
        txn_count  = 0
        seq        = 1

        for day_index, date in enumerate(_daterange(start_date, end_date)):
            qty = gen_fn(float(base_demand), date, day_index, rng)

            if qty > 0:
                tx_code = f"PX-SEED-{date.strftime('%Y%m%d')}-{prod_code[:8]}-{seq:05d}"
                tx_time = date.replace(
                    hour=rng.randint(7, 17),
                    minute=rng.randint(0, 59),
                    second=0,
                )
                subtotal = qty * unit_price

                cur.execute("""
                    INSERT IGNORE INTO inventory_transactions
                        (transaction_code, warehouse_id, type, reason,
                         transaction_date, status, total_amount, created_date)
                    VALUES (%s, %s, 'OUT', 'SALE', %s, 'COMPLETED', %s, %s)
                """, (tx_code, warehouse_id, tx_time, subtotal, tx_time))

                tx_id = cur.lastrowid
                if tx_id:
                    cur.execute("""
                        INSERT INTO inventory_transaction_items
                            (transaction_id, product_id, quantity, unit_price, subtotal)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (tx_id, prod_id, qty, unit_price, subtotal))
                    txn_count += 1
                seq += 1

        conn.commit()

        desc = PATTERN_DESC.get(pattern, pattern)
        print(f"  {prod_name:<35s} {desc:<35s} {history_days:>3}d  base={base_demand:>3}  → {txn_count:>3} txns")
        total_txn += txn_count

    return total_txn


def _daterange(start: datetime, end: datetime):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


if __name__ == "__main__":
    main()
