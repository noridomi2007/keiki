# FE_PLAN.md: kế hoạch vibe-coding cho Frontend (Antigravity)

Đọc `AGENTS.md` và `docs/CONTRACT.md` trước. Bạn sở hữu thư mục `frontend/`. Hạng mục **[Nền]** làm trước ngày thi, **[Ngày thi]** chỉ làm khi `PHASE: HACKATHON`.

## 1. Mục tiêu

Một PWA tiếng Việt, dùng tốt trên điện thoại, cho chủ hộ kinh doanh không rành công nghệ: chụp, nói hoặc dán chứng từ, xem agent làm việc, duyệt những gì agent chưa chắc, xuất sổ.

| Hạng mục | Nhãn |
|---|---|
| Khung responsive, 4 tab, design tokens (SW-04) | [Nền] |
| Màn Thêm: chụp hoặc chọn ảnh, tải lên (SW-05) | [Nền] |
| Màn Sổ: xem danh sách, nhập tay (SW-06, phần FE) | [Nền] |
| Hai tab Cần xác nhận và Báo cáo chỉ là trang trống "Sắp có" | [Nền] |
| Khung agent theo SSE (SW-08), hàng đợi xác nhận (SW-09), cảnh báo (SW-10) | [Ngày thi] |
| Xuất sổ, báo cáo (SW-12, SW-13), ghi âm (SW-11), tối ưu mobile (SW-16), demo (SW-17) | [Ngày thi] |

## 2. Setup

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm i react-router-dom @fontsource/be-vietnam-pro
npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest
```

- Dev proxy trong `vite.config.ts`: `/api` → `http://localhost:8080`.
- Biến môi trường: `VITE_MOCK=true` dùng dữ liệu giả trong `src/mocks/` khi backend chưa sẵn sàng.
- Lệnh kiểm tra trước khi commit: `npm run build` và `npx vitest run`.

## 3. Cấu trúc thư mục

```
frontend/src/
  api/         client.ts (fetch + xử lý lỗi chuẩn), sse.ts, endpoints.ts
  components/  TabBar, AddButtons, AgentTimeline, LedgerRow, ReviewSheet, Stamp, EmptyState
  pages/       AddPage, LedgerPage, ReviewPage, ReportPage
  hooks/       useTransactions, useJobStream, useRecorder
  i18n/        vi.ts   (mọi chuỗi giao diện)
  mocks/       dữ liệu giả theo contract
  styles/      tokens.css
  types/       contract.ts   (khớp docs/CONTRACT.md)
  utils/       money.ts, date.ts, image.ts
```

## 4. Hướng thiết kế (một chủ đề, không dùng mặc định)

Gốc hình ảnh lấy từ chính nghề này: **vở ô ly và sổ ghi chép của người buôn bán Việt Nam**: giấy kẻ, mực tím, bút đỏ chấm bài, con dấu. Không dùng kiểu "thẻ bo tròn xám bóng" hay nền kem với màu đất nung.

**Màu (token trong `tokens.css`):**

| Tên | Hex | Dùng cho |
|---|---|---|
| giay | `#F6F8FB` | nền trang, hơi lạnh như giấy vở |
| ke-o | `#D5DCE8` | đường kẻ ô, viền mảnh |
| muc-tim | `#3B2FA8` | chữ nhấn, nút chính, liên kết |
| but-do | `#C62828` | cảnh báo, "cần xác nhận", gạch chân dòng cần xem |
| dau-xanh | `#0F7B5F` | "đã ghi sổ", dấu xác nhận |
| muc-than | `#1B1F2A` | chữ chính |
| da-quang | `#FFE66D` | tô sáng trường vừa được sửa hoặc vừa đọc được |

**Chữ:** một họ duy nhất, **Be Vietnam Pro** (thiết kế cho tiếng Việt, cài qua `@fontsource` để chạy offline). Cỡ gốc 16px, thang 16 / 18 / 22 / 28. Số tiền dùng `font-variant-numeric: tabular-nums`. Chữ thường theo câu, không viết hoa cả chữ cho nhãn.

