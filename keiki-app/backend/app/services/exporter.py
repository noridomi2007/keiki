from __future__ import annotations

import csv
import io
import zipfile
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from backend.app.repositories.memory import MemoryRepo
from backend.app.security import sanitize_spreadsheet_cell
from backend.app.services.storage import storage_service


def _style_header(ws, row_idx: int, col_count: int) -> None:
    fill = PatternFill(start_color="3B2FA8", end_color="3B2FA8", fill_type="solid")
    font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    thin = Side(border_style="thin", color="CBD5E1")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    for col in range(1, col_count + 1):
        cell = ws.cell(row=row_idx, column=col)
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border


def _auto_width(ws, col_count: int) -> None:
    for col in range(1, col_count + 1):
        col_letter = get_column_letter(col)
        max_len = max(
            (len(str(ws.cell(row=r, column=col).value or "")) for r in range(1, ws.max_row + 1)),
            default=12,
        )
        ws.column_dimensions[col_letter].width = min(max(max_len + 4, 14), 42)


def generate_tt152_excel(repo: MemoryRepo, month: str = "2026-11", household_id: str = "demo") -> bytes:
    """Generate full Circular 152/2025/TT-BTC Excel workbook (S1-HKD, S2-HKD, S3-HKD, HoSoVayVon) compatible with Google Sheets."""
    date_from = f"{month}-01"
    date_to = f"{month}-31"
    txs = [
        t
        for t in repo.list_transactions(household_id=household_id, date_from=date_from, date_to=date_to)
        if t.status == "recorded"
    ]
    txs.sort(key=lambda x: x.date)

    hh = repo.get_household(household_id) or {
        "name": "Cửa hàng Thương mại & Dịch vụ Minh Tâm",
        "address": "142 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh",
        "tax_code": "0316889912",
    }

    wb = Workbook()
    thin = Side(border_style="thin", color="CBD5E1")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    title_font = Font(name="Arial", size=14, bold=True, color="1B1F2A")
    sub_font = Font(name="Arial", size=10, italic=True, color="475569")
    bold_font = Font(name="Arial", size=11, bold=True)

    # =========================================================================
    # SHEET 1: S1-HKD — SỔ CHI TIẾT DOANH THU BÁN HÀNG HÓA, DỊCH VỤ
    # =========================================================================
    ws1 = wb.active
    ws1.title = "S1-HKD_DoanhThu"
    ws1["A1"] = sanitize_spreadsheet_cell(f"HỘ KINH DOANH: {hh.get('name', '').upper()} — MST: {hh.get('tax_code', '')}")
    ws1["A2"] = sanitize_spreadsheet_cell(f"Địa chỉ: {hh.get('address', '')}")
    ws1["A3"] = f"SỔ CHI TIẾT DOANH THU BÁN HÀNG HÓA, DỊCH VỤ (Mẫu số S1-HKD — Thông tư 152/2025/TT-BTC) — Kỳ: {month}"
    ws1["A1"].font = bold_font
    ws1["A3"].font = title_font

    headers_s1 = [
        "Ngày ghi sổ",
        "Số hiệu CT",
        "Diễn giải (Đối tác / Nội dung)",
        "Phân phối hàng hóa (1,5%)",
        "Sản xuất, ăn uống (4,5%)",
        "Dịch vụ, lưu trú (7%)",
        "Kinh doanh khác (3%)",
        "PT Thanh toán",
        "Chứng từ gốc đối chiếu",
    ]
    for idx, h in enumerate(headers_s1, start=1):
        ws1.cell(row=5, column=idx, value=h)
    _style_header(ws1, 5, len(headers_s1))

    row_s1 = 6
    tot_g1 = tot_g2 = tot_g3 = tot_g4 = 0
    for t in txs:
        if t.type != "revenue":
            continue
        g1 = t.amount_vnd if t.tax_group == "phan_phoi_hang_hoa" else 0
        g2 = t.amount_vnd if t.tax_group == "san_xuat_van_tai_an_uong" else 0
        g3 = t.amount_vnd if t.tax_group == "dich_vu_xay_dung" else 0
        g4 = t.amount_vnd if t.tax_group == "kinh_doanh_khac" else 0
        tot_g1 += g1
        tot_g2 += g2
        tot_g3 += g3
        tot_g4 += g4

        evidence_str = ", ".join(t.linked_document_ids) if t.linked_document_ids else ("Ghi âm giọng nói" if t.transcript else "Nhập tay")
        vals = [
            sanitize_spreadsheet_cell(t.date),
            sanitize_spreadsheet_cell(t.id),
            sanitize_spreadsheet_cell(t.counterparty or "Doanh thu bán hàng"),
            g1,
            g2,
            g3,
            g4,
            "Chuyển khoản" if t.payment_method == "transfer" else "Tiền mặt",
            sanitize_spreadsheet_cell(evidence_str),
        ]
        for c_idx, val in enumerate(vals, start=1):
            c = ws1.cell(row=row_s1, column=c_idx, value=val)
            c.border = border
            if 4 <= c_idx <= 7:
                c.number_format = "#,##0"
        row_s1 += 1

    ws1.cell(row=row_s1, column=3, value="TỔNG CỘNG DOANH THU TRONG KỲ").font = bold_font
    for col_i, tot_v in [(4, tot_g1), (5, tot_g2), (6, tot_g3), (7, tot_g4)]:
        c = ws1.cell(row=row_s1, column=col_i, value=tot_v)
        c.font = bold_font
        c.number_format = "#,##0"
        c.border = border
    _auto_width(ws1, len(headers_s1))

    # =========================================================================
    # SHEET 2: S2-HKD — SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA
    # =========================================================================
    ws2 = wb.create_sheet(title="S2-HKD_VatLieuHangHoa")
    ws2["A1"] = f"SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA (Mẫu số S2-HKD — TT 152/2025/TT-BTC) — Kỳ: {month}"
    ws2["A1"].font = title_font
    headers_s2 = [
        "Ngày nhập",
        "Mã giao dịch",
        "Nhà cung cấp",
        "Tên vật liệu / hàng hóa",
        "Số lượng",
        "Đơn giá (VND)",
        "Thành tiền (VND)",
    ]
    for idx, h in enumerate(headers_s2, start=1):
        ws2.cell(row=3, column=idx, value=h)
    _style_header(ws2, 3, len(headers_s2))

    row_s2 = 4
    for t in txs:
        if t.type == "expense" and t.items:
            for item in t.items:
                vals = [
                    sanitize_spreadsheet_cell(t.date),
                    sanitize_spreadsheet_cell(t.id),
                    sanitize_spreadsheet_cell(t.counterparty or ""),
                    sanitize_spreadsheet_cell(item.name),
                    item.quantity,
                    item.unit_price_vnd,
                    item.line_total_vnd,
                ]
                for c_idx, val in enumerate(vals, start=1):
                    c = ws2.cell(row=row_s2, column=c_idx, value=val)
                    c.border = border
                    if c_idx in (6, 7):
                        c.number_format = "#,##0"
                row_s2 += 1
    _auto_width(ws2, len(headers_s2))

    # =========================================================================
    # SHEET 3: S3-HKD — SỔ CHI PHÍ SẢN XUẤT, KINH DOANH
    # =========================================================================
    ws3 = wb.create_sheet(title="S3-HKD_ChiPhi")
    ws3["A1"] = f"SỔ CHI PHÍ SẢN XUẤT, KINH DOANH (Mẫu số S3-HKD — Thông tư 152/2025/TT-BTC) — Kỳ: {month}"
    ws3["A1"].font = title_font
    headers_s3 = [
        "Ngày ghi sổ",
        "Số hiệu CT",
        "Nhà cung cấp / Nội dung chi",
        "Mã số thuế NCC",
        "Tổng số tiền chi (VND)",
        "Chi nhập hàng / nguyên liệu",
        "Chi điện, nước, vận hành",
        "Chi nhân công & khác",
        "Chứng từ gốc đính kèm",
    ]
    for idx, h in enumerate(headers_s3, start=1):
        ws3.cell(row=3, column=idx, value=h)
    _style_header(ws3, 3, len(headers_s3))

    row_s3 = 4
    tot_exp = 0
    for t in txs:
        if t.type != "expense":
            continue
        tot_exp += t.amount_vnd
        c_nhap = t.amount_vnd if t.category == "nhap_hang" else 0
        c_vh = t.amount_vnd if t.category == "chi_phi_van_hanh" else 0
        c_khac = t.amount_vnd if t.category not in ("nhap_hang", "chi_phi_van_hanh") else 0
        ev_str = " + ".join(t.linked_document_ids) if t.linked_document_ids else "Nhập tay"
        if len(t.linked_document_ids) >= 2:
            ev_str += " (Đủ Hóa đơn + CK)"

        vals = [
            sanitize_spreadsheet_cell(t.date),
            sanitize_spreadsheet_cell(t.id),
            sanitize_spreadsheet_cell(t.counterparty or "Chi phí"),
            sanitize_spreadsheet_cell(t.tax_code or ""),
            t.amount_vnd,
            c_nhap,
            c_vh,
            c_khac,
            sanitize_spreadsheet_cell(ev_str),
        ]
        for c_idx, val in enumerate(vals, start=1):
            c = ws3.cell(row=row_s3, column=c_idx, value=val)
            c.border = border
            if 5 <= c_idx <= 8:
                c.number_format = "#,##0"
        row_s3 += 1

    ws3.cell(row=row_s3, column=3, value="TỔNG CHI PHÍ TRONG KỲ").font = bold_font
    c_tot = ws3.cell(row=row_s3, column=5, value=tot_exp)
    c_tot.font = bold_font
    c_tot.number_format = "#,##0"
    _auto_width(ws3, len(headers_s3))

    # =========================================================================
    # SHEET 4: HoSoVayVon — TÓM TẮT HỒ SƠ DÒNG TIỀN MINH BẠCH VAY VỐN NGÂN HÀNG
    # =========================================================================
    ws4 = wb.create_sheet(title="HoSoVayVon_NganHang")
    ws4["A1"] = "HỒ SƠ TÓM TẮT DÒNG TIỀN & ĐỘ MINH BẠCH CHỨNG TỪ (PHỤC VỤ TIẾP CẬN VỐN VAY NGÂN HÀNG)"
    ws4["A1"].font = title_font
    ws4["A2"] = sanitize_spreadsheet_cell(f"Đơn vị: {hh.get('name', '')} | Địa chỉ: {hh.get('address', '')} | MST: {hh.get('tax_code', '')}")
    ws4["A2"].font = sub_font

    total_rev = tot_g1 + tot_g2 + tot_g3 + tot_g4
    net_profit = total_rev - tot_exp
    with_ev = sum(1 for t in txs if t.document_id or t.linked_document_ids or t.transcript)
    cross_ev = sum(1 for t in txs if len(t.linked_document_ids) >= 2)
    ratio_pct = round((with_ev / len(txs)) * 100, 1) if txs else 100.0

    summary_rows = [
        ("Chỉ tiêu đánh giá năng lực tài chính & minh bạch sổ sách", "Giá trị"),
        ("1. Tổng doanh thu ghi sổ hợp lệ trong kỳ (VND)", total_rev),
        ("2. Tổng chi phí sản xuất kinh doanh có đối chiếu (VND)", tot_exp),
        ("3. Lợi nhuận ròng tạm tính trong kỳ (VND)", net_profit),
        ("4. Tổng số bút toán đã ghi sổ", len(txs)),
        ("5. Số bút toán có chứng từ gốc (Ảnh hóa đơn / VietQR / Ghi âm)", with_ev),
        ("6. Số bút toán đối chiếu chéo kép (Có đủ cả Hóa đơn giấy + Ảnh chuyển khoản)", cross_ev),
        ("7. Tỷ lệ minh bạch chứng từ (%)", f"{ratio_pct}%"),
    ]
    for r_i, (k, v) in enumerate(summary_rows, start=4):
        c1 = ws4.cell(row=r_i, column=1, value=k)
        c2 = ws4.cell(row=r_i, column=2, value=v)
        c1.border = border
        c2.border = border
        if isinstance(v, int) and r_i in (5, 6, 7):
            c2.number_format = "#,##0"
    _style_header(ws4, 4, 2)
    _auto_width(ws4, 2)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def generate_export_zip(repo: MemoryRepo, month: str = "2026-11", household_id: str = "demo") -> bytes:
    """Create a .zip containing the TT152 Excel workbook, all original evidence images, and an index CSV."""
    xlsx_bytes = generate_tt152_excel(repo=repo, month=month, household_id=household_id)
    date_from = f"{month}-01"
    date_to = f"{month}-31"
    txs = [
        t
        for t in repo.list_transactions(household_id=household_id, date_from=date_from, date_to=date_to)
        if t.status == "recorded"
    ]

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"So_Ke_Toan_TT152_Keiki_{month}.xlsx", xlsx_bytes)

        csv_buf = io.StringIO()
        writer = csv.writer(csv_buf)
        writer.writerow(["transaction_id", "date", "type", "amount_vnd", "counterparty", "evidence_files"])

        for t in txs:
            doc_ids = list(t.linked_document_ids) or ([t.document_id] if t.document_id else [])
            saved_files: list[str] = []
            for did in doc_ids:
                if not did:
                    continue
                doc = repo.get_document(did)
                if doc and doc.household_id == household_id:
                    ext = Path(doc.storage_path).suffix or ".svg"
                    arc_name = f"chung_tu/{t.date}_{t.id}_{did}{ext}"
                    raw_bytes = storage_service.read_bytes(doc.storage_path, doc.preset_hint)
                    zf.writestr(arc_name, raw_bytes)
                    saved_files.append(arc_name)
            writer.writerow([
                sanitize_spreadsheet_cell(t.id),
                sanitize_spreadsheet_cell(t.date),
                sanitize_spreadsheet_cell(t.type),
                t.amount_vnd,
                sanitize_spreadsheet_cell(t.counterparty or ""),
                sanitize_spreadsheet_cell("; ".join(saved_files)),
            ])

        zf.writestr("doi_chieu_chung_tu.csv", csv_buf.getvalue().encode("utf-8-sig"))

    return zip_buf.getvalue()
