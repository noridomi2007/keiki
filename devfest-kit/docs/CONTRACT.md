# CONTRACT.md: Hợp đồng dữ liệu và API — Dự án Keiki (Sản phẩm Hoàn chỉnh)

Nguồn sự thật duy nhất cho **FE**, **BE** và **AI Dev**. Mọi thay đổi phải sửa file này **trước**, rồi cập nhật đồng bộ `backend/app/models.py`, `agent/schemas.py` và `frontend/src/types/contract.ts` trong cùng một commit.

---

## 1. Quy ước chung

- **Tiền:** số nguyên VND, trường có hậu tố `_vnd`. Tuyệt đối không dùng số thực (`float`) cho tiền tệ.
- **Ngày:** `YYYY-MM-DD`. Thời điểm: ISO 8601 UTC (`2026-11-12T03:15:00Z`). Hiển thị theo múi giờ `Asia/Ho_Chi_Minh`.
- **Id:** chuỗi có tiền tố theo loại (`txn_`, `doc_`, `job_`).
- **Hộ kinh doanh mặc định:** `household_id = "demo"` (lấy từ biến môi trường `DEMO_HOUSEHOLD_ID`, đại diện hộ kinh doanh mẫu *"Quán Mì Quảng & Tạp hóa Bà Sáu — Hải Châu, Đà Nẵng"*).
- **JSON:** dùng `snake_case`. Mọi thông điệp, cảnh báo và câu hỏi chủ động của AI hiển thị cho người dùng đều viết bằng **tiếng Việt** tự nhiên, lễ phép, dễ hiểu với tiểu thương.

---

## 2. Enum chuẩn

- `type`: `revenue` (thu / bán hàng) | `expense` (chi / mua hàng, vận hành)
- `category` (doanh thu): `ban_hang`, `dich_vu`, `an_uong`, `thu_khac`
- `category` (chi phí): `nhap_hang`, `chi_phi_van_hanh`, `luong`, `thue_phi`, `chi_khac`
- `tax_group` (nhóm ngành tính thuế hộ kinh doanh theo quy định & sổ S1-HKD Thông tư 152/2025/TT-BTC):
  - `phan_phoi_hang_hoa` (Phân phối, cung cấp hàng hóa — tỷ lệ thuế 1,5%: GTGT 1% + TNCN 0,5%)
  - `san_xuat_van_tai_an_uong` (Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, ăn uống — 4,5%: GTGT 3% + TNCN 1,5%)
  - `dich_vu_xay_dung` (Dịch vụ, lưu trú, du lịch, xây dựng không bao thầu nguyên vật liệu — 7%: GTGT 5% + TNCN 2%)
  - `kinh_doanh_khac` (Hoạt động kinh doanh khác — 3%: GTGT 2% + TNCN 1%)
  - `khong_tinh_thue` (Chi phí đầu vào hoặc khoản thu không thuộc diện tính thuế doanh thu)
- `payment_method`: `cash` (tiền mặt) | `transfer` (chuyển khoản ngân hàng / QR) | `unknown`
- `status`: `recorded` (đã ghi sổ) | `needs_review` (cần chủ hộ xác nhận / trả lời) | `rejected` (đã từ chối / đã gộp vào giao dịch gốc)
- `source`: `agent` (Google Gemini AI) | `manual` (nhập tay)
- `document.kind`:
  - `image` (ảnh chụp hóa đơn giấy, phiếu thu/chi, sổ viết tay)
  - `transfer` (ảnh chụp màn hình chuyển khoản ngân hàng / VietQR / ví điện tử)
  - `audio` (ghi âm giọng nói của chủ hộ, bao gồm phương ngữ miền Trung)
