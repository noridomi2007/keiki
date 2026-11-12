# BE_PLAN.md: kế hoạch vibe-coding cho Backend và Triển khai (Antigravity)

Đọc `AGENTS.md` và `docs/CONTRACT.md` trước. Bạn sở hữu `backend/`, `Dockerfile` và việc deploy. Hạng mục **[Nền]** làm trước ngày thi, **[Ngày thi]** chỉ làm khi `PHASE: HACKATHON`. Bạn cũng là người duy nhất được deploy và quản lý nhánh `main`.

## 1. Mục tiêu

Một dịch vụ FastAPI duy nhất trên Cloud Run: phục vụ API, phục vụ giao diện React đã build, điều phối job của agent, phát SSE, xuất Excel.

| Hạng mục | Nhãn |
|---|---|
| Hạ tầng, Dockerfile, deploy Cloud Run (SW-01) | [Nền] |
| Firestore, Storage, API documents và transactions CRUD, endpoint giả `POST /api/extract` (SW-02) | [Nền] |
| Hộ kinh doanh demo cố định, không đăng nhập (SW-03) | [Nền] |
| Phần backend của màn Sổ (SW-06) | [Nền] |
| Job, SSE, tích hợp agent (SW-07, SW-08) | [Ngày thi] |
| Hàng đợi xác nhận: confirm, reject, PATCH trạng thái (SW-09) | [Ngày thi] |
| Báo cáo (SW-12), xuất Excel (SW-13), demo reset (SW-17), deploy cuối (SW-18) | [Ngày thi] |

## 2. Setup

- Python 3.11+, tạo `backend/requirements.txt`:

```
fastapi
uvicorn[standard]
pydantic>=2
python-multipart
google-cloud-firestore
google-cloud-storage
openpyxl
google-genai        # chỉ cần khi PHASE: HACKATHON (package agent/ dùng)
pytest
httpx
```

- Chạy local: `uvicorn backend.app.main:app --reload --port 8080` (từ thư mục gốc, đặt `PYTHONPATH=.`).
- Test: `pytest backend`.

**Biến môi trường** (liệt kê trong `backend/.env.example`, không commit giá trị thật):

| Biến | Ý nghĩa |
|---|---|
| `GCP_PROJECT` | id dự án Google Cloud |
| `GCS_BUCKET` | bucket lưu ảnh và âm thanh |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | khóa và tên model (kiểm tra model Flash hiện hành trong AI Studio) |
| `DEMO_HOUSEHOLD_ID` | mặc định `demo` |
| `MOCK_MODE` | `true` thì endpoint đọc trả fixture |
| `DEMO_MODE` | `true` thì cho phép `POST /api/demo/reset` |
| `MAX_UPLOAD_MB` | mặc định 8 |

## 3. Cấu trúc thư mục

```
backend/
  app/
    main.py          tạo app, gắn router, phục vụ static + SPA fallback
    config.py        đọc biến môi trường
    models.py        Pydantic khớp docs/CONTRACT.md (nguồn của FE contract.ts)
    errors.py        lỗi chuẩn {error:{code,message,details}}
    routers/         documents.py, transactions.py, jobs.py, report.py, export.py, demo.py
    services/        jobs.py (JobRunner), report.py, exporter.py
    repositories/    base.py (Repository protocol), memory.py, firestore.py
    fixtures/        *.json (MOCK_MODE)
    templates/       mẫu sổ Excel chính thức (AI Dev khảo sát cột, bạn đặt file)
  tests/
```

## 4. Thiết kế

**Repository.** Một lớp truy cập dữ liệu duy nhất theo protocol trong CONTRACT mục 9 cộng các hàm CRUD cho documents và transactions. Có hai hiện thực: `MemoryRepo` (test, mock) và `FirestoreRepo` (thật). Mọi router chỉ gọi repository, không gọi Firestore trực tiếp.

**Firestore.** Bộ sưu tập: `households`, `documents`, `transactions`, `jobs`, `tax_codes`. Truy vấn lọc theo `household_id`; việc lọc thêm theo trạng thái, ngày, loại làm **trong Python** với dữ liệu demo nhỏ, để tránh phải tạo chỉ mục tổng hợp (code do AI sinh hay dính lỗi này).

**Tải tệp.** Kiểm tra loại và dung lượng ở server, tính `sha256` ở server, lưu vào Cloud Storage tại `household_id/document_id.ext`. Trả ảnh gốc qua `GET /api/documents/{id}/file` do backend proxy, **không dùng signed URL** (cần quyền ký thêm, dễ lỗi).

**Phục vụ giao diện.** FastAPI mount thư mục `static/` (kết quả build của `frontend/`); mọi đường dẫn không bắt đầu bằng `/api` trả về `index.html` (SPA fallback).