**Bố cục:**
- Điện thoại: thanh tab dưới (Thêm, Sổ, Cần xác nhận, Báo cáo), vùng chạm tối thiểu 44px, huy hiệu số lượng chờ trên tab Cần xác nhận.
- Máy tính (từ 1024px): cột trái cố định là Thêm và khung agent, cột phải là Sổ hoặc tab đang chọn.
- Màn Sổ là **trang sổ kẻ ô**, không phải lưới thẻ. Mỗi giao dịch là một dòng kẻ ngang; lề trái có đường đỏ mảnh như lề vở. Dòng cần xem được **gạch chân bằng bút đỏ** thay cho huy hiệu.

**Chi tiết đáng nhớ duy nhất:** khi một giao dịch được ghi vào sổ, **con dấu xanh "ĐÃ GHI SỔ"** đóng xuống dòng đó một lần (xoay nhẹ, thu từ lớn về nhỏ, khoảng 250ms). Mọi chuyển động khác giữ tối thiểu. Tôn trọng `prefers-reduced-motion` (bỏ chuyển động, hiện dấu ngay).

**Không làm:** hiệu ứng trượt vào cho từng khối, hover động trên mọi thẻ, nhãn viết hoa phía trên mỗi tiêu đề, đánh số 01/02/03 cho nội dung không phải trình tự, gradient trang trí.

## 5. Chữ trên giao diện (tất cả vào `vi.ts`)

Nói như người dùng nói, động từ chủ động, cùng một hành động giữ cùng một tên trong toàn luồng.

- Nút: **Chụp hóa đơn**, **Nói để ghi**, **Dán ảnh chuyển khoản**, **Lưu vào sổ**, **Duyệt và ghi sổ**, **Sửa**, **Từ chối**, **Xuất sổ**.
- Trạng thái rỗng là lời mời: "Sổ còn trống. Chụp hóa đơn đầu tiên để bắt đầu."
- Lỗi nói rõ chuyện gì và cách sửa: "Ảnh hơi mờ nên chưa đọc được. Chụp lại gần hơn và đủ sáng." Không xin lỗi dài dòng, không nói chung chung.
- Dòng pháp lý nhỏ ở chân trang cài đặt: "Công cụ hỗ trợ ghi chép, không thay thế kế toán."

## 6. Đặc tả màn hình

**Thêm [Nền]:** ba nút lớn xếp dọc (Chụp hóa đơn, Nói để ghi, Dán ảnh chuyển khoản). Ở giai đoạn Nền chỉ hoạt động nút chụp/chọn ảnh: `<input type="file" accept="image/*" capture="environment">`, xem trước ảnh, nút "Lưu vào sổ" gọi `POST /api/documents`, hiện kết quả "Đã lưu chứng từ". Nút Nói để ghi chưa bật (ẩn hoặc vô hiệu kèm chú thích).

```
┌──────────────────────┐
│  Thêm chứng từ       │
│ ┌──────────────────┐ │
│ │ Chụp hóa đơn     │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ Nói để ghi       │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ Dán ảnh chuyển   │ │
│ │ khoản            │ │
│ └──────────────────┘ │
│ [Thêm][Sổ][Xác nhận][Báo cáo]
└──────────────────────┘
```

**Sổ [Nền]:** danh sách giao dịch từ `GET /api/transactions`, mỗi dòng gồm ngày, đối tác, loại, số tiền (chi phí và doanh thu phân biệt bằng dấu và mực, không chỉ bằng màu). Bấm dòng xem chi tiết và ảnh gốc. Nút "Nhập tay" mở biểu mẫu (ngày, loại, danh mục, số tiền, đối tác), gửi `POST /api/transactions`. Có trạng thái đang tải, rỗng và lỗi mạng.

**Cần xác nhận [Ngày thi]:** mỗi phiếu hiển thị ảnh gốc cạnh các trường đã đọc, trường độ tin cậy thấp được tô `da-quang`, lý do cảnh báo viết bằng tiếng Việt từ `warnings[].message`. Ba nút: Duyệt và ghi sổ, Sửa (mở biểu mẫu), Từ chối.

**Khung agent [Ngày thi]:** danh sách bước hiện dần theo sự kiện SSE (mục 7). Mỗi bước có tên, trạng thái (đang chạy, xong, cảnh báo, lỗi) và một câu giải thích. Dùng `aria-live="polite"` để trình đọc màn hình đọc được. Kết thúc bằng kết quả: ghi sổ (con dấu) hoặc đưa vào hàng đợi (gạch bút đỏ kèm lý do).

