import { useState } from 'react';
import { api } from '../api/endpoints';
import { vi } from '../i18n/vi';
import type { Transaction } from '../types/contract';
import { formatDateVi, formatVnd } from '../utils/money';
import { speakVietnamese } from '../utils/speech';

interface ReviewPageProps {
  allTransactions: Transaction[];
  onUpdated: () => void;
}

export function ReviewPage({ allTransactions, onUpdated }: ReviewPageProps) {
  const reviewItems = allTransactions.filter((t) => t.status === 'needs_review');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCounterparty, setEditCounterparty] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleConfirm = async (tx: Transaction, mergeIntoDuplicate: boolean) => {
    setBusyId(tx.id);
    try {
      await api.confirmTransaction(tx.id, mergeIntoDuplicate);
      onUpdated();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (txId: string) => {
    setBusyId(txId);
    try {
      await api.rejectTransaction(txId, 'Chủ hộ bỏ qua chứng từ trùng/sai');
      onUpdated();
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditAmount(String(tx.amount_vnd));
    setEditCounterparty(tx.counterparty || '');
  };

  const saveEditAndConfirm = async (txId: string) => {
    setBusyId(txId);
    try {
      const amt = parseInt(editAmount.replace(/[^\d]/g, ''), 10);
      await api.patchTransaction(txId, {
        amount_vnd: amt > 0 ? amt : undefined,
        counterparty: editCounterparty.trim() || undefined,
      });
      await api.confirmTransaction(txId, false);
      setEditingId(null);
      onUpdated();
    } finally {
      setBusyId(null);
    }
  };

  if (reviewItems.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-[#D5DCE8] bg-white p-10 text-center shadow-xs">
        <span className="material-symbols-rounded text-5xl text-[#0F7B5F]">task_alt</span>
        <h3 className="mt-3 text-xl font-bold text-[#1B1F2A]">
          Tất cả chứng từ đã được kiểm tra rõ ràng!
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Hiện không có hóa đơn hay chuyển khoản nào nghi trùng hoặc bất thường cần hỏi lại cô/chú.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#C62828]/30 bg-[#FFF8F8] p-4">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-rounded text-2xl text-[#C62828]">
            notification_important
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#1B1F2A]">
              Keiki cần hỏi lại cô/chú ({reviewItems.length} chứng từ)
            </h2>
            <p className="text-xs text-slate-600">
              Nguyên tắc an toàn: Khi nghi ngờ trùng chéo hóa đơn – chuyển khoản hoặc giá tăng đột
              biến, Keiki luôn hỏi ý kiến cô/chú trước khi ghi sổ.
            </p>
          </div>
        </div>
      </div>

      {reviewItems.map((tx) => {
        const isCrossDup = tx.warnings.some((w) => w.code === 'CROSS_DUPLICATE');
        const origTx = tx.duplicate_of_id
          ? allTransactions.find((x) => x.id === tx.duplicate_of_id)
          : null;

        return (
          <div
            key={tx.id}
            className="overflow-hidden rounded-2xl border-2 border-[#C62828]/60 bg-white shadow-sm"
          >
            {/* Proactive Question Header with Read-Aloud Button for Older Users */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D5DCE8] bg-[#FFE66D]/55 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#C62828]">
                  <span className="material-symbols-rounded text-base">psychology_alt</span>
                  Câu hỏi chủ động từ Trợ lý AI Keiki:
                </div>
                <p className="mt-1 text-base font-bold leading-snug text-[#1B1F2A]">
                  "{tx.clarification_question || tx.warnings[0]?.message}"
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  speakVietnamese(tx.clarification_question || tx.warnings[0]?.message || '')
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3B2FA8] px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-[#2f248a] cursor-pointer"
              >
                <span className="material-symbols-rounded text-lg">volume_up</span>
                🔊 {vi.actions.speakAloud}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-12">
              {/* Left: Original Document Image Preview */}
              <div className="md:col-span-5">
                {tx.document_id ? (
                  <div className="overflow-hidden rounded-xl border border-[#D5DCE8] bg-slate-50 p-2">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Chứng từ vừa tải lên ({tx.document_id})</span>
                      <span className="rounded bg-white px-2 py-0.5 text-[#3B2FA8]">
                        {tx.payment_method === 'transfer' ? 'Ảnh chuyển khoản' : 'Ảnh hóa đơn giấy'}
                      </span>
                    </div>
                    <img
                      src={`/api/documents/${tx.document_id}/file`}
                      alt="Chứng từ cần duyệt"
                      className="mx-auto max-h-72 w-auto rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#D5DCE8] bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Chứng từ ghi âm / văn bản
                  </div>
                )}
              </div>

              {/* Right: Extracted Fields, Warnings & Action Buttons */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Warning Badges */}
                  <div className="space-y-1.5">
                    {tx.warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-xl border border-[#C62828]/30 bg-red-50/80 px-3 py-2 text-xs font-semibold text-[#C62828]"
                      >
                        <span className="material-symbols-rounded text-base">warning</span>
                        <span>
                          <strong>[{w.code}]</strong> {w.message}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Side-by-Side Comparison when CROSS_DUPLICATE is detected */}
                  {isCrossDup && origTx && (
                    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-3.5 text-xs">
                      <div className="font-bold text-[#3B2FA8]">
                        🔗 Đối chiếu với Hóa đơn gốc đã ghi sổ trước đó (Mã #{origTx.id}):
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                          • Đối tác: <strong>{origTx.counterparty}</strong>
                        </div>
                        <div>
                          • Số tiền: <strong>{formatVnd(origTx.amount_vnd)}</strong>
                        </div>
                        <div>• Ngày hóa đơn: {formatDateVi(origTx.date)}</div>
                        <div>• Chứng từ hiện có: {origTx.linked_document_ids.join(', ')}</div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Fields Table */}
                  {editingId === tx.id ? (
                    <div className="space-y-3 rounded-xl border border-[#3B2FA8] bg-[#F6F8FB] p-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600">
                          Sửa tên đối tác / diễn giải:
                        </label>
                        <input
                          type="text"
                          value={editCounterparty}
                          onChange={(e) => setEditCounterparty(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#D5DCE8] bg-white p-2 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600">
                          Sửa tổng số tiền (VND):
                        </label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#D5DCE8] bg-white p-2 text-base font-bold text-[#3B2FA8]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEditAndConfirm(tx.id)}
                          className="rounded-xl bg-[#0F7B5F] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                        >
                          Lưu sửa đổi & Ghi vào sổ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] p-3.5 text-sm">
                      <div>
                        <span className="text-xs text-slate-500">Đối tác / Cửa hàng:</span>
                        <div
                          className={`font-bold text-[#1B1F2A] ${
                            (tx.confidence?.counterparty ?? 1) < 0.85
                              ? 'bg-[#FFE66D] px-1.5 py-0.5 rounded'
                              : ''
                          }`}
                        >
                          {tx.counterparty || 'Chưa rõ'}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Tổng số tiền đọc được:</span>
                        <div className="tabular-nums text-lg font-extrabold text-[#C62828] bg-[#FFE66D]/70 px-2 py-0.5 rounded inline-block">
                          {formatVnd(tx.amount_vnd)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Ngày chứng từ:</span>
                        <div className="font-semibold">{formatDateVi(tx.date)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Phân loại sổ TT 152:</span>
                        <div className="font-semibold text-xs">
                          {vi.taxGroupLabels[tx.tax_group]}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {isCrossDup && tx.duplicate_of_id && (
                    <button
                      type="button"
                      disabled={busyId === tx.id}
                      onClick={() => handleConfirm(tx, true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3B2FA8] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2f248a] cursor-pointer"
                    >
                      <span className="material-symbols-rounded text-xl">merge</span>
                      {vi.actions.mergeDuplicate}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busyId === tx.id}
                    onClick={() => handleConfirm(tx, false)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F7B5F] px-4 py-3 text-sm font-bold text-white shadow hover:bg-emerald-800 cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-lg">check_circle</span>
                    {isCrossDup ? 'Ghi thành giao dịch riêng' : vi.actions.confirmRecord}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === tx.id}
                    onClick={() => startEdit(tx)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#D5DCE8] bg-white px-3.5 py-3 text-xs font-bold text-[#1B1F2A] hover:bg-slate-100 cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-base">edit</span>
                    {vi.actions.editTransaction}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === tx.id}
                    onClick={() => handleReject(tx.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#C62828]/40 bg-red-50 px-3.5 py-3 text-xs font-bold text-[#C62828] hover:bg-red-100 cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-base">delete_forever</span>
                    {vi.actions.rejectTransaction}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
