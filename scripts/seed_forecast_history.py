"""
Seed lịch sử forecast để demo tính năng "tự học model".

Tạo 4 lần chạy forecast giả (28, 21, 14, 7 ngày trước),
mỗi lần đã được AccuracyEvaluationScheduler đánh giá (có mape, mae, actual).

Câu chuyện demo:
  - Lần 1 (28d): hệ thống chưa có lịch sử → eval cả 2 model → chọn model A
  - Lần 2 (21d): có 1 lần đánh giá → vẫn eval nhưng preferred = model A
  - Lần 3 (14d): có 2 lần đánh giá → preferred model khớp winner → confidence tăng
  - Lần 4 (7d):  có 3 lần đánh giá → hệ thống đã "học xong" → dùng preferred_model

Chạy:
    python seed_forecast_history.py
"""

import random
import sys
from datetime import date, timedelta

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

try:
    import mysql.connector
except ImportError:
    print("pip install mysql-connector-python")
    sys.exit(1)

# ─────────────────── Config ───────────────────────────────────────────────────

DB_CONFIG = dict(host="127.0.0.1", port=3307, user="root", password="1234", database="construction_db")
TODAY      = date.today()
RNG        = random.Random(42)

# Số ngày trước cho mỗi lần chạy lịch sử
HISTORY_RUNS = [28, 21, 14, 7]


# ─────────────────── Helpers ─────────────────────────────────────────────────

def jitter(value: float, pct: float = 0.20) -> float:
    """Thêm noise ±pct% vào value."""
    return max(0.0, value * (1 + RNG.uniform(-pct, pct)))


def mape_val(predicted: int, actual: int) -> float | None:
    if actual == 0:
        return None
    return round(abs(predicted - actual) / actual * 100, 2)


def model_scores_json(model_used: str, mae: float) -> str:
    """Tạo model_scores_json giả lập — model thắng có MAE thấp hơn."""
    winner_mae = round(mae, 2)
    loser_mae  = round(mae * RNG.uniform(1.15, 1.60), 2)
    if model_used == "xgboost":
        return f'{{"xgboost":{winner_mae},"holt_winters":{loser_mae}}}'
    else:
        return f'{{"holt_winters":{winner_mae},"xgboost":{loser_mae}}}'


def daily_forecast_json(total: int) -> str:
    """Chia total thành 7 ngày với một chút noise."""
    avg = total / 7
    days = [max(0, int(round(jitter(avg, 0.15)))) for _ in range(6)]
    days.append(max(0, total - sum(days)))
    return "[" + ",".join(str(d) for d in days) + "]"


# ─────────────────── Main ────────────────────────────────────────────────────

def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cur  = conn.cursor(dictionary=True)

    # Lấy tất cả sản phẩm + avg_daily_demand từ forecast gần nhất
    cur.execute("""
        SELECT
            p.id            AS product_id,
            p.stock         AS current_stock,
            fp.avg_daily_demand,
            fp.model_used   AS latest_model,
            fp.safety_stock,
            fp.reorder_point,
            fp.eoq,
            fp.confidence_score
        FROM products p
        JOIN forecast_predictions fp ON fp.id = (
            SELECT MAX(fp2.id) FROM forecast_predictions fp2
            WHERE fp2.product_id = p.id
        )
        ORDER BY p.id
    """)
    products = cur.fetchall()

    if not products:
        print("Chưa có forecast_predictions. Chạy trigger forecast trước.")
        sys.exit(1)

    print(f"Seed lịch sử cho {len(products)} sản phẩm × {len(HISTORY_RUNS)} lần chạy...\n")

    inserted = 0
    for prod in products:
        pid         = prod["product_id"]
        avg_demand  = float(prod["avg_daily_demand"] or 1.0)
        base_model  = prod["latest_model"]  # model hiện tại → dùng làm "model đúng"
        alt_model   = "holt_winters" if base_model == "xgboost" else "xgboost"
        stock       = prod["current_stock"] or 0
        ss          = prod["safety_stock"] or 0
        rop         = prod["reorder_point"] or 0
        eoq         = prod["eoq"] or 0
        conf        = float(prod["confidence_score"] or 0.6)

        for i, days_ago in enumerate(HISTORY_RUNS):
            fdate = TODAY - timedelta(days=days_ago)

            # Skip nếu đã có record cho ngày này (idempotent)
            cur.execute(
                "SELECT 1 FROM forecast_predictions WHERE product_id=%s AND forecast_date=%s",
                (pid, fdate)
            )
            if cur.fetchone():
                continue

            # ── Chọn model cho lần này ───────────────────────────────────────
            # Lần 1: dùng alt_model (chưa học)
            # Lần 2: chuyển sang base_model (đang học)
            # Lần 3-4: ổn định với base_model
            if i == 0:
                model = alt_model
                conf_run = max(0.30, conf - 0.20)
            else:
                model = base_model
                conf_run = min(0.95, conf - 0.05 + i * 0.03)

            # ── Demand thực tế và dự báo ─────────────────────────────────────
            actual_7d    = max(1, int(round(jitter(avg_demand * 7, 0.25))))
            # Lần 1 dự báo kém hơn, lần sau dần chính xác hơn
            error_pct    = [0.30, 0.18, 0.12, 0.08][i]
            predicted_7d = max(1, int(round(actual_7d * (1 + RNG.uniform(-error_pct, error_pct)))))

            mae_val_raw  = abs(predicted_7d - actual_7d)
            mape_raw     = mape_val(predicted_7d, actual_7d)

            # MAE trên validation set (model_scores)
            val_mae      = round(avg_demand * error_pct * RNG.uniform(0.8, 1.2), 2)

            risk = "LOW"
            if stock < rop:         risk = "MEDIUM"
            if stock < ss:          risk = "HIGH"
            if stock <= 0:          risk = "CRITICAL"

            days_stockout = int(stock / avg_demand) if avg_demand > 0 else 9999
            days_stockout = min(days_stockout, 9999)

            cur.execute("""
                INSERT INTO forecast_predictions
                    (product_id, forecast_date,
                     predicted_demand7days, avg_daily_demand,
                     current_stock, safety_stock, reorder_point,
                     recommended_reorder_qty, eoq,
                     stockout_risk, confidence_score, days_until_stockout,
                     model_used, daily_forecast_json, model_scores_json,
                     actual_demand7days, mape, mae, created_at)
                VALUES (%s,%s, %s,%s, %s,%s,%s, %s,%s, %s,%s,%s, %s,%s,%s, %s,%s,%s, %s)
            """, (
                pid, fdate,
                predicted_7d, round(avg_demand, 2),
                stock, ss, rop,
                max(eoq, int(avg_demand * 30) - stock + ss), eoq,
                risk, round(conf_run, 3), days_stockout,
                model,
                daily_forecast_json(predicted_7d),
                model_scores_json(model, val_mae),
                actual_7d, mape_raw, float(mae_val_raw),
                fdate.strftime("%Y-%m-%d") + " 02:05:00",
            ))
            inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"✅ Đã seed {inserted} bản ghi lịch sử forecast.")
    print("   Bây giờ trigger forecast lại để getBestModelForProduct() có dữ liệu học.")


if __name__ == "__main__":
    main()