**[Ngày thi] JobRunner.**
1. `POST /api/documents` lưu tệp, tạo `Job`, chạy `agent.process_document` bằng `asyncio.create_task`.
2. Mỗi sự kiện: ghi vào mảng `events` của job trong Firestore **và** đẩy vào `asyncio.Queue` của job.
3. `GET /api/jobs/{id}/stream` phát lại các sự kiện đã lưu, rồi đọc tiếp từ hàng đợi. Gửi dòng comment nhắc nhịp mỗi 15 giây. Header: `Cache-Control: no-cache`, `X-Accel-Buffering: no`.
4. Sự kiện cuối của agent: gán `id`, lưu giao dịch, phát `save` rồi `done`.
5. Lỗi hoặc quá thời gian: phát `error`, giao dịch (nếu đọc được) vào hàng đợi. Không bao giờ ghi sổ khi lỗi.

**Cloud Run và CPU.** Mặc định CPU chỉ được cấp khi đang có request. Một tác vụ nền sẽ bị làm chậm hoặc dừng nếu không có kết nối nào còn mở. Vì vậy deploy với `--no-cpu-throttling` (và min instance 1) khi demo, hoặc chạy agent ngay trong request SSE. Vì job được lưu vào Firestore, nếu instance bị thay thế thì FE polling vẫn đọc được sự kiện đã lưu.

**Xuất Excel [Ngày thi].**
1. Nạp file mẫu trong `templates/` bằng `openpyxl.load_workbook` (giữ nguyên định dạng).
2. Dòng bắt đầu, cột và tên sheet khai báo trong `export/mapping.py` (AI Dev cung cấp danh sách cột ở AI-05).
3. Điền dữ liệu giao dịch `recorded` của tháng được chọn; tổng theo cột.
4. `evidence=true`: tạo `.zip` gồm file Excel, thư mục ảnh gốc theo ngày và `index.csv` đối chiếu giao dịch với ảnh.
5. Trả bằng `StreamingResponse` với `Content-Disposition`.
6. Làm đúng **một** mẫu sổ trước; mẫu cần chọn do người làm kế toán hoặc nguồn chính thức xác nhận, không tự đoán.

**Báo cáo [Ngày thi].** Tính toàn bộ số trong code Python (tổng, top mặt hàng, tăng giá). Sau đó mới gọi `agent.report.summarize(numbers)` để lấy `summary_text`. Không để mô hình tự tính tiền.

## 5. Dockerfile

```dockerfile
FROM node:20-slim AS fe
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
# [Ngày thi] nếu cần chuyển định dạng âm thanh: apt-get update && apt-get install -y ffmpeg
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY agent/ ./agent/
COPY --from=fe /fe/dist ./static
ENV PYTHONPATH=/app
CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

## 6. Deploy

```bash
gcloud run deploy ketoan-tui \
  --source . --region asia-southeast1 --allow-unauthenticated \
  --memory 1Gi --cpu 1 --timeout 300 \
  --set-env-vars GCP_PROJECT=<id>,GCS_BUCKET=<bucket>,GEMINI_MODEL=<model>,DEMO_HOUSEHOLD_ID=demo,DEMO_MODE=true \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

- Giai đoạn Nền: để `--min-instances 0` cho tiết kiệm.
- Ngày thi và lúc trình bày: thêm `--min-instances 1 --no-cpu-throttling`, và "đánh thức" dịch vụ trước khi lên sân khấu.
- **Quay lại bản trước:** `gcloud run services update-traffic ketoan-tui --to-revisions <tên-bản-cũ>=100`. Ghi lại tên bản ổn định gần nhất sau mỗi lần deploy tốt.
- Dịch vụ cần quyền: Firestore User, Storage Object Admin trên bucket, Secret Accessor.

## 7. Prompt cho Antigravity

**BE-01 [Nền]: khung dự án**
```
Đọc AGENTS.md, docs/CONTRACT.md và docs/plans/BE_PLAN.md. Tạo khung FastAPI trong backend/
theo mục 3: main.py, config.py (biến môi trường mục 2), errors.py (lỗi chuẩn CONTRACT mục 7),
models.py (Pydantic khớp CONTRACT mục 3 và 4), GET /api/health. Thêm .env.example và
requirements.txt. Nêu kế hoạch file trước khi tạo. Chỉ làm đúng việc này.
```

**BE-02 [Nền]: repository**
```
Tạo repositories/base.py (protocol CONTRACT mục 9 cộng CRUD documents và transactions),
memory.py và firestore.py. Lọc theo status, type, ngày làm trong Python. Viết pytest cho
MemoryRepo. Chỉ làm đúng việc này, chưa tạo router.
```

