# FE_PLAN.md: Kế hoạch xây dựng Frontend PWA Hoàn chỉnh — Dự án Keiki

Đọc `AGENTS.md`, `docs/ROADMAP.md` và `docs/CONTRACT.md` trước. Bạn sở hữu thư mục `frontend/`. Toàn bộ các màn hình và tính năng được xây dựng **hoàn chỉnh 100%** (không để bất kỳ nút "Sắp có" hay trang trống nào).

---

## 1. Mục tiêu

Xây dựng ứng dụng web tiến bộ (**PWA**) tiếng Việt mang tên **Keiki**, chạy mượt trên cả điện thoại và máy tính, được thiết kế chuyên biệt cho **tiểu thương chợ truyền thống, chủ quán ăn, tạp hóa, hộ kinh doanh lớn tuổi tại Đà Nẵng và Việt Nam**:
- **3 phương thức nhập liệu tự nhiên hoạt động 100%:**
  1. **Chụp ảnh hóa đơn** (hóa đơn giấy, phiếu giao hàng, sổ viết tay).
  2. **Dán màn hình chuyển khoản** (hỗ trợ bấm 1 chạm đọc từ Clipboard, nhấn `Ctrl+V` trên máy tính, hoặc chọn ảnh chụp màn hình VietQR/ngân hàng).
  3. **Nói một câu để ghi** (ghi âm trực tiếp qua `MediaRecorder`, hỗ trợ **phương ngữ miền Trung** kèm câu mẫu gợi ý).
- **Trực quan hóa tiến trình AI (`AgentTimeline`):** Xem trợ lý AI Keiki đọc và kiểm toán chứng từ theo từng bước qua SSE thời gian thực.
- **Chủ động hỏi lại & Gộp chứng từ trùng chéo (`ReviewPage`):** Nghe câu hỏi của Keiki qua nút **🔊 Nghe Keiki hỏi** (Text-to-Speech tiếng Việt cho người lớn tuổi), bấm 1 chạm để **Gộp ảnh chuyển khoản vào hóa đơn giấy gốc** (chống cộng trùng tiền) hoặc xác nhận đơn giá.
- **Sổ kế toán kẻ ô ly & Xuất sổ Thông tư 152/2025/TT-BTC (`LedgerPage` & `ReportPage`):** Xem sổ ghi chép quen thuộc với con dấu xanh **"ĐÃ GHI SỔ"**, theo dõi thuế ước tính theo nhóm ngành, xem thẻ **Hồ sơ Tín dụng Minh bạch (Vay vốn Ngân hàng)** và xuất sổ `.xlsx` (mở ngay trên Excel / **Google Sheets**) hoặc gói chứng từ `.zip`.

---

## 2. Công nghệ Google Web Platform sử dụng

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm i react-router-dom @fontsource/be-vietnam-pro
npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest
```

- **Google Fonts (`Be Vietnam Pro`)** & **Google Material Symbols Rounded**: Hiển thị tiếng Việt rõ nét, biểu tượng to, trực quan cho người lớn tuổi.
- **Google Workbox (`vite-plugin-pwa`)**: Đóng gói PWA chuẩn **Google Lighthouse**, cài thẳng ra màn hình chính điện thoại Android/iOS và máy tính.
- **Web Speech API (`window.speechSynthesis` với giọng `vi-VN`)**: Đọc to câu hỏi xác nhận (`clarification_question`) và kết quả ghi sổ cho tiểu thương lớn tuổi mắt kém.
- **Clipboard API (`navigator.clipboard.read` & sự kiện `paste`)**: Dán thẳng ảnh chụp màn hình chuyển khoản vừa copy.

---

## 3. Cấu trúc thư mục `frontend/src/`

```
frontend/src/
  api/
    client.ts          Hàm request<T>() xử lý lỗi chuẩn tiếng Việt
    endpoints.ts       Gọi toàn bộ REST API (documents, jobs, transactions, report, export, demo)
  components/
    TabBar.tsx         Thanh điều hướng 4 tab + huy hiệu số lượng chờ xác nhận + công tắc Chữ to
    AddButtons.tsx     3 nút lớn: Chụp hóa đơn, Dán chuyển khoản, Nói một câu (phương ngữ miền Trung)
    AgentTimeline.tsx  Khung tiến trình Gemini Agent chạy trực tiếp qua SSE
    LedgerRow.tsx      Dòng giao dịch trên trang sổ kẻ ô ly (kèm huy hiệu gộp chứng từ & con dấu)
    ReviewCard.tsx     Thẻ câu hỏi chủ động của Keiki + nút Nghe giọng đọc + nút Gộp chứng từ trùng
    Stamp.tsx          Con dấu xanh "ĐÃ GHI SỔ"
    SpeakButton.tsx    Nút phát âm thanh tiếng Việt đọc câu hỏi cho người lớn tuổi
    EmptyState.tsx     Trạng thái rỗng thân thiện
  pages/
    AddPage.tsx        Màn Thêm chứng từ đa phương thức + tiến trình AI
    LedgerPage.tsx     Màn Sổ kế toán kẻ ô ly + xem chi tiết chứng từ + nhập tay
    ReviewPage.tsx     Màn Cần hỏi lại (duyệt, gộp chứng từ trùng chéo, sửa, bỏ qua)
    ReportPage.tsx     Màn Báo cáo thuế TT 152, Hồ sơ vay vốn ngân hàng & Xuất sổ Excel/Google Sheets
  hooks/
    useJobStream.ts      Kết nối SSE (/api/jobs/{id}/stream) kèm tự động fallback sang polling
    useRecorder.ts       Ghi âm giọng nói qua MediaRecorder
    useClipboardImage.ts Đọc ảnh chuyển khoản từ Clipboard hoặc sự kiện paste Ctrl+V
  i18n/
    vi.ts              Toàn bộ chuỗi giao diện tiếng Việt thân thiện với tiểu thương
  styles/
    tokens.css         Bảng màu sổ kẻ ô ly & cấu hình cỡ chữ lớn cho người lớn tuổi
  types/
    contract.ts        Kiểu TypeScript khớp 100% docs/CONTRACT.md
  utils/
    money.ts           Định dạng tiền VND (1.250.000 đ) & đọc số tiền bằng chữ
    date.ts            Định dạng ngày giờ Việt Nam (dd/mm/yyyy)
    image.ts           Nén ảnh về tối đa 1600px JPEG trước khi tải lên
    speech.ts          Đọc văn bản tiếng Việt qua Web Speech API
