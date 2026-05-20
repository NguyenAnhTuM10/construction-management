#!/usr/bin/env python3
"""
Seed toàn bộ dữ liệu demo: warehouse, categories, products, và 12 tháng
lịch sử giao dịch xuất kho để XGBoost có đủ data hoạt động.

Cài dependencies:
    pip install -r requirements-scripts.txt

Chạy (Docker Compose — MySQL port 3307):
    python seed_historical_data.py

Chạy lại sạch:
    python seed_historical_data.py --reset

Chạy MySQL local (port 3306):
    python seed_historical_data.py --port 3306
"""

import argparse
import random
import sys
from datetime import datetime, timedelta

# Windows console UTF-8 fix
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


# ─────────────────── Sample Master Data ──────────────────────────────────────

CATEGORIES = [
    (1, "Vật liệu kết cấu"),
    (2, "Vật liệu hoàn thiện"),
    (3, "Thiết bị & Điện"),
]

# (code, name, category_id, unit, buy_price, sell_price, stock)
PRODUCTS = [
    ("XM001", "Xi măng Portland PC40",     1, "bao",    65000,   80000,   500),
    ("ST001", "Thép cây Φ10 CB300-V",       1, "thanh",  120000,  150000,  300),
    ("CT001", "Cát vàng xây dựng",          1, "m3",     180000,  250000,  200),
    ("GH001", "Gạch nung đỏ 4 lỗ",          1, "viên",     600,     800, 10000),
    ("SN001", "Sơn nước nội thất Jotun",    2, "thùng",  280000,  350000,  150),
    ("GP001", "Gạch men ceramic 60x60",     2, "hộp",    220000,  280000,  400),
    ("NG001", "Ngói lợp màu đỏ 22v/m2",     2, "viên",    3500,    5000,  5000),
    ("TC001", "Tôn lạnh mạ kẽm 0.3mm",      1, "tấm",    95000,  120000,  200),
    ("BT001", "Bê tông tươi M200",          1, "m3",    900000, 1200000,   50),
    ("DS001", "Dây điện đôi CADIVI 1.5mm2", 3, "cuộn",  150000,  180000,  100),
]

# ─────────────────── Demand Pattern (vật liệu xây dựng VN) ──────────────────

MONTHLY_FACTOR = {
    1: 0.60, 2: 0.35, 3: 1.25, 4: 1.30,
    5: 1.20, 6: 1.00, 7: 0.90, 8: 0.85,
    9: 1.00, 10: 1.15, 11: 1.20, 12: 1.00,
}

WEEKDAY_FACTOR = {
    0: 1.00,  # Thứ 2
    1: 1.05,  # Thứ 3 — ngày đặt hàng đầu tuần
    2: 1.00,  # Thứ 4
    3: 1.00,  # Thứ 5
    4: 0.95,  # Thứ 6
    5: 0.60,  # Thứ 7
    6: 0.15,  # Chủ nhật
}


def generate_daily_demand(base: float, date: datetime, rng: random.Random) -> int:
    monthly   = MONTHLY_FACTOR.get(date.month, 1.0)
    weekday   = WEEKDAY_FACTOR.get(date.weekday(), 1.0)
    noise     = rng.gauss(1.0, 0.20)
    big_order = 2.5 if rng.random() < 0.03 else 1.0
    zero_day  = 0   if rng.random() < 0.05 else 1
    return max(0, int(round(base * monthly * weekday * noise * big_order * zero_day)))


