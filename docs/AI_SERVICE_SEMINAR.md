# AI Inventory Forecasting — Seminar

---

## Đặt vấn đề

Hệ thống quản lý công trình xây dựng cần trả lời 3 câu hỏi mỗi ngày:

> **"Tuần tới tôi cần bao nhiêu xi măng?"**  
> **"Khi nào tôi cần đặt hàng thêm?"**  
> **"Tôi có nguy cơ hết hàng không?"**

Trước đây: quản lý kho tự ước tính bằng kinh nghiệm — dễ thiếu hàng hoặc tồn kho thừa.

Giải pháp: xây một **AI Service** riêng phân tích lịch sử xuất kho và dự báo tự động.

---

## Kiến trúc tổng thể

Hệ thống chia làm 2 phần tách biệt:

```
React Frontend
      ↕
Spring Boot Backend  ──────→  FastAPI AI Service
      ↕                            (port 8000)
   MySQL DB
```

**Tại sao tách AI Service riêng?**  
Spring Boot không chạy được NumPy, XGBoost, statsmodels. Tách ra thành microservice độc lập — AI Service có thể phát triển, nâng cấp, scale riêng mà không ảnh hưởng backend.

**Luồng kích hoạt:**  
Mỗi đêm 2:00 AM, Spring Boot tự động gom lịch sử xuất kho 90 ngày gần nhất → gửi sang AI Service → AI trả về dự báo → lưu vào DB → sáng ra nhân viên thấy kết quả mới.

---

## Pipeline 7 bước — trái tim của hệ thống

Mỗi sản phẩm đi qua 7 bước này:

```
[Lịch sử xuất kho 90 ngày]
         ↓
  1. Phân loại cầu        →  sản phẩm này thuộc loại nào?
         ↓
  2. Chuẩn bị dữ liệu     →  lấp đầy ngày thiếu, sắp xếp liên tục
         ↓
  3. Đánh giá mô hình     →  XGBoost hay Holt-Winters tốt hơn?
         ↓
  4. Chọn mô hình thắng   →  cái nào có sai số nhỏ hơn
         ↓
  5. Train lại & Dự báo   →  dự báo 7 ngày tới
         ↓
  6. Tính chỉ số tồn kho  →  cần đặt bao nhiêu? khi nào?
         ↓
  7. Tính độ tin cậy      →  kết quả này đáng tin đến mức nào?
         ↓
[Kết quả gửi về Backend]
```

---

## Bước 1 — Phân loại cầu

### Vấn đề

Không phải sản phẩm nào cũng có pattern giống nhau:
- Xi măng: ngày nào cũng xuất đều đặn
- Thiết bị điện đặc biệt: cả tháng chỉ xuất 2-3 lần
- Sơn màu theo đơn: khi xuất thì xuất nhiều bất thường

Nếu dùng chung 1 cách tính cho tất cả → sai số lớn.

### Giải pháp — Ma trận Syntetos-Boylan

Dùng 2 chỉ số để phân loại:

**ADI** — Demand có thưa không?  
→ Trung bình khoảng cách ngày giữa các lần xuất kho

**CV²** — Lượng xuất có bất thường không?  
→ Độ biến thiên của lượng xuất mỗi lần (cao = lúc ít lúc nhiều)

```
                 Lượng đều (CV² thấp)    Lượng bất thường (CV² cao)
Xuất thường xuyên    →    SMOOTH              ERRATIC
Xuất thưa thớt       →  INTERMITTENT           LUMPY
```

| Loại | Ví dụ thực tế | Mô hình dùng |
|------|--------------|-------------|
| **Smooth** | Xi măng, cát, gạch | XGBoost hoặc Holt-Winters |
| **Erratic** | Sơn màu theo đơn | Holt-Winters |
| **Intermittent** | Thiết bị đặc biệt | Holt-Winters |
| **Lumpy** | Vật tư dự phòng hiếm | Holt-Winters thận trọng |

Phân loại này quyết định mô hình nào sẽ được dùng và cách tính chỉ số tồn kho.

---

## Bước 2 — Chuẩn bị dữ liệu

Dữ liệu thực tế từ DB chỉ có những ngày **có giao dịch**. Nhưng model cần chuỗi ngày **liên tục**.

```
Dữ liệu thô:    [01/05: 12]  [03/05: 8]  [07/05: 15]
                    ↑ ngày 02, 04, 05, 06 bị thiếu

Sau xử lý:      01/05: 12
                02/05:  0   ← fill = 0 (ngày không xuất kho)
                03/05:  8
                04/05:  0
                05/05:  0
                06/05:  0
                07/05: 15
```

Fill bằng 0 là đúng về nghĩa kinh doanh — ngày không có giao dịch nghĩa là không tiêu thụ, không phải data bị mất.

---

## Bước 3–5 — Chọn mô hình

### 2 mô hình trong hệ thống

**XGBoost** — học từ pattern lịch sử
- Cần ít nhất **60 ngày** data
- Phù hợp demand đều đặn (smooth)
- Phân tích nhiều yếu tố: ngày trong tuần, tuần trước, tháng trước...

**Holt-Winters** — bắt xu hướng tăng/giảm
- Chỉ cần **14 ngày** data
- Phù hợp mọi loại demand kể cả thưa
- Tự điều chỉnh α và β để bắt trend

### Làm sao biết cái nào tốt hơn?

Không dùng train/test split đơn giản (train 80%, test 20%). Thay vào đó dùng **Rolling-Origin Evaluation** — mô phỏng đúng cách dùng thực tế:

