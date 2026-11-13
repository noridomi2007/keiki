import React, { useCallback, useEffect, useState } from 'react';
import { api, type HouseholdLoginPayload } from './api/endpoints';
import { MobileConnectModal } from './components/MobileConnectModal';
import { vi } from './i18n/vi';
import { AddPage } from './pages/AddPage';
import { LedgerPage } from './pages/LedgerPage';
import { LoginPage } from './pages/LoginPage';
import { ReportPage } from './pages/ReportPage';
import { ReviewPage } from './pages/ReviewPage';
import type { SettingsStatus, Transaction } from './types/contract';
import { stopSpeakingVietnamese } from './utils/speech';

type ActiveTab = 'add' | 'ledger' | 'review' | 'report';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ledger');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);
  const [largeText, setLargeText] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiModelInput, setApiModelInput] = useState('gemini-2.5-flash');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const loadData = useCallback(async (forceFetchTransactions = false) => {
    try {
      const stRes = await api.getSettingsStatus();
      setSettingsStatus(stRes);
      if (stRes.gemini_model) {
        setApiModelInput(stRes.gemini_model);
      }
      if (stRes.authenticated || forceFetchTransactions) {
        setIsLoggedIn(true);
        const txRes = await api.listTransactions();
        setTransactions(txRes.items);
      }
    } catch {
      // ignore initial fetch error
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (largeText) {
      document.documentElement.classList.add('large-text-mode');
    } else {
      document.documentElement.classList.remove('large-text-mode');
    }
  }, [largeText]);

  const pendingCount = transactions.filter((t) => t.status === 'needs_review').length;
  const lanUrls = settingsStatus?.lan_urls || [];

  const handleLoginSuccess = async (_payload: HouseholdLoginPayload, welcomeMsg: string) => {
    setIsLoggedIn(true);
    setStatusBanner(welcomeMsg);
    await loadData(true);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const handleLogout = async () => {
    stopSpeakingVietnamese();
    try {
      await api.logout();
    } catch {
      // ignore logout error
    }
    setIsLoggedIn(false);
    setTransactions([]);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateApiKey(apiKeyInput, apiModelInput);
    setStatusBanner(res.message);
    setShowApiModal(false);
    setApiKeyInput('');
    await loadData();
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const handleResetDemo = async () => {
    const res = await api.resetDemo();
    setStatusBanner(res.message);
    await loadData();
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const hh = settingsStatus?.household;

  const content = !isLoggedIn ? (
    <LoginPage
      largeText={largeText}
      onToggleLargeText={() => setLargeText((v) => !v)}
      onOpenMobileModal={() => setShowMobileModal(true)}
      onLoginSuccess={handleLoginSuccess}
    />
  ) : (
    <div
      className={`min-h-screen flex flex-col bg-[#F6F8FB] text-[#1B1F2A] ${
        mobilePreview ? 'pb-24' : 'pb-24 lg:pb-8'
      }`}
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#D5DCE8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {hh?.picture ? (
              <img
                src={hh.picture}
                alt={hh.owner || 'Avatar'}
                className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-2xl border-2 border-[#3B2FA8] object-cover shadow-xs"
              />
            ) : (
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3B2FA8] text-white shadow-sm">
                <span className="material-symbols-rounded text-2xl">menu_book</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-[#3B2FA8] truncate">
                  {vi.appName}
                </h1>
                <span className="rounded-md bg-[#3B2FA8]/10 px-2 py-0.5 text-[11px] font-bold text-[#3B2FA8] truncate max-w-[140px] sm:max-w-none">
                  {hh?.owner || 'Nguyễn Minh Tâm'}
                </span>
                {hh?.email && !mobilePreview && (
                  <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#4285F4]">
                    G {hh.email}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-slate-600 truncate">
                {hh?.name || 'Cửa hàng Thương mại & Dịch vụ Minh Tâm'} • MST:{' '}
                <strong>{hh?.tax_code || '0316889912'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Mobile Connect & QR Button */}
            <button
              type="button"
              onClick={() => setShowMobileModal(true)}
              title="Mở trên Điện thoại (Mã QR & Khung di động)"
              className="inline-flex items-center gap-1 rounded-xl border border-[#3B2FA8] bg-[#3B2FA8] px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#2f248a] cursor-pointer"
            >
              <span className="material-symbols-rounded text-base">smartphone</span>
              <span className={mobilePreview ? 'hidden' : 'hidden sm:inline'}>
                Điện thoại / QR
              </span>
            </button>

            {/* Google Gemini API Configuration Button */}
            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              title="Cấu hình Google Gemini API"
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                settingsStatus?.gemini_configured
                  ? 'border-[#0F7B5F] bg-emerald-50 text-[#0F7B5F]'
                  : 'border-[#3B2FA8]/40 bg-indigo-50 text-[#3B2FA8]'
              }`}
            >
              <span className="material-symbols-rounded text-base">key</span>
              <span className={mobilePreview ? 'hidden' : 'hidden md:inline'}>
                {settingsStatus?.gemini_configured
                  ? `Gemini (${settingsStatus.gemini_model})`
                  : 'Gemini API'}
              </span>
            </button>

            {/* Elderly Large Text Mode Toggle */}
            <button
              type="button"
              onClick={() => setLargeText((v) => !v)}
              title={vi.actions.largeText}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                largeText
                  ? 'border-[#3B2FA8] bg-[#3B2FA8] text-white'
                  : 'border-[#D5DCE8] bg-[#F6F8FB] text-[#1B1F2A]'
              }`}
            >
              <span className="material-symbols-rounded text-base">format_size</span>
              <span className={mobilePreview ? 'hidden' : 'hidden sm:inline'}>
                {vi.actions.largeText}
              </span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              type="button"
              onClick={handleResetDemo}
              title={vi.actions.resetDemo}
              className="inline-flex items-center gap-1 rounded-xl border border-[#D5DCE8] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <span className="material-symbols-rounded text-base">restart_alt</span>
              <span className={mobilePreview ? 'hidden' : 'hidden md:inline'}>Reset</span>
            </button>

            {/* Logout / Switch Household Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đổi tài khoản / Đăng xuất"
              className="inline-flex items-center gap-1 rounded-xl border border-[#C62828]/30 bg-red-50/70 px-2.5 py-1.5 text-xs font-bold text-[#C62828] hover:bg-red-100 cursor-pointer"
            >
              <span className="material-symbols-rounded text-base">logout</span>
              <span className={mobilePreview ? 'hidden' : 'hidden sm:inline'}>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Bar (Hidden when in Mobile Preview or <1024px) */}
        {!mobilePreview && (
          <div className="mx-auto hidden max-w-7xl border-t border-[#D5DCE8] px-4 lg:flex lg:gap-2 lg:py-2">
            {(
              [
                ['ledger', vi.tabs.ledger, 'menu_book', 0],
                ['review', vi.tabs.review, 'fact_check', pendingCount],
                ['report', vi.tabs.report, 'monitoring', 0],
              ] as const
            ).map(([key, label, icon, badge]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as ActiveTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer ${
                  activeTab === key
                    ? 'bg-[#3B2FA8] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-rounded text-lg">{icon}</span>
                <span>{label}</span>
                {badge > 0 && (
                  <span className="rounded-full bg-[#C62828] px-2 py-0.5 text-xs font-extrabold text-white">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {statusBanner && (
        <div className="mx-auto mt-3 max-w-7xl px-3 sm:px-4 w-full">
          <div className="rounded-xl border border-[#0F7B5F] bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-[#0F7B5F]">
            ✅ {statusBanner}
          </div>
        </div>
      )}

      {/* Main Content: 2-Column on Desktop (>=1024px when not in mobilePreview), Tab-Switched on Mobile */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
        {mobilePreview ? (
          <div className="space-y-4">
            {activeTab === 'add' && (
              <AddPage
                onTransactionCreated={() => loadData()}
                onOpenReviewTab={() => setActiveTab('review')}
                onOpenLedgerTab={() => setActiveTab('ledger')}
              />
            )}
            {activeTab === 'ledger' && (
              <LedgerPage
                transactions={transactions}
                onRefresh={loadData}
                onSelectReviewItem={() => setActiveTab('review')}
              />
            )}
            {activeTab === 'review' && (
              <ReviewPage allTransactions={transactions} onUpdated={loadData} />
            )}
            {activeTab === 'report' && <ReportPage />}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column on Desktop: Always show AddPage + AgentTimeline */}
            <div
              className={`lg:col-span-5 ${
                activeTab === 'add' ? 'block' : 'hidden lg:block'
              }`}
            >
              <AddPage
                onTransactionCreated={() => loadData()}
                onOpenReviewTab={() => setActiveTab('review')}
                onOpenLedgerTab={() => setActiveTab('ledger')}
              />
            </div>

            {/* Right Column on Desktop: Ledger / Review / Report */}
            <div
              className={`lg:col-span-7 ${
                activeTab === 'add' ? 'hidden lg:block' : 'block'
              }`}
            >
              {(activeTab === 'ledger' || activeTab === 'add') && (
                <LedgerPage
                  transactions={transactions}
                  onRefresh={loadData}
                  onSelectReviewItem={() => setActiveTab('review')}
                />
              )}
              {activeTab === 'review' && (
                <ReviewPage allTransactions={transactions} onUpdated={loadData} />
              )}
              {activeTab === 'report' && <ReportPage />}
            </div>
          </div>
        )}
      </main>

      {/* Legal Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-slate-500">
        {vi.legalFooter}
      </footer>

      {/* Mobile Bottom Tab Bar (Visible on phones <1024px OR when mobilePreview is active) */}
      <nav
        className={`${
          mobilePreview
            ? 'sticky bottom-0 left-0 right-0 z-40 flex border-t border-[#D5DCE8] bg-white pb-safe'
            : 'fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#D5DCE8] bg-white pb-safe lg:hidden'
        }`}
      >
        {(
          [
            ['add', 'Thêm mới', 'add_a_photo', 0],
            ['ledger', 'Sổ kế toán', 'menu_book', 0],
            ['review', 'Cần hỏi lại', 'fact_check', pendingCount],
            ['report', 'Báo cáo', 'monitoring', 0],
          ] as const
        ).map(([key, label, icon, badge]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as ActiveTab)}
            className={`relative flex flex-1 flex-col items-center justify-center py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === key
                ? 'text-[#3B2FA8] bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-rounded text-2xl">{icon}</span>
            <span className="mt-0.5 text-[11px]">{label}</span>
            {badge > 0 && (
              <span className="absolute top-1.5 right-4 rounded-full bg-[#C62828] px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {mobilePreview ? (
        <div className="min-h-screen bg-slate-900 py-4 px-2 flex flex-col items-center">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 w-full max-w-[420px] rounded-2xl bg-slate-800 px-4 py-2.5 text-xs text-white shadow">
            <span className="font-bold flex items-center gap-1.5">
              <span className="material-symbols-rounded text-base text-emerald-400">
                smartphone
              </span>
              Chế độ Khung Điện thoại (390px)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMobileModal(true)}
                className="rounded-lg bg-[#3B2FA8] px-2.5 py-1 font-bold text-white cursor-pointer"
              >
                Mã QR
              </button>
              <button
                type="button"
                onClick={() => setMobilePreview(false)}
                className="rounded-lg bg-[#C62828] px-2.5 py-1 font-bold text-white cursor-pointer"
              >
                Thoát khung ĐT
              </button>
            </div>
          </div>

          <div className="w-full max-w-[412px] overflow-hidden rounded-[38px] border-[8px] border-slate-800 bg-[#F6F8FB] shadow-2xl">
            {/* Phone Speaker Notch */}
            <div className="flex items-center justify-center bg-slate-800 py-1.5">
              <div className="h-1.5 w-16 rounded-full bg-slate-600" />
            </div>
            <div className="max-h-[820px] overflow-y-auto">{content}</div>
          </div>
        </div>
      ) : (
        content
      )}

      {/* Mobile Connect & QR Code Modal */}
      <MobileConnectModal
        open={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        lanUrls={lanUrls}
        mobilePreview={mobilePreview}
        onToggleMobilePreview={() => {
          setMobilePreview((v) => {
            const next = !v;
            if (next) setActiveTab('add');
            return next;
          });
        }}
      />

      {/* Google Gemini API Key Configuration Modal */}
      {showApiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowApiModal(false)}
        >
          <form
            onSubmit={handleSaveApiKey}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#D5DCE8] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-[#3B2FA8]">auto_awesome</span>
                <h3 className="text-lg font-bold text-[#1B1F2A]">
                  Kết nối Google Gemini API (`google-genai`)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              Nhập khóa <strong>GEMINI_API_KEY</strong> (từ Google AI Studio) để Keiki gọi trực tiếp
              mô hình đa phương thức <code>gemini-2.5-flash</code> cho mọi ảnh chụp hóa đơn, sao kê
              ngân hàng và giọng nói tiếng Việt. Nếu để trống, Keiki vẫn hoạt động mượt mà với bộ
              kịch bản thông minh tích hợp sẵn.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700">GEMINI_API_KEY</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Mô hình Gemini</label>
              <select
                value={apiModelInput}
                onChange={(e) => setApiModelInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-2.5 text-sm font-semibold"
              >
                <option value="gemini-2.5-flash">
                  gemini-2.5-flash (Khuyên dùng - Nhanh & Đa phương thức)
                </option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Suy luận sâu)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="rounded-xl border border-[#D5DCE8] px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#3B2FA8] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#2f248a] cursor-pointer"
              >
                Lưu cấu hình Gemini
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