```

---

## 4. Hướng thiết kế: "Cuốn Sổ Kẻ Ô Ly & Bút Mực Tím"

Lấy cảm hứng từ chính **cuốn sổ ghi chép hàng ngày của bà con tiểu thương Việt Nam**: giấy kẻ ngang, lề đỏ, mực tím, bút đỏ gạch chân chỗ cần hỏi lại, và con dấu xanh đóng xác nhận.

**Bảng màu (`tokens.css`):**

| Tên token | Mã Hex | Ý nghĩa sử dụng |
|---|---|---|
| `giay` | `#F6F8FB` | Nền trang sáng rõ, độ tương phản cao ngoài trời chợ |
| `ke-o` | `#D5DCE8` | Đường kẻ dòng sổ, viền mảnh |
| `muc-tim` | `#3B2FA8` | Màu chủ đạo Keiki, nút bấm chính, tiêu đề |
| `but-do` | `#C62828` | Cảnh báo trùng lặp/bất thường, gạch chân dòng cần xác nhận |
| `dau-xanh` | `#0F7B5F` | Trạng thái "ĐÃ GHI SỔ", con dấu xác nhận hợp lệ |
| `muc-than` | `#1B1F2A` | Chữ chính sắc nét cho người lớn tuổi |
| `da-quang` | `#FFE66D` | Tô sáng trường thông tin AI vừa đọc hoặc cần chủ hộ kiểm tra |

**Tối ưu đặc biệt cho tiểu thương lớn tuổi:**
- Nút **"Chữ to"** ngay trên thanh đầu trang giúp phóng lớn toàn bộ chữ lên `115%` tức thì.
- Nút **🔊 Nghe Keiki hỏi** đọc to câu hỏi xác nhận bằng tiếng Việt.
- Tất cả các nút bấm chính đều cao tối thiểu `48px–56px`, có biểu tượng rõ ràng và nhãn động từ chủ động.

---

## 5. Trình tự triển khai chi tiết trong `frontend/`

1. **Bước FE-01:** Khởi tạo dự án Vite + React + TypeScript + Tailwind CSS + `@fontsource/be-vietnam-pro`, tạo `src/types/contract.ts`, `src/i18n/vi.ts` và `src/styles/tokens.css`.
2. **Bước FE-02:** Tạo các tiện ích `utils/money.ts`, `utils/date.ts`, `utils/image.ts`, `utils/speech.ts` (kèm unit test `vitest`) và lớp kết nối `api/client.ts`, `api/endpoints.ts`.
3. **Bước FE-03:** Tạo các hooks `useJobStream.ts` (SSE + polling fallback), `useRecorder.ts` (ghi âm giọng nói), `useClipboardImage.ts` (dán ảnh chuyển khoản) và các component dùng chung (`TabBar`, `Stamp`, `SpeakButton`, `AgentTimeline`).
4. **Bước FE-04:** Hoàn thiện `AddPage.tsx` (Chụp hóa đơn, Dán ảnh chuyển khoản, Ghi âm phương ngữ miền Trung + nút chọn nhanh mẫu thử Demo để thao tác 1 chạm trên sân khấu).
5. **Bước FE-05:** Hoàn thiện `LedgerPage.tsx` (trang sổ kẻ ô ly, bộ lọc, xem chi tiết nhiều chứng từ đính kèm `linked_document_ids`, biểu mẫu nhập tay).
6. **Bước FE-06:** Hoàn thiện `ReviewPage.tsx` (thẻ câu hỏi chủ động của Keiki, phát âm thanh TTS, so sánh và gộp chứng từ trùng chéo `CROSS_DUPLICATE`, sửa và duyệt).
7. **Bước FE-07:** Hoàn thiện `ReportPage.tsx` (tổng hợp thu chi, bảng thuế theo nhóm ngành TT 152/2025/TT-BTC, thẻ Hồ sơ Vay vốn Ngân hàng `loan_readiness`, nhận xét của Gemini và tải sổ Excel `.xlsx` / `.zip`).
8. **Bước FE-08:** Cấu hình PWA (`vite-plugin-pwa`), kiểm tra `npm run build` và `npx vitest run`.
