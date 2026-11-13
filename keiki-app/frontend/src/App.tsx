import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api, type HouseholdLoginPayload } from './api/endpoints';
import { KeikiMark } from './components/KeikiMark';
import { MobileConnectModal } from './components/MobileConnectModal';
import { vi } from './i18n/vi';
import { AddPage } from './pages/AddPage';
import { LandingPage } from './pages/LandingPage';
import { LedgerPage } from './pages/LedgerPage';
import { LoginPage } from './pages/LoginPage';
import { ReportPage } from './pages/ReportPage';
import { ReviewPage } from './pages/ReviewPage';
import './styles/editorial.css';
import type { SettingsStatus, Transaction } from './types/contract';
import { stopSpeakingVietnamese } from './utils/speech';
import { AppIcon } from '@/components/AppIcon';

type ActiveTab = 'add' | 'ledger' | 'review' | 'report';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [unauthView, setUnauthView] = useState<'landing' | 'login'>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
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
    setUnauthView('landing');
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
    unauthView === 'landing' ? (
      <LandingPage
        largeText={largeText}
        onToggleLargeText={() => setLargeText((v) => !v)}
        onOpenMobileModal={() => setShowMobileModal(true)}
        onNavigateLogin={(mode = 'login') => {
          setAuthInitialMode(mode);
          setUnauthView('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    ) : (
      <LoginPage
        largeText={largeText}
        onToggleLargeText={() => setLargeText((v) => !v)}
        onOpenMobileModal={() => setShowMobileModal(true)}
        onBackToLanding={() => {
          setUnauthView('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        initialMode={authInitialMode}
        onLoginSuccess={handleLoginSuccess}
      />
    )
  ) : (
    <TooltipProvider>
      <div
        className={`flex min-h-screen flex-col overflow-x-hidden bg-[#F6F8FB] text-[#111625] ${
          mobilePreview ? 'pb-24' : 'pb-24 lg:pb-8'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {hh?.picture ? (
                <img
                  src={hh.picture}
                  alt={hh.owner || 'Avatar'}
                  className="h-10 w-10 shrink-0 rounded-xl border border-[#2E2396] object-cover shadow-xs sm:h-11 sm:w-11"
                />
              ) : (
                <KeikiMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="font-heading truncate text-base font-extrabold tracking-tight text-[#2E2396] sm:text-xl">
                    {vi.appName}
                  </h1>
                  <Badge variant="secondary" className="max-w-[140px] truncate text-[#2E2396] sm:max-w-none">
                    {hh?.owner || 'Nguyễn Minh Tâm'}
                  </Badge>
                  {hh?.email && !mobilePreview && (
                    <Badge variant="outline" className="hidden text-[#1D4ED8] md:inline-flex">
                      G {hh.email}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs font-medium text-[#475569] sm:text-xs">
                  {hh?.name || 'Cửa hàng Thương mại & Dịch vụ Minh Tâm'} • MST:{' '}
                  <strong className="font-mono text-[#111625]">{hh?.tax_code || '0316889912'}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowMobileModal(true)}
                      className="h-9 px-2.5 text-xs font-bold"
                    />
                  }
                >
                  <AppIcon name="smartphone" className="text-base" />
                  <span className={mobilePreview ? 'hidden' : 'hidden sm:inline'}>
                    Điện thoại / QR
                  </span>
                </TooltipTrigger>
                <TooltipContent>Mở trên Điện thoại (Mã QR &amp; Khung di động 390px)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant={settingsStatus?.gemini_configured ? 'outline' : 'secondary'}
                      onClick={() => setShowApiModal(true)}
                      className={`h-9 px-2.5 text-xs font-bold ${
                        settingsStatus?.gemini_configured
                          ? 'border-[#0B6E54]/35 bg-emerald-50 text-[#0B6E54]'
                          : 'text-[#2E2396]'
                      }`}
                    />
                  }
                >
                  <AppIcon name="key" className="text-base" />
                  <span className={mobilePreview ? 'hidden' : 'hidden md:inline'}>
                    {settingsStatus?.gemini_configured
                      ? `Gemini (${settingsStatus.gemini_model})`
                      : 'Gemini API'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Cấu hình khóa Google Gemini API</TooltipContent>
              </Tooltip>

              <Button
                type="button"
                size="sm"
                variant={largeText ? 'default' : 'outline'}
                onClick={() => setLargeText((v) => !v)}
                title={vi.actions.largeText}
                className="h-9 px-2.5 text-xs font-bold"
              >
                <AppIcon name="format_size" className="text-base" />
                <span className={mobilePreview ? 'hidden' : 'hidden sm:inline'}>
                  {vi.actions.largeText}
                </span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResetDemo}
                title={vi.actions.resetDemo}
                className="h-9 px-2.5 text-xs font-semibold text-[#475569]"
              >
                <AppIcon name="restart_alt" className="text-base" />
                <span className={mobilePreview ? 'hidden' : 'hidden md:inline'}>Reset</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleLogout}
                title="Đổi tài khoản / Đăng xuất"
                className="h-9 px-2.5 text-xs font-bold"
              >
                <AppIcon name="logout" className="text-base" />
                <span className={mobilePreview ? 'hidden' : 'hidden sm:inline'}>Đăng xuất</span>
              </Button>
            </div>
          </div>

          {/* Desktop Navigation Bar */}
          {!mobilePreview && (
            <div className="mx-auto hidden max-w-7xl border-t border-border px-4 lg:flex lg:gap-2 lg:py-2">
              {(
                [
                  ['ledger', vi.tabs.ledger, 'menu_book', 0],
                  ['review', vi.tabs.review, 'fact_check', pendingCount],
                  ['report', vi.tabs.report, 'monitoring', 0],
                ] as const
              ).map(([key, label, icon, badge]) => (
                <Button
                  key={key}
                  type="button"
                  variant={activeTab === key ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(key as ActiveTab)}
                  className="h-10 gap-2 rounded-xl px-4 text-sm font-bold"
                >
                  <AppIcon name={icon} className="text-lg" />
                  <span>{label}</span>
                  {badge > 0 && (
                    <Badge variant="destructive" className="ml-0.5 bg-[#B91C1C] text-white">
                      {badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </header>

        {statusBanner && (
          <div className="mx-auto mt-3 w-full max-w-7xl px-3 sm:px-4">
            <div className="flex items-center gap-2 rounded-xl border border-[#0B6E54]/30 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-[#0B6E54]">
              <AppIcon name="check_circle" className="text-base" />
              <span>{statusBanner}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-5">
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
              <div
                className={`min-w-0 lg:col-span-5 ${
                  activeTab === 'add' ? 'block' : 'hidden lg:block'
                }`}
              >
                <AddPage
                  onTransactionCreated={() => loadData()}
                  onOpenReviewTab={() => setActiveTab('review')}
                  onOpenLedgerTab={() => setActiveTab('ledger')}
                />
              </div>

              <div
                className={`min-w-0 lg:col-span-7 ${
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
        <footer className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-[#475569]">
          {vi.legalFooter}
        </footer>

        {/* Mobile Bottom Tab Bar */}
        <nav
          className={`${
            mobilePreview
              ? 'sticky right-0 bottom-0 left-0 z-40 grid w-full grid-cols-4 border-t border-border bg-white pb-safe'
              : 'fixed right-0 bottom-0 left-0 z-40 grid w-full grid-cols-4 border-t border-border bg-white pb-safe lg:hidden'
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
              className={`relative flex min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden px-1 py-2.5 text-xs font-bold transition ${
                activeTab === key
                  ? 'bg-[#E8ECF6]/60 text-[#2E2396]'
                  : 'text-[#475569] hover:text-[#111625]'
              }`}
            >
              <AppIcon name={icon} className="text-xl" />
              <span className="mt-1 max-w-full truncate text-xs">{label}</span>
              {badge > 0 && (
                <span className="absolute top-1.5 right-3 rounded-full bg-[#B91C1C] px-1.5 py-0.2 text-xs font-extrabold text-white">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {mobilePreview ? (
        <div className="flex min-h-screen flex-col items-center bg-slate-900 px-2 py-4">
          <div className="mb-3 flex w-full max-w-[420px] flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs text-white shadow">
            <span className="flex items-center gap-1.5 font-bold">
              <AppIcon name="smartphone" className="text-base text-emerald-400" />
              Chế độ Khung Điện thoại (390px)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowMobileModal(true)}
                className="h-7 px-2.5 text-xs"
              >
                Mã QR
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive-solid"
                onClick={() => setMobilePreview(false)}
                className="h-7 px-2.5 text-xs"
              >
                Thoát khung ĐT
              </Button>
            </div>
          </div>

          <div className="w-full max-w-[412px] overflow-hidden rounded-[38px] border-[8px] border-slate-800 bg-[#F6F8FB] shadow-2xl">
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
      <Dialog open={showApiModal} onOpenChange={setShowApiModal}>
        <DialogContent className="p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border bg-[#F6F8FB] px-5 py-4">
            <div className="flex items-center gap-2 pr-6">
              <AppIcon name="auto_awesome" className="text-[#2E2396]" />
              <div>
                <DialogTitle className="font-bold text-[#111625]">
                  Kết nối Google Gemini API
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-[#475569]">
                  Chạy mô hình đa phương thức <code>google-genai</code>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveApiKey} className="space-y-4 p-5">
            <p className="text-xs leading-relaxed text-[#475569]">
              Nhập khóa <strong className="text-[#111625]">GEMINI_API_KEY</strong> (từ Google AI
              Studio) để Keiki gọi trực tiếp mô hình <code>gemini-2.5-flash</code> cho ảnh hóa đơn,
              sao kê ngân hàng và giọng nói. Nếu để trống, Keiki vẫn chạy bộ kịch bản thông minh
              tích hợp sẵn.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#111625]">GEMINI_API_KEY</label>
              <Input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111625]">Mô hình Gemini</label>
              <select
                value={apiModelInput}
                onChange={(e) => setApiModelInput(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-[#F6F8FB] px-3 text-sm font-semibold text-[#111625] focus:border-[#2E2396] focus:bg-white focus:outline-none"
              >
                <option value="gemini-2.5-flash">
                  gemini-2.5-flash (Khuyên dùng - Nhanh &amp; Đa phương thức)
                </option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Suy luận sâu)</option>
              </select>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowApiModal(false)}
              >
                Đóng
              </Button>
              <Button type="submit" size="sm">
                Lưu cấu hình Gemini
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