# ─────────────────────────────── Main ────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host",     default="localhost")
    parser.add_argument("--port",     type=int, default=3307)
    parser.add_argument("--database", default="construction_db")
    parser.add_argument("--user",     default="root")
    parser.add_argument("--password", default="1234")
    parser.add_argument("--days",     type=int, default=365)
    parser.add_argument("--reset",    action="store_true", help="Xóa seed data cũ trước khi chạy")
    parser.add_argument("--seed",     type=int, default=42)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    np.random.seed(args.seed)

    print(f"Kết nối MySQL {args.host}:{args.port}/{args.database}...")
    conn = mysql.connector.connect(
        host=args.host, port=args.port,
        database=args.database,
        user=args.user, password=args.password,
        autocommit=False,
    )
    cur = conn.cursor()

    try:
        if args.reset:
            _reset_seed_data(cur)
            conn.commit()

        warehouse_id = _ensure_warehouse(cur, conn)
        _ensure_categories(cur, conn)
        product_rows  = _ensure_products(cur, conn)

        print(f"\nSinh {args.days} ngày lịch sử xuất kho...\n")
        _seed_transactions(cur, conn, product_rows, warehouse_id, args.days, rng)

        print(f"\n{'='*60}")
        print("Xong! Bước tiếp theo:")
        print("  1. Đảm bảo docker-compose up đang chạy")
        print("  2. POST /construction/forecast/trigger  (cần JWT token admin)")
        print("  3. GET  /construction/forecast/latest")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        cur.close()
        conn.close()


# ─────────────────────────── Helpers ─────────────────────────────────────────

def _reset_seed_data(cur):
    print("Xóa seed data cũ...")
    cur.execute("""
        DELETE ti FROM inventory_transaction_items ti
        JOIN inventory_transactions t ON ti.transaction_id = t.id
        WHERE t.transaction_code LIKE 'PX-SEED-%'
    """)
    cur.execute("DELETE FROM inventory_transactions WHERE transaction_code LIKE 'PX-SEED-%'")
    cur.execute("DELETE FROM products WHERE code IN (%s)" % ",".join(["%s"] * len(PRODUCTS)),
                [p[0] for p in PRODUCTS])
    cur.execute("DELETE FROM categories WHERE id <= 3")
    cur.execute("DELETE FROM warehouses WHERE code = 'KHO-MAIN'")
    print("Đã xóa data cũ.")


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
    warehouse_id = cur.lastrowid
    print(f"Tạo warehouse: Kho Chính (id={warehouse_id})")
    return warehouse_id


def _ensure_categories(cur, conn):
    for cat_id, cat_name in CATEGORIES:
        cur.execute("SELECT id FROM categories WHERE id = %s", (cat_id,))
        if not cur.fetchone():
            cur.execute("INSERT INTO categories (id, name) VALUES (%s, %s)", (cat_id, cat_name))
    conn.commit()
    print(f"Categories: {len(CATEGORIES)} đã sẵn sàng")


def _ensure_products(cur, conn):
    created = 0
    for code, name, cat_id, unit, buy, sell, stock in PRODUCTS:
        cur.execute("SELECT id FROM products WHERE code = %s", (code,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO products (code, name, category_id, unit, buy_price, sell_price, stock)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (code, name, cat_id, unit, buy, sell, stock))
            created += 1
    conn.commit()
    print(f"Products: {created} mới tạo, {len(PRODUCTS) - created} đã tồn tại")

    cur.execute("SELECT id, code, name, stock, sell_price FROM products WHERE code IN (%s)"
                % ",".join(["%s"] * len(PRODUCTS)), [p[0] for p in PRODUCTS])
    return cur.fetchall()


def _seed_transactions(cur, conn, product_rows, warehouse_id, days, rng):
    end_date   = datetime.now().replace(hour=18, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=days)
    total_txn  = 0

    for product_id, product_code, product_name, stock, sell_price in product_rows:
        base_daily = max(3, int((stock or 60) * 0.033))
        unit_price = float(sell_price) if sell_price else 10000.0

        txn_count = 0
        current   = start_date
        seq       = 1

        while current <= end_date:
            qty = generate_daily_demand(base_daily, current, rng)

            if qty > 0:
                tx_code = f"PX-SEED-{current.strftime('%Y%m%d')}-{product_code[:8]}-{seq:05d}"
                tx_time = current.replace(
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
                    """, (tx_id, product_id, qty, unit_price, subtotal))
                    txn_count += 1

            current += timedelta(days=1)
            seq     += 1

        conn.commit()
        print(f"  {product_name:<35s}  base={base_daily:3d}/ngày  → {txn_count:3d} transactions")
        total_txn += txn_count

    print(f"\nTổng: {total_txn} transactions cho {len(product_rows)} sản phẩm")


if __name__ == "__main__":
    main()