**BE-03 [Nền]: documents và transactions**
```
Tạo routers/documents.py: POST /api/documents (multipart, kiểm tra loại và dung lượng, tính
sha256, lưu Cloud Storage, job_id luôn null), GET /api/documents/{id}/file (proxy). Tạo
routers/transactions.py: GET (lọc), POST (nhập tay, source=manual, status=recorded), PATCH,
DELETE. Thêm POST /api/extract làm STUB trả ExtractionResult cố định từ fixtures. Test bằng
httpx và MemoryRepo. Chỉ làm đúng việc này.
```

**BE-04 [Nền]: mock, Docker, deploy**
```
Thêm MOCK_MODE đọc fixtures/*.json (12 giao dịch đủ 3 trạng thái, 1 ExtractionResult, 1 Job,
1 Report). Mount static/ và SPA fallback trong main.py. Viết Dockerfile multi-stage theo mục
5 và README.md ngắn (chạy local, build, deploy theo mục 6). Chỉ làm đúng việc này.
```

**BE-05 [Ngày thi]: JobRunner và SSE**
```
Tạo services/jobs.py (JobRunner) và routers/jobs.py theo mục 4: tạo Job, chạy
agent.process_document bằng asyncio.create_task, lưu events vào Firestore và đẩy vào
asyncio.Queue; GET /api/jobs/{id} và GET /api/jobs/{id}/stream phát lại sự kiện đã lưu rồi
đọc tiếp, nhắc nhịp 15 giây, header đúng. Dùng một FakeAgent trong test. Cập nhật
POST /api/documents trả job_id thật.
```

**BE-06 [Ngày thi]: tích hợp agent thật**
```
Nối package agent/ vào JobRunner theo CONTRACT mục 9: tạo DocumentRef, AgentContext với
repository thật; khi nhận sự kiện cuối, gán id và lưu giao dịch, phát save rồi done. Xóa STUB
POST /api/extract. Lỗi hoặc quá thời gian: phát error, đưa vào hàng đợi, không ghi sổ.
```

**BE-07 [Ngày thi]: hàng đợi xác nhận**
```
Thêm POST /api/transactions/{id}/confirm và /reject; PATCH cho giao dịch needs_review. Kiểm
tra chuyển trạng thái hợp lệ (needs_review → recorded | rejected), trả lỗi chuẩn nếu sai.
```

**BE-08 [Ngày thi]: báo cáo**
```
Tạo services/report.py tính trong code: tổng doanh thu, chi phí, lãi tạm tính, top mặt hàng,
mặt hàng tăng giá, số giao dịch chờ. Router GET /api/report khớp CONTRACT. Sau khi tính, gọi
agent.report.summarize để lấy summary_text; nếu lỗi thì summary_text = null.
```

**BE-09 [Ngày thi]: xuất Excel**
```
Tạo services/exporter.py và routers/export.py theo mục 4: nạp mẫu trong templates/, điền theo
export/mapping.py, hỗ trợ evidence=true (zip gồm Excel, ảnh gốc, index.csv). Test: file mở
được, tổng khớp dữ liệu.
```

**BE-10 [Ngày thi]: hoàn thiện**
```
Thêm POST /api/demo/reset (chỉ khi DEMO_MODE=true, nạp lại dữ liệu demo). Rà soát: giới hạn
upload, thông báo lỗi tiếng Việt, log không chứa nội dung chứng từ, health check. Cập nhật
README với lệnh deploy cuối và cách rollback.
```

## 8. Kiểm tra trước khi commit

- `pytest backend` đạt; `uvicorn` chạy được; `docker build .` thành công.
- Mọi endpoint khớp `docs/CONTRACT.md` (kể cả mã lỗi).
- Không log nội dung chứng từ; không commit `.env` hay khóa.
- Cập nhật `docs/SCOPE_30.md`.

## 9. Lỗi thường gặp

- **Task nền bị dừng trên Cloud Run:** xem phần "Cloud Run và CPU" ở trên.
- **Firestore báo thiếu chỉ mục:** bạn đang kết hợp lọc và sắp xếp phía server; chuyển sang lọc trong Python.
- **CORS khi chạy local:** dùng proxy của Vite thay vì mở CORS rộng.
- **Tải lên lớn bị từ chối:** kiểm tra giới hạn 8 MB cả ở FE (nén ảnh) lẫn BE.
- **SSE đến dồn một lúc:** kiểm tra header `X-Accel-Buffering: no` và không bật nén cho `text/event-stream`.
- **Ảnh iPhone định dạng HEIC:** trả lỗi 415 kèm hướng dẫn chụp lại bằng JPEG (FE đã nén sang JPEG trước khi tải).
