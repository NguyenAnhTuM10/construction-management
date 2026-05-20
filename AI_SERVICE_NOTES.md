# AI Inventory Forecast Service — Ghi Chép Học Tập

> File này ghi lại toàn bộ quá trình thiết kế, quyết định kỹ thuật, và logic phía sau feature AI Forecasting.
> Đọc file này như đọc "nhật ký kỹ thuật" của một senior engineer.

---

## 1. Bức Tranh Toàn Cảnh (Architecture)

```
React Frontend (port 3000)
        │
        │  GET /forecast/latest
        ▼
Spring Boot Backend (port 8080)
        │
        │  POST http://ai-service:8000/api/v1/forecast
        │  (WebClient — HTTP REST)
        ▼
FastAPI AI Service (port 8000)
        │
        │  Tính toán: Holt-Winters / Linear Regression / SMA
        │  Safety Stock, ROP, EOQ
        ▼
  Trả kết quả JSON về Spring Boot
        │
        ▼
Spring Boot lưu vào MySQL
  (bảng forecast_predictions)
        │
        ▼
ForecastScheduler chạy lại mỗi đêm 2:00 AM
```

### Tại sao tách AI service riêng?

Trong thực tế ở công ty, AI/ML service thường được tách riêng vì:
1. **Language freedom**: Python có pandas/scikit-learn/statsmodels, Java không có tương đương tốt
2. **Độc lập scale**: AI service cần nhiều CPU hơn → scale riêng không ảnh hưởng backend
3. **Deployment riêng**: Data scientist deploy model mới mà không cần rebuild Spring Boot
4. **Separation of concerns**: Backend engineer và ML engineer làm việc độc lập

---

## 2. Cấu Trúc Thư Mục

```
construction-management/
├── frontend/               ← React (không thay đổi)
├── backend/                ← Spring Boot (thêm forecast feature)
│   └── src/main/java/com/example/construction_management/
│       ├── config/
│       │   ├── WebClientConfig.java     ← Cấu hình WebClient bean
│       │   └── SchedulerConfig.java     ← Enable @Scheduled
│       ├── controller/
│       │   └── ForecastController.java
│       ├── service/
│       │   ├── AiServiceClient.java     ← HTTP client gọi AI service
│       │   ├── ForecastService.java     ← Business logic + DB
│       │   └── ForecastScheduler.java   ← Cron job 2AM
│       ├── entity/
│       │   └── ForecastPrediction.java  ← JPA entity (bảng mới)
│       ├── enums/
│       │   └── StockoutRisk.java        ← LOW/MEDIUM/HIGH/CRITICAL
│       ├── repository/
│       │   └── ForecastPredictionRepository.java
│       └── dto/
│           ├── request/AiForecastRequestDTO.java   ← Gửi sang AI
│           └── response/
│               ├── AiForecastResponseDTO.java      ← Nhận từ AI
│               └── ForecastPredictionResponse.java ← Trả về frontend
│
├── ai-service/             ← FastAPI AI service (MỚI)
│   ├── app/
│   │   ├── main.py                  ← FastAPI app entry point
│   │   ├── core/config.py           ← Settings (pydantic-settings)
│   │   ├── models/schemas.py        ← Pydantic schemas (request/response)
│   │   ├── routers/forecast.py      ← POST /api/v1/forecast endpoint
│   │   └── services/
│   │       ├── data_preparation.py  ← Chuẩn bị time series
│   │       └── forecast_service.py  ← Logic dự báo
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yaml     ← Cập nhật thêm ai-service
└── AI_SERVICE_NOTES.md     ← File này
```

---

## 3. Database Schema Mới

```sql
CREATE TABLE forecast_predictions (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id            BIGINT NOT NULL,
    forecast_date         DATE NOT NULL,          -- Ngày chạy forecast
    predicted_demand_7days INT,                   -- Tổng cầu dự báo 7 ngày
    avg_daily_demand      DOUBLE,                 -- Trung bình cầu/ngày
    current_stock         INT,                    -- Tồn kho tại thời điểm chạy
    safety_stock          INT,                    -- Tồn kho an toàn
    reorder_point         INT,                    -- Ngưỡng cần đặt hàng
    recommended_reorder_qty INT,                  -- Số lượng nên đặt
    eoq                   INT,                    -- Economic Order Quantity
    stockout_risk         VARCHAR(20),            -- LOW/MEDIUM/HIGH/CRITICAL
    confidence_score      DOUBLE,                 -- 0.0 → 1.0
    days_until_stockout   INT,                    -- Số ngày còn trước khi hết
    model_used            VARCHAR(50),            -- Tên model đã dùng
    daily_forecast_json   TEXT,                   -- [45, 52, 48, 55, 50, 47, 53]
    created_at            DATETIME NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_forecast_product_date (product_id, forecast_date),
    INDEX idx_forecast_date (forecast_date)
);
```

