# SCOPE_30.md: phạm vi và theo dõi ranh giới 30%

Thể lệ cho phép mang đến cuộc thi dự án đã làm trước nếu **chưa hoàn thiện quá 30%**, và BTC quyết định tính hợp lệ. File này là bằng chứng nhóm tự theo dõi và nộp kèm báo cáo hiện trạng. Mục tiêu tự đặt: **toàn dự án không quá khoảng 25%**, để có biên an toàn.

Ước lượng này do nhóm tự chấm. Nếu BTC dùng cách đo khác, hãy điều chỉnh theo hướng dẫn của họ.

## Cách dùng

- Đánh dấu `[x]` ngay khi một hạng mục được merge vào `main`.
- Không đánh dấu hạng mục [Ngày thi] khi `PHASE: PRE_HACKATHON`.
- Cập nhật tiến độ ở cuối file mỗi lần đánh dấu.

## A. Phần mềm (FE + BE), tổng 100 điểm

### [Nền] (24 điểm, được làm trước)

| Xong | ID | Hạng mục | Owner | Điểm |
|---|---|---|---|---|
| [ ] | SW-01 | Hạ tầng và deploy Cloud Run | BE | 4 |
| [ ] | SW-02 | Firestore, Storage, API khung (documents, transactions CRUD) | BE | 4 |
| [ ] | SW-03 | Hộ kinh doanh demo cố định (không đăng nhập) | BE | 2 |
| [ ] | SW-04 | Khung responsive, điều hướng 4 tab, design tokens | FE | 4 |
| [ ] | SW-05 | Màn Thêm: chụp hoặc chọn ảnh, tải lên | FE | 4 |
| [ ] | SW-06 | Màn Sổ: xem danh sách, nhập tay | FE + BE | 6 |

### [Ngày thi] (76 điểm, để dành)

| Xong | ID | Hạng mục | Owner | Điểm | Mức |
|---|---|---|---|---|---|
| [ ] | SW-07 | Tích hợp agent thật (job, gọi agent, lưu kết quả) | BE | 12 | Must |
| [ ] | SW-08 | Khung "agent đang làm gì" theo SSE | FE + BE | 8 | Must |
| [ ] | SW-09 | Hàng đợi xác nhận (duyệt, sửa, từ chối) | FE + BE | 8 | Must |
| [ ] | SW-10 | Hiển thị cảnh báo bất thường | FE | 5 | Must |
| [ ] | SW-13 | Xuất sổ Excel đúng một mẫu, kèm gói chứng từ | BE (+FE) | 10 | Must |
| [ ] | SW-12 | Báo cáo tuần và tháng | FE + BE | 8 | Should |
| [ ] | SW-11 | Ghi âm giọng nói | FE | 4 | Should |
| [ ] | SW-16 | Tối ưu mobile, hoàn thiện PWA | FE | 5 | Should |
| [ ] | SW-17 | Dữ liệu demo và nút reset | FE + BE | 4 | Should |
| [ ] | SW-18 | Deploy cuối, min instance, rollback | BE | 4 | Should |
| [ ] | SW-14 | Hỏi đáp trên dữ liệu | FE + BE | 5 | Could |
| [ ] | SW-15 | Trung tâm thông báo | FE | 3 | Could |

## B. Agent và AI (AI Dev), tổng 100 điểm

### [Nền] (10 điểm, được làm trước)

| Xong | ID | Hạng mục | Điểm |
|---|---|---|---|
| [ ] | AI-01 | Bộ 30 đến 50 chứng từ mẫu (che thông tin nhạy cảm) kèm nhãn đáp án | 3 |
| [ ] | AI-02 | Schema Pydantic khớp contract (`agent/schemas.py`) | 2 |
| [ ] | AI-03 | Nháp prompt, đã thử bằng tay trong AI Studio (chưa có code gọi API) | 2 |
| [ ] | AI-04 | Danh sách mã số thuế giả cho demo | 1 |
| [ ] | AI-05 | Khảo sát cột của mẫu sổ cần xuất (ghi vào `docs/`) | 2 |

### [Ngày thi] (90 điểm, để dành)

| Xong | ID | Hạng mục | Điểm | Mức |
|---|---|---|---|---|
| [ ] | AI-06 | Trích xuất ảnh thành giao dịch có cấu trúc kèm độ tin cậy | 15 | Must |
| [ ] | AI-07 | Chuẩn hóa tiền, ngày, tên mặt hàng | 8 | Must |
| [ ] | AI-08 | Công cụ kiểm tra: trùng, giá bất thường, tổng, mã số thuế, danh mục | 20 | Must |
| [ ] | AI-09 | Quyết định tự ghi hoặc đưa vào hàng đợi | 10 | Must |
| [ ] | AI-10 | `process_document` phát sự kiện SSE | 8 | Must |
| [ ] | AI-13 | Bộ đo độ chính xác và số liệu thật | 8 | Must |
| [ ] | AI-14 | pytest cho các luật | 5 | Must |
| [ ] | AI-11 | Nhập giọng nói | 8 | Should |
| [ ] | AI-12 | Nhận xét báo cáo bằng lời | 8 | Should |

## C. Tính tiến độ

```
Tiến độ dự án (%) ≈ (điểm SW đã xong + điểm AI đã xong) / 200 * 100
```

Giả định khối lượng hai bên xấp xỉ nhau.

| Mốc | SW | AI | Ước lượng |
|---|---|---|---|
| Sau khi làm xong toàn bộ [Nền] | 24 | 10 | 17% |
| Ngưỡng cảnh báo tự đặt | | | 25% |
| Trần của thể lệ | | | 30% |

**Nếu ước lượng chạm 25%: dừng làm thêm** và nhắn BTC hỏi lại trước khi tiếp tục.

Tiến độ hiện tại: SW = __ / 100, AI = __ / 100, ước lượng = __ %. Cập nhật lần cuối: __/__/2026.

## D. Mẫu báo cáo hiện trạng một trang (nộp cho BTC)

```
BÁO CÁO HIỆN TRẠNG: [Tên dự án]
Nhóm: [tên, 3 thành viên và vai trò]
Ngày: __/__/2026

1. Bài toán và đối tượng: (2 câu)
2. Đã làm đến thời điểm này:
   - (liệt kê hạng mục [Nền] đã xong, kèm ảnh chụp màn hình)
3. Chưa làm (sẽ làm trong ngày Hackathon):
   - (liệt kê hạng mục [Ngày thi])
4. Ước lượng mức hoàn thiện: __ % (cách tính: xem docs/SCOPE_30.md)
5. Hướng build tiếp theo trong ngày thi: (3 đến 5 gạch đầu dòng)
6. Liên kết: repo, tag `pre-hackathon`
```

## E. Việc làm một lần khi kết thúc giai đoạn chuẩn bị

1. Cập nhật mục C ở trên.
2. Gắn tag `pre-hackathon` trên `main`.
3. Điền và lưu báo cáo mẫu D.
4. Gửi BTC theo hình thức họ yêu cầu, giữ lại tin nhắn xác nhận.
