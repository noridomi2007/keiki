# AI_PLAN.md: Kế hoạch xây dựng Gemini Multimodal Agent Hoàn chỉnh — Dự án Keiki

Đọc `AGENTS.md`, `docs/ROADMAP.md` và `docs/CONTRACT.md` trước. Bạn sở hữu thư mục `agent/` và bộ đo độ chính xác thực nghiệm. Toàn bộ các module đều được xây dựng **hoàn chỉnh 100% (End-to-End)**.

---

## 1. Mục tiêu của Keiki AI Agent

Xây dựng package Python `agent/` trên nền **Google Gemini API (`google-genai` SDK)** mà backend import trực tiếp. Agent nhận một chứng từ đa phương thức (**ảnh hóa đơn giấy**, **ảnh chụp màn hình chuyển khoản**, hoặc **ghi âm giọng nói phương ngữ miền Trung**) và phát các sự kiện `AgentEvent` từng bước theo thời gian thực, kết thúc bằng một giao dịch kèm quyết định:
- **Tự động ghi sổ (`recorded`)** khi độ tin cậy cao và vượt qua 100% các công cụ kiểm toán.
- **Chủ động hỏi lại chủ hộ (`needs_review` kèm `clarification_question`)** khi thông tin mơ hồ, phát hiện trùng chéo giữa hóa đơn giấy và ảnh chuyển khoản, hoặc đơn giá nhập tăng bất thường.

**Nguyên tắc cốt lõi: Google Gemini đọc hiểu đa phương thức, giải mã phương ngữ miền Trung và suy luận ngữ cảnh; còn code Python kiểm toán số học và ra quyết định cuối cùng.** Tiền, tổng, trung vị lịch sử giá, ngưỡng phát hiện trùng lặp đều do hàm thuần Python tính. Mô hình không bao giờ được tự cộng tiền hay tự ý ghi sổ khi chưa qua bộ công cụ kiểm tra.

---

## 2. Cấu trúc thư mục `agent/`

```
agent/
  __init__.py
  schemas.py        Pydantic v2 khớp CONTRACT (Transaction, Item, Warning, ExtractionResult…)
  api.py            process_document() theo CONTRACT mục 8
  extract.py        Gọi Google Gemini API (vision/transfer) lấy ExtractionResult
  voice.py          Xử lý ghi âm giọng nói phương ngữ miền Trung bằng Gemini Multimodal Audio
  normalize.py      Chuẩn hóa tiền, ngày, tên mặt hàng, từ điển phương ngữ miền Trung
  tools/
    __init__.py
    validate_totals.py   Kiểm tra tổng tiền các dòng hàng so với tổng hóa đơn
    duplicates.py        Phát hiện trùng cùng loại (DUPLICATE) & trùng chéo (CROSS_DUPLICATE)
    price.py             Phát hiện đơn giá nhập bất thường so với trung vị lịch sử
    taxcode.py           Tra cứu trạng thái mã số thuế nhà cung cấp
    category.py          Phân loại danh mục & nhóm ngành thuế theo Thông tư 152/2025/TT-BTC
  decide.py         Quyết định recorded | needs_review & tạo clarification_question tiếng Việt
  events.py         Tạo AgentEvent tiếng Việt thân thiện với tiểu thương
  report.py         Nhận xét dòng tiền & đánh giá độ minh bạch hồ sơ vay vốn bằng Gemini
  prompts/
    extract_receipt.vi.md   Prompt trích xuất hóa đơn giấy & màn hình chuyển khoản
    extract_voice.vi.md     Prompt nghe hiểu phương ngữ miền Trung & khẩu ngữ chợ
    report_summary.vi.md    Prompt phân tích báo cáo thu chi, thuế & hồ sơ vay vốn
  data/
    tax_codes_demo.json         Danh mục mã số thuế mẫu khu vực Đà Nẵng
    price_history_demo.json     Lịch sử giá nhập các mặt hàng phổ biến
    central_dialect_dict.json   Từ điển phương ngữ miền Trung & khẩu ngữ tiền tệ
    tt152_columns.json          Đặc tả cột sổ S1-HKD, S2-HKD, S3-HKD (TT 152/2025/TT-BTC)
  eval/
    dataset/        Bộ 40 chứng từ mẫu Đà Nẵng (ảnh + audio + labels.jsonl)
    run_eval.py     Script chạy đánh giá tự động toàn bộ tập mẫu
    metrics.py      Tính độ chính xác, Auto-Record Precision, Cross-Duplicate Recall, Latency
  tests/            Unit tests pytest cho schemas, normalize, tools, decide, api
```

---

## 3. Bộ chứng từ mẫu mang bối cảnh Đà Nẵng & Miền Trung