JPA sẽ tự tạo bảng này khi Spring Boot start (vì `ddl-auto: update`).

---

## 4. API Contract (Spring Boot ↔ AI Service)

### Request: POST /api/v1/forecast

```json
{
  "forecast_horizon_days": 7,
  "products": [
    {
      "product_id": 1,
      "product_name": "Xi măng Portland PC40",
      "unit": "bao",
      "current_stock": 500,
      "lead_time_days": 3,
      "ordering_cost": 100000.0,
      "holding_cost_per_unit": 500.0,
      "daily_history": [
        { "date": "2024-03-01", "quantity_out": 52, "quantity_in": 0 },
        { "date": "2024-03-02", "quantity_out": 48, "quantity_in": 0 },
        { "date": "2024-03-03", "quantity_out": 0,  "quantity_in": 200 },
        "..."
      ]
    }
  ]
}
```

### Response: 200 OK

```json
{
  "forecast_run_at": "2024-04-15T02:00:00",
  "products_processed": 1,
  "results": [
    {
      "product_id": 1,
      "predicted_demand_7days": 350,
      "avg_daily_demand": 50.0,
      "confidence_score": 0.72,
      "stockout_risk": "MEDIUM",
      "days_until_stockout": 10,
      "reorder_point": 165,
      "recommended_reorder_qty": 1200,
      "safety_stock": 15,
      "eoq": 1095,
      "daily_forecast": [48, 52, 50, 49, 53, 48, 50],
      "model_used": "holt_winters"
    }
  ]
}
```

**Lưu ý JSON naming convention:**
- Python (FastAPI) dùng `snake_case`
- Java (Spring Boot) dùng `camelCase`
- Dùng `@JsonProperty("snake_case_name")` trên DTO Java để Jackson map đúng

---

## 5. Thuật Toán Dự Báo — Giải Thích Đơn Giản

### Model Selection Strategy (cập nhật với XGBoost)

```
Số ngày có dữ liệu    → Model
──────────────────────────────────────────────
>= 60 ngày           → XGBoost (feature engineering)
  14–59 ngày         → Holt-Winters
   7–13 ngày         → Linear Regression
    < 7 ngày         → Simple Moving Average
 Không có dữ liệu    → no_history (trả 0)
```

Để có đủ data demo XGBoost: chạy `scripts/seed_historical_data.py`.

### Tại sao XGBoost cần >= 60 ngày?

XGBoost dùng lag feature lớn nhất là `lag_28` → 28 rows đầu bị `NaN` sau shift.
Sau `dropna()` cần ít nhất 20 samples để train có ý nghĩa → 60 ngày là ngưỡng an toàn.

### XGBoost Feature Engineering

```python
# Calendar features (bắt seasonality)
day_of_week, is_weekend, month, quarter

# Lag features (giá trị quá khứ — "bộ nhớ" của model)
lag_1, lag_2, lag_3, lag_7, lag_14, lag_21, lag_28

# Rolling statistics (trend và volatility)
roll_7_mean, roll_7_std, roll_14_mean, roll_28_mean, roll_28_max
```

**Tại sao dùng `shift(1)` trước khi tính rolling?**
Tránh data leakage: giá trị ngày hôm nay không được dùng để predict ngày hôm nay.
`shift(1)` đảm bảo mọi feature đều là thông tin từ *quá khứ*.

**Multi-step recursive forecasting:**
Dự báo từng bước → dùng kết quả làm lag cho bước sau:
```
predict day+1 → append to history
predict day+2 → dùng day+1 (vừa predict) làm lag_1
...
```
Sai số tích lũy theo số bước, nên chỉ forecast 7 ngày là hợp lý.

### Tại sao không dùng ChatGPT API?

ChatGPT không phải công cụ tốt cho time series forecasting:
- Không có "bộ nhớ" về dữ liệu lịch sử
- Không đảm bảo tính nhất quán của số liệu
- Chi phí cao, latency cao
- Không thể audit/debug kết quả

