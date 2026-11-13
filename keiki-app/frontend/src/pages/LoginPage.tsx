import React, { useEffect, useState } from 'react';
import { api, type HouseholdLoginPayload } from '../api/endpoints';

function speakGuideLocally(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
    if (!viVoice) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = viVoice;
    u.lang = 'vi-VN';
    window.speechSynthesis.speak(u);
  } catch {
    // ignore speech errors
  }
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

interface LoginPageProps {
  largeText: boolean;
  onToggleLargeText: () => void;
  onOpenMobileModal: () => void;
  onLoginSuccess: (payload: HouseholdLoginPayload, welcomeMsg: string) => void;
}

const VIETNAM_SME_PROFILES: HouseholdLoginPayload[] = [
  {
    owner: 'Nguyễn Minh Tâm',
    name: 'Cửa hàng Thương mại & Thực phẩm Minh Tâm',
    phone: '0909 123 456',
    tax_code: '0318899123',
    address: '142 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
    email: 'minhtam.store.vn@gmail.com',
    auth_method: 'preset',
  },
  {
    owner: 'Trần Quốc Hoàng',
    name: 'Công ty TNHH TM & Dịch vụ Hoàng Gia (SME)',
    phone: '0912 888 999',
    tax_code: '0107766554',
    address: '86 Cầu Giấy, Quận Cầu Giấy, TP. Hà Nội',
    email: 'hoanggia.sme.hn@gmail.com',
    auth_method: 'preset',
  },
  {
    owner: 'Lê Thị Mai',
    name: 'Chuỗi Cà phê & Đặc sản Sông Hàn',
    phone: '0905 456 789',
    tax_code: '0406655443',
    address: '68 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng',
    email: 'songhan.coffee.vn@gmail.com',
    auth_method: 'preset',
  },
];

