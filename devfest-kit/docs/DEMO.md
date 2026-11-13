# DEMO.md: Kịch bản Demo Sản phẩm Hoàn chỉnh, Thuyết trình & Q&A — Dự án Keiki

Tài liệu hướng dẫn trình diễn sản phẩm **Keiki hoàn chỉnh 100%** tại **GDG DevFest Miền Trung 2026**.

---

## 1. Thông điệp cốt lõi (Pitch 30 giây)

- **Bài toán thực tế:** Từ năm 2026, hơn 5 triệu hộ kinh doanh Việt Nam phải ghi sổ kế toán theo **Thông tư 152/2025/TT-BTC**. Nhưng các cô chú tiểu thương chợ Cồn, chợ Hàn, chủ quán ăn, tạp hóa không đủ chi phí thuê kế toán riêng, ngại phần mềm phức tạp và đặc biệt dễ **thất lạc hoặc ghi trùng chứng từ** — ví dụ nhận **hóa đơn giấy** lúc giao hàng rồi tối lại **chụp màn hình chuyển khoản** thanh toán dẫn đến cộng sổ hai lần.
- **Giải pháp Keiki (1 câu):** **Keiki** là trợ lý AI kế toán bỏ túi đa nền tảng (điện thoại & máy tính) chạy trên hệ sinh thái **Google Gemini & Google Cloud**, giúp hộ kinh doanh ghi sổ chuẩn quy định chỉ bằng **chụp ảnh hóa đơn, dán màn hình chuyển khoản hoặc nói một câu bằng giọng miền Trung**.
- **4 Giá trị vượt trội của sản phẩm hoàn chỉnh:**
  1. **Gemini Multimodal hiểu phương ngữ Miền Trung** (*"bữa ni", "sáng ni", "rứa", "chục", "xị", "củ"*...).
  2. **Chống ghi trùng chéo thông minh (`CROSS_DUPLICATE`)** giữa hóa đơn giấy và ảnh chuyển khoản ngân hàng — gộp 2 hình ảnh vào chung 1 bút toán.
  3. **Chủ động hỏi lại bằng tiếng Việt tự nhiên (kèm giọng đọc cho người lớn tuổi)** khi thông tin mơ hồ hoặc giá nhập tăng bất thường, tuyệt đối không tự ý ghi liều.
  4. **Xuất trọn bộ sổ chuẩn Thông tư 152/2025/TT-BTC (`.xlsx` & Google Sheets) + Hồ sơ dòng tiền minh bạch** giúp tiểu thương dễ dàng tiếp cận vốn vay ngân hàng chính thống.

---

## 2. Kịch bản Demo trực tiếp trên sân khấu (3 phút — Toàn bộ tính năng chạy thật)

| # | Thao tác trên sân khấu | Khán giả & Ban Giám khảo thấy trên màn chiếu | Điểm nhấn công nghệ Google |
|---|---|---|---|
| **1 (20s)** | Cầm xấp hóa đơn giấy nhăn và điện thoại có ảnh chuyển khoản VietQR của một quán ăn tại Đà Nẵng, nêu nỗi đau Thông tư 152/2025/TT-BTC. | Giao diện **Keiki** hình cuốn sổ kẻ ô ly thân thiện, bật nút **"Chữ to cho cô chú"** ngay trên thanh đầu trang. | PWA đa nền tảng (Google Workbox + Fonts `Be Vietnam Pro`). |
| **2 (30s)** | **Chụp hóa đơn giấy** nhập 5kg cà phê hạt của Đại lý Minh Phát (1.250.000đ, giá ổn định). | Khung tiến trình Agent SSE chạy từng bước (`extract` → `validate` → `decide`), đóng **con dấu xanh "ĐÃ GHI SỔ"** xuống dòng mới. | **Gemini 2.5 Flash Vision** + Structured Outputs + Cloud Firestore. |
| **3 (35s)** | Bấm **"Nói một câu để ghi"** bằng **giọng đặc trưng Miền Trung**: *"Sáng ni bán hai mươi tô mì Quảng tám trăm ngàn, thu tiền mặt nghe!"* | Keiki hiện nguyên văn câu nói (`transcript`), tự động dịch "sáng ni" → ngày hôm nay, phân loại `Doanh thu ăn uống (4,5%)` và đóng dấu ghi sổ. | **Gemini Multimodal Audio** + Bộ chuẩn hóa phương ngữ Miền Trung. |
| **4 (35s)** | Bấm **"Dán ảnh chuyển khoản"** (`Ctrl+V` hoặc 1 chạm) cho biên lai VietQR 1.250.000đ vừa thanh toán cho Đại lý Minh Phát (cùng đơn hàng ở Bước 2!). | Keiki **chặn lại ngay**, hiện cảnh báo `CROSS_DUPLICATE` và đặt câu hỏi chủ động: *"Khoản chuyển khoản 1.250.000đ này trùng với hóa đơn giấy Đại lý Minh Phát hôm nay. Cô/chú muốn gộp vào hóa đơn đó để tránh cộng trùng chi phí không ạ?"* (bấm nút 🔊 nghe Keiki đọc). Bấm **"Gộp vào hóa đơn gốc"** → dòng cũ hiện huy hiệu **"Đủ 2 chứng từ (Hóa đơn + CK)"**! | Giải quyết triệt để nỗi đau **ghi trùng giữa hóa đơn giấy và ảnh chuyển khoản**. |
| **5 (25s)** | Chụp một hóa đơn nhập nguyên liệu có **đơn giá tăng vọt 39%** so với lịch sử. | Keiki gạch chân bút đỏ, đưa vào tab **Cần hỏi lại**, chỉ rõ mức chênh lệch so với trung vị 3 lần nhập trước để chủ hộ kiểm tra. | Kết hợp **Gemini đọc** + **Code Python kiểm toán số học**. |
| **6 (35s)** | Mở tab **Báo cáo & Xuất sổ**, xem ước tính thuế TT 152, thẻ **Hồ sơ Vay vốn Ngân hàng (95% giao dịch có chứng từ gốc)**, bấm **Xuất sổ TT 152 (.xlsx / Google Sheets)**. | File Excel chuẩn mẫu `S1-HKD`, `S2-HKD`, `S3-HKD` và sheet `HoSoVayVon` mở ra ngay kèm gói chứng từ gốc `.zip`. | `openpyxl` chuẩn Thông tư 152/2025/TT-BTC + tương thích **Google Sheets**. |

