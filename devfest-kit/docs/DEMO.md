# DEMO.md: kịch bản demo, thuyết trình và dự phòng

Dùng khi `PHASE: HACKATHON`. Ba người đều đọc file này. Người vận hành demo (thường là FE) và người trả lời kỹ thuật (thường là AI Dev) cần thống nhất trước.

## 1. Thông điệp cốt lõi

- **Vấn đề:** theo các nguồn nhóm đã tra cứu, từ 01/01/2026 mọi hộ kinh doanh phải ghi sổ kế toán theo Thông tư 152/2025/TT-BTC; phần lớn không có kế toán và chứng từ lộn xộn. Cần đối chiếu với văn bản chính thức trước khi nói chắc số liệu cụ thể.
- **Giải pháp một câu:** chụp, nói hoặc dán chứng từ; AI đọc, kiểm tra, hỏi lại khi chưa chắc, ghi sổ và xuất sổ đúng mẫu.
- **Khác biệt:** chủ hộ không phải học phần mềm hay nhập liệu. Agent bắt lỗi (trùng, giá bất thường) và **chỉ tự ghi khi đủ chắc**.

## 2. Kịch bản demo (khoảng 3 phút)

| # | Việc làm trên sân khấu | Khán giả thấy |
|---|---|---|
| 1 | Nêu bài toán trong 20 giây, cầm tập hóa đơn thật (đã che thông tin) | Nỗi đau quen thuộc |
| 2 | Chụp hóa đơn nhăn bằng điện thoại | Khung agent chạy từng bước, dòng mới xuất hiện trong sổ, con dấu "ĐÃ GHI SỔ" |
| 3 | Gửi tin nhắn thoại ("hôm nay bán ba triệu hai") và ảnh chuyển khoản | Hai dòng nữa vào sổ, doanh thu cập nhật |
| 4 | Chụp hóa đơn **giá nhập tăng bất thường** | Agent dừng, gạch bút đỏ, giải thích lý do bằng tiếng Việt |
| 5 | Gửi lại một hóa đơn **trùng** | Agent chặn, nói rõ trùng với giao dịch nào |
| 6 | Mở hàng đợi, duyệt một dòng, từ chối một dòng | Chủ hộ kiểm soát, agent không ghi liều |
| 7 | Bấm Xuất sổ, mở file Excel ngay | Sổ đúng mẫu kèm chứng từ |
| 8 | Chốt: nêu số đo thật (độ chính xác, tỷ lệ tự ghi đúng) và đóng góp cho hộ kinh doanh Đà Nẵng và cả nước | Kết quả đo được, không phải lời hứa |

Mỗi bước có một người phụ trách nói và một người thao tác, đã tập trước.

## 3. Dữ liệu demo cần có sẵn

- 8 đến 10 chứng từ đã che thông tin: hóa đơn nhăn, giấy viết tay, ảnh chuyển khoản.
- Bộ "bẫy": một hóa đơn giá tăng bất thường và một cặp trùng (đã nạp lịch sử giá và giao dịch trước đó).
- Một tin nhắn thoại quay sẵn (và một bản ghi dự phòng).
- Nút đặt lại dữ liệu demo (`POST /api/demo/reset`) kiểm tra trước giờ lên sân khấu.
- Một file Excel đã xuất sẵn để mở nếu việc xuất trực tiếp trục trặc.

## 4. Danh sách kiểm tra trước giờ lên sân khấu

- [ ] Dịch vụ Cloud Run đang `min-instances 1`, đã "đánh thức" bằng một request thử.
- [ ] Đăng nhập, khóa API, hạn mức token còn đủ.
- [ ] Điện thoại: camera và micro hoạt động, đã cài PWA, sạc đầy, tắt thông báo.
- [ ] Máy trình bày: mở sẵn giao diện, kết nối máy chiếu đã thử, chế độ không làm phiền.
- [ ] Wifi hội trường và **điểm phát 4G dự phòng** đều đã thử.
- [ ] Video demo quay sẵn và kết quả đã lưu, mở được không cần mạng.
- [ ] Dữ liệu demo đã đặt lại về trạng thái sạch.
- [ ] Tên bản Cloud Run ổn định gần nhất đã ghi lại để quay lại nếu cần.

## 5. Phương án dự phòng