export function LoginPage({
  largeText,
  onToggleLargeText,
  onOpenMobileModal,
  onLoginSuccess,
}: LoginPageProps) {
  const [demoMode, setDemoMode] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Google OAuth state
  const [googleClientId, setGoogleClientId] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  useEffect(() => {
    api
      .getSettingsStatus()
      .then((st) => {
        setDemoMode(Boolean(st.demo_mode));
        if (st.google_client_id) {
          setGoogleClientId(st.google_client_id);
          setClientIdInput(st.google_client_id);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (payload: HouseholdLoginPayload) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.loginHousehold(payload);
      onLoginSuccess(
        {
          owner: res.household?.owner || payload.owner,
          name: res.household?.name || payload.name,
          phone: res.household?.phone || payload.phone,
          tax_code: res.household?.tax_code || payload.tax_code,
          address: res.household?.address || payload.address,
          email: res.household?.email || payload.email,
          picture: res.household?.picture || payload.picture,
          auth_method: payload.auth_method,
        },
        res.message
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (authMode === 'register') {
      setLoading(true);
      try {
        const res = await api.registerHousehold({
          phone,
          password,
          owner: ownerName,
          name: shopName,
          tax_code: taxCode,
          address,
        });
        onLoginSuccess(
          {
            owner: res.household?.owner || ownerName,
            name: res.household?.name || shopName,
            phone: res.household?.phone || phone,
            tax_code: res.household?.tax_code || taxCode,
            address: res.household?.address || address,
            auth_method: 'phone',
          },
          res.message
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi đăng ký tài khoản.');
      } finally {
        setLoading(false);
      }
      return;
    }

    await handleLogin({
      phone,
      password,
      owner: ownerName,
      name: shopName,
      tax_code: taxCode,
      address,
      auth_method: 'phone',
    });
  };

  const ensureGoogleScriptLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.google?.accounts?.oauth2) {
        resolve(true);
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="accounts.google.com/gsi/client"]'
      );
      if (existing) {
        let checks = 0;
        const timer = setInterval(() => {
          checks += 1;
          if (window.google?.accounts?.oauth2) {
            clearInterval(timer);
            resolve(true);
          } else if (checks > 25) {
            clearInterval(timer);
            resolve(false);
          }
        }, 150);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(Boolean(window.google?.accounts?.oauth2));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const launchRealGooglePopup = async (activeClientId: string) => {
    setErrorMsg(null);
    const trimmedId = activeClientId.trim();

    if (!trimmedId.endsWith('.apps.googleusercontent.com')) {
      setErrorMsg(
        'Mã Client ID chưa đúng định dạng chuẩn của Google (phải kết thúc bằng .apps.googleusercontent.com).'
      );
      setShowGoogleModal(true);
      return;
    }

    setLoading(true);
    const ready = await ensureGoogleScriptLoaded();
    setLoading(false);

    const oauth2 = window.google?.accounts?.oauth2;
    if (!ready || !oauth2) {
      setErrorMsg(
        'Trình duyệt đang chặn hoặc chưa tải được Google Identity Services. Bạn có thể chọn tài khoản Gmail bên dưới để đăng nhập ngay.'
      );
      setShowGoogleModal(true);
      return;
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: trimmedId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          setErrorMsg(`Google OAuth báo lỗi: ${tokenResponse.error || 'Đã hủy đăng nhập'}`);
          return;
        }
        setLoading(true);
        try {
          const res = await api.loginWithGoogle({
            access_token: tokenResponse.access_token,
            shop_name: shopName || 'Hộ kinh doanh (Google)',
            tax_code: taxCode || '',
            address: address || 'TP. Hồ Chí Minh, Việt Nam',
          });
          setShowGoogleModal(false);
          onLoginSuccess(
            {
              owner: res.household?.owner || ownerName,
              name: res.household?.name || shopName,
              phone,
              tax_code: res.household?.tax_code || taxCode,
              address: res.household?.address || address,
              email: res.household?.email,
              picture: res.household?.picture,
              auth_method: 'google',
            },
            res.message
          );
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Xác thực Google thất bại.');
        } finally {
          setLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const handleClearClientId = async () => {
    try {
      await api.updateGoogleClientId('');
      setGoogleClientId('');
      setClientIdInput('');
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể xóa Google Client ID.');
    }
  };

  const handleGoogleButtonClick = () => {
    if (googleClientId) {
      launchRealGooglePopup(googleClientId);
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleSaveClientIdAndPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = clientIdInput.trim();
    if (!cleaned) return;
    setErrorMsg(null);
    try {
      if (demoMode) {
        await api.updateGoogleClientId(cleaned);
      }
      setGoogleClientId(cleaned);
      launchRealGooglePopup(cleaned);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể lưu Google Client ID.');
    }
  };

  const handleQuickGoogleAccountSelect = async (email: string, name: string, shop?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.loginWithGoogle({
        email,
        name,
        shop_name: shop || shopName || 'Cửa hàng Thương mại & Thực phẩm Minh Tâm',
        tax_code: taxCode || '0318899123',
        address: address || 'Việt Nam',
      });
      setShowGoogleModal(false);
      onLoginSuccess(
        {
          owner: name,
          name: shop || shopName,
          phone,
          tax_code: taxCode,
          address,
          email,
          auth_method: 'google',
        },
        res.message
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F6F8FB] text-[#1B1F2A] p-4 sm:p-6">
      {/* Top Bar */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3B2FA8] text-white shadow-sm">
            <span className="material-symbols-rounded text-2xl">menu_book</span>
          </div>
          <div>
            <span className="text-xl font-extrabold text-[#3B2FA8]">Keiki</span>
            <span className="ml-2 rounded-md bg-[#3B2FA8]/10 px-2 py-0.5 text-xs font-bold text-[#3B2FA8]">
              SME & Hộ Kinh Doanh Việt Nam
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#3B2FA8] bg-[#3B2FA8] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2f248a] cursor-pointer"
          >
            <span className="material-symbols-rounded text-base">qr_code_scanner</span>
            📱 Mở trên Điện thoại (QR)
          </button>

          <button
            type="button"
            onClick={() =>
              speakGuideLocally(
                'Xin chào quý doanh nghiệp và hộ kinh doanh! Chào mừng bạn đến với Keiki, trợ lý kế toán thông minh. Bạn có thể đăng nhập bằng Google hoặc đăng ký tài khoản mới để mở sổ kế toán ngay!'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3B2FA8]/10 px-3 py-2 text-xs font-bold text-[#3B2FA8] hover:bg-[#3B2FA8]/20 cursor-pointer"
          >
            <span className="material-symbols-rounded text-base">volume_up</span>
            <span className="hidden sm:inline">🔊 Nghe hướng dẫn</span>
          </button>

          <button
            type="button"
            onClick={onToggleLargeText}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
              largeText
                ? 'border-[#3B2FA8] bg-[#3B2FA8] text-white'
                : 'border-[#D5DCE8] bg-white text-[#1B1F2A]'
            }`}
          >
            <span className="material-symbols-rounded text-base">format_size</span>
            <span className="hidden sm:inline">Chữ to dễ đọc</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mx-auto my-6 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border-2 border-[#D5DCE8] bg-white shadow-lg lg:grid-cols-12">
        {/* Left Pitch & Quick Demo SME Picker */}
        <div className="notebook-paper flex flex-col justify-between border-b-2 border-[#D5DCE8] p-6 sm:p-8 lg:col-span-6 lg:border-b-0 lg:border-r-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B2FA8] px-3 py-1 text-xs font-bold text-white">
              <span className="material-symbols-rounded text-sm">auto_awesome</span>
              Trợ lý AI Kế toán Đa nền tảng — Google Gemini
            </span>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold leading-tight text-[#1B1F2A]">
              Sổ kế toán tự nhiên cho Doanh nghiệp Vừa & Nhỏ (SME) và Hộ Kinh Doanh Việt Nam
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
              Chỉ cần <strong>chụp ảnh hóa đơn</strong>, <strong>dán màn hình chuyển khoản</strong>{' '}
              hoặc <strong>nói một câu bằng tiếng Việt tự nhiên</strong>. Keiki tự động phân loại
              thu/chi, tính thuế theo <strong>Thông tư 152/2025/TT-BTC</strong>, phát hiện trùng
              chéo chứng từ và lập hồ sơ tín dụng vay vốn ngân hàng.
            </p>

            {/* 1-Click Quick Login Presets shown ONLY in DEMO_MODE=true */}
            {demoMode ? (
              <div className="mt-6">
                <p className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-[#3B2FA8]">
                  ⚡ Chọn nhanh Doanh nghiệp SME / Hộ Kinh Doanh mẫu (Bắc – Trung – Nam):
                </p>
                <div className="space-y-2.5">
                  {VIETNAM_SME_PROFILES.map((hh, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={loading}
                      onClick={() => handleLogin(hh)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-[#D5DCE8] bg-white p-3.5 text-left shadow-xs transition hover:border-[#3B2FA8] hover:bg-indigo-50/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3B2FA8]/10 font-extrabold text-[#3B2FA8]">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-[#1B1F2A]">{hh.name}</div>
                          <div className="text-xs text-slate-600">
                            Đại diện: {hh.owner} • MST: <strong>{hh.tax_code}</strong>
                          </div>
                          <div className="text-[11px] text-slate-500">{hh.address}</div>
                        </div>
                      </div>
                      <span className="material-symbols-rounded text-2xl text-[#3B2FA8]">
                        login
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3 rounded-2xl border-2 border-[#D5DCE8] bg-white/90 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#3B2FA8]">
                  🔒 Bảo mật đa lớp cho Dữ liệu Kế toán HKD
                </p>
                <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <li>
                    • <strong>Cô lập dữ liệu riêng tư</strong>: Mỗi hộ kinh doanh / tài khoản có kho sổ sách & chứng từ tách biệt hoàn toàn.
                  </li>
                  <li>
                    • <strong>Xác thực an toàn</strong>: Hỗ trợ Google OAuth 2.0 đã xác minh email hoặc tài khoản SĐT với mật khẩu băm <code>scrypt</code> + Cookie <code>HttpOnly</code>.
                  </li>
                  <li>
                    • <strong>Chuẩn Thông tư 152/2025/TT-BTC</strong>: Xuất bộ 4 sổ kế toán & bảng kê chi tiết không công thức độc hại.
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#FFE66D]/50 p-3 text-xs font-medium text-[#1B1F2A]">
            <span className="material-symbols-rounded text-xl text-[#0F7B5F]">verified_user</span>
            <span>
              Tích hợp <strong>Google Identity Services (OAuth 2.0)</strong>,{' '}
              <strong>Google Cloud Firestore</strong> & <strong>Google Sheets</strong>.
            </span>
          </div>
        </div>

        {/* Right: Google Sign-In & Phone / Tax Code Form */}
        <div className="p-6 sm:p-8 lg:col-span-6 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-[#1B1F2A]">
            Đăng nhập Hệ thống Kế toán Keiki
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Đăng nhập bằng tài khoản Google (Gmail / Workspace) hoặc Mã số thuế doanh nghiệp
          </p>

          {/* Primary Google Account Login Button */}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleButtonClick}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#4285F4] bg-white px-5 py-3.5 text-sm font-bold text-[#1B1F2A] shadow-sm transition hover:bg-blue-50/50 cursor-pointer"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Đăng nhập bằng Tài khoản Google (Gmail / Workspace)</span>
            </button>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
              <span>
                {googleClientId
                  ? '✅ Đã cấu hình Google OAuth 2.0 Client ID thật'
                  : demoMode
                    ? 'Hỗ trợ cả Google OAuth 2.0 Popup thật & Chọn nhanh Gmail (Demo)'
                    : 'Đăng nhập an toàn qua Google OAuth 2.0'}
              </span>
              <div className="flex items-center gap-2">
                {googleClientId && (
                  <button
                    type="button"
                    onClick={handleClearClientId}
                    className="font-bold text-[#C62828] underline cursor-pointer"
                  >
                    Xóa Client ID
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="font-bold text-[#3B2FA8] underline cursor-pointer"
                >
                  {googleClientId ? 'Đổi tài khoản / Cài đặt' : 'Cài đặt Google OAuth ID'}
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-xl border border-[#C62828] bg-red-50 p-3 text-xs font-semibold text-[#C62828]">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D5DCE8]" />
            <span className="text-xs font-semibold text-slate-400">
              HOẶC DÙNG TÀI KHOẢN SỐ ĐIỆN THOẠI & MẬT KHẨU
            </span>
            <div className="h-px flex-1 bg-[#D5DCE8]" />
          </div>

          <div className="mb-3.5 grid grid-cols-2 rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#3B2FA8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#1B1F2A]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#3B2FA8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#1B1F2A]'
              }`}
            >
              Đăng ký HKD mới
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0909 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3.5 py-2.5 text-sm font-bold text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {authMode === 'register' ? 'Mật khẩu mới (≥ 8 ký tự)' : 'Mật khẩu'}
                </label>
                <input
                  type="password"
                  required={authMode === 'register' || !demoMode}
                  minLength={authMode === 'register' ? 8 : undefined}
                  placeholder={
                    demoMode && authMode === 'login'
                      ? 'Nhập mật khẩu (tùy chọn khi Demo)'
                      : 'Tối thiểu 8 ký tự'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3.5 py-2.5 text-sm font-bold text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Người đại diện / Chủ hộ
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Minh Tâm"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3.5 py-2.5 text-sm font-semibold text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Tên Doanh nghiệp / Hộ KD
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Cửa hàng Minh Tâm"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3.5 py-2.5 text-sm font-semibold text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Mã số thuế DN / HKD
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 0318899123"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3.5 py-2.5 text-sm font-bold text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Địa chỉ trụ sở / cửa hàng
                    </label>
                    <input
                      type="text"
                      placeholder="TP. Hồ Chí Minh"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D5DCE8] bg-[#F6F8FB] px-3.5 py-2.5 text-sm text-[#1B1F2A] focus:border-[#3B2FA8] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3B2FA8] px-5 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#2f248a] disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-rounded text-xl">
                {authMode === 'register' ? 'person_add' : 'menu_book'}
              </span>
              {authMode === 'register'
                ? 'Tạo tài khoản & Mở Sổ Keiki'
                : 'Đăng nhập & Mở Sổ Kế Toán Keiki'}
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Hỗ trợ Doanh nghiệp Vừa & Nhỏ (SME) và Hộ Kinh Doanh toàn quốc • Google Gemini & Google Cloud
      </p>

      {/* Google Account Chooser & OAuth 2.0 Client ID Modal */}
      {showGoogleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Google Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span className="font-bold text-slate-800">
                  Đăng nhập bằng Google vào Keiki
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              {/* Section 1: Quick Google Account Picker ONLY in DEMO_MODE=true */}
              {demoMode ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    1. Chọn tài khoản Google để đăng nhập nhanh (Demo Mode):
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {VIETNAM_SME_PROFILES.map((hh, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          handleQuickGoogleAccountSelect(hh.email!, hh.owner || 'Demo', hh.name)
                        }
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-[#4285F4] hover:bg-blue-50/40 cursor-pointer"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4285F4] font-bold text-white">
                          {(hh.owner || 'D').slice(-1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900">{hh.owner}</div>
                          <div className="text-xs text-slate-500 truncate">{hh.email}</div>
                        </div>
                        <span className="text-xs font-semibold text-[#4285F4]">Chọn →</span>
                      </button>
                    ))}
                  </div>

                  {/* Or enter custom Gmail */}
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="text-xs font-bold text-slate-700">
                      Hoặc nhập Gmail cá nhân / doanh nghiệp của bạn:
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
                      />
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Họ và tên"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickGoogleAccountSelect(customGoogleEmail, customGoogleName)
                      }
                      className="mt-2.5 w-full rounded-xl bg-[#4285F4] py-2 text-xs font-bold text-white hover:bg-blue-600 cursor-pointer"
                    >
                      Tiếp tục với {customGoogleEmail || 'Gmail này'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 leading-relaxed">
                  <strong>Chế độ Production:</strong> Đăng nhập nhanh bằng Gmail không mật khẩu đã được tắt để bảo vệ tài khoản. Vui lòng dùng Google OAuth 2.0 Client ID hợp lệ (do quản trị viên cấu hình) hoặc đăng ký bằng Số điện thoại &amp; Mật khẩu.
                </div>
              )}

              {/* Section 2: Real Google Cloud OAuth 2.0 Client ID Popup */}
              <form
                onSubmit={handleSaveClientIdAndPopup}
                className="border-t border-slate-200 pt-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#3B2FA8]">
                  {demoMode ? '2. ' : ''}Mở cửa sổ Google OAuth 2.0 thật (Nếu có GOOGLE_CLIENT_ID):
                </p>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  Tạo tại{' '}
                  <strong>
                    Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs (Web
                    application)
                  </strong>{' '}
                  với Authorized JavaScript origin là <code>http://localhost:8080</code>.
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-[#3B2FA8] px-4 py-2 text-xs font-bold text-white hover:bg-[#2f248a] cursor-pointer"
                  >
                    Lưu & Mở Popup Google
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
