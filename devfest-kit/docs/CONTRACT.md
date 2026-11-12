# CONTRACT.md: hợp đồng dữ liệu và API

Nguồn sự thật duy nhất cho FE, BE và AI Dev. Mọi thay đổi phải sửa file này **trước**, rồi cập nhật `backend/app/models.py` và `frontend/src/types/contract.ts` trong cùng một commit.

Nhãn **[Nền]** = có thể làm trước ngày thi. **[Ngày thi]** = chỉ làm khi `PHASE: HACKATHON` (xem `AGENTS.md`).

## 1. Quy ước chung

- Tiền: số nguyên VND, trường có hậu tố `_vnd`. Không dùng số thực.
- Ngày: `YYYY-MM-DD`. Thời điểm: ISO 8601 UTC (`2026-11-12T03:15:00Z`). Hiển thị theo `Asia/Ho_Chi_Minh`.
- Id: chuỗi, tiền tố theo loại (`txn_`, `doc_`, `job_`).
- Một hộ kinh doanh demo cố định: `household_id = "demo"` (lấy từ biến môi trường `DEMO_HOUSEHOLD_ID`). Không có đăng nhập.
- JSON dùng `snake_case`. Thông điệp cho người dùng viết bằng tiếng Việt.

## 2. Enum

- `type`: `revenue` | `expense`
- `category` (doanh thu): `ban_hang`, `dich_vu`, `thu_khac`
- `category` (chi phí): `nhap_hang`, `chi_phi_van_hanh`, `luong`, `thue_phi`, `chi_khac`
- `status`: `recorded` (đã ghi) | `needs_review` (cần xác nhận) | `rejected` (từ chối)
- `source`: `agent` | `manual`
- `document.kind`: `image` | `audio` | `transfer` (ảnh chụp màn hình chuyển khoản)
- `warning.code`: `DUPLICATE`, `PRICE_ANOMALY`, `TOTAL_MISMATCH`, `MISSING_FIELD`, `LOW_CONFIDENCE`, `TAX_CODE_NOT_FOUND`, `IMAGE_QUALITY`
- `warning.severity`: `high` | `medium` | `info`
- `job.status`: `queued` | `running` | `done` | `error`

## 3. Giao dịch (Transaction)

```json
{
  "id": "txn_01",
  "household_id": "demo",
  "document_id": "doc_01",
  "date": "2026-11-12",
  "type": "expense",
  "category": "nhap_hang",
  "amount_vnd": 1250000,
  "counterparty": "Cửa hàng Minh Phát",
  "tax_code": "0401234567",
  "items": [
    {"name": "Cà phê hạt 1kg", "quantity": 5, "unit_price_vnd": 250000, "line_total_vnd": 1250000}
  ],
  "confidence": {"date": 0.98, "amount_vnd": 0.95, "counterparty": 0.9},
  "status": "needs_review",
  "warnings": [
    {"code": "PRICE_ANOMALY", "severity": "medium",
     "message": "Đơn giá cà phê hạt cao hơn 39% so với trung vị 3 lần nhập trước (180.000 đ)."}
  ],
  "source": "agent",
  "created_at": "2026-11-12T03:15:00Z",
  "updated_at": "2026-11-12T03:15:00Z"
}
```

- Bắt buộc: `id`, `household_id`, `date`, `type`, `amount_vnd` (> 0), `status`, `source`, `created_at`, `updated_at`.
- Có thể `null`: `document_id` (khi nhập tay), `category`, `counterparty`, `tax_code`, `confidence` (khi nhập tay là `{}`).
- `items` có thể rỗng. Nếu có thì `line_total_vnd = quantity * unit_price_vnd` (cho phép lệch do làm tròn trên chứng từ gốc, luật `TOTAL_MISMATCH` xử lý).
- Trường người dùng được sửa qua PATCH: `date`, `type`, `category`, `amount_vnd`, `counterparty`, `tax_code`, `items`.

## 4. Chứng từ (Document) và Job

```json
{"id": "doc_01", "household_id": "demo", "kind": "image", "mime_type": "image/jpeg",
 "sha256": "…", "storage_path": "demo/doc_01.jpg", "uploaded_at": "2026-11-12T03:14:50Z"}
```

```json
{"id": "job_01", "document_id": "doc_01", "status": "running",
 "events": [], "transaction_id": null, "error": null}
```

## 5. API

Mọi phản hồi thành công là JSON (trừ file và SSE). Mọi lỗi theo mục 7.

### [Nền]

- `GET /api/health` → `{"status": "ok", "mock": false}`
- `POST /api/documents` (multipart: `file`, `kind`) → `201 {"document_id": "doc_01", "job_id": null}`. Ở giai đoạn Nền chỉ lưu tệp, `job_id` luôn `null`. Giới hạn 8 MB; chỉ nhận JPEG, PNG, WebP, và âm thanh webm/mp4/wav/mp3.
- `GET /api/documents/{id}/file` → trả nội dung tệp gốc (backend proxy, không dùng signed URL).
- `GET /api/transactions?status=&type=&from=&to=` → `{"items": [Transaction], "total": 12}`, mới nhất trước.
- `POST /api/transactions` → `201 Transaction` (nhập tay: `source = "manual"`, `status = "recorded"`).
- `PATCH /api/transactions/{id}` → `Transaction`.
- `DELETE /api/transactions/{id}` → `204`.
- `POST /api/extract` **(STUB)** body `{"document_id": "doc_01"}` → trả một `ExtractionResult` cố định từ fixture. Xóa khi tích hợp agent thật.

