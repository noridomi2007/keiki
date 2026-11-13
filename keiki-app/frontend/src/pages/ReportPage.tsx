import { useEffect, useState } from 'react';
import { api } from '../api/endpoints';
import { vi } from '../i18n/vi';
import type { ReportResponse } from '../types/contract';
import { formatVnd } from '../utils/money';
import { speakVietnamese } from '../utils/speech';

export function ReportPage() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [month, setMonth] = useState('2026-11');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getReport(month)
      .then((res) => {
        if (mounted) setReport(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [month]);

  if (loading || !report) {
    return (
      <div className="rounded-2xl border border-[#D5DCE8] bg-white p-8 text-center text-sm text-slate-600">
        Đang tổng hợp sổ kế toán và tính toán báo cáo theo Thông tư 152/2025/TT-BTC...
      </div>
    );
  }

  const maxTopItem = Math.max(...report.top_items.map((i) => i.total_vnd), 1);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">Doanh thu trong kỳ</div>
          <div className="tabular-nums mt-1.5 text-xl font-extrabold text-[#0F7B5F]">
            {formatVnd(report.totals.revenue_vnd)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Sổ S1-HKD (Đã ghi sổ)</div>
        </div>

        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">Chi phí sản xuất KD</div>
          <div className="tabular-nums mt-1.5 text-xl font-extrabold text-[#C62828]">
            {formatVnd(report.totals.expense_vnd)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Sổ S2-HKD & S3-HKD</div>
        </div>

        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">Lợi nhuận ròng tạm tính</div>
          <div className="tabular-nums mt-1.5 text-xl font-extrabold text-[#3B2FA8]">
            {formatVnd(report.totals.profit_vnd)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Doanh thu − Chi phí</div>
        </div>

        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">
            Thuế HKD ước tính (TT 152)
          </div>
          <div className="tabular-nums mt-1.5 text-xl font-extrabold text-amber-700">
            {formatVnd(report.totals.estimated_tax_vnd)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">GTGT + TNCN theo nhóm ngành</div>
        </div>
      </div>

      {/* Gemini AI Executive Summary */}
      {report.summary_text && (
        <div className="rounded-2xl border-2 border-[#3B2FA8]/30 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-2xl text-[#3B2FA8]">auto_awesome</span>
              <h3 className="font-bold text-[#1B1F2A]">
                Nhận xét của Trợ lý AI Keiki (Google Gemini)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => speakVietnamese(report.summary_text || '')}
              className="inline-flex items-center gap-1 rounded-xl bg-[#3B2FA8]/10 px-3 py-1.5 text-xs font-bold text-[#3B2FA8] hover:bg-[#3B2FA8]/20 cursor-pointer"
            >
              <span className="material-symbols-rounded text-base">volume_up</span>
              🔊 Nghe đọc báo cáo
            </button>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-800">{report.summary_text}</p>
        </div>
      )}

      {/* Bank Loan Readiness & Transparent Bookkeeping Card */}
      <div className="rounded-2xl border-2 border-[#0F7B5F]/40 bg-emerald-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0F7B5F] px-3 py-0.5 text-xs font-bold text-white">
              <span className="material-symbols-rounded text-sm">account_balance</span>
              Hồ sơ Sổ sách Minh bạch — Tiếp cận Vốn vay Ngân hàng
            </div>
            <h3 className="mt-2 text-lg font-bold text-[#1B1F2A]">
              Độ tin cậy chứng từ đạt {report.loan_readiness.verified_ratio_pct}%
            </h3>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed">
              Có <strong>{report.loan_readiness.with_evidence_count}</strong> /{' '}
              {report.loan_readiness.total_recorded_count} bút toán đính kèm đầy đủ ảnh hóa đơn gốc
              hoặc ghi âm (trong đó có{' '}
              <strong>{report.loan_readiness.cross_verified_count} bút toán đối chiếu kép</strong>{' '}
              khớp cả Hóa đơn giấy lẫn Biên lai chuyển khoản VietQR). Giúp hộ kinh doanh chứng minh
              dòng tiền thực tế khi vay vốn ngân hàng chính thống.
            </p>
          </div>

          <div className="text-center rounded-2xl bg-white px-5 py-3 border border-[#0F7B5F]/30 shadow-xs">
            <div className="text-3xl font-extrabold text-[#0F7B5F]">
              {report.loan_readiness.verified_ratio_pct}%
            </div>
            <div className="text-[11px] font-bold text-slate-600">Chứng từ hợp lệ</div>
          </div>
        </div>
      </div>

      {/* Circular 152/2025/TT-BTC Export Section */}
      <div className="rounded-2xl border-2 border-[#3B2FA8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#1B1F2A]">
              📥 Xuất Sổ Kế Toán Chuẩn Thông tư 152/2025/TT-BTC & Google Sheets
            </h3>
            <p className="text-xs text-slate-600">
              Bao gồm đủ 4 Sheet: <strong>S1-HKD (Doanh thu)</strong>,{' '}
              <strong>S2-HKD (Vật liệu/Hàng hóa)</strong>, <strong>S3-HKD (Chi phí)</strong> và{' '}
              <strong>Hồ sơ Vay vốn Ngân hàng</strong>. Mở trực tiếp trên Excel hoặc Google Trang
              tính (Google Sheets).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Kỳ sổ:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl border border-[#D5DCE8] px-3 py-1.5 text-sm font-bold text-[#1B1F2A]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/api/export?month=${month}&evidence=false`}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-[#3B2FA8] px-5 py-3 text-sm font-bold text-white shadow hover:bg-[#2f248a]"
          >
            <span className="material-symbols-rounded text-xl">table_view</span>
            {vi.actions.exportExcel}
          </a>

          <a
            href={`/api/export?month=${month}&evidence=true`}
            download
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0F7B5F] bg-[#0F7B5F]/10 px-5 py-3 text-sm font-bold text-[#0F7B5F] hover:bg-[#0F7B5F]/20"
          >
            <span className="material-symbols-rounded text-xl">folder_zip</span>
            {vi.actions.exportZip}
          </a>
        </div>
      </div>

      {/* Tax Breakdown Table by Industry Group (S1-HKD) */}
      <div className="rounded-2xl border border-[#D5DCE8] bg-white p-5 shadow-xs">
        <h3 className="font-bold text-[#1B1F2A]">
          Bảng phân bổ Doanh thu & Thuế theo nhóm ngành (Mẫu S1-HKD — TT 152/2025/TT-BTC)
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D5DCE8] text-xs font-bold uppercase text-slate-500">
                <th className="py-2 pr-3">Nhóm ngành kinh doanh</th>
                <th className="py-2 px-3 text-right">Doanh thu ghi sổ</th>
                <th className="py-2 px-3 text-right">Tỷ lệ thuế</th>
                <th className="py-2 pl-3 text-right">Thuế ước tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DCE8]">
              {report.tax_breakdown.map((row) => (
                <tr key={row.tax_group}>
                  <td className="py-2.5 pr-3 font-medium text-[#1B1F2A]">{row.label}</td>
                  <td className="tabular-nums py-2.5 px-3 text-right font-bold">
                    {formatVnd(row.revenue_vnd)}
                  </td>
                  <td className="tabular-nums py-2.5 px-3 text-right text-slate-600">
                    {row.rate_pct}%
                  </td>
                  <td className="tabular-nums py-2.5 pl-3 text-right font-bold text-[#3B2FA8]">
                    {formatVnd(row.tax_vnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Items & Price Increase Alerts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-5 shadow-xs">
          <h3 className="font-bold text-[#1B1F2A]">Khoản mục giao dịch lớn nhất trong kỳ</h3>
          <div className="mt-3 space-y-3">
            {report.top_items.map((item, idx) => {
              const widthPct = Math.max(Math.round((item.total_vnd / maxTopItem) * 100), 8);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#1B1F2A]">{item.name}</span>
                    <span className="tabular-nums font-bold text-[#3B2FA8]">
                      {formatVnd(item.total_vnd)}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-[#3B2FA8]"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-5 shadow-xs">
          <h3 className="font-bold text-[#1B1F2A]">
            ⚠️ Cảnh báo mặt hàng biến động giá nhập (&gt; 30%)
          </h3>
          {report.price_increases.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Không có mặt hàng nào tăng giá bất thường.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {report.price_increases.map((al, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#C62828]/30 bg-red-50/70 p-3 text-xs"
                >
                  <div className="font-bold text-[#C62828]">
                    {al.item} — Tăng +{al.pct}%
                  </div>
                  <div className="mt-0.5 text-slate-700">
                    Nhà cung cấp: <strong>{al.counterparty}</strong>
                  </div>
                  <div className="mt-1 tabular-nums text-slate-600">
                    Giá lịch sử trung vị: {formatVnd(al.old_vnd)} → Hóa đơn mới:{' '}
                    <strong className="text-[#C62828]">{formatVnd(al.new_vnd)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
