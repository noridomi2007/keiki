# BE_PLAN.md: Kế hoạch xây dựng Backend & Hạ tầng Google Cloud Hoàn chỉnh — Dự án Keiki

Đọc `AGENTS.md`, `docs/ROADMAP.md` và `docs/CONTRACT.md` trước. Bạn sở hữu `backend/`, `Dockerfile` và việc triển khai lên **Google Cloud Run**. Toàn bộ tính năng được xây dựng **hoàn chỉnh 100%**.

---

## 1. Mục tiêu

Xây dựng dịch vụ FastAPI hợp nhất trên **Google Cloud Run** (`service: keiki`):
- Phục vụ đầy đủ REST API và ứng dụng React PWA đã build.
- Lưu trữ dữ liệu trên **Google Cloud Firestore** (kèm `MemoryRepo` nạp sẵn dữ liệu mẫu Đà Nẵng phong phú để chạy local hoặc demo tức thì).
- Lưu trữ chứng từ gốc (ảnh hóa đơn, ảnh chuyển khoản, ghi âm giọng nói) trên **Google Cloud Storage (GCS)** (kèm fallback lưu ổ cứng local khi phát triển).
- Điều phối tiến trình **Gemini Multimodal Agent** bất đồng bộ (`JobRunner`) và phát sự kiện **SSE** thời gian thực.
- Xử lý **Gộp chứng từ trùng chéo (`merge_into_duplicate=true`)** giữa hóa đơn giấy và ảnh chuyển khoản.
- Tính toán báo cáo thu chi, ước tính nghĩa vụ thuế theo nhóm ngành và **Độ minh bạch Hồ sơ Vay vốn Ngân hàng (`loan_readiness`)**.
- Xuất trọn bộ sổ kế toán chuẩn **Thông tư 152/2025/TT-BTC** (`S1-HKD`, `S2-HKD`, `S3-HKD` + `HoSoVayVon`) ra file `.xlsx` tương thích **Google Sheets** và gói `.zip` chứa toàn bộ ảnh chứng từ gốc đối chiếu.

---

## 2. Cài đặt & Hệ sinh thái Google Cloud

Python 3.11+, tạo `backend/requirements.txt`:

```txt
fastapi
uvicorn[standard]
pydantic>=2
python-multipart
google-cloud-firestore
google-cloud-storage
google-cloud-logging
google-cloud-texttospeech
openpyxl
google-genai
pytest
pytest-asyncio
httpx
```

**Biến môi trường** (liệt kê trong `backend/.env.example`, khóa thật lưu trong **Google Cloud Secret Manager**):

| Biến | Ý nghĩa |
|---|---|
| `GCP_PROJECT` | ID dự án Google Cloud (nếu để trống sẽ tự động dùng `MemoryRepo` + lưu file local) |
| `GCS_BUCKET` | Bucket trên Google Cloud Storage lưu ảnh hóa đơn, ảnh chuyển khoản và ghi âm |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Khóa API từ Google AI Studio / Secret Manager và tên model (`gemini-2.5-flash`) |
| `DEMO_HOUSEHOLD_ID` | Mặc định `demo` (*Quán Mì Quảng & Tạp hóa Bà Sáu — Hải Châu, Đà Nẵng*) |
| `MAX_UPLOAD_MB` | Mặc định `8` |

---

## 3. Cấu trúc thư mục `backend/`

```
backend/
  app/
    main.py          Khởi tạo FastAPI, gắn toàn bộ router, mount static PWA + SPA fallback
    config.py        Đọc biến môi trường & cấu hình Google Cloud
    models.py        Pydantic v2 khớp 100% docs/CONTRACT.md
    errors.py        Định dạng lỗi chuẩn tiếng Việt {error:{code,message,details}}
    routers/
      documents.py   POST /api/documents (kích hoạt JobRunner), GET /api/documents/{id}/file
      jobs.py        GET /api/jobs/{id}, GET /api/jobs/{id}/stream (SSE)
      transactions.py CRUD giao dịch + POST confirm (hỗ trợ gộp chứng từ) + POST reject
      report.py      GET /api/report (thu chi, thuế TT 152, hồ sơ vay vốn, nhận xét Gemini)
      export.py      GET /api/export (xuất Excel .xlsx chuẩn TT 152 & gói chứng từ .zip)
      demo.py        POST /api/demo/reset (khôi phục dữ liệu mẫu Đà Nẵng)
    services/
      jobs.py        JobRunner bất đồng bộ nối trực tiếp agent.process_document
      report.py      Tính toán số liệu báo cáo, thuế & độ minh bạch hồ sơ vay vốn
      exporter.py    Xuất sổ Excel Thông tư 152/2025/TT-BTC (S1-HKD, S2-HKD, S3-HKD, HoSoVayVon)
      storage.py     Lưu/đọc tệp trên Google Cloud Storage (có fallback thư mục local)
    repositories/
      base.py        Repository protocol (CONTRACT mục 8 + CRUD)
      memory.py      MemoryRepo nạp sẵn bộ dữ liệu mẫu Đà Nẵng
      firestore.py   FirestoreRepo kết nối Google Cloud Firestore
    fixtures/
      seed_danang.json  Bộ dữ liệu khởi tạo phong phú của hộ kinh doanh tại Đà Nẵng
  tests/             Bộ kiểm thử pytest toàn diện cho API, JobRunner, Gộp chứng từ, Xuất sổ
```