Thay vào đó, các thuật toán thống kê cổ điển vẫn là tiêu chuẩn ngành.

### Model Selection Strategy

```
Số ngày có dữ liệu    → Model
──────────────────────────────────────────
>= 14 ngày           → Holt-Winters
 7 – 13 ngày         → Linear Regression
  < 7 ngày           → Simple Moving Average (3 ngày)
 Không có dữ liệu    → Trả về 0 (no_history)
```

### Holt-Winters (Double Exponential Smoothing)

```
Level:   L_t = α * y_t + (1-α) * (L_{t-1} + B_{t-1})
Trend:   B_t = β * (L_t - L_{t-1}) + (1-β) * B_{t-1}
Forecast: ŷ_{t+h} = L_t + h * B_t
```

Tại sao không dùng Triple (seasonal)?
- Cần ít nhất 2 chu kỳ mùa vụ đầy đủ để ước lượng tốt
- Dữ liệu vật liệu xây dựng thường < 90 ngày
- Double (trend only) đủ tốt và ít overfitting hơn

### Safety Stock

```
Safety Stock = Z * σ_demand * √(lead_time)

Z = 1.65 (service level 95%)
σ_demand = độ lệch chuẩn lượng xuất kho mỗi ngày
lead_time = số ngày từ lúc đặt hàng đến khi nhận hàng
```

**Ý nghĩa**: Lượng hàng dự phòng để chống rủi ro nhu cầu đột biến trong thời gian chờ hàng về.

### Reorder Point (ROP)

```
ROP = avg_daily_demand * lead_time + safety_stock
```

**Ý nghĩa**: Khi tồn kho xuống đến mức này → phải đặt hàng ngay để không bị stockout.

### Economic Order Quantity (EOQ)

```
EOQ = √( 2 * D * S / H )

D = annual_demand (= avg_daily * 365)
S = ordering_cost (chi phí mỗi lần đặt hàng: vận chuyển, nhân công, admin)
H = holding_cost_per_unit_per_year (chi phí lưu kho: thuê kho, hao mòn, vốn)
```

**Ý nghĩa**: Số lượng tối ưu mỗi lần đặt hàng để tổng chi phí thấp nhất.
Tăng lô hàng → giảm số lần đặt → giảm ordering cost nhưng tăng holding cost.
EOQ là điểm cân bằng.

### Confidence Score

```
Base score từ số ngày dữ liệu:
  >= 30 ngày → 0.85
  >= 14 ngày → 0.70
   >= 7 ngày → 0.55
    < 7 ngày → 0.35

Adjustment (Coefficient of Variation):
  cv = std_demand / avg_demand
  score = base - min(cv, 1.0) * 0.25
```

**Ý nghĩa**: Nhu cầu càng biến động (cv cao) → dự báo càng kém tin cậy.

### Stockout Risk

```
days_until_stockout = current_stock / avg_daily_demand

<= 3 ngày  → CRITICAL (đặt hàng ngay lập tức)
<= 7 ngày  → HIGH
<= 14 ngày → MEDIUM
> 14 ngày  → LOW
```

---

## 6. Flow Scheduler Tự Động

```
[2:00 AM] @Scheduled(cron = "0 0 2 * * ?")
    │
    ▼ ForecastScheduler.runNightlyForecast()
    │
    ▼ ForecastService.runForecast()
    │
    ├─ Query: findProductIdsWithRecentOutActivity(since = 90 ngày trước)
    │   → Native SQL: GROUP BY product_id, lấy những sản phẩm có xuất kho COMPLETED
    │
    ├─ Với mỗi product_id:
    │   └─ buildProductInput():
    │       ├─ findById() → lấy thông tin sản phẩm
    │       └─ findDailyOutQuantityByProduct() → lấy lịch sử xuất kho theo ngày
    │
    ├─ Build AiForecastRequestDTO và POST sang AI service
    │
    ├─ Nhận AiForecastResponseDTO
    │
    └─ saveAll() vào bảng forecast_predictions
```

**Tại sao scheduler bắt Exception?**
```java
try {
    forecastService.runForecast();
} catch (Exception e) {
    log.error("[SCHEDULER] Nightly forecast job failed: {}", e.getMessage(), e);
    // Không re-throw → scheduler tiếp tục chạy lần sau
}
```
Nếu để exception nổi lên, Spring Scheduling sẽ hủy task. Lần sau sẽ không chạy nữa.
Bắt lại + log error → lần sau vẫn tự động chạy lại.