Bộ dữ liệu **40 chứng từ** sát thực tế hộ kinh doanh tại Đà Nẵng (quán ăn, tạp hóa, cà phê, cửa hàng đặc sản), đã ẩn danh thông tin cá nhân:

| Loại chứng từ | Số lượng | Đặc điểm kiểm thử |
|---|---|---|
| Hóa đơn in rõ nét | 10 | Phiếu tính tiền siêu thị, đại lý bia/nước giải khát, tạp hóa |
| Hóa đơn nhăn, mờ hoặc nghiêng | 6 | Chụp vội tại quầy hàng chợ Cồn / chợ Hàn |
| Giấy viết tay chợ truyền thống | 5 | Sổ tay tiểu thương ghi "5 ký chả bò", "2 thùng bia Larue" |
| Ảnh chụp màn hình chuyển khoản | 6 | Giao diện chuyển khoản ngân hàng / VietQR |
| **Cặp trùng chéo (Hóa đơn giấy + Ảnh chuyển khoản)** | **4 (2 cặp)** | Cùng ngày, cùng số tiền (`dup_cross_01_bill.jpg` + `dup_cross_01_transfer.jpg`) để kiểm thử tính năng chống ghi trùng chứng từ |
| Cặp hóa đơn trùng cùng loại | 2 (1 cặp) | Chụp 2 lần cùng một hóa đơn (`dup_same_01_a.jpg`, `dup_same_01_b.jpg`) |
| Hóa đơn giá nhập tăng bất thường | 3 | Đơn giá cao hơn > 30% so với `price_history_demo.json` |
| Hóa đơn cộng sai tổng tiền | 2 | Tổng các dòng lệch với số tổng thanh toán |
| Ghi âm giọng nói phương ngữ miền Trung | 2 | Ví dụ: *"Hồi sáng ni bán mười lăm tô mì Quảng bảy trăm rưỡi ngàn, nhập thêm hai thùng bia hết sáu trăm tư nghe"* |

---

## 4. Thiết kế Google Gemini Multimodal Agent

**Luồng xử lý một chứng từ (`process_document`)** phát sự kiện `AgentEvent` qua từng bước:

1. `receive`, `quality_check`: Kiểm tra dung lượng, kích thước và độ mờ cơ bản. Không đạt thì phát `IMAGE_QUALITY` và dừng, nhắc chụp lại rõ hơn.
2. `extract`: Gọi **Google Gemini API (`google-genai`)** với **Structured Outputs** (`response_schema=ExtractionResult`), thu về kết quả bóc tách đa phương thức kèm `confidence` từng trường và câu hỏi gợi ý nếu mơ hồ. Thử lại **một lần** nếu JSON lỗi; vẫn lỗi thì đưa vào `needs_review`.
3. `normalize`: Chuẩn hóa tiền tệ VND, ngày tháng, tên mặt hàng và từ vựng phương ngữ miền Trung.
4. `validate`: Chạy 6 công cụ kiểm toán độc lập (mục 5).
5. `decide`: Quyết định `recorded` hay `needs_review` và hoàn thiện câu hỏi chủ động `clarification_question` (mục 6).
6. Sự kiện cuối `done` mang giao dịch nháp và quyết định về cho Backend lưu vào **Google Cloud Firestore**.

**Gọi Google Gemini API qua SDK `google-genai`:**

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

