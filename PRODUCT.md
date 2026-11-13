# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nhóm người dùng trọng tâm của Keiki là chủ doanh nghiệp vừa và nhỏ (SME / MSME) và người phụ trách tài chính – kế toán kiêm nhiệm xử lý số lượng lớn hóa đơn, biên lai chuyển khoản và đối soát dòng tiền trên máy tính (trình duyệt desktop).

Bên cạnh đó, sản phẩm cũng hỗ trợ các hộ kinh doanh cá thể và nhân viên quầy/kho sử dụng trên điện thoại qua Web PWA để chụp ảnh hóa đơn, dán biên lai VietQR hoặc nhập nhanh giao dịch bằng giọng nói tiếng Việt ngay tại điểm bán.

## Product Purpose

Keiki giúp SME và hộ kinh doanh Việt Nam biến chứng từ giao dịch rời rạc hàng ngày (hóa đơn giấy viết tay/nhiệt, ảnh chụp chuyển khoản ngân hàng VietQR, ghi âm hoặc lời nói tiếng Việt tự nhiên) thành sổ sách kế toán chuẩn Thông tư 152/2025/TT-BTC và hồ sơ minh bạch dòng tiền phục vụ kê khai thuế lẫn vay vốn ngân hàng, mà không đòi hỏi người dùng phải thành thạo định khoản Nợ/Có truyền thống.

## Positioning

Keiki tách rạch ròi tầng AI đọc hiểu đa phương thức (Google Gemini bóc tách ngữ nghĩa tiếng Việt 3 miền, chữ viết tay, ảnh chuyển khoản kèm điểm tin cậy từng trường) khỏi tầng kiểm toán số học Python xác định (6 công cụ kiểm toán độc lập). Khác với phần mềm nhập liệu thuần túy hoặc công cụ AI tự điền thiếu kiểm chứng, Keiki khóa tự động ghi sổ mọi ca nghi trùng chéo giữa hóa đơn giấy và chuyển khoản VietQR (`CROSS_DUPLICATE`), lệch phép tính dòng hàng hoặc đơn giá nhập tăng bất thường (`PRICE_ANOMALY`), và chủ động hỏi lại người dùng trước khi chốt sổ.

## Operating Context

- **Phạm vi mã nguồn sản phẩm chính:** Web app sản xuất nằm trong thư mục `keiki-app/` (`keiki-app/frontend/` biên dịch ra `keiki-app/static/`, phục vụ hợp nhất bởi backend FastAPI tại cổng `8080`, hoặc chạy Vite dev server tại cổng `5173`). Các thư mục ngoài `keiki-app/` ở gốc repo (`devfest-kit/`, các thư mục nguồn cũ ở root) không phải bản ứng dụng sản xuất đang vận hành.
- **Quy trình sử dụng cốt lõi trên Web:**
  1. Khách ghé thăm tiếp cận trang giới thiệu tương tác (thử nghiệm mô phỏng quy trình kiểm toán 6 bước và xem trước 4 mẫu sổ Thông tư 152) cùng cổng đăng nhập/đăng ký (Google OAuth 2.0 đã xác minh email hoặc SĐT + mật khẩu băm `scrypt`).
  2. Người dùng đã đăng nhập tải lên chứng từ (ảnh hóa đơn, dán ảnh chụp màn hình VietQR qua `Ctrl+V` hoặc tệp, thu âm/gõ câu lệnh thoại) và theo dõi tiến trình xử lý 8 bước thời gian thực qua SSE.
  3. Các giao dịch vướng cảnh báo dừng lại tại mục Cần hỏi lại để đối chiếu song song chứng từ cũ – mới, chọn gộp đối chiếu kép (`merge`), xác nhận ghi riêng, chỉnh sửa hoặc từ chối.
  4. Kiểm tra Sổ kế toán thu/chi theo kỳ, xem Báo cáo tổng hợp (doanh thu, chi phí, lợi nhuận tạm tính, thuế ước tính theo nhóm ngành, chỉ số minh bạch chứng từ vay vốn, cảnh báo tăng giá nhập) và xuất tệp `.xlsx` hoặc `.zip` chứng từ gốc.

## Capabilities and Constraints

