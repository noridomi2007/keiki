import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/endpoints';
import { AgentTimeline } from '../components/AgentTimeline';
import { useJobStream } from '../hooks/useJobStream';
import { vi } from '../i18n/vi';
import type { DocumentKind, Transaction } from '../types/contract';

interface AddPageProps {
  onTransactionCreated: (tx?: Transaction) => void;
  onOpenReviewTab: () => void;
  onOpenLedgerTab: () => void;
}

const VOICE_SUGGESTIONS = [
  'Hôm nay xuất bán 20 đơn hàng bán lẻ tổng cộng 800 nghìn đồng, khách trả tiền mặt.',
  'Thu tiền hợp đồng dịch vụ thiết kế và in ấn của khách hàng 4 triệu 200 nghìn qua chuyển khoản.',
  'Nhập 2 thùng nguyên vật liệu từ nhà cung cấp hết 540 nghìn tiền mặt.',
  'Thanh toán tiền điện nước và internet cơ sở kinh doanh tháng này 1 triệu 250 nghìn.',
];

export function AddPage({
  onTransactionCreated,
  onOpenReviewTab,
  onOpenLedgerTab,
}: AddPageProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [voiceBoxOpen, setVoiceBoxOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState(VOICE_SUGGESTIONS[0]);

  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const receiptGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const transferInputRef = useRef<HTMLInputElement | null>(null);
  const mobileAudioInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { events, isRunning, finalDecision, resultTransaction } = useJobStream(
    activeJobId,
    (tx) => {
      onTransactionCreated(tx);
    }
  );

  // Listen for Ctrl+V clipboard image paste anywhere on AddPage
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            await handleFileUpload(blob, 'transfer', 'clipboard_transfer.png');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = async (file: File | Blob, kind: DocumentKind, filename?: string) => {
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const res = await api.uploadDocument(file, kind, filename);
      setActiveJobId(res.job_id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải tệp lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClipboardButton = async () => {
    setErrorMsg(null);
    if (navigator.clipboard && 'read' in navigator.clipboard) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            await handleFileUpload(blob, 'transfer', 'clipboard_vietqr.png');
            return;
          }
        }
      } catch {
        // Fallback to file input picker if clipboard permission denied or empty
      }
    }
    transferInputRef.current?.click();
  };

  const startOrStopMic = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceBoxOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (blob.size > 100) {
          await handleFileUpload(blob, 'audio', 'ghi_am_giao_dich.webm');
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setVoiceBoxOpen(true);
    } catch {
      setVoiceBoxOpen(true);
    }
  };

  const handleTriggerPreset = async (presetName: string, customTranscript?: string) => {
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const res = await api.triggerPreset(presetName, customTranscript);
      setActiveJobId(res.job_id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi chạy mẫu thử.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#D5DCE8] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1B1F2A]">
              Ghi sổ tự nhiên cùng Trợ lý AI Keiki
            </h2>
            <p className="text-sm text-slate-600">
              Dành cho mọi Doanh nghiệp Vừa & Nhỏ (SME) và Hộ kinh doanh tại Việt Nam
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#3B2FA8]/10 px-3 py-1 text-xs font-semibold text-[#3B2FA8]">
            <span className="material-symbols-rounded text-base">verified_user</span>
            Thông tư 152/2025/TT-BTC
          </span>
        </div>

        {/* 3 Big Primary Action Buttons */}
        <div className="grid grid-cols-1 gap-3.5">
          {/* 1. Capture Paper Receipt (Rear Camera + Photo Library option for mobile) */}
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'image');
              e.target.value = '';
            }}
          />
          <input
            ref={receiptGalleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'image');
              e.target.value = '';
            }}
          />
          <input
            ref={mobileAudioInputRef}
            type="file"
            accept="audio/*"
            capture
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'audio', f.name || 'ghi_am_dien_thoai.m4a');
              e.target.value = '';
            }}
          />
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={isUploading || isRunning}
              onClick={() => receiptInputRef.current?.click()}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-[#3B2FA8] bg-[#3B2FA8] p-4 text-left text-white shadow-sm transition hover:bg-[#2f248a] disabled:opacity-60 cursor-pointer"
            >
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <span className="material-symbols-rounded text-3xl">photo_camera</span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-base sm:text-lg font-bold">{vi.actions.captureReceipt}</div>
                <div className="text-xs text-indigo-100">{vi.actions.captureReceiptSub}</div>
              </div>
              <span className="material-symbols-rounded text-2xl">chevron_right</span>
            </button>
            <div className="flex items-center justify-end gap-2 px-1">
              <button
                type="button"
                disabled={isUploading || isRunning}
                onClick={() => receiptInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B2FA8] hover:underline cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">photo_camera</span>
                Mở Camera sau ĐT
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                disabled={isUploading || isRunning}
                onClick={() => receiptGalleryInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F7B5F] hover:underline cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">photo_library</span>
                Chọn ảnh hóa đơn từ Album ĐT
              </button>
            </div>
          </div>

          {/* 2. Paste Bank Transfer Screenshot */}
          <input
            ref={transferInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'transfer');
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={isUploading || isRunning}
            onClick={handleClipboardButton}
            className="flex items-center gap-4 rounded-2xl border-2 border-[#0F7B5F] bg-[#0F7B5F]/10 p-4 text-left text-[#1B1F2A] transition hover:bg-[#0F7B5F]/20 disabled:opacity-60 cursor-pointer"
          >
            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#0F7B5F] text-white">
              <span className="material-symbols-rounded text-3xl">content_paste_go</span>
            </span>
            <div className="flex-1">
              <div className="text-lg font-bold text-[#0F7B5F]">{vi.actions.pasteTransfer}</div>
              <div className="text-xs text-slate-600">{vi.actions.pasteTransferSub}</div>
            </div>
            <span className="material-symbols-rounded text-2xl text-[#0F7B5F]">chevron_right</span>
          </button>

          {/* 3. Speak Voice Input */}
          <button
            type="button"
            disabled={isUploading || isRunning}
            onClick={() => setVoiceBoxOpen((v) => !v)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition cursor-pointer ${
              isRecording
                ? 'border-[#C62828] bg-[#C62828]/10 text-[#C62828]'
                : 'border-[#3B2FA8]/40 bg-[#F6F8FB] text-[#1B1F2A] hover:border-[#3B2FA8]'
            }`}
          >
            <span
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-xl text-white ${
                isRecording ? 'bg-[#C62828] animate-pulse' : 'bg-[#3B2FA8]'
              }`}
            >
              <span className="material-symbols-rounded text-3xl">mic</span>
            </span>
            <div className="flex-1">
              <div className="text-lg font-bold">
                {isRecording ? vi.actions.stopRecording : vi.actions.speakVoice}
              </div>
              <div className="text-xs text-slate-600">{vi.actions.speakVoiceSub}</div>
            </div>
            <span className="material-symbols-rounded text-2xl text-[#3B2FA8]">
              {voiceBoxOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Voice Input Panel */}
        {voiceBoxOpen && (
          <div className="mt-4 rounded-xl border-2 border-[#3B2FA8]/30 bg-[#F6F8FB] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#3B2FA8]">
                🎙️ Ghi âm giọng nói hoặc nhập câu lệnh kế toán bằng tiếng Việt tự nhiên:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={startOrStopMic}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white cursor-pointer ${
                    isRecording ? 'bg-[#C62828]' : 'bg-[#3B2FA8]'
                  }`}
                >
                  <span className="material-symbols-rounded text-base">
                    {isRecording ? 'stop_circle' : 'mic'}
                  </span>
                  {isRecording ? 'Đang thu âm... Bấm để dừng' : 'Bật Micro trình duyệt'}
                </button>
                <button
                  type="button"
                  onClick={() => mobileAudioInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#3B2FA8] bg-white px-2.5 py-1.5 text-xs font-bold text-[#3B2FA8] hover:bg-indigo-50 cursor-pointer"
                >
                  <span className="material-symbols-rounded text-base">smartphone</span>
                  Ghi âm / Tải file âm thanh ĐT
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              className="mt-2.5 w-full rounded-xl border border-[#D5DCE8] bg-white p-3 text-sm font-medium text-[#1B1F2A] focus:border-[#3B2FA8] focus:outline-none"
              placeholder="Ví dụ: Hôm nay xuất bán 20 đơn hàng tổng cộng 3 triệu 500 nghìn..."
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              {VOICE_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSpokenText(s)}
                  className="rounded-lg border border-[#D5DCE8] bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-[#3B2FA8] hover:text-[#3B2FA8] cursor-pointer"
                >
                  Mẫu {idx + 1}: "{s.slice(0, 42)}..."
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={isUploading || isRunning || !spokenText.trim()}
                onClick={() => handleTriggerPreset('voice_vn', spokenText.trim())}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3B2FA8] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#2f248a] disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-rounded text-lg">send</span>
                Gửi câu nói cho Keiki ghi sổ
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-[#C62828] bg-red-50 p-3 text-sm font-medium text-[#C62828]">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1-Click Stage Demo Presets */}
        <div className="mt-5 border-t border-[#D5DCE8] pt-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            ⚡ Kịch bản kiểm thử nhanh cho SME & Hộ kinh doanh (Bấm 1 chạm):
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isUploading || isRunning}
              onClick={() => handleTriggerPreset('receipt_clean')}
              className="flex items-center gap-2.5 rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#1B1F2A] hover:border-[#0F7B5F] hover:bg-emerald-50/50 cursor-pointer"
            >
              <span className="material-symbols-rounded text-xl text-[#0F7B5F]">receipt_long</span>
              <div>
                <div className="font-bold">1. Hóa đơn giấy hợp lệ (900.000 đ)</div>
                <div className="text-[11px] text-slate-500">
                  Nhập 5kg Cà phê Minh Phát → Tự ghi & đóng dấu
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isUploading || isRunning}
              onClick={() => handleTriggerPreset('cross_transfer')}
              className="flex items-center gap-2.5 rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#1B1F2A] hover:border-[#C62828] hover:bg-red-50/40 cursor-pointer"
            >
              <span className="material-symbols-rounded text-xl text-[#C62828]">compare_arrows</span>
              <div>
                <div className="font-bold">2. Ảnh VietQR trùng chéo hóa đơn (900.000 đ)</div>
                <div className="text-[11px] text-slate-500">
                  Phát hiện CROSS_DUPLICATE & hỏi gộp chứng từ
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isUploading || isRunning}
              onClick={() =>
                handleTriggerPreset(
                  'voice_vn',
                  'Hôm nay xuất bán 20 đơn hàng bán lẻ tổng cộng 800 nghìn đồng, khách trả tiền mặt.'
                )
              }
              className="flex items-center gap-2.5 rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#1B1F2A] hover:border-[#3B2FA8] hover:bg-indigo-50/50 cursor-pointer"
            >
              <span className="material-symbols-rounded text-xl text-[#3B2FA8]">record_voice_over</span>
              <div>
                <div className="font-bold">3. Ghi sổ bằng giọng nói ("Hôm nay xuất bán 20 đơn...")</div>
                <div className="text-[11px] text-slate-500">
                  Gemini Audio bóc tách & phân loại thuế tự động
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isUploading || isRunning}
              onClick={() => handleTriggerPreset('price_anomaly')}
              className="flex items-center gap-2.5 rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#1B1F2A] hover:border-amber-600 hover:bg-amber-50/50 cursor-pointer"
            >
              <span className="material-symbols-rounded text-xl text-amber-600">trending_up</span>
              <div>
                <div className="font-bold">4. Hóa đơn giá nhập tăng bất thường (+39%)</div>
                <div className="text-[11px] text-slate-500">
                  Đơn giá 250k vs lịch sử 180k → Chủ động hỏi lại
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Live SSE Agent Timeline */}
      <AgentTimeline
        events={events}
        isRunning={isRunning}
        finalDecision={finalDecision}
        resultTransaction={resultTransaction}
        onOpenReviewTab={onOpenReviewTab}
        onOpenLedgerTab={onOpenLedgerTab}
      />
    </div>
  );
}
