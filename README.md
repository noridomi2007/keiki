# Keiki — Trợ lý AI Kế toán Đa nền tảng cho Doanh nghiệp Vừa & Nhỏ (SME) và Hộ Kinh Doanh Việt Nam

**Keiki** là web ứng dụng (PWA) kế toán bỏ túi đa nền tảng (điện thoại và máy tính) sử dụng trợ lý AI đa phương thức trên hệ sinh thái **Google (Gemini API + Google Identity Services OAuth 2.0 + Google Translate TTS + Google Cloud + Google Workspace)**, giúp mọi **Doanh nghiệp vừa & nhỏ (SME / MSME)** và **Hộ kinh doanh** tại Việt Nam ghi sổ kế toán tự nhiên chỉ bằng thao tác **chụp ảnh hóa đơn**, **dán màn hình chuyển khoản** hoặc **nói một câu tiếng Việt tự nhiên**.

---

## 1. Bài toán giải quyết
Từ năm 2026, các hộ kinh doanh và doanh nghiệp nhỏ phải chuẩn hóa sổ kế toán theo **Thông tư 152/2025/TT-BTC** (và chế độ kế toán doanh nghiệp siêu nhỏ/SME) nhưng đa số:
- Không đủ chi phí duy trì bộ phận kế toán riêng chuyên trách.
- Ngại dùng phần mềm kế toán truyền thống phức tạp, nhiều thuật ngữ nghiệp vụ.
- Dễ thất lạc chứng từ hoặc **ghi trùng giao dịch** (đặc biệt giữa **hóa đơn GTGT/bán lẻ giấy** và **ảnh chụp màn hình chuyển khoản / sao kê ngân hàng** của cùng một đơn hàng).

**Keiki** dùng **Google Gemini Multimodal Agent** kết hợp bộ quy tắc kiểm toán định sẵn để:
1. **Đọc hiểu đa phương thức:** Hóa đơn GTGT/phiếu giao hàng, ảnh màn hình chuyển khoản VietQR/ngân hàng, và **giọng nói tiếng Việt tự nhiên** (hiểu thuật ngữ thương mại, bán sỉ/bán lẻ, công nợ, chiết khấu trên toàn quốc).
2. **Phân loại thu chi & nhóm ngành thuế tự động:** Ánh xạ đúng biểu mẫu doanh thu/chi phí và tỷ lệ thuế (1,5% / 3% / 4,5% / 7%) theo Thông tư 152/2025/TT-BTC.
3. **Đối chiếu phát hiện trùng lặp chéo & bất thường:** Phát hiện giao dịch trùng giữa **hóa đơn giấy ↔ ảnh chuyển khoản ↔ giọng nói** (`CROSS_DUPLICATE`) để gợi ý gộp chứng từ thanh toán thay vì cộng sổ 2 lần; cảnh báo khi đơn giá nhập tăng bất thường so với lịch sử nhà cung cấp.
4. **Chủ động hỏi lại khi thông tin mơ hồ & Nghe đọc tiếng Việt chuẩn:** Sinh câu hỏi tiếng Việt rõ ràng kèm phát giọng nói tiếng Việt tự nhiên (**Google Translate Vietnamese TTS proxy `/api/tts`**) giúp chủ doanh nghiệp và nhân viên kiểm tra nhanh không cần nhìn màn hình.
5. **Xuất sổ chuẩn quy định & Hồ sơ vay vốn ngân hàng:** Xuất trọn bộ sổ kế toán **Thông tư 152/2025/TT-BTC** (`.xlsx` và đồng bộ **Google Sheets**) kèm gói ảnh chứng từ đối chiếu (`.zip`) và **Báo cáo Minh bạch Dòng tiền** giúp SME & hộ kinh doanh dễ dàng tiếp cận vốn vay tín chấp ngân hàng.

## 2. Đối tượng hướng đến
- Toàn bộ **Doanh nghiệp vừa và nhỏ (SME / MSME)**, công ty thương mại - dịch vụ, nhà phân phối, cửa hàng bán lẻ, chuỗi F&B, xưởng sản xuất nhỏ và hơn **5 triệu hộ kinh doanh cá thể** trên khắp Việt Nam (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng và 63 tỉnh thành).
- Thiết kế trực quan, hỗ trợ **Đăng nhập bằng tài khoản Google (Google Sign-In)** chỉ với 1 chạm, phù hợp cho cả chủ doanh nghiệp bận rộn lẫn nhân viên bán hàng/kho không chuyên kế toán.

## 3. Tiềm năng đóng góp cho Doanh nghiệp & Kinh tế số Việt Nam
- **Chuẩn hóa & Minh bạch hóa tài chính SME:** Giúp hàng triệu doanh nghiệp vừa và nhỏ, hộ kinh doanh tại Việt Nam tiết kiệm hàng giờ nhập liệu mỗi ngày và tuân thủ đúng quy định thuế.
- **Khơi thông nguồn vốn tín dụng chính thống:** Tạo lập **hệ thống sổ sách minh bạch và đối chiếu chứng từ gốc 100%** giúp doanh nghiệp vừa và nhỏ chứng minh năng lực dòng tiền, dễ dàng tiếp cận nguồn vốn vay ngân hàng với lãi suất ưu đãi.

## 4. Hệ sinh thái Công nghệ Google sử dụng tối đa
- **Google Gemini API (`google-genai` SDK):**
  - `gemini-2.5-flash`: Bóc tách đa phương thức tốc độ cao (Ảnh hóa đơn, Ảnh chuyển khoản VietQR, Giọng nói tiếng Việt) với **Structured Outputs** (`response_schema`) và **Function Calling**.
  - `gemini-2.5-pro`: Phân tích báo cáo tài chính chuyên sâu, đánh giá hồ sơ tín dụng vay vốn và đối chiếu chứng từ phức tạp.
- **Google Identity Services (Google OAuth 2.0 Sign-In):** Đăng nhập an toàn bằng tài khoản Google/Gmail hoặc Google Workspace của doanh nghiệp (`POST /api/auth/google`).
- **Google Translate Vietnamese TTS (`/api/tts`):** Proxy tổng hợp giọng đọc tiếng Việt (`tl=vi`) chuẩn xác trên mọi trình duyệt và hệ điều hành.
- **Google Cloud Run & Cloud Firestore & Cloud Storage (GCS):** Kiến trúc Serverless container hợp nhất (FastAPI + React PWA), lưu trữ sổ kế toán thời gian thực và kho chứng từ số hóa.
- **Google Workspace (Google Sheets API / Drive) & Google Web Platform:** Xuất sổ trực tiếp ra file Excel chuẩn TT 152/2025/TT-BTC tương thích **Google Sheets**, sử dụng **Google Fonts (`Be Vietnam Pro`)** và **Material Symbols**.

## 5. Cấu trúc dự án
- [keiki-app/](file:///d:/GDG%20DevFest%20MienTrung%202026%20-%20Keiki/keiki-app): Mã nguồn sản phẩm hoàn chỉnh (Backend FastAPI + AI Agent `google-genai` + Frontend React TypeScript Tailwind PWA + Bộ kiểm thử tự động).
- [devfest-kit/](file:///d:/GDG%20DevFest%20MienTrung%202026%20-%20Keiki/devfest-kit): Bộ tài liệu kiến trúc, lộ trình sản phẩm và đặc tả kỹ thuật.