---

## 4. Thiết kế chi tiết các tính năng trọng tâm

### 4.1. `JobRunner` & Luồng SSE thời gian thực (`services/jobs.py`)
1. `POST /api/documents` kiểm tra loại tệp và dung lượng (`<= 8 MB`), tính `sha256`, lưu tệp qua `storage.py`, tạo bản ghi `Job` và chạy `agent.process_document` bằng `asyncio.create_task`.
2. Mỗi sự kiện `AgentEvent` phát ra được lưu vào `job.events` trong Repository **và** đẩy vào `asyncio.Queue` của job.
3. `GET /api/jobs/{id}/stream` phát lại các sự kiện đã có, sau đó đọc tiếp từ hàng đợi cho đến khi gặp `done` hoặc `error`. Gửi comment `: keep-alive\n\n` mỗi 15 giây. Header: `Cache-Control: no-cache`, `X-Accel-Buffering: no`.

### 4.2. Gộp chứng từ trùng chéo: Hóa đơn giấy ↔ Ảnh chuyển khoản (`routers/transactions.py`)
Khi chủ hộ bấm **"Gộp vào hóa đơn gốc"** (`POST /api/transactions/{id}/confirm` với `{"merge_into_duplicate": true}`):
1. Lấy giao dịch gốc `orig_txn` theo `duplicate_of_id`.
2. Đưa `document_id` của chứng từ mới vào `orig_txn.linked_document_ids` (đảm bảo không trùng ID).
3. Nếu chứng từ mới là ảnh chuyển khoản (`payment_method == "transfer"`), cập nhật `orig_txn.payment_method = "transfer"`.
4. Đánh dấu bản ghi trùng tạm thời là `status = "rejected"` và trả về `orig_txn` đã cập nhật.

### 4.3. Xuất sổ Kế toán chuẩn Thông tư 152/2025/TT-BTC & Google Sheets (`services/exporter.py`)
Tạo file `.xlsx` bằng `openpyxl` với định dạng chuẩn kế toán Việt Nam (font Times New Roman / Arial rõ nét, kẻ khung bảng, định dạng số tiền `#,##0`, công thức `SUM`), gồm 4 Sheet:
1. **`S1-HKD (Doanh thu)`:** Sổ chi tiết doanh thu bán hàng hóa, dịch vụ theo mẫu Thông tư 152/2025/TT-BTC, chia cột theo 4 nhóm ngành tính thuế (Phân phối hàng hóa 1,5%; Sản xuất/ăn uống 4,5%; Dịch vụ/xây dựng 7%; Kinh doanh khác 3%).
2. **`S2-HKD (Vật liệu - Hàng hóa)`:** Sổ chi tiết nhập vật liệu, dụng cụ, sản phẩm, hàng hóa (trích xuất từ các dòng `items` của hóa đơn nhập hàng).
3. **`S3-HKD (Chi phí)`:** Sổ chi phí sản xuất, kinh doanh (nhập hàng, vận hành, lương, thuế phí).
4. **`HoSoVayVon (Minh bạch Tín dụng)`:** Bảng tổng hợp dòng tiền, lợi nhuận ròng, ước tính thuế và danh mục đối chiếu mã chứng từ đính kèm (`linked_document_ids`), giúp tiểu thương nộp trực tiếp cho ngân hàng hoặc tải lên **Google Sheets / Google Drive**.
- Khi `evidence=true`: nén thành gói `.zip` gồm file `.xlsx`, thư mục `chung_tu/` chứa các tệp ảnh/ghi âm gốc và bảng `doi_chieu_chung_tu.csv`.

---

## 5. Dockerfile & Triển khai Google Cloud Run

```dockerfile
FROM node:20-slim AS fe
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY agent/ ./agent/
COPY --from=fe /fe/dist ./static
ENV PYTHONPATH=/app
CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

Lệnh triển khai lên **Google Cloud Run**:

```bash
gcloud run deploy keiki \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1Gi --cpu 1 --timeout 300 \
  --min-instances 1 --no-cpu-throttling \
  --set-env-vars GCP_PROJECT=<id>,GCS_BUCKET=<bucket>,GEMINI_MODEL=gemini-2.5-flash,DEMO_HOUSEHOLD_ID=demo \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

---

## 6. Trình tự triển khai chi tiết trong `backend/`

1. **Bước BE-01:** Tạo `config.py`, `errors.py`, `models.py`, `.env.example`, `requirements.txt`.
2. **Bước BE-02:** Tạo `repositories/base.py`, `repositories/memory.py` (kèm `fixtures/seed_danang.json` hoàn chỉnh), `repositories/firestore.py` và `services/storage.py`.
3. **Bước BE-03:** Tạo `services/jobs.py`, `routers/documents.py` và `routers/jobs.py` (hỗ trợ SSE thời gian thực).
4. **Bước BE-04:** Tạo `routers/transactions.py` (CRUD + confirm + gộp chứng từ trùng chéo + reject).
5. **Bước BE-05:** Tạo `services/report.py` và `routers/report.py`.
6. **Bước BE-06:** Tạo `services/exporter.py` và `routers/export.py` (xuất sổ TT 152/2025/TT-BTC `.xlsx` và `.zip`).
7. **Bước BE-07:** Tạo `routers/demo.py`, `main.py`, `Dockerfile` và bộ kiểm thử `backend/tests/`.
