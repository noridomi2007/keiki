import React, { useState } from 'react';
import { api } from '../api/endpoints';
import { Stamp } from '../components/Stamp';
import { vi } from '../i18n/vi';
import type { Transaction } from '../types/contract';
import { formatDateVi, formatVnd } from '../utils/money';

interface LedgerPageProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onSelectReviewItem: () => void;
}

export function LedgerPage({
  transactions,
  onRefresh,
  onSelectReviewItem,
}: LedgerPageProps) {
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual entry form state
  const [manualDate, setManualDate] = useState('2026-11-12');
  const [manualType, setManualType] = useState<'revenue' | 'expense'>('revenue');
  const [manualAmount, setManualAmount] = useState('500000');
  const [manualCounterparty, setManualCounterparty] = useState('');
  const [manualPayment, setManualPayment] = useState<'cash' | 'transfer'>('cash');

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cp = (t.counterparty || '').toLowerCase();
      const tr = (t.transcript || '').toLowerCase();
      const itemsStr = t.items.map((i) => i.name.toLowerCase()).join(' ');
      if (!cp.includes(q) && !tr.includes(q) && !itemsStr.includes(q)) return false;
    }
    return true;
  });

  const totalRev = filtered
    .filter((t) => t.type === 'revenue' && t.status === 'recorded')
    .reduce((acc, t) => acc + t.amount_vnd, 0);
  const totalExp = filtered
    .filter((t) => t.type === 'expense' && t.status === 'recorded')
    .reduce((acc, t) => acc + t.amount_vnd, 0);

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(manualAmount.replace(/[^\d]/g, ''), 10);
    if (!amt || amt <= 0) return;
    await api.createManualTransaction({
      date: manualDate,
      type: manualType,
      payment_method: manualPayment,
      amount_vnd: amt,
      counterparty:
        manualCounterparty.trim() ||
        (manualType === 'revenue' ? 'Bán hàng tại quán' : 'Chi mua hàng hóa'),
    });
    setShowManualModal(false);
    setManualCounterparty('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Top Summary Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tổng Thu đã ghi sổ</div>
          <div className="tabular-nums mt-1 text-lg font-extrabold text-[#0F7B5F]">
            +{formatVnd(totalRev)}
          </div>
        </div>
        <div className="rounded-2xl border border-[#D5DCE8] bg-white p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tổng Chi đã ghi sổ</div>
          <div className="tabular-nums mt-1 text-lg font-extrabold text-[#C62828]">
            -{formatVnd(totalExp)}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#D5DCE8] bg-white p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Chênh lệch Thu - Chi</div>
            <div className="tabular-nums mt-1 text-lg font-extrabold text-[#3B2FA8]">
              {formatVnd(totalRev - totalExp)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-[#3B2FA8] px-3 py-2 text-xs font-bold text-white hover:bg-[#2f248a] cursor-pointer"
          >
            <span className="material-symbols-rounded text-base">edit_note</span>
            {vi.actions.manualEntry}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#D5DCE8] bg-white p-3">
        <div className="flex gap-1.5">
          {(
            [
              ['all', 'Tất cả'],
              ['revenue', 'Khoản Thu (+)'],
              ['expense', 'Khoản Chi (-)'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterType === key
                  ? 'bg-[#3B2FA8] text-white'
                  : 'bg-[#F6F8FB] text-slate-700 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên mặt hàng, đại lý, câu ghi âm..."
            className="w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] py-1.5 pl-3 pr-8 text-xs font-medium text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Vietnamese Lined Notebook ("Vở Ô Ly") Ledger */}
      <div className="notebook-paper overflow-hidden rounded-2xl border-2 border-[#D5DCE8] shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-[#D5DCE8] bg-[#FFF9DB]/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-[#3B2FA8]">menu_book</span>
            <h3 className="font-bold text-[#1B1F2A]">
              Sổ Ghi Chép Thu Chi Hộ Kinh Doanh (TT 152/2025/TT-BTC)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {filtered.length} dòng bút toán
          </span>
        </div>

        <div className="divide-y divide-[#D5DCE8]">
          {filtered.map((tx) => {
            const isNeedsReview = tx.status === 'needs_review';
            const hasMergedDocs = tx.linked_document_ids && tx.linked_document_ids.length >= 2;
            const docCount = tx.linked_document_ids?.length || (tx.document_id ? 1 : 0);

            return (
              <div
                key={tx.id}
                onClick={() => {
                  if (isNeedsReview) {
                    onSelectReviewItem();
                  } else {
                    setSelectedTx(tx);
                  }
                }}
                className="relative flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#3B2FA8]/5 cursor-pointer"
              >
                {/* Red notebook left margin line */}
                <div className="w-16 shrink-0 border-r-2 border-[#C62828]/45 pr-2 text-center">
                  <div className="text-xs font-bold text-[#1B1F2A]">
                    {formatDateVi(tx.date).slice(0, 5)}
                  </div>
                  <div className="text-[11px] text-slate-500">{tx.date.slice(0, 4)}</div>
                  <div className="mt-1">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        tx.payment_method === 'transfer'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tx.payment_method === 'transfer' ? 'CK/QR' : 'Tiền mặt'}
                    </span>
                  </div>
                </div>

                {/* Main Entry Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-bold text-[#1B1F2A] ${
                        isNeedsReview ? 'red-wavy-underline text-[#C62828]' : ''
                      }`}
                    >
                      {tx.counterparty || 'Giao dịch hộ kinh doanh'}
                    </span>

                    {hasMergedDocs && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-[#3B2FA8]">
                        <span className="material-symbols-rounded text-xs">link</span>
                        {vi.mergedBadge}
                      </span>
                    )}

                    {!hasMergedDocs && docCount === 1 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <span className="material-symbols-rounded text-xs">image</span>
                        Có ảnh gốc
                      </span>
                    )}
                  </div>

                  {tx.transcript && (
                    <p className="mt-1 text-xs italic text-[#3B2FA8]">
                      🎙️ Giọng nói: "{tx.transcript}"
                    </p>
                  )}

                  {tx.items && tx.items.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-600 truncate">
                      {tx.items
                        .map((i) => `${i.name} (SL: ${i.quantity} × ${formatVnd(i.unit_price_vnd)})`)
                        .join(' • ')}
                    </p>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {vi.taxGroupLabels[tx.tax_group] || tx.tax_group}
                    </span>

                    {isNeedsReview && tx.warnings.length > 0 && (
                      <span className="rounded bg-[#FFE66D] px-2 py-0.5 text-[11px] font-bold text-[#C62828]">
                        ⚠️ {tx.warnings[0].code}: Bấm để xác nhận
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Stamp */}
                <div className="text-right shrink-0">
                  <div
                    className={`tabular-nums text-base sm:text-lg font-extrabold ${
                      tx.type === 'revenue' ? 'text-[#0F7B5F]' : 'text-[#1B1F2A]'
                    }`}
                  >
                    {tx.type === 'revenue' ? '+' : '-'}
                    {formatVnd(tx.amount_vnd)}
                  </div>
                  <div className="mt-1.5">
                    {tx.status === 'recorded' ? (
                      <Stamp animate={false} />
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-[#C62828] bg-red-50 px-2 py-0.5 text-[11px] font-bold text-[#C62828]">
                        Cần hỏi lại
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Detail & Evidence Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#D5DCE8] pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  Chi tiết bút toán #{selectedTx.id} • Ngày {formatDateVi(selectedTx.date)}
                </span>
                <h3 className="text-lg font-bold text-[#1B1F2A]">
                  {selectedTx.counterparty || 'Giao dịch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F6F8FB] p-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500">Số tiền ghi sổ:</span>
                <div className="tabular-nums text-lg font-extrabold text-[#3B2FA8]">
                  {formatVnd(selectedTx.amount_vnd)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Nhóm ngành Thông tư 152:</span>
                <div className="font-semibold text-[#1B1F2A]">
                  {vi.taxGroupLabels[selectedTx.tax_group]}
                </div>
              </div>
            </div>

            {/* Attached Original Evidence Images (Supports Merged Paper Receipt + Bank Transfer!) */}
            {(selectedTx.linked_document_ids?.length > 0 || selectedTx.document_id) && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  📎 Chứng từ gốc lưu trữ đối chiếu ({selectedTx.linked_document_ids.length || 1}{' '}
                  chứng từ):
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(selectedTx.linked_document_ids.length > 0
                    ? selectedTx.linked_document_ids
                    : [selectedTx.document_id!]
                  ).map((docId, idx) => (
                    <div
                      key={docId}
                      className="overflow-hidden rounded-xl border border-[#D5DCE8] bg-slate-50 p-2"
                    >
                      <div className="mb-1.5 text-xs font-bold text-[#3B2FA8]">
                        Chứng từ #{idx + 1} ({docId})
                      </div>
                      <img
                        src={`/api/documents/${docId}/file`}
                        alt={`Chứng từ ${docId}`}
                        className="mx-auto max-h-72 w-auto rounded-lg object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowManualModal(false)}
        >
          <form
            onSubmit={handleCreateManual}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#D5DCE8] pb-3">
              <h3 className="text-lg font-bold text-[#1B1F2A]">Ghi tay giao dịch vào sổ</h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600">Loại giao dịch</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as 'revenue' | 'expense')}
                  className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-sm font-semibold"
                >
                  <option value="revenue">Thu vào (Doanh thu)</option>
                  <option value="expense">Chi ra (Chi phí)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">Ngày ghi sổ</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600">Số tiền (VND)</label>
              <input
                type="number"
                required
                min={1000}
                step={1000}
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-base font-bold text-[#3B2FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600">
                Đối tác / Nội dung diễn giải
              </label>
              <input
                type="text"
                value={manualCounterparty}
                onChange={(e) => setManualCounterparty(e.target.value)}
                placeholder="Ví dụ: Bán 15 tô mì Quảng buổi trưa..."
                className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600">Hình thức thanh toán</label>
              <select
                value={manualPayment}
                onChange={(e) => setManualPayment(e.target.value as 'cash' | 'transfer')}
                className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-sm"
              >
                <option value="cash">Tiền mặt</option>
                <option value="transfer">Chuyển khoản / VietQR</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="rounded-xl border border-[#D5DCE8] px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#3B2FA8] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#2f248a] cursor-pointer"
              >
                Lưu & Đóng dấu ghi sổ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