---

## 3. Danh sách kiểm tra trước giờ lên sân khấu (Checklist)

- [ ] Dịch vụ **Google Cloud Run** (`keiki`) đang chạy với `--min-instances 1 --no-cpu-throttling` tại vùng `asia-southeast1`, đã gọi `/api/health` đánh thức.
- [ ] Khóa `GEMINI_API_KEY` trong **Google Cloud Secret Manager** còn hạn mức quota dồi dào.
- [ ] Điện thoại demo: camera và micro hoạt động tốt, đã cài PWA Keiki ra màn hình chính, bật âm lượng để nghe rõ nút 🔊 đọc câu hỏi, tắt thông báo cá nhân.
- [ ] Máy tính trình chiếu: mở sẵn giao diện 2 cột của Keiki, đã copy sẵn ảnh chụp màn hình chuyển khoản vào Clipboard để bấm Dán (`Ctrl+V`) ngay trên sân khấu.
- [ ] Dữ liệu demo đã bấm Reset (`POST /api/demo/reset` hoặc nhấn giữ logo Keiki 3 giây) về trạng thái chuẩn.

---

## 4. Cấu trúc Slide thuyết trình (6 Slide cô đọng)

1. **Bài toán & Nỗi đau từ 2026:** Thông tư 152/2025/TT-BTC có hiệu lực; tiểu thương Đà Nẵng và hơn 5 triệu hộ kinh doanh toàn quốc sợ phần mềm phức tạp, dễ thất lạc hoặc ghi trùng giữa hóa đơn giấy và ảnh chuyển khoản.
2. **Trải nghiệm Keiki — "Chụp, Dán hoặc Nói một câu":** Giao diện sổ kẻ ô ly thân thiện với người lớn tuổi; hỗ trợ đa phương thức và phương ngữ miền Trung.
3. **Kiến trúc Hệ sinh thái Google Toàn diện:** Google Gemini 2.5 (Vision + Audio + Structured Outputs) + Google Cloud Run + Cloud Firestore + Cloud Storage + Secret Manager + Google Workbox PWA + Google Sheets.
4. **Cơ chế Kiểm toán Kép (AI + Deterministic Rules):** Gemini đọc hiểu đa phương thức & sinh câu hỏi chủ động; Code Python kiểm toán tổng tiền, phát hiện trùng chéo Hóa đơn ↔ Chuyển khoản, cảnh báo giá nhập bất thường.
5. **Demo trực tiếp & Kết quả đo kiểm thực tế (`EVAL_RESULTS.md`):** Độ chính xác trích xuất, tỷ lệ tự ghi đúng, khả năng bắt trùng chéo và tốc độ phản hồi.
6. **Tác động cho Đà Nẵng, Miền Trung & Toàn quốc:**
   - *Đà Nẵng & Miền Trung:* Xóa rào cản công nghệ cho hàng chục nghìn hộ kinh doanh dịch vụ - du lịch và chợ truyền thống nhờ nhận diện giọng nói miền Trung.
   - *Toàn quốc:* Tiết kiệm hàng giờ cộng sổ mỗi ngày, giảm tải hướng dẫn cho cơ quan thuế, và kiến tạo **Hồ sơ dòng tiền minh bạch** giúp tiểu thương tiếp cận vốn vay ngân hàng chính thống.

---

## 5. Chuẩn bị trả lời câu hỏi Ban Giám khảo (Q&A)