- `warning.code`:
  - `DUPLICATE`: Trùng chứng từ cùng loại (cùng ảnh `sha256`, hoặc cùng đối tác + ngày + số tiền + cùng loại chứng từ)
  - `CROSS_DUPLICATE`: **Trùng chéo giữa hóa đơn giấy và ảnh chuyển khoản / giọng nói** của cùng một giao dịch (ví dụ: vừa chụp hóa đơn giấy 1.250.000đ xong lại dán tiếp màn hình chuyển khoản 1.250.000đ)
  - `PRICE_ANOMALY`: Đơn giá mặt hàng biến động bất thường (> 30%) so với lịch sử nhập
  - `TOTAL_MISMATCH`: Tổng tiền các dòng hàng không khớp với tổng thanh toán trên hóa đơn
  - `MISSING_FIELD`: Thiếu trường bắt buộc (`date`, `amount_vnd`, `type`)
  - `LOW_CONFIDENCE`: Độ tin cậy trích xuất của trường quan trọng thấp (< 0,85) hoặc thông tin mơ hồ
  - `TAX_CODE_NOT_FOUND`: Mã số thuế nhà cung cấp không tồn tại hoặc đã ngừng hoạt động
  - `IMAGE_QUALITY`: Ảnh quá mờ, tối hoặc mất góc không đọc được
- `warning.severity`: `high` | `medium` | `info`
- `job.status`: `queued` | `running` | `done` | `error`

---

## 3. Giao dịch (`Transaction`)

```json
{
  "id": "txn_01",
  "household_id": "demo",
  "document_id": "doc_01",
  "linked_document_ids": ["doc_01"],
  "duplicate_of_id": null,
  "date": "2026-11-12",
  "type": "expense",
  "category": "nhap_hang",
  "tax_group": "khong_tinh_thue",
  "payment_method": "transfer",
  "amount_vnd": 1250000,
  "counterparty": "Đại lý Minh Phát Đà Nẵng",
  "tax_code": "0401234567",
  "items": [
    {"name": "Cà phê hạt 1kg", "quantity": 5, "unit_price_vnd": 250000, "line_total_vnd": 1250000}
  ],
  "transcript": null,
  "confidence": {"date": 0.98, "amount_vnd": 0.95, "counterparty": 0.9, "type": 0.96},
  "status": "needs_review",
  "clarification_question": "Đơn giá cà phê hạt đợt này là 250.000đ/kg (cao hơn 39% so với mức 180.000đ/kg các lần trước). Cô/chú xác nhận đúng giá mới hay hóa đơn ghi nhầm ạ?",
  "warnings": [
    {
      "code": "PRICE_ANOMALY",
      "severity": "medium",
      "message": "Đơn giá cà phê hạt cao hơn 39% so với trung vị 3 lần nhập trước (180.000 đ)."
    }
  ],
  "source": "agent",
  "created_at": "2026-11-12T03:15:00Z",
  "updated_at": "2026-11-12T03:15:00Z"
}
```

- **Bắt buộc:** `id`, `household_id`, `date`, `type`, `amount_vnd` (> 0), `status`, `source`, `created_at`, `updated_at`.
- **Trường liên kết & thông minh:**
  - `document_id`: ID chứng từ chính (`null` khi nhập tay).
  - `linked_document_ids`: danh sách tất cả `document_id` gắn với giao dịch này. Khi chủ hộ bấm **Gộp chứng từ trùng chéo** (hóa đơn giấy + ảnh chụp màn hình chuyển khoản), mảng này lưu cả 2 `document_id` để đảm bảo 1 bút toán có đủ bộ chứng từ gốc!
  - `duplicate_of_id`: `id` của giao dịch gốc nếu giao dịch này bị nghi trùng (`DUPLICATE` hoặc `CROSS_DUPLICATE`).
  - `transcript`: câu nói gốc đã nhận diện (khi nhập bằng giọng nói phương ngữ miền Trung).
  - `clarification_question`: câu hỏi chủ động bằng tiếng Việt tự nhiên của Keiki khi cần chủ hộ xác nhận.
- **Trường người dùng được sửa qua `PATCH`:** `date`, `type`, `category`, `tax_group`, `payment_method`, `amount_vnd`, `counterparty`, `tax_code`, `items`.

---

## 4. Chứng từ (`Document`) và Tiến trình (`Job`)