```
Dữ liệu 90 ngày: [d₁ ............. d₉₀]

Fold 1:  Train [d₁→d₆₉]  →  Dự báo 7 ngày  →  So với [d₇₀→d₇₆]
Fold 2:  Train [d₁→d₇₆]  →  Dự báo 7 ngày  →  So với [d₇₇→d₈₃]
Fold 3:  Train [d₁→d₈₃]  →  Dự báo 7 ngày  →  So với [d₈₄→d₉₀]
```

Đo **MAE** (sai số trung bình) của mỗi model qua 3 lần → model nào sai số nhỏ hơn → **thắng**.

Model thắng được train lại trên **toàn bộ 90 ngày** → dự báo 7 ngày tiếp theo.

---

## Bước 6 — Chỉ số tồn kho

Từ dự báo demand, tính 3 chỉ số để cảnh báo và gợi ý đặt hàng:

### Safety Stock — Tồn kho an toàn

```
SS = 1.65 × độ_lệch_chuẩn_demand × √(lead_time)
```

Đây là **đệm dự phòng** cho những biến động bất ngờ.  
Hệ số 1.65 tương ứng mức phục vụ 95% — tức là 95% trường hợp không hết hàng.

### Reorder Point — Điểm đặt hàng lại

```
ROP = demand_trung_bình × lead_time + safety_stock
```

Khi tồn kho chạm mức này → **đặt hàng ngay** để kịp nhận trước khi hết.

### EOQ — Lượng đặt hàng tối ưu

```
EOQ = √(2 × nhu_cầu_năm × chi_phí_đặt_hàng / chi_phí_lưu_kho)
```

Lượng đặt mỗi lần để tổng chi phí (đặt hàng + lưu kho) là **nhỏ nhất**.

---

## Bước 7 — Độ tin cậy

Mỗi dự báo đi kèm 1 con số từ 0 đến 1 cho biết "kết quả này đáng tin đến đâu":

```
Confidence = 40% × (nhiều data?) 
           + 30% × (demand đều không?)
           + 30% × (model có tốt hơn đoán mò không?)
```

**Nhiều data?** — 90 ngày cho điểm 0.5, cần 180 ngày mới đạt điểm tối đa.

**Demand đều không?**  
- Smooth → 1.0 (dễ dự báo)
- Erratic → 0.7
- Intermittent → 0.6
- Lumpy → 0.4 (khó dự báo nhất)

**Model có tốt hơn đoán mò không?** — So sánh với **naive forecast** (dự báo ngày mai = hôm nay). Nếu model chỉ ngang bằng hoặc tệ hơn → điểm thấp.

Ví dụ: sản phẩm có 70 ngày data, smooth demand, XGBoost tốt hơn naive 30%:
```
Confidence = 40%×0.39 + 30%×1.0 + 30%×0.85 = 71%
```

---

## Vòng lặp Tự học

Đây là phần hệ thống "thông minh dần" theo thời gian.

### Cơ chế

```
Tuần 1: Chạy forecast
   → Rolling-origin chọn XGBoost
   → Lưu DB: model_used = "xgboost", predicted = 78
         ↓ (chờ 7 ngày)
Tuần 2: AccuracyEvaluator chạy 2:30 AM
   → Tính tổng xuất kho thực 7 ngày qua: actual = 72
   → MAPE = |78-72|/72 × 100 = 8.3%
   → Ghi vào DB
         ↓
Tuần 2: Chạy forecast tiếp theo
   → getBestModel() đọc lịch sử → XGBoost avg MAPE thấp hơn HW
   → Gửi preferred_model = "xgboost" sang AI Service
   → AI Service dùng luôn XGBoost, bỏ qua evaluation bước này
         ↓
Tuần 3-4-5: Tiếp tục học...
   → Nếu XGBoost vẫn tốt → tiếp tục preferred
   → Nếu HW bắt đầu tốt hơn → tự chuyển model
```

### Điều kiện kích hoạt

Hệ thống chỉ ưu tiên model sau khi có **ít nhất 3 lần đánh giá** — tránh 1 tuần outlier làm lệch kết quả.

### Hiển thị trên giao diện

```
📚 Lịch sử Tự học  |  🏆 Đã học: XGBoost

  Ngày    Model         Dự báo   Thực tế   MAPE
 19/05   xgboost          42       39      ✅ 7.7%
 12/05   xgboost          45       41      ✅ 9.8%
 05/05   xgboost          38       40      ✅ 5.0%
 28/04   holt_winters     51       39      ⚠️ 30.8%

 Đã đủ 3/3 → hệ thống ưu tiên XGBoost cho sản phẩm này
```

---

## Những điều cần biết khi demo

**Dữ liệu lịch sử tự học là mock** — được seed vào DB để demo. Trong thực tế cần ít nhất 3-4 tuần chạy thật để có lịch sử. Cơ chế đánh giá accuracy và vòng lặp tự học là thật, chỉ có data demo là tạo sẵn.

**Model không thực sự "retrain"** — "Tự học" ở đây là *chọn model phù hợp hơn* dựa trên kết quả thực tế, không phải cập nhật weights như Deep Learning. Đây là model selection thông minh, không phải online learning.

**MAPE cao với sản phẩm xuất thất thường là bình thường** — Lumpy demand về bản chất khó dự báo. MAPE 30-50% với sản phẩm thưa là chấp nhận được trong thực tế.

---

## Tóm tắt

| Vấn đề | Giải pháp |
|--------|-----------|
| Sản phẩm khác nhau cần cách xử lý khác | Phân loại demand (Syntetos-Boylan) |
| Không biết model nào tốt hơn | Rolling-origin 3-fold evaluation |
| Hệ thống không thích nghi | Vòng lặp tự học qua MAPE thực tế |
| Không biết kết quả đáng tin không | Confidence score 3 thành phần |
| Không biết khi nào đặt hàng | Safety Stock, ROP, EOQ tự động |