**Báo cáo [Ngày thi]:** tổng doanh thu, chi phí, lãi tạm tính; mặt hàng chi nhiều nhất; mặt hàng tăng giá; đoạn nhận xét từ `summary_text`. Chỉ dùng biểu đồ đơn giản (thanh ngang), không thêm thư viện nặng nếu thanh CSS đủ dùng.

**Xuất sổ [Ngày thi]:** chọn tháng, bật "Kèm ảnh chứng từ", nút Xuất sổ tải file từ `GET /api/export`.

## 7. Kết nối API, SSE, giọng nói, ảnh

- `api/client.ts`: một hàm `request<T>()`, đọc lỗi chuẩn `{error:{code,message}}` và ném lỗi có `message` tiếng Việt để hiện thẳng cho người dùng.
- **SSE:** `new EventSource('/api/jobs/' + id + '/stream')`. Khi `onerror`, chuyển sang gọi `GET /api/jobs/{id}` mỗi giây cho đến khi `status` là `done` hoặc `error`. Sau sự kiện `done`, tải lại danh sách giao dịch.
- **Ghi âm:** `MediaRecorder`; chọn định dạng bằng `MediaRecorder.isTypeSupported` theo thứ tự `audio/webm;codecs=opus`, `audio/mp4`, `audio/webm`; gửi kèm `mime_type`. Cần HTTPS và thao tác bấm của người dùng (đặc biệt trên iOS Safari).
- **Nén ảnh trước khi tải:** `createImageBitmap(file, {imageOrientation: 'from-image'})`, vẽ lên canvas, cạnh dài tối đa 1600px, JPEG chất lượng 0,82. Giữ đúng chiều ảnh.
- **PWA:** manifest (tên, `theme_color` là muc-tim, biểu tượng 192 và 512). Service worker chỉ cache khung ứng dụng; **không cache `/api`** (dữ liệu cũ sẽ làm hỏng demo).

## 8. Prompt cho Antigravity

Dán từng prompt một, theo thứ tự. Mỗi prompt đã bao gồm yêu cầu "chỉ làm đúng việc này".

**FE-01 [Nền]: khởi tạo**
```
Đọc AGENTS.md, docs/CONTRACT.md và docs/plans/FE_PLAN.md. Khởi tạo dự án trong frontend/
theo mục 2 và 3 của FE_PLAN (Vite, React, TypeScript strict, Tailwind, react-router-dom,
@fontsource/be-vietnam-pro). Tạo src/types/contract.ts khớp CONTRACT.md. Thêm proxy /api
trong vite.config.ts. Nêu kế hoạch file trước khi tạo. Chỉ làm đúng việc này, không tạo
màn hình nào.
```

**FE-02 [Nền]: tokens và khung**
```
Theo mục 4 của FE_PLAN, tạo src/styles/tokens.css với 7 màu và thang chữ, cấu hình Tailwind
đọc token. Tạo TabBar (4 tab: Thêm, Sổ, Cần xác nhận, Báo cáo) dưới cùng trên điện thoại,
bố cục hai cột từ 1024px. Hai tab Cần xác nhận và Báo cáo chỉ hiện EmptyState "Sắp có".
Mọi chuỗi vào src/i18n/vi.ts. Không thêm hiệu ứng chuyển động. Chỉ làm đúng việc này.
```

**FE-03 [Nền]: API client và mock**
```
Tạo src/api/client.ts và endpoints.ts cho các endpoint [Nền] trong CONTRACT.md mục 5,
xử lý lỗi chuẩn mục 7. Khi VITE_MOCK=true dùng dữ liệu trong src/mocks/ (12 giao dịch mẫu
đủ 3 trạng thái). Viết utils/money.ts (định dạng 1.250.000 đ) kèm test vitest. Chỉ làm
đúng việc này.
```

**FE-04 [Nền]: màn Thêm**
```
Làm AddPage theo "Thêm [Nền]" trong FE_PLAN mục 6: nút Chụp hóa đơn (input file accept
image/*, capture environment), xem trước ảnh, nút Lưu vào sổ gọi POST /api/documents, hiện
kết quả hoặc lỗi bằng tiếng Việt. Nút Nói để ghi và Dán ảnh chuyển khoản chưa hoạt động:
hiện chú thích "Sắp có". Không nén ảnh, không SSE. Chỉ làm đúng việc này.
```