### [Ngày thi]

- `POST /api/documents` trả thêm `job_id` thật và tự chạy agent.
- `GET /api/jobs/{id}` → `Job`.
- `GET /api/jobs/{id}/stream` → SSE (mục 6).
- `POST /api/transactions/{id}/confirm` → `Transaction` với `status = "recorded"`.
- `POST /api/transactions/{id}/reject` body `{"reason": "…"}` (tùy chọn) → `Transaction` với `status = "rejected"`.
- `GET /api/report?period=week|month&anchor=YYYY-MM-DD` → `Report`:
  ```json
  {"period": {"from": "2026-11-09", "to": "2026-11-15"},
   "totals": {"revenue_vnd": 0, "expense_vnd": 0, "profit_vnd": 0},
   "top_items": [{"name": "…", "total_vnd": 0}],
   "price_increases": [{"item": "…", "counterparty": "…", "old_vnd": 0, "new_vnd": 0, "pct": 0.0}],
   "pending_review": 0,
   "summary_text": null}
  ```
- `GET /api/export?month=YYYY-MM&evidence=true|false` → `.xlsx` (hoặc `.zip` nếu `evidence=true`).
- `POST /api/demo/reset` → xóa và nạp lại dữ liệu demo. Chỉ hoạt động khi `DEMO_MODE=true`.

## 6. Sự kiện SSE

`GET /api/jobs/{id}/stream` gửi từng sự kiện dạng `data: <JSON>\n\n`, nhắc nhịp mỗi 15 giây bằng dòng comment.

```json
{"job_id": "job_01", "seq": 3, "step": "validate", "status": "warn",
 "message": "Đơn giá cà phê hạt cao hơn 39% so với lần nhập trước.",
 "data": {"warning_code": "PRICE_ANOMALY"}}
```

- `step`: `receive` → `quality_check` → `extract` → `normalize` → `validate` → `decide` → `save` → `done` | `error`
- `status`: `running` | `ok` | `warn` | `error`
- `message`: tiếng Việt, một câu, người dùng đọc được.
- Sự kiện `done`: `data = {"transaction_id": "txn_01", "decision": "recorded" | "needs_review"}`.
- Sự kiện `error`: `data = {"code": "…"}`; giao dịch (nếu có thể đọc được) vẫn chuyển vào hàng đợi.
- Nếu SSE đứt, FE gọi lại `GET /api/jobs/{id}` mỗi giây để lấy `events` đã lưu.

## 7. Lỗi chuẩn

```json
{"error": {"code": "FILE_TOO_LARGE", "message": "Ảnh lớn hơn 8 MB. Hãy chụp lại hoặc giảm độ phân giải.", "details": {}}}
```

Mã HTTP: 400 dữ liệu sai, 404 không thấy, 413 tệp quá lớn, 415 loại tệp không hỗ trợ, 422 sai schema, 500 lỗi hệ thống. `message` luôn tiếng Việt và nói cách sửa.

## 8. Mock và fixture (ngoại lệ cho giai đoạn Nền)

- `MOCK_MODE=true` ở backend: các endpoint đọc trả dữ liệu từ `backend/app/fixtures/*.json`.
- `VITE_MOCK=true` ở frontend: dùng dữ liệu trong `frontend/src/mocks/` khi backend chưa sẵn sàng.
- Fixture tối thiểu: 12 giao dịch mẫu (đủ ba trạng thái), 1 `ExtractionResult` mẫu, 1 `Job` mẫu có đủ sự kiện, 1 `Report` mẫu.
- Đây là dữ liệu giả để FE không phải chờ, không tính là tính năng thật.

## 9. Giao diện Python giữa `backend/` và `agent/`

```python
# agent/api.py
class DocumentRef(BaseModel):
    document_id: str
    kind: Literal["image", "audio", "transfer"]
    mime_type: str
    data: bytes
    sha256: str

class AgentEvent(BaseModel):
    seq: int
    step: str            # xem mục 6
    status: Literal["running", "ok", "warn", "error"]
    message: str         # tiếng Việt
    data: dict = {}

class AgentContext(BaseModel):
    household_id: str
    repo: "Repository"   # backend cung cấp, xem bên dưới
    settings: "AgentSettings"

async def process_document(doc: DocumentRef, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
    """Phát từng sự kiện. Sự kiện cuối: step='done',
    data={'transaction': <Transaction dict, chưa có id>, 'decision': 'recorded'|'needs_review'}."""
```

Backend nhận sự kiện cuối, gán `id`, lưu giao dịch, rồi phát sự kiện `save` và `done`.

```python
# Do backend hiện thực, agent chỉ gọi
class Repository(Protocol):
    async def find_duplicates(self, household_id: str, counterparty_norm: str | None,
                              date: str, amount_vnd: int, sha256: str | None) -> list[Transaction]: ...
    async def price_history(self, household_id: str, item_norm: str,
                            counterparty_norm: str | None, limit: int = 10) -> list[PricePoint]: ...
    async def lookup_tax_code(self, tax_code: str) -> TaxCodeInfo | None: ...
```

`PricePoint = {item_norm, counterparty_norm, unit_price_vnd, date}`. `TaxCodeInfo = {tax_code, name, status}`. Backend có `MemoryRepo` (test, mock) và `FirestoreRepo` (thật).

## 10. Quy trình đổi contract

1. Người cần đổi mở `docs/CONTRACT.md` và sửa kèm lý do.
2. Cập nhật `models.py` và `contract.ts` trong cùng commit.
3. Báo hai người còn lại. Không merge nếu chưa có người xác nhận.
