import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api } from '../api/endpoints';
import { AgentTimeline } from '../components/AgentTimeline';
import { useJobStream } from '../hooks/useJobStream';
import { vi } from '../i18n/vi';
import type { DocumentKind, Transaction } from '../types/contract';
import { AppIcon } from '@/components/AppIcon';

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
      <Card className="gap-0 py-0">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-[#111625]">
                Ghi sổ tự nhiên cùng Trợ lý AI Keiki
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                Dành cho mọi Doanh nghiệp Vừa &amp; Nhỏ (SME) và Hộ kinh doanh tại Việt Nam
              </p>
            </div>
            <Badge variant="outline" className="hidden border-[#2E2396]/25 text-[#2E2396] sm:inline-flex">
              <AppIcon name="verified_user" className="text-sm" />
              Thông tư 152/2025/TT-BTC
            </Badge>
          </div>

          {/* 3 Big Primary Action Buttons */}
          <div className="grid grid-cols-1 gap-3.5">
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
                className="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-[#2E2396] p-4 text-left text-white shadow-xs transition hover:bg-[#231978] disabled:opacity-60"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <AppIcon name="photo_camera" className="text-3xl" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold sm:text-lg">{vi.actions.captureReceipt}</div>
                  <div className="text-xs text-indigo-100">{vi.actions.captureReceiptSub}</div>
                </div>
                <AppIcon name="chevron_right" className="text-2xl" />
              </button>
              <div className="flex flex-wrap items-center justify-end gap-2 px-1">
                <button
                  type="button"
                  disabled={isUploading || isRunning}
                  onClick={() => receiptInputRef.current?.click()}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#2E2396] hover:underline"
                >
                  <AppIcon name="photo_camera" className="text-sm" />
                  Mở Camera sau ĐT
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  disabled={isUploading || isRunning}
                  onClick={() => receiptGalleryInputRef.current?.click()}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0B6E54] hover:underline"
                >
                  <AppIcon name="photo_library" className="text-sm" />
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
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[#0B6E54]/35 bg-emerald-50/70 p-4 text-left text-[#111625] transition hover:bg-emerald-50 disabled:opacity-60"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B6E54] text-white">
                <AppIcon name="content_paste_go" className="text-3xl" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-[#0B6E54] sm:text-lg">
                  {vi.actions.pasteTransfer}
                </div>
                <div className="text-xs text-[#475569]">{vi.actions.pasteTransferSub}</div>
              </div>
              <AppIcon name="chevron_right" className="text-2xl text-[#0B6E54]" />
            </button>

            {/* 3. Speak Voice Input */}
            <button
              type="button"
              disabled={isUploading || isRunning}
              onClick={() => setVoiceBoxOpen((v) => !v)}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition ${
                isRecording
                  ? 'border-[#B91C1C] bg-red-50 text-[#B91C1C]'
                  : 'border-border bg-[#F6F8FB] text-[#111625] hover:border-[#2E2396]'
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${
                  isRecording ? 'animate-pulse bg-[#B91C1C]' : 'bg-[#2E2396]'
                }`}
              >
                <AppIcon name="mic" className="text-3xl" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold sm:text-lg">
                  {isRecording ? vi.actions.stopRecording : vi.actions.speakVoice}
                </div>
                <div className="text-xs text-[#475569]">{vi.actions.speakVoiceSub}</div>
              </div>
              <AppIcon name={voiceBoxOpen ? 'expand_less' : 'expand_more'} className="text-2xl text-[#2E2396]" />
            </button>
          </div>

          {/* Voice Input Panel */}
          {voiceBoxOpen && (
            <div className="mt-4 rounded-xl bg-[#F6F8FB] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2E2396]">
                  <AppIcon name="mic" className="text-base" />
                  Ghi âm giọng nói hoặc nhập câu lệnh tiếng Việt:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={isRecording ? 'destructive-solid' : 'default'}
                    onClick={startOrStopMic}
                  >
                    <AppIcon name={isRecording ? 'stop_circle' : 'mic'} className="text-base" />
                    {isRecording ? 'Đang thu âm... Bấm dừng' : 'Bật Micro'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => mobileAudioInputRef.current?.click()}
                    className="text-[#2E2396]"
                  >
                    <AppIcon name="smartphone" className="text-base" />
                    Tải file âm thanh ĐT
                  </Button>
                </div>
              </div>

              <textarea
                rows={2}
                value={spokenText}
                onChange={(e) => setSpokenText(e.target.value)}
                className="mt-2.5 w-full rounded-xl border border-border bg-white p-3 text-sm font-medium text-[#111625] focus:border-[#2E2396] focus:outline-none"
                placeholder="Ví dụ: Hôm nay xuất bán 20 đơn hàng tổng cộng 3 triệu 500 nghìn..."
              />

              <div className="mt-2 flex flex-wrap gap-1.5">
                {VOICE_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSpokenText(s)}
                    className="cursor-pointer rounded-lg border border-border bg-white px-2.5 py-1 text-xs text-[#475569] hover:border-[#2E2396] hover:text-[#2E2396]"
                  >
                    Mẫu {idx + 1}: "{s.slice(0, 42)}..."
                  </button>
                ))}
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  disabled={isUploading || isRunning || !spokenText.trim()}
                  onClick={() => handleTriggerPreset('voice_vn', spokenText.trim())}
                  size="lg"
                >
                  <AppIcon name="send" className="text-lg" />
                  Gửi câu nói cho Keiki ghi sổ
                </Button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#B91C1C]/35 bg-red-50 p-3 text-sm font-medium text-[#B91C1C]">
              <AppIcon name="warning" className="shrink-0 text-lg" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-Click Stage Demo Presets */}
          <Separator className="my-5" />
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-[#475569]">
              <AppIcon name="bolt" className="text-sm text-[#2E2396]" />
              Kịch bản kiểm thử nhanh cho SME &amp; Hộ kinh doanh (Bấm 1 chạm):
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={isUploading || isRunning}
                onClick={() => handleTriggerPreset('receipt_clean')}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#111625] transition hover:border-[#0B6E54] hover:bg-emerald-50/50"
              >
                <AppIcon name="receipt_long" className="text-xl text-[#0B6E54]" />
                <div className="min-w-0">
                  <div className="font-bold">1. Hóa đơn giấy hợp lệ (900.000 đ)</div>
                  <div className="text-xs text-[#475569]">
                    Nhập 5kg Cà phê Minh Phát → Tự ghi &amp; đóng dấu
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={isUploading || isRunning}
                onClick={() => handleTriggerPreset('cross_transfer')}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#111625] transition hover:border-[#B91C1C] hover:bg-red-50/40"
              >
                <AppIcon name="compare_arrows" className="text-xl text-[#B91C1C]" />
                <div className="min-w-0">
                  <div className="font-bold">2. Ảnh VietQR trùng chéo (900.000 đ)</div>
                  <div className="text-xs text-[#475569]">
                    Phát hiện CROSS_DUPLICATE &amp; hỏi gộp chứng từ
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
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#111625] transition hover:border-[#2E2396] hover:bg-indigo-50/50"
              >
                <AppIcon name="record_voice_over" className="text-xl text-[#2E2396]" />
                <div className="min-w-0">
                  <div className="font-bold">3. Ghi sổ bằng giọng nói ("20 đơn...")</div>
                  <div className="text-xs text-[#475569]">
                    Gemini Audio bóc tách &amp; phân loại thuế tự động
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={isUploading || isRunning}
                onClick={() => handleTriggerPreset('price_anomaly')}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-[#F6F8FB] px-3 py-2.5 text-left text-xs font-semibold text-[#111625] transition hover:border-amber-600 hover:bg-amber-50/50"
              >
                <AppIcon name="trending_up" className="text-xl text-[#92400E]" />
                <div className="min-w-0">
                  <div className="font-bold">4. Giá nhập tăng bất thường (+39%)</div>
                  <div className="text-xs text-[#475569]">
                    Đơn giá 250k vs lịch sử 180k → Chủ động hỏi lại
                  </div>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

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