```json
{
  "id": "doc_01",
  "household_id": "demo",
  "kind": "image",
  "mime_type": "image/jpeg",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "storage_path": "demo/doc_01.jpg",
  "uploaded_at": "2026-11-12T03:14:50Z"
}
```

```json
{
  "id": "job_01",
  "document_id": "doc_01",
  "status": "running",
  "events": [],
  "transaction_id": null,
  "error": null
}
```

---

## 5. Danh sách REST API Hoàn chỉnh

Mọi phản hồi thành công là JSON (trừ tải file gốc, xuất Excel/ZIP và luồng SSE). Mọi lỗi tuân theo mục 7.

- `GET /api/health` → `{"status": "ok", "service": "keiki", "model": "gemini-2.5-flash"}`
- `POST /api/documents` (multipart: `file`, `kind` = `image` | `transfer` | `audio`) → `201 {"document_id": "doc_01", "job_id": "job_01"}`.
  - Lưu tệp lên Google Cloud Storage (hoặc thư mục local khi chạy dev), tạo `Job` và kích hoạt ngay `agent.process_document` trong nền.
  - Giới hạn 8 MB; hỗ trợ ảnh `image/jpeg`, `image/png`, `image/webp` và âm thanh `audio/webm`, `audio/mp4`, `audio/wav`, `audio/mpeg`.
- `GET /api/documents/{id}/file` → trả nội dung tệp gốc (backend proxy).
- `GET /api/jobs/{id}` → `Job` (chứa toàn bộ danh sách `events`, `transaction_id`, `status`).
- `GET /api/jobs/{id}/stream` → luồng SSE thời gian thực (mục 6).
- `GET /api/transactions?status=&type=&from=&to=` → `{"items": [Transaction], "total": 12}`, sắp xếp mới nhất trước.
- `POST /api/transactions` → `201 Transaction` (nhập tay: `source = "manual"`, `status = "recorded"`).
- `PATCH /api/transactions/{id}` → `Transaction`.
- `DELETE /api/transactions/{id}` → `204`.
- `POST /api/transactions/{id}/confirm` body tùy chọn `{"merge_into_duplicate": false}` →
  - Nếu `merge_into_duplicate = false` (mặc định): chuyển trạng thái giao dịch sang `status = "recorded"`.
  - Nếu `merge_into_duplicate = true` và giao dịch có `duplicate_of_id`: gắn `document_id` hiện tại vào `linked_document_ids` của giao dịch gốc, cập nhật `payment_method = "transfer"`, đánh dấu bản ghi trùng tạm thời là `rejected`, và trả về giao dịch gốc đã cập nhật!
- `POST /api/transactions/{id}/reject` body `{"reason": "…"}` (tùy chọn) → `Transaction` với `status = "rejected"`.
- `GET /api/report?period=week|month&anchor=YYYY-MM-DD` → `Report`:
  ```json
  {
    "period": {"from": "2026-11-01", "to": "2026-11-30"},
    "totals": {
      "revenue_vnd": 45000000,
      "expense_vnd": 28500000,
      "profit_vnd": 16500000,
      "estimated_tax_vnd": 1125000
    },
    "tax_breakdown": [
      {"tax_group": "san_xuat_van_tai_an_uong", "revenue_vnd": 25000000, "rate_pct": 4.5, "tax_vnd": 1125000},
      {"tax_group": "phan_phoi_hang_hoa", "revenue_vnd": 20000000, "rate_pct": 1.5, "tax_vnd": 300000}
    ],
    "top_items": [{"name": "Cà phê hạt 1kg", "total_vnd": 6250000}],
    "price_increases": [
      {"item": "Cà phê hạt 1kg", "counterparty": "Đại lý Minh Phát Đà Nẵng", "old_vnd": 180000, "new_vnd": 250000, "pct": 38.9}
    ],
    "loan_readiness": {
      "verified_ratio_pct": 94.7,
      "with_evidence_count": 36,
      "total_recorded_count": 38,
      "cross_verified_count": 14
    },
    "pending_review": 2,
    "summary_text": "Doanh thu tháng 11 đạt 45.000.000đ, lợi nhuận tạm tính 16.500.000đ. Có 94,7% giao dịch đính kèm đầy đủ chứng từ gốc, đủ điều kiện minh bạch sổ sách để nộp hồ sơ vay vốn ngân hàng."
  }
  ```