- **Câu 1: Keiki khác gì các phần mềm kế toán hiện có như MISA, Sapo hay KiotViet?**
  *Trả lời:* Các phần mềm truyền thống được thiết kế theo tư duy quản trị ERP thu nhỏ: người dùng phải tự tạo danh mục hàng hóa, tự gõ từng đơn hàng và hiểu thuật ngữ kế toán. Với các cô chú tiểu thương lớn tuổi ở chợ truyền thống hay quán ăn nhỏ, đó là rào cản quá lớn. **Keiki** giải quyết bài toán ở bước **nhập liệu tự nhiên và kiểm soát sai sót đầu vào**: chủ hộ chỉ cần chụp hóa đơn, dán màn hình chuyển khoản hoặc nói một câu bằng giọng địa phương; AI Agent tự phân loại theo Thông tư 152/2025/TT-BTC, tự phát hiện trùng chéo giữa hóa đơn giấy và chuyển khoản, và chủ động hỏi lại như một người phụ việc tận tâm.
- **Câu 2: Làm sao giải quyết triệt để việc ghi trùng giữa hóa đơn giấy và ảnh chụp màn hình chuyển khoản?**
  *Trả lời:* Đây là tính năng trọng tâm (`CROSS_DUPLICATE`) của Keiki. Khi chủ hộ chụp hóa đơn giấy 1.250.000đ lúc nhận hàng, rồi sau đó dán ảnh chuyển khoản 1.250.000đ, công cụ `check_duplicate` của Keiki đối chiếu chéo giữa các loại chứng từ (`image` ↔ `transfer` ↔ `audio`) theo số tiền và khung thời gian ±1 ngày. Thay vì ghi thành 2 khoản chi (làm sai lệch sổ), Keiki chủ động hỏi chủ hộ và cho phép **gộp cả 2 hình ảnh vào chung 1 bút toán** — vừa chống ghi trùng, vừa tạo bộ chứng từ thanh toán hoàn chỉnh (Hóa đơn + Ủy nhiệm chi) đúng chuẩn kiểm toán và vay vốn ngân hàng.
- **Câu 3: Dự án tận dụng hệ sinh thái của Google như thế nào?**
  *Trả lời:* Keiki được thiết kế tối ưu trên nền tảng Google từ đầu đến cuối:
  1. **Google Gemini API (`google-genai` SDK):** Sử dụng khả năng Multimodal gốc (nhìn ảnh hóa đơn nhăn/viết tay, đọc ảnh VietQR, nghe trực tiếp tệp âm thanh phương ngữ miền Trung không cần qua tầng STT rời) kết hợp `response_schema` (Structured Outputs).
  2. **Google AI Studio:** Dùng để thiết kế và tinh chỉnh prompt cùng bộ mẫu đánh giá.
  3. **Google Cloud Run + Firestore + Cloud Storage + Secret Manager + Cloud Logging:** Kiến trúc serverless đồng nhất, tự động co giãn, chi phí vận hành cực thấp cho hộ kinh doanh nhỏ.
  4. **Google Web Platform & Workspace:** PWA với Workbox, Google Fonts `Be Vietnam Pro`, Material Symbols và xuất sổ tương thích trực tiếp với **Google Sheets**.
- **Câu 4: Nếu AI đọc sai số tiền thì sao? Có rủi ro pháp lý cho hộ kinh doanh không?**
  *Trả lời:* Keiki tuân thủ nguyên tắc **"AI đọc và suy luận, Code Python tính toán và kiểm soát"**. AI không bao giờ được tự cộng tiền. Nếu tổng tiền các mặt hàng lệch với tổng hóa đơn (`TOTAL_MISMATCH`), hoặc độ tin cậy dưới 0,85, hoặc giá lệch > 30% so với lịch sử, giao dịch bắt buộc bị chặn lại ở hàng đợi `Cần hỏi lại` kèm câu hỏi rõ ràng cho chủ hộ. Keiki chỉ tự động ghi sổ khi đạt độ tin cậy cao và vượt qua toàn bộ 6 công cụ kiểm toán.
- **Câu 5: Làm thế nào sổ sách từ Keiki giúp tiểu thương vay vốn ngân hàng dễ hơn?**
  *Trả lời:* Lý do lớn nhất khiến tiểu thương khó vay vốn tín chấp ngân hàng và phải tìm đến tín dụng đen là vì họ chỉ ghi sổ tay gạch xóa, không có chứng từ chứng minh dòng tiền thực. Trong Keiki, mỗi dòng doanh thu/chi phí đều gắn liền với ảnh hóa đơn gốc và ảnh chuyển khoản đã được AI đối chiếu (chỉ số `loan_readiness`). Khi xuất sổ cuối tháng, Keiki xuất kèm **Sheet Hồ sơ Vay vốn (`HoSoVayVon`)** và gói `.zip` chứng từ đối chiếu để chủ hộ nộp trực tiếp cho cán bộ tín dụng ngân hàng.