**FE-05 [Nền]: màn Sổ**
```
Làm LedgerPage theo "Sổ [Nền]": danh sách từ GET /api/transactions dạng dòng kẻ ngang với
lề đỏ mảnh, chi tiết kèm ảnh gốc (GET /api/documents/{id}/file), biểu mẫu Nhập tay gọi
POST /api/transactions. Có trạng thái đang tải, rỗng, lỗi. Chưa làm con dấu, chưa làm
hàng đợi. Chỉ làm đúng việc này.
```

**FE-06 [Nền]: PWA**
```
Cấu hình vite-plugin-pwa theo mục 7: manifest, biểu tượng, cache khung ứng dụng, KHÔNG
cache /api. Kiểm tra cài được lên màn hình chính. Chỉ làm đúng việc này.
```

**FE-07 [Ngày thi]: khung agent SSE**
```
Làm AgentTimeline và hook useJobStream theo mục 6 và 7: nhận sự kiện từ
GET /api/jobs/{id}/stream, hiện từng bước dần với trạng thái, aria-live polite, tự chuyển
sang polling nếu SSE đứt. Tích hợp vào AddPage sau khi POST /api/documents trả job_id.
```

**FE-08 [Ngày thi]: hàng đợi xác nhận**
```
Làm ReviewPage theo "Cần xác nhận": lấy status=needs_review, hiện ảnh gốc cạnh các trường,
tô da-quang trường độ tin cậy thấp, hiện warnings, ba nút Duyệt và ghi sổ / Sửa / Từ chối
gọi confirm, PATCH, reject. Cập nhật huy hiệu số lượng trên TabBar.
```

**FE-09 [Ngày thi]: con dấu ghi sổ**
```
Làm component Stamp "ĐÃ GHI SỔ" (xanh dau-xanh, xoay nhẹ, thu từ lớn về nhỏ ~250ms) hiện
một lần trên dòng vừa được ghi. Tôn trọng prefers-reduced-motion. Không thêm chuyển động
nào khác.
```

**FE-10 [Ngày thi]: báo cáo và xuất sổ**
```
Làm ReportPage từ GET /api/report (tổng, mặt hàng chi nhiều nhất, tăng giá, summary_text,
thanh ngang bằng CSS) và nút Xuất sổ chọn tháng, tải file từ GET /api/export.
```

**FE-11 [Ngày thi]: ghi âm và nén ảnh**
```
Làm hook useRecorder (MediaRecorder, chọn mime theo isTypeSupported, gửi kèm mime_type) và
nút Nói để ghi. Thêm utils/image.ts nén ảnh theo mục 7 và dùng khi tải lên. Xử lý khi người
dùng từ chối quyền micro bằng thông báo tiếng Việt nói rõ cách bật lại.
```

**FE-12 [Ngày thi]: dữ liệu demo và hoàn thiện**
```
Thêm nút ẩn (nhấn giữ logo 3 giây) gọi POST /api/demo/reset. Rà soát trạng thái đang tải,
rỗng, lỗi cho mọi màn. Kiểm tra chữ ≥16px, vùng chạm ≥44px, focus nhìn thấy được. Không
thêm tính năng mới.
```

## 9. Kiểm tra trước khi commit

- `npm run build` không lỗi; `npx vitest run` đạt.
- Mở bằng điện thoại thật: chụp ảnh, tải lên, thấy trong Sổ.
- Không còn chuỗi tiếng Việt viết thẳng trong component (phải nằm trong `vi.ts`).
- Không dùng `any`; kiểu dữ liệu khớp `contract.ts`.
- Cập nhật `docs/SCOPE_30.md`.

## 10. Lỗi thường gặp

- **Camera không mở trên iOS:** cần thuộc tính `capture` và thao tác bấm trực tiếp của người dùng.
- **Micro không chạy:** chỉ hoạt động trên HTTPS (Cloud Run đã có) hoặc `localhost`.
- **Safari ghi âm ra `audio/mp4`, Chrome ra `audio/webm`:** luôn gửi `mime_type` thật.
- **Service worker giữ bản cũ:** không cache `/api`; khi cập nhật hãy xóa dữ liệu trang hoặc dùng cửa sổ ẩn danh.
- **Ảnh xoay sai chiều:** dùng `imageOrientation: 'from-image'` khi nén.
- **SSE bị trình duyệt hoặc proxy giữ đệm:** nếu thấy sự kiện đến dồn một lúc, báo BE kiểm tra header; dự phòng bằng polling.