---

## 7. Key Engineering Decisions

### Decision 1: Tại sao dùng native SQL thay JPQL cho query lịch sử?

JPQL không có hàm `DATE()` native. Có thể dùng `FUNCTION('DATE', ...)` nhưng phức tạp.
Native SQL MySQL rõ ràng hơn, dễ đọc hơn, và GROUP BY DATE() là cú pháp quen thuộc.

### Decision 2: Tại sao lưu `daily_forecast_json` dạng TEXT?

JPA không có kiểu `List<Integer>` native. Các lựa chọn:
- `@ElementCollection` → tạo bảng phụ, query phức tạp
- JSON string → đơn giản, đủ dùng, frontend parse được trực tiếp

Dùng `ObjectMapper` để serialize/deserialize — đây là pattern phổ biến ở công ty.

### Decision 3: Tại sao dùng WebClient với `.block()` thay RestClient?

- User yêu cầu WebClient (production-like, Spring 6 recommended)
- RestTemplate deprecated từ Spring 5
- `.block()` cho phép dùng trong non-reactive (servlet) context mà không cần toàn bộ app chuyển sang reactive
- Nếu sau này muốn async: chỉ cần bỏ `.block()` và trả về `Mono<>`

### Decision 4: Tại sao forecast_predictions không unique (product_id, forecast_date)?

- Cho phép chạy lại forecast nhiều lần trong ngày (manual trigger)
- Query `findLatestForecasts()` luôn lấy `MAX(forecastDate)` nên frontend luôn thấy mới nhất
- Không cần delete record cũ — giữ lại để phân tích trend dự báo theo thời gian

---

## 8. Cách Chạy

### Development (local)

```bash
# 1. Start AI service
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. Start Spring Boot (với MySQL local)
cd backend
./mvnw spring-boot:run

# 3. Test forecast
# Trigger manual forecast
curl -X POST http://localhost:8080/construction/forecast/trigger \
  -H "Authorization: Bearer <token>"

# Xem kết quả
curl http://localhost:8080/construction/forecast/latest \
  -H "Authorization: Bearer <token>"

# Test AI service trực tiếp
curl -X POST http://localhost:8000/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "forecast_horizon_days": 7,
    "products": [{
      "product_id": 1,
      "product_name": "Test",
      "unit": "bao",
      "current_stock": 100,
      "daily_history": [
        {"date": "2024-01-01", "quantity_out": 10},
        {"date": "2024-01-02", "quantity_out": 12},
        {"date": "2024-01-03", "quantity_out": 8},
        {"date": "2024-01-04", "quantity_out": 11},
        {"date": "2024-01-05", "quantity_out": 9},
        {"date": "2024-01-06", "quantity_out": 13},
        {"date": "2024-01-07", "quantity_out": 10}
      ]
    }]
  }'
```

### Docker Compose (full stack)

```bash
docker-compose up --build
```

**Thứ tự khởi động:**
1. MySQL khởi động + healthcheck pass
2. AI service build + healthcheck pass (`/health` endpoint)
3. Spring Boot start + connect MySQL + connect AI service
4. Frontend start

---

## 9. XGBoost — Giải Thích Chi Tiết (Thêm 2026-05-20)

### Tại sao cần fake data trước khi dùng XGBoost?

XGBoost dùng lag feature lớn nhất là `lag_28` (giá trị 28 ngày trước).
Sau `shift(28)` và `dropna()`, 28 rows đầu tiên bị loại bỏ.
Để còn >= 20 rows train được: cần **tối thiểu 60 ngày**.

Seed script (`scripts/seed_historical_data.py`) tạo 365 ngày fake data với pattern thực tế.

### Script Seed Data (`scripts/seed_historical_data.py`)

Script này tạo **toàn bộ dữ liệu nền** nếu chưa có:
1. Warehouse "Kho Chính"
2. 3 categories vật liệu xây dựng
3. 10 sản phẩm thực tế (xi măng, thép, cát, gạch, sơn, ...)
4. 365 ngày giao dịch xuất kho với demand pattern thực tế

```bash
cd scripts
pip install -r requirements-scripts.txt

# Docker (port 3307):
python seed_historical_data.py

# MySQL local (port 3306):
python seed_historical_data.py --port 3306

# Reset và seed lại:
python seed_historical_data.py --reset
```