| Sự cố | Xử lý |
|---|---|
| Mạng hội trường kém | Chuyển sang điểm phát 4G; nếu vẫn lỗi, chiếu video demo và nói rõ đây là bản ghi |
| Gemini chậm hoặc lỗi | Nói "agent đưa vào hàng đợi khi không chắc" và chuyển sang kết quả đã lưu |
| Cold start | Đã đặt min instance; nếu vẫn chậm, nói trong lúc chờ về cách hoạt động |
| Ảnh chụp mờ | Dùng ảnh trong máy đã chuẩn bị thay vì chụp lại |
| Xuất Excel lỗi | Mở file Excel xuất sẵn |
| SSE đứt | FE tự chuyển sang polling; nếu hình ảnh không cập nhật, tải lại trang Sổ |

## 6. Cấu trúc slide (5 đến 7 slide)

1. Bài toán và đối tượng (một câu chuyện thật từ chủ cửa hàng nếu nhóm đã phỏng vấn).
2. Giải pháp: chụp, nói, dán; agent làm việc; chủ hộ xác nhận.
3. Kiến trúc: một dịch vụ Cloud Run, Gemini, Firestore, hàng đợi xác nhận.
4. Cách agent quyết định: Gemini đọc, code kiểm tra, chỉ tự ghi khi đủ chắc.
5. Kết quả đo thật (từ `docs/EVAL_RESULTS.md`).
6. Đóng góp cho địa phương và đất nước, hướng phát triển.
7. (Tùy chọn) Đội ngũ và phần làm trước so với làm tại chỗ.

## 7. Chuẩn bị trả lời câu hỏi

- **Khác gì phần mềm kế toán như MISA hay Sapo?** Các phần mềm đó yêu cầu người dùng tự nhập và học giao diện. Ở đây chủ hộ chỉ chụp, nói hoặc dán; agent đọc, kiểm tra, hỏi lại. Chúng tôi không cạnh tranh về độ đầy đủ tính năng kế toán mà giải quyết bước nhập liệu và kiểm soát lỗi ban đầu.
- **Phần nào làm trước, phần nào làm tại chỗ?** Trả lời đúng theo `docs/SCOPE_30.md` và báo cáo hiện trạng đã nộp. Không nói giảm hay nói quá.
- **Độ chính xác bao nhiêu?** Đọc số trong `docs/EVAL_RESULTS.md`, nói rõ bộ mẫu có bao nhiêu chứng từ và đã đo thế nào. Nhấn mạnh tỷ lệ *tự ghi đúng* và việc hỏi lại khi chưa chắc.
- **AI đọc sai thì sao?** Agent chỉ tự ghi khi độ tin cậy cao và qua các luật kiểm tra; mọi trường hợp nghi ngờ vào hàng đợi cho chủ hộ duyệt.
- **Dữ liệu nhạy cảm xử lý thế nào?** Khóa API trong biến môi trường, không ghi nội dung chứng từ vào log, dữ liệu demo đã che hoặc là dữ liệu giả, chữ trong ảnh chỉ được coi là dữ liệu.
- **Có thay thế kế toán không?** Không. Công cụ hỗ trợ ghi chép; không tự khai thuế, không tư vấn thuế.
- **Sao không dùng Zalo hoặc Telegram?** Chúng tôi ưu tiên làm thật tốt một sản phẩm hoàn chỉnh; kênh nhắn tin là hướng mở rộng.
- **Mở rộng thế nào?** Thêm mẫu sổ, quản lý tồn kho cơ bản, kênh nhập qua ứng dụng nhắn tin, nhắc lịch kê khai, nhiều ngành hàng.
- **Vì sao không tự huấn luyện mô hình?** Trong thời gian này, dùng Gemini cho phần đọc và giữ luật kiểm tra trong code giúp chính xác, kiểm soát được và đo được; mô hình tự huấn luyện không chứng minh được lợi ích rõ ràng bằng.

## 8. Việc phải tránh khi trình bày

- Không nói "tự khai thuế", "thay kế toán" hay đưa số liệu chưa kiểm chứng nguồn.
- Không dùng chứng từ có thông tin thật của người khác.
- Không thêm tính năng mới ngay trước giờ lên sân khấu.
- Không dùng số liệu đo từ lần chạy cũ khi đã chỉnh prompt hay ngưỡng; chạy lại bộ đo.