- `GET /api/export?month=YYYY-MM&book=ALL|S1-HKD|S2-HKD|S3-HKD&evidence=true|false` → trả file `.xlsx` theo mẫu sổ **Thông tư 152/2025/TT-BTC** (tương thích hoàn toàn với **Google Sheets** & Microsoft Excel) hoặc gói `.zip` kèm thư mục ảnh chứng từ gốc nếu `evidence=true`.
- `POST /api/demo/reset` → khôi phục dữ liệu mẫu hộ kinh doanh Đà Nẵng về trạng thái chuẩn để trình diễn.

---

## 6. Sự kiện SSE (`Server-Sent Events`)

`GET /api/jobs/{id}/stream` gửi từng sự kiện dạng `data: <JSON>\n\n`, nhắc nhịp mỗi 15 giây bằng dòng comment `: keep-alive\n\n`.

```json
{
  "job_id": "job_01",
  "seq": 4,
  "step": "validate",
  "status": "warn",
  "message": "Phát hiện ảnh chuyển khoản 1.250.000đ trùng với hóa đơn giấy Đại lý Minh Phát cùng ngày.",
  "data": {"warning_code": "CROSS_DUPLICATE", "duplicate_of_id": "txn_00"}
}
```

- Chuỗi bước `step`: `receive` → `quality_check` → `extract` → `normalize` → `validate` → `decide` → `save` → `done` | `error`
- `status`: `running` | `ok` | `warn` | `error`
- `message`: tiếng Việt, một câu ngắn gọn, tiểu thương đọc hoặc nghe hiểu ngay.
- Sự kiện `done`: `data = {"transaction_id": "txn_01", "decision": "recorded" | "needs_review", "clarification_question": "..."}`.
- Sự kiện `error`: `data = {"code": "…"}`; giao dịch (nếu đọc được một phần) vẫn chuyển vào hàng đợi `needs_review`.

---

## 7. Định dạng lỗi chuẩn

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Ảnh lớn hơn 8 MB. Cô/chú vui lòng chụp lại hoặc chọn ảnh nhẹ hơn nhé.",
    "details": {}
  }
}
```

Mã HTTP: `400` dữ liệu sai, `404` không tìm thấy, `413` tệp quá lớn, `415` loại tệp không hỗ trợ, `422` sai schema, `500` lỗi hệ thống.

---

## 8. Giao diện Python giữa `backend/` và `agent/`

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
    message: str         # tiếng Việt thân thiện
    data: dict = {}

class AgentContext(BaseModel):
    household_id: str
    repo: "Repository"   # backend cung cấp (MemoryRepo hoặc FirestoreRepo)
    settings: "AgentSettings"

async def process_document(doc: DocumentRef, ctx: AgentContext) -> AsyncIterator[AgentEvent]:
    """Phát từng sự kiện qua Gemini Agent. Sự kiện cuối: step='done',
    data={'transaction': <Transaction dict, chưa có id>, 'decision': 'recorded'|'needs_review'}."""
```

```python
# Do backend hiện thực, agent gọi để đối chiếu lịch sử
class Repository(Protocol):
    async def find_duplicates(
        self,
        household_id: str,
        counterparty_norm: str | None,
        date: str,
        amount_vnd: int,
        sha256: str | None,
        doc_kind: str | None = None,
    ) -> list[Transaction]: ...

    async def price_history(
        self,
        household_id: str,
        item_norm: str,
        counterparty_norm: str | None,
        limit: int = 10,
    ) -> list[PricePoint]: ...

    async def lookup_tax_code(self, tax_code: str) -> TaxCodeInfo | None: ...
```