### Demand Pattern trong Seed Script

```python
# Mùa vụ xây dựng Việt Nam (tháng 2 = Tết, tháng 4 = cao điểm)
MONTHLY_FACTOR = {
    1: 0.60,  # gần Tết
    2: 0.35,  # Tết — thấp nhất
    3: 1.25,  # sau Tết — bùng nổ
    4: 1.30,  # cao điểm mùa khô
    ...
}

# Ngày trong tuần (chủ nhật = nghỉ)
WEEKDAY_FACTOR = {
    0: 1.00, 1: 1.05, 2: 1.00, 3: 1.00,
    4: 0.95, 5: 0.60, 6: 0.15  # CN
}

# Cộng thêm: 3% đơn hàng lớn (2.5x), 5% ngày 0 (nghỉ/hết hàng)
```

Dữ liệu này giả lập đủ hiện tượng thực tế mà XGBoost cần học.

### XGBoost Feature Engineering

16 features được dùng:

```
Calendar (4):      day_of_week, is_weekend, month, quarter
Lag features (7):  lag_1, lag_2, lag_3, lag_7, lag_14, lag_21, lag_28
Rolling stats (5): roll_7_mean, roll_7_std, roll_14_mean, roll_28_mean, roll_28_max
```

**Tại sao dùng `shift(1)` trước khi tính rolling?**
```python
shifted = demand.shift(1)           # Dùng giá trị hôm qua
df["roll_7_mean"] = shifted.rolling(7).mean()   # Không có giá trị hôm nay
```
Đây gọi là tránh **data leakage**: model không được nhìn thấy giá trị ngày hôm nay
để predict ngày hôm nay. Nếu không shift → model học trivially (100% accuracy trên train set
nhưng 0% trên production).

**Multi-step Recursive Forecasting:**
```
Day +1: predict → 48  → append to history
Day +2: predict → 52  (lag_1 = 48, vừa predict)
Day +3: predict → 50  (lag_1 = 52, lag_2 = 48)
...
```
Sai số tích lũy theo số bước → forecast 7 ngày là giới hạn hợp lý.

### XGBoost Hyperparameters (và lý do chọn)

```python
XGBRegressor(
    n_estimators=200,      # 200 cây — đủ capacity, không quá nhiều
    max_depth=4,           # Không quá sâu — tránh overfit với data nhỏ
    learning_rate=0.05,    # Nhỏ → học chậm nhưng ổn định hơn
    subsample=0.8,         # Dùng 80% rows mỗi cây → regularization
    colsample_bytree=0.8,  # Dùng 80% features mỗi cây → regularization
    min_child_weight=5,    # Node cần >= 5 samples → tránh lá quá cụ thể
    random_state=42,       # Reproducible
)
```

Không dùng early stopping vì train set nhỏ và không có validation set riêng.

---

## 10. Frontend Integration (React)

### Files đã tạo

```
frontend/src/
├── api/forecastApi.js              ← getLatest(), getByProduct(), trigger()
├── pages/forecast/
│   ├── ForecastDashboard.jsx       ← Main page
│   └── index.js
└── components/layout/Sidebar.jsx   ← Thêm "Dự Báo AI" vào menu Kho hàng
```

Route: `/forecast` — chỉ dành cho ADMIN.

### UI Components

**Alert banner (nếu có CRITICAL):**
```
🔴 3 sản phẩm sẽ hết hàng trong ≤3 ngày: Xi măng, Thép cây, Cát vàng
```

**4 Stats cards:**
- Tổng sản phẩm dự báo
- Rủi ro cao (Critical + High)
- Cần đặt hàng ngay (stock ≤ ROP)
- Độ tin cậy trung bình %

**Main Table với:**
- Cột tồn kho → đỏ nếu ≤ ROP
- Cột "Hết hàng sau" → màu theo nguy hiểm
- Risk badge → màu theo CRITICAL/HIGH/MEDIUM/LOW
- Confidence → Progress bar màu xanh/vàng/đỏ
- Model AI → tag màu (purple=XGBoost, blue=Holt-Winters, ...)
- Expandable row → Recharts BarChart 7 ngày + bảng Safety Stock/ROP/EOQ

**Màu cột đỏ khi critical:**
```css
.forecast-row-critical td { background-color: #fff1f0 !important; }
.forecast-row-high     td { background-color: #fff7e6 !important; }
```