resp = client.models.generate_content(
    model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
    contents=[
        types.Part.from_bytes(data=media_bytes, mime_type=mime_type),
        PROMPT,
    ],
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=ExtractionResult,   # Pydantic v2 schema
        temperature=0.0,
    ),
)
data = resp.parsed or ExtractionResult.model_validate_json(resp.text)
```

---

## 5. Bộ 6 Công cụ Kiểm toán (`agent/tools/`)

Viết dưới dạng hàm thuần (pure functions) để dễ kiểm thử bằng `pytest`:

| Công cụ | Quy tắc kiểm toán | Mã cảnh báo (`Warning`) |
|---|---|---|
| `validate_totals` | So sánh tổng `line_total_vnd` của `items` với `amount_vnd`; cho phép sai số làm tròn tối đa `max(1000, 1% amount_vnd)`. | `TOTAL_MISMATCH` (`high`) |
| `check_duplicate` | **1. Trùng cùng loại (`DUPLICATE`):** Trùng `sha256` ảnh, hoặc cùng `(counterparty_norm, date, amount_vnd)` và cùng loại chứng từ.<br>**2. Trùng chéo Hóa đơn giấy ↔ Chuyển khoản (`CROSS_DUPLICATE`):** Cùng `amount_vnd`, `date` lệch tối đa ±1 ngày, nhưng một bên là `image` (hóa đơn giấy) và một bên là `transfer` (ảnh chuyển khoản) hoặc `audio`! Gán `duplicate_of_id` để gợi ý **Gộp chứng từ**. | `DUPLICATE` (`high`) hoặc `CROSS_DUPLICATE` (`high`) |
| `compare_price_history` | Với từng mặt hàng chuẩn hóa: lấy tối đa 10 lần nhập gần nhất (tối thiểu 3 điểm); nếu `\|unit_price - median\| / median > 0.30` thì cảnh báo biến động giá. | `PRICE_ANOMALY` (`medium`) |
| `lookup_tax_code` | Nếu trên hóa đơn có `tax_code`, đối chiếu trong danh mục mã số thuế; cảnh báo nếu không tồn tại hoặc đã ngừng hoạt động. | `TAX_CODE_NOT_FOUND` (`medium`) |
| `check_missing_or_low_conf` | Thiếu `date`, `amount_vnd`, `type` hoặc trường bắt buộc có `confidence < 0.85`. | `MISSING_FIELD` / `LOW_CONFIDENCE` (`high`) |
| `classify_category` | Chuẩn hóa `category` và `tax_group` khớp đúng biểu mẫu **Thông tư 152/2025/TT-BTC** (S1-HKD, S2-HKD, S3-HKD). | Không sinh lỗi |

---

## 6. Logic Quyết định & Chủ động Hỏi lại (`agent/decide.py`)

```
nếu có bất kỳ cảnh báo mức high hoặc medium        → needs_review
nếu trường bắt buộc có confidence < 0.85          → needs_review
nếu Gemini trả về clarification_question khác null → needs_review
ngược lại                                          → recorded (tự động ghi sổ)
```

**Cơ chế "Chủ động hỏi lại khi thông tin mơ hồ":**
Mỗi giao dịch rơi vào `needs_review` đều có trường `clarification_question` là một câu hỏi tiếng Việt lễ phép, rõ ràng để hiển thị và đọc thành tiếng trên Frontend cho chủ hộ:
- Khi gặp `CROSS_DUPLICATE`: *"Khoản chuyển khoản 1.250.000đ này trùng khớp với hóa đơn giấy của Đại lý Minh Phát cùng ngày. Cô/chú muốn gộp ảnh chuyển khoản này vào hóa đơn đó để tránh ghi sổ 2 lần không ạ?"*
- Khi gặp `PRICE_ANOMALY`: *"Đơn giá cà phê hạt trên hóa đơn là 250.000đ/kg, cao hơn 39% so với mức nhập thường ngày (180.000đ/kg). Cô/chú xác nhận giá mới hay cần sửa lại ạ?"*
- Khi gặp `LOW_CONFIDENCE` / `MISSING_FIELD`: *"Ảnh chụp phần tổng tiền hơi mờ (Keiki đọc tạm là 450.000đ). Cô/chú xác nhận giúp đúng số tiền này chưa ạ?"*

---

## 7. Trình tự triển khai chi tiết trong `agent/`

1. **Bước AI-01 (Schemas & Dữ liệu chuẩn Đà Nẵng):**
   - Tạo `agent/schemas.py` khớp `docs/CONTRACT.md`.
   - Tạo `agent/data/tax_codes_demo.json`, `agent/data/price_history_demo.json`, `agent/data/central_dialect_dict.json`, `agent/data/tt152_columns.json` và `agent/eval/dataset/labels.jsonl`.
2. **Bước AI-02 (Prompts chuyên biệt):**
   - Tạo `agent/prompts/extract_receipt.vi.md`, `agent/prompts/extract_voice.vi.md` và `agent/prompts/report_summary.vi.md`.
3. **Bước AI-03 (Chuẩn hóa tiền tệ & Phương ngữ Miền Trung):**
   - Tạo `agent/normalize.py` xử lý chuỗi tiền tiếng Việt, khẩu ngữ (*"chục", "xị", "lít", "củ", "rưỡi"*), ngày tháng và từ điển phương ngữ miền Trung. Viết `agent/tests/test_normalize.py`.
4. **Bước AI-04 (Bộ 6 Công cụ Kiểm toán & Đối chiếu trùng chéo):**
   - Tạo `agent/tools/validate_totals.py`, `duplicates.py`, `price.py`, `taxcode.py`, `category.py`. Viết `agent/tests/test_tools.py`.
5. **Bước AI-05 (Trích xuất Gemini Vision/Audio, Quyết định & Luồng API):**
   - Tạo `agent/extract.py`, `agent/voice.py`, `agent/decide.py`, `agent/events.py`, `agent/report.py` và `agent/api.py` (`process_document`). Viết `agent/tests/test_pipeline.py`.
6. **Bước AI-06 (Bộ đánh giá tự động `eval/`):**
   - Tạo `agent/eval/metrics.py` và `agent/eval/run_eval.py`, xuất báo cáo `docs/EVAL_RESULTS.md`.