- **Hệ thống 4 sổ & báo cáo Thông tư 152/2025/TT-BTC bắt buộc:** `S1-HKD` (Doanh thu theo nhóm ngành thuế 1,5% / 3% / 4,5% / 7%), `S2-HKD` (Vật liệu, dụng cụ, sản phẩm, hàng hóa), `S3-HKD` (Chi phí sản xuất, kinh doanh) và `HoSoVayVon` (tổng hợp chứng từ gốc và bút toán đối chiếu kép). Xuất Excel phải làm sạch tiền tố công thức (`=`, `+`, `-`, `@`) để chống chèn công thức độc hại.
- **Cơ chế khóa an toàn khi kiểm toán (`needs_review`):** Tuyệt đối không tự ý ghi sổ (`recorded`) khi phát hiện trùng chéo chứng từ (`CROSS_DUPLICATE` trong cửa sổ ±3 ngày), lệch tổng tiền chi tiết, điểm tin cậy trường thông tin thấp hoặc đơn giá nhập vượt +30% trung vị lịch sử (`PRICE_ANOMALY`).
- **Tách biệt dữ liệu & Bảo mật Production:** Dữ liệu sổ sách và kho chứng từ được cô lập hoàn toàn theo từng hộ kinh doanh / tài khoản qua phiên Cookie `HttpOnly` ký HMAC; các tài khoản mẫu (Preset) và lối tắt đăng nhập demo chỉ hiển thị khi máy chủ bật `DEMO_MODE=true` và bị vô hiệu hóa hoàn toàn ở Production.
- **Ràng buộc nền tảng & Chính sách bảo mật (CSP):** Chạy dưới dạng Web PWA trong hạ tầng `keiki-app/` (có khung giả lập di động 390px và chia sẻ mã QR truy cập qua mạng LAN). Content Security Policy (`backend/app/security.py`) giới hạn script/font trong `'self'`, Google Identity Services và Google Fonts. Ngôn ngữ sản phẩm hoàn toàn bằng tiếng Việt chuẩn thuật ngữ kế toán – thuế doanh nghiệp/hộ Việt Nam.

## Brand Commitments

- **Tên sản phẩm:** Keiki (Keiki — Sổ Kế Toán Tự Nhiên).
- **Giọng điệu & ngôn từ:** Chính xác, minh bạch về số liệu và thuật ngữ Thông tư 152; thẳng thắn nêu rõ cảnh báo trùng lặp hoặc sai lệch; súc tích, thực tế cho chủ doanh nghiệp SME bận rộn và tránh cường điệu tiếp thị mơ hồ hay các ký hiệu trang trí thiếu chuyên nghiệp.

## Evidence on Hand

- **Số liệu kiểm thử nội bộ (`keiki-app/EVAL_RESULTS.md`):** Đo trên 6 kịch bản kiểm thử chuẩn (hóa đơn giấy hợp lệ, VietQR trùng chéo, tăng giá bất thường, giọng nói Miền Trung) đạt 100,0% chính xác ở trích xuất số tiền (6/6), ngày chứng từ (6/6), phân loại tự ghi/hỏi lại (6/6), bắt `CROSS_DUPLICATE` (1/1) với độ trễ trung bình 1068,0 ms qua SSE.
- **Hồ sơ dữ liệu mẫu tích hợp:** 3 doanh nghiệp/hộ kinh doanh giả lập Bắc – Trung – Nam (`Minh Tâm` TP.HCM MST `0318899123`, `Hoàng Gia` Hà Nội MST `0107766554`, `Sông Hàn` Đà Nẵng MST `0406655443`) chỉ dùng cho chế độ Demo cục bộ.
- **Những bằng chứng chưa có (tuyệt đối không tự bịa):** Chưa có số liệu người dùng thực tế ngoài thị trường, lời chứng thực (testimonial) của khách hàng thật, bảng giá dịch vụ chính thức hay xác nhận liên kết trực tiếp từ ngân hàng thương mại.

## Product Principles

1. **Tách AI đọc hiểu khỏi phép tính kiểm toán:** Mô hình AI đảm nhiệm việc đọc chữ viết tay, giải mã ngữ cảnh Việt Nam và gắn độ tin cậy; toàn bộ phép tính cộng/nhân, so khớp trùng lặp và kiểm ngưỡng giá do mã Python xác định thực thi.
2. **Thà dừng hỏi lại còn hơn sai sổ thuế:** Mọi dấu hiệu nghi trùng chéo giữa hóa đơn và chuyển khoản hoặc chênh lệch số học phải chặn bước tự ghi sổ để chủ doanh nghiệp xác nhận trong một chạm.
3. **Chứng từ đối chiếu là nền tảng vay vốn:** Mỗi dòng bút toán trong sổ đều lưu vết ảnh hóa đơn, biên lai VietQR hoặc câu thoại gốc (đặc biệt là đối chiếu kép 2 chứng từ) nhằm nâng cao độ tin cậy khi làm việc với cơ quan thuế và ngân hàng.
4. **An toàn mặc định theo từng doanh nghiệp:** Cô lập kho dữ liệu từng tài khoản, tắt mọi lối tắt thử nghiệm ở Production và vô hiệu hóa rủi ro công thức độc hại trong dữ liệu xuất ra.

## Accessibility & Inclusion

Sản phẩm cung cấp tùy chọn bật chế độ chữ lớn (`Chữ to dễ đọc`) và nút phát giọng đọc tiếng Việt (`/api/tts` kèm `speechSynthesis` dự phòng) ở các bước hỏi lại, hướng dẫn và đọc tóm tắt báo cáo để hỗ trợ người vận hành kiểm tra nhanh không cần nhìn lâu vào màn hình hoặc người dùng lớn tuổi tại quầy.
