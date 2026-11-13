import type { JobEventRecord, Transaction } from '../types/contract';
import { formatVnd } from '../utils/money';
import { speakVietnamese } from '../utils/speech';
import { Stamp } from './Stamp';

interface AgentTimelineProps {
  events: JobEventRecord[];
  isRunning: boolean;
  finalDecision: 'recorded' | 'needs_review' | null;
  resultTransaction: Transaction | null;
  onOpenReviewTab: () => void;
  onOpenLedgerTab: () => void;
}

const STEP_LABELS: Record<string, string> = {
  receive: '1. Tiếp nhận chứng từ',
  quality_check: '2. Kiểm tra độ nét & định dạng',
  extract: '3. Google Gemini đọc đa phương thức',
  normalize: '4. Chuẩn hóa tiền tệ VND & phân loại thuế',
  validate: '5. Kiểm toán tổng tiền, lịch sử giá & trùng chéo',
  decide: '6. Ra quyết định kế toán',
  save: '7. Lưu vào sổ Firestore',
  done: '8. Hoàn tất',
};

export function AgentTimeline({
  events,
  isRunning,
  finalDecision,
  resultTransaction,
  onOpenReviewTab,
  onOpenLedgerTab,
}: AgentTimelineProps) {
  if (events.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="mt-5 rounded-2xl border-2 border-[#3B2FA8]/30 bg-white p-5 shadow-md"
    >
      <div className="flex items-center justify-between border-b border-[#D5DCE8] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-rounded text-2xl text-[#3B2FA8]">auto_awesome</span>
          <div>
            <h3 className="font-bold text-[#1B1F2A]">Tiến trình Trợ lý AI Keiki (Google Gemini)</h3>
            <p className="text-xs text-slate-600">
              Gemini đọc hiểu đa phương thức • Code Python kiểm toán số học
            </p>
          </div>
        </div>
        {isRunning && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B2FA8]/10 px-3 py-1 text-xs font-semibold text-[#3B2FA8]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#3B2FA8]" />
            Đang xử lý...
          </span>
        )}
      </div>

      <ol className="mt-4 space-y-2.5">
        {events.map((ev) => {
          const icon =
            ev.status === 'ok'
              ? 'check_circle'
              : ev.status === 'warn'
              ? 'warning'
              : ev.status === 'error'
              ? 'error'
              : 'pending';
          const color =
            ev.status === 'ok'
              ? 'text-[#0F7B5F]'
              : ev.status === 'warn'
              ? 'text-[#C62828]'
              : ev.status === 'error'
              ? 'text-[#C62828]'
              : 'text-[#3B2FA8]';

          return (
            <li
              key={`${ev.seq}-${ev.step}`}
              className="flex items-start gap-2.5 rounded-lg bg-[#F6F8FB] px-3.5 py-2.5 text-sm"
            >
              <span className={`material-symbols-rounded mt-0.5 text-lg ${color}`}>{icon}</span>
              <div className="flex-1">
                <span className="font-semibold text-[#1B1F2A]">
                  {STEP_LABELS[ev.step] || ev.step}:{' '}
                </span>
                <span className="text-slate-800">{ev.message}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {resultTransaction && finalDecision && (
        <div
          className={`mt-4 rounded-xl border-2 p-4 ${
            finalDecision === 'recorded'
              ? 'border-[#0F7B5F] bg-[#0F7B5F]/5'
              : 'border-[#C62828] bg-[#FFF8F8]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {resultTransaction.date} •{' '}
                {resultTransaction.type === 'revenue' ? 'Khoản Thu vào' : 'Khoản Chi ra'}
              </p>
              <p className="text-lg font-bold text-[#1B1F2A]">
                {resultTransaction.counterparty || 'Giao dịch mới'}
              </p>
              <p className="tabular-nums text-xl font-extrabold text-[#3B2FA8]">
                {formatVnd(resultTransaction.amount_vnd)}
              </p>
            </div>
            {finalDecision === 'recorded' ? (
              <Stamp animate />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#C62828] px-3 py-1.5 text-xs font-bold text-white">
                <span className="material-symbols-rounded text-base">help</span>
                CẦN XÁC NHẬN LẠI
              </span>
            )}
          </div>

          {resultTransaction.clarification_question && (
            <div className="mt-3 rounded-lg bg-[#FFE66D]/45 p-3 text-sm text-[#1B1F2A]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-relaxed">
                  💬 <strong>Keiki hỏi:</strong> {resultTransaction.clarification_question}
                </p>
                <button
                  type="button"
                  onClick={() => speakVietnamese(resultTransaction.clarification_question || '')}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#3B2FA8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2f248a] cursor-pointer"
                >
                  <span className="material-symbols-rounded text-base">volume_up</span>
                  Nghe đọc
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {finalDecision === 'needs_review' ? (
              <button
                type="button"
                onClick={onOpenReviewTab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#C62828] px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-red-800 cursor-pointer"
              >
                <span className="material-symbols-rounded text-lg">fact_check</span>
                Mở mục Cần hỏi lại để xử lý ngay
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLedgerTab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F7B5F] px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-800 cursor-pointer"
              >
                <span className="material-symbols-rounded text-lg">menu_book</span>
                Xem trong Sổ kế toán
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