### API Contract (Frontend → Backend)

```javascript
// forecastApi.js
GET  /forecast/latest            → [{id, productName, stockoutRisk, dailyForecast, ...}]
GET  /forecast/product/:id       → {id, ...} hoặc message "Chưa có dữ liệu"
POST /forecast/trigger           → "Forecast đã chạy xong"  (ADMIN only)
```

### Response mẫu

```json
{
  "success": true,
  "data": [{
    "id": 1,
    "productName": "Xi măng Portland PC40",
    "productCode": "XM001",
    "unit": "bao",
    "forecastDate": "2026-05-20",
    "predictedDemand7Days": 115,
    "avgDailyDemand": 16.5,
    "dailyForecast": [15, 18, 16, 17, 15, 10, 3],
    "currentStock": 500,
    "safetyStock": 12,
    "reorderPoint": 61,
    "recommendedReorderQty": 495,
    "eoq": 495,
    "stockoutRisk": "LOW",
    "daysUntilStockout": 30,
    "confidenceScore": 0.82,
    "modelUsed": "xgboost",
    "createdAt": "2026-05-20 02:00:30"
  }]
}
```

---

## 10. Roadmap Nâng Cấp

### Phase 2: Performance & Reliability

**Kafka (Event-Driven Forecast Trigger)**
```
InventoryTransactionService → publish "transaction.completed" event
                                         ↓
                               Kafka Consumer (AI service)
                                         ↓
                              Trigger partial re-forecast
```
Thay vì chờ 2AM, mỗi khi có giao dịch lớn → tự động forecast lại.

**Redis Cache**
```java
@Cacheable("forecast:latest")
public List<ForecastPredictionResponse> getLatestPredictions() { ... }

// Invalidate cache sau mỗi forecast run
@CacheEvict(value = "forecast:latest", allEntries = true)
public void runForecast() { ... }
```
Giảm DB query cho endpoint `/forecast/latest` (được gọi nhiều lần từ dashboard).

### Phase 3: AI Enhancement

**Anomaly Detection**
- Phát hiện outlier trong lịch sử (đơn hàng bất thường, sự cố logistics)
- Loại bỏ outlier trước khi forecast → kết quả chính xác hơn
- Dùng `IsolationForest` (scikit-learn) hoặc Z-score method

**Seasonality Detection**
- Tự động detect chu kỳ mùa vụ (mùa xây dựng, Tết, mùa mưa)
- Nếu đủ dữ liệu (>= 2 năm): chuyển sang Triple Exponential Smoothing
- Dùng `seasonal_decompose` từ statsmodels

**Feature Engineering**
Thêm features vào model:
- `is_weekend`: cuối tuần thường bán ít hơn
- `month_of_year`: mùa vụ xây dựng
- `days_since_last_restock`: chu kỳ nhập kho
- `price_change_flag`: thay đổi giá ảnh hưởng demand

**Vector DB + RAG Assistant**
```
User hỏi: "Sản phẩm nào cần đặt hàng tuần này?"
                  ↓
       Embed câu hỏi → Vector search trên
       knowledge base (lịch sử đặt hàng, forecast data)
                  ↓
       LLM generate câu trả lời dựa trên context thực
```
Đây mới là chỗ phù hợp để dùng LLM — không phải forecast số liệu,
mà để giải thích và tư vấn dựa trên dữ liệu.

---

## 11. Mindset Engineering Cần Nhớ

1. **AI service = một service bình thường, chỉ là output là con số dự báo**
   - Không có gì magic. Chỉ là HTTP request/response.
   - Debug như debug API thông thường.

2. **Bắt đầu đơn giản, phức tạp hóa khi có nhu cầu thật sự**
   - SMA đủ dùng cho MVP
   - Holt-Winters tốt cho production
   - LSTM/Transformer chỉ khi có > 2 năm data và team ML riêng

3. **Scheduler phải fail-safe**
   - Luôn bắt Exception trong scheduled tasks
   - Log đủ thông tin để debug sau
   - Idempotent: chạy nhiều lần không gây hại

4. **DTO là hợp đồng giữa các service**
   - `@JsonProperty` là cách "translate" giữa Java camelCase và Python snake_case
   - Thay đổi tên field phải cập nhật cả 2 phía

5. **Dockerize từ đầu**
   - Service name trong Docker network thay thế localhost
   - Healthcheck đảm bảo dependency order khi start
