import { useState } from 'react';

interface MobileConnectModalProps {
  open: boolean;
  onClose: () => void;
  lanUrls: string[];
  mobilePreview: boolean;
  onToggleMobilePreview: () => void;
}

export function MobileConnectModal({
  open,
  onClose,
  lanUrls,
  mobilePreview,
  onToggleMobilePreview,
}: MobileConnectModalProps) {
  const [selectedUrlIdx, setSelectedUrlIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const activeUrl =
    lanUrls[selectedUrlIdx] || lanUrls[0] || window.location.origin;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#D5DCE8] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-2xl text-[#3B2FA8]">
              smartphone
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-[#1B1F2A]">
                Sử dụng Keiki trên Điện thoại (iOS & Android)
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ đầy đủ PWA, Camera chụp hóa đơn, Dán ảnh ngân hàng & Giọng nói
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Option 1: Toggle Mobile Frame Preview right on this screen */}
          <div className="rounded-2xl border-2 border-[#3B2FA8] bg-indigo-50/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-[#3B2FA8]">
                  1. Xem & Thao tác Giao diện Điện thoại ngay trên máy tính
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  Chuyển ngay sang màn hình chuẩn Điện thoại (390×844px) với thanh điều hướng 4
                  tab dưới đáy để kiểm thử trực tiếp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onToggleMobilePreview();
                  onClose();
                }}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow transition cursor-pointer ${
                  mobilePreview
                    ? 'bg-[#C62828] text-white hover:bg-red-700'
                    : 'bg-[#3B2FA8] text-white hover:bg-[#2f248a]'
                }`}
              >
                {mobilePreview ? 'Thoát Khung ĐT' : '📱 Bật Khung ĐT'}
              </button>
            </div>
          </div>

          {/* Option 2: Scan QR Code with real phone over Wi-Fi */}
          <div className="rounded-2xl border border-[#D5DCE8] bg-[#F6F8FB] p-4">
            <div className="text-sm font-extrabold text-[#1B1F2A]">
              2. Quét mã QR để mở trên Điện thoại thật (cùng mạng Wi-Fi)
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Đảm bảo điện thoại và máy tính kết nối cùng mạng Wi-Fi, sau đó dùng Camera hoặc Zalo
              quét mã QR bên dưới:
            </p>

            {lanUrls.length > 1 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {lanUrls.map((u, idx) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setSelectedUrlIdx(idx)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-mono font-semibold cursor-pointer ${
                      idx === selectedUrlIdx
                        ? 'border-[#3B2FA8] bg-[#3B2FA8] text-white'
                        : 'border-[#D5DCE8] bg-white text-slate-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-[#3B2FA8]/30 bg-white p-3 text-center shadow-xs">
                <span className="material-symbols-rounded text-5xl text-[#3B2FA8]">
                  devices
                </span>
                <span className="mt-1 text-[11px] font-bold text-slate-600">
                  Kết nối Nội bộ An toàn (Zero Third-Party Leak)
                </span>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="text-xs font-semibold text-slate-500">
                  Địa chỉ truy cập trên trình duyệt điện thoại:
                </div>
                <div className="rounded-xl border border-[#D5DCE8] bg-white px-3 py-2 font-mono text-sm font-extrabold text-[#3B2FA8] break-all">
                  {activeUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F7B5F] px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
                >
                  <span className="material-symbols-rounded text-base">content_copy</span>
                  {copied ? 'Đã sao chép đường dẫn!' : 'Sao chép đường dẫn'}
                </button>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Mẹo cài App (PWA):</strong> Sau khi mở trên điện thoại, chọn{' '}
                  <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> trên Safari/Chrome
                  để dùng Keiki full-screen như ứng dụng di động thực thụ!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
