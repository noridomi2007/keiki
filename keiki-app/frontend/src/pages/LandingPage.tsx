import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AppIcon } from '@/components/AppIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HouseholdLoginPayload } from '../api/endpoints';
import { AuditWorkbench } from '../components/AuditWorkbench';
import { AuthPanel } from '../components/AuthPanel';
import { FloatingNavPill } from '../components/FloatingNavPill';
import { HeroShaderCanvas } from '../components/HeroShaderCanvas';
import { KeikiMark } from '../components/KeikiMark';
import { Stamp } from '../components/Stamp';
import { useAnimatedNumber, useReveal } from '../hooks/useRevealAndCounter';
import { vi } from '../i18n/vi';

interface LandingPageProps {
  largeText: boolean;
  onToggleLargeText: () => void;
  onOpenMobileModal: () => void;
  onNavigateLogin: (mode?: 'login' | 'register') => void;
  onLoginSuccess: (payload: HouseholdLoginPayload, welcomeMsg: string) => void;
}

type SheetKey = 'S1-HKD' | 'S2-HKD' | 'S3-HKD' | 'VAY-VON';

interface SheetSpec {
  code: SheetKey;
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
  summary: string;
}

const SHEET_SPECS: SheetSpec[] = [
  {
    code: 'S1-HKD',
    title: 'Sổ chi tiết Doanh thu bán hàng hóa, dịch vụ',
    subtitle: 'Tự động tách doanh thu theo 4 nhóm ngành thuế GTGT + TNCN tại Thông tư 152/2025/TT-BTC.',
    columns: ['Ngày chứng từ', 'Diễn giải giao dịch', 'Nhóm ngành TT152', 'Thuế suất', 'Thành tiền VND'],
    rows: [
      ['12/11/2026', 'Bán lẻ tại quầy (20 tô mì Quảng + 12 trà đá)', 'Nhóm 2: Dịch vụ ăn uống', '4.5%', '+820.000 đ'],
      ['11/11/2026', 'Hợp đồng thiết kế in ấn (Chuyển khoản)', 'Nhóm 2: Dịch vụ không bao thầu NVL', '7.0%', '+4.200.000 đ'],
      ['10/11/2026', 'Xuất bán sỉ cà phê hạt đóng gói', 'Nhóm 1: Phân phối cung cấp hàng hóa', '1.5%', '+3.650.000 đ'],
    ],
    summary: 'Cộng kỳ đối soát: 8.670.000 đ • Thuế tạm tính khớp từng nhóm ngành',
  },
  {
    code: 'S2-HKD',
    title: 'Sổ chi tiết Vật liệu, dụng cụ, sản phẩm, hàng hóa',
    subtitle: 'Theo dõi đơn giá nhập từng mặt hàng và cảnh báo ngay khi giá nhập vượt +30% trung vị lịch sử.',
    columns: ['Ngày nhập', 'Nhà cung cấp & Mặt hàng', 'Số lượng', 'Đơn giá', 'Kiểm toán giá'],
    rows: [
      ['12/11/2026', 'Cà phê rang xay Minh Phát', '5 kg', '180.000 đ', 'Khớp trung vị (0%)'],
      ['09/11/2026', 'Bao bì giấy kraft 250g', '500 cái', '2.100 đ', 'Khớp trung vị (-2%)'],
      ['08/11/2026', 'Sữa đặc nguyên kem thùng 48', '2 thùng', '960.000 đ', 'Đã đính kèm ảnh gốc'],
    ],
    summary: 'Đối chiếu hóa đơn giấy ↔ chuyển khoản VietQR không ghi trùng chi phí',
  },
  {
    code: 'S3-HKD',
    title: 'Sổ chi phí sản xuất, kinh doanh',
    subtitle: 'Ghi nhận điện nước, mặt bằng, vận chuyển và chi phí vận hành trực tiếp phục vụ kinh doanh.',
    columns: ['Ngày chi', 'Nội dung chi phí', 'Thanh toán', 'Chứng từ gốc', 'Số tiền VND'],
    rows: [
      ['10/11/2026', 'Tiền điện, nước & Internet cửa hàng T11', 'Chuyển khoản', 'Ảnh hóa đơn EVN', '-1.250.000 đ'],
      ['05/11/2026', 'Thuê mặt bằng kinh doanh tháng 11/2026', 'Chuyển khoản', 'Biên lai VietQR', '-8.500.000 đ'],
      ['03/11/2026', 'Phí giao hàng nội thành đơn sỉ', 'Tiền mặt', 'Ghi âm + Phiếu thu', '-185.000 đ'],
    ],
    summary: 'Tất cả ô văn bản xuất Excel được làm sạch tiền tố công thức (=, +, -, @)',
  },
  {
    code: 'VAY-VON',
    title: 'Sheet Hồ sơ Tín dụng & Minh bạch Dòng tiền',
    subtitle: 'Tổng hợp tỷ lệ bút toán có chứng từ gốc và đối chiếu kép cho ngân hàng chính thống.',
    columns: ['Chỉ tiêu đánh giá', 'Giá trị ghi nhận', 'Tỷ lệ xác thực', 'Mục đích ngân hàng'],
    rows: [
      ['Bút toán có chứng từ ảnh / thoại gốc', '42 / 44 bút toán', '95%', 'Chứng minh thu nhập thực'],
      ['Bút toán đối chiếu kép (HĐ + VietQR)', '18 bút toán', '100% khớp mã FT', 'Loại trừ rủi ro khai khống'],
      ['Dòng tiền ròng sau chi phí & thuế', 'Vận hành ổn định', 'Khớp sao kê', 'Cơ sở cấp hạn mức tín dụng'],
    ],
    summary: 'Xuất trực tiếp tệp .xlsx hoặc gói .zip đính kèm toàn bộ ảnh chứng từ đối soát',
  },
];

const HERO_PARSE_FEED = [
  { raw: '"Sáng ni bán 20 tô mì Quảng tiền mặt"', sheet: 'S1-HKD', result: '+700.000 đ' },
  { raw: '"Nhập 5kg cà phê hạt Minh Phát 180k/kg"', sheet: 'S2-HKD', result: '-900.000 đ' },
  { raw: '"Chuyển khoản tiền điện EVN tháng 11"', sheet: 'S3-HKD', result: '-1.250.000 đ' },
];

const FLOATING_NAV_ITEMS = [
  { id: 'thu-nghiem', label: 'Thử kiểm toán' },
  { id: 'quy-trinh', label: 'AI + Python' },
  { id: 'so-tt152', label: 'Bộ 4 sổ TT152' },
  { id: 'dang-nhap', label: 'Đăng nhập' },
];

function MetricItem({
  value,
  suffix = '',
  label,
  detail,
  active,
}: {
  value: number;
  suffix?: string;
  label: string;
  detail: string;
  active: boolean;
}) {
  const animated = useAnimatedNumber(value, active, 700);
  return (
    <div className="p-5 sm:p-6">
      <div className="font-heading text-3xl font-extrabold tracking-tight text-[#111625] tabular-nums sm:text-4xl">
        {value < 10 && value > 0 ? `0${animated}` : animated}
        {suffix}
      </div>
      <div className="mt-1.5 text-sm font-bold text-[#2E2396]">{label}</div>
      <p className="mt-1 text-xs leading-relaxed text-[#475569]">{detail}</p>
    </div>
  );
}

export function LandingPage({
  largeText,
  onToggleLargeText,
  onOpenMobileModal,
  onNavigateLogin,
  onLoginSuccess,
}: LandingPageProps) {
  const [heroScenario, setHeroScenario] = useState<'clean' | 'duplicate'>('duplicate');
  const [activeSheet, setActiveSheet] = useState<SheetKey>('S1-HKD');
  const [feedIdx, setFeedIdx] = useState<number>(0);

  const [metricsRef, metricsVisible] = useReveal<HTMLDivElement>(0.15);

  const selectedSheet = SHEET_SPECS.find((s) => s.code === activeSheet) || SHEET_SPECS[0];
  const currentFeed = HERO_PARSE_FEED[feedIdx];

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setFeedIdx((prev) => (prev + 1) % HERO_PARSE_FEED.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#F6F8FB] text-[#111625]">
        {/* Sticky Top Navbar */}
        <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
              <KeikiMark className="h-9 w-9 shrink-0" />
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-lg font-extrabold tracking-tight text-[#111625]">
                  Keiki
                </span>
                <span className="hidden font-mono text-xs font-semibold text-[#2E2396] sm:inline">
                  TT 152/2025
                </span>
              </div>
            </div>

            <nav className="hidden shrink-0 items-center gap-6 whitespace-nowrap text-xs font-semibold text-[#475569] lg:flex">
              <a href="#thu-nghiem" className="transition hover:text-[#2E2396]">
                Thử kiểm toán
              </a>
              <a href="#quy-trinh" className="transition hover:text-[#2E2396]">
                Kiến trúc AI + Python
              </a>
              <a href="#so-tt152" className="transition hover:text-[#2E2396]">
                Bộ 4 sổ TT152
              </a>
              <a href="#dang-nhap" className="transition hover:text-[#2E2396]">
                Mở sổ ngay
              </a>
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenMobileModal}
                title="Mở trên Điện thoại (Mã QR)"
                className="hidden h-9 px-2.5 text-xs sm:inline-flex"
              >
                <AppIcon name="qr_code_2" className="text-base" />
                <span className="hidden md:inline">QR</span>
              </Button>

              <Button
                type="button"
                variant={largeText ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleLargeText}
                title="Bật chế độ Chữ to dễ đọc"
                className="h-9 px-2.5 text-xs"
              >
                <AppIcon name="format_size" className="text-base" />
                <span className="hidden xl:inline">Chữ to</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateLogin('login')}
                className="hidden h-9 px-3 text-xs sm:inline-flex"
              >
                Đăng nhập
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => onNavigateLogin('register')}
                className="h-9 px-3 text-xs"
              >
                <span>Mở sổ</span>
                <AppIcon name="arrow_forward" className="text-sm" />
              </Button>
            </div>
          </div>
        </header>

        {/* Editorial Asymmetric Hero with Subtle Archival Contour Shader */}
        <section className="relative overflow-hidden border-b border-border/60">
          <HeroShaderCanvas />

          <div className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-14 sm:px-6 lg:pt-16 lg:pb-18">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              {/* Hero Left: Kinetic Focus Entrance (Linear style, visible by default) */}
              <motion.div
                initial={{ opacity: 0.96, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="min-w-0 lg:col-span-6"
              >
                <h1 className="font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-[#111625] sm:text-5xl">
                  Chụp hóa đơn.
                  <br />
                  Nói một câu.
                  <br />
                  <span className="text-[#2E2396]">Sổ sách tự vào đúng dòng.</span>
                </h1>

                <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-[#475569]">
                  Dành cho hộ kinh doanh và doanh nghiệp nhỏ Việt Nam không rành định khoản Nợ/Có.
                  Keiki đọc hóa đơn giấy viết tay, ảnh chuyển khoản VietQR và giọng nói vùng miền,
                  kiểm toán số học độc lập rồi xuất đủ 4 sổ thuế S1–S4.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => scrollToSection('thu-nghiem')}
                    className="h-11 rounded-xl px-5 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-px"
                  >
                    <span>Thử kiểm toán trực tiếp</span>
                    <AppIcon name="play_arrow" className="text-lg" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onNavigateLogin('login')}
                    className="h-11 rounded-xl bg-white/90 px-5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-y-px"
                  >
                    <AppIcon name="menu_book" className="text-lg text-[#2E2396]" />
                    <span>Đăng nhập mở sổ hộ</span>
                  </Button>
                </div>

                {/* Live Voice/OCR Parsing Ticker Strip */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white/90 px-3.5 py-2.5 text-xs shadow-xs">
                  <span className="inline-flex min-w-0 items-center gap-2 font-medium text-[#475569]">
                    <span className="audit-live-dot inline-block h-2 w-2 shrink-0 rounded-full bg-[#0B6E54]" />
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentFeed.raw}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22 }}
                        className="truncate text-[#111625]"
                      >
                        {currentFeed.raw}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${currentFeed.sheet}-${currentFeed.result}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 font-mono text-xs font-bold text-[#2E2396] tabular-nums"
                    >
                      → {currentFeed.sheet} • {currentFeed.result}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-[#2E2396]/25 bg-white/80 text-[#2E2396]">
                    Thông tư 152/2025/TT-BTC
                  </Badge>
                  <Badge variant="secondary">Không cần hiểu định khoản Nợ / Có</Badge>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5 text-xs">
                  <div>
                    <div className="font-bold text-[#111625]">Không trùng chéo</div>
                    <div className="mt-0.5 text-[#475569]">Khớp Hóa đơn ↔ VietQR</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#111625]">Xuất Excel S1–S4</div>
                    <div className="mt-0.5 text-[#475569]">Đính kèm ZIP chứng từ</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#111625]">Cách ly dữ liệu</div>
                    <div className="mt-0.5 text-[#475569]">Scrypt + Google OAuth</div>
                  </div>
                </div>
              </motion.div>

              {/* Hero Right: Interactive Ledger Specimen Card */}
              <motion.div
                initial={{ opacity: 0.96, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="min-w-0 lg:col-span-6"
              >
                <Card className="surface-lift gap-0 py-0 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[#F6F8FB] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#111625]">
                      <AppIcon name="fact_check" className="text-lg text-[#2E2396]" />
                      <span>Kiểm chứng sổ thực tế</span>
                    </div>
                    <Tabs
                      value={heroScenario}
                      onValueChange={(val) => setHeroScenario(val as 'clean' | 'duplicate')}
                    >
                      <TabsList className="h-8 bg-slate-200/70 p-0.5">
                        <TabsTrigger
                          value="clean"
                          className="h-7 cursor-pointer px-2.5 text-xs font-bold data-active:bg-[#0B6E54] data-active:text-white"
                        >
                          Hợp lệ
                        </TabsTrigger>
                        <TabsTrigger
                          value="duplicate"
                          className="h-7 cursor-pointer px-2.5 text-xs font-bold data-active:bg-[#B91C1C] data-active:text-white"
                        >
                          Trùng chéo VietQR
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Ruled Paper Specimen Body */}
                  <div className="notebook-ledger p-5 pl-16 sm:p-6 sm:pl-20">
                    <div className="space-y-4">
                      {/* Source 1 */}
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-3.5">
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-semibold text-[#475569]">
                            Chứng từ #01 • Ảnh hóa đơn giấy
                          </div>
                          <div className="mt-1 text-sm font-bold text-[#111625]">
                            Cà phê rang xay Minh Phát
                          </div>
                          <div className="text-xs text-[#475569]">
                            5 kg × 180.000 đ • Tiền mặt • 12/11/2026
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-sm font-extrabold text-[#111625] tabular-nums">
                            -900.000 đ
                          </div>
                          <div className="mt-1.5">
                            <Stamp animate={false} />
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Comparison State (AnimatePresence swap) */}
                      <AnimatePresence mode="wait">
                        {heroScenario === 'clean' ? (
                          <motion.div
                            key="clean"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-emerald-50/90 p-3.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6E54]">
                                <AppIcon name="calculate" className="text-base" />
                                Kiểm toán Python: Đạt chuẩn
                              </span>
                              <Badge variant="emerald" className="font-mono">
                                S2-HKD
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                              Tổng tiền <code className="font-mono text-[#111625]">5 × 180.000 = 900.000 đ</code> khớp hoàn toàn với tổng mặt
                              giấy. Giá nhập giữ ổn định so với lịch sử 30 ngày qua.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="duplicate"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3 border-b border-[#B91C1C]/20 pb-3.5">
                              <div className="min-w-0">
                                <div className="font-mono text-xs font-bold text-[#B91C1C]">
                                  Chứng từ #02 • Ảnh chụp VietQR (14:22)
                                </div>
                                <div className="mt-0.5 text-xs font-bold text-[#111625]">
                                  CK: PHAM VAN MINH — "TT ca phe Minh Phat"
                                </div>
                              </div>
                              <div className="shrink-0 text-right font-mono text-xs font-extrabold text-[#B91C1C] tabular-nums">
                                -900.000 đ
                              </div>
                            </div>

                            <div className="bg-red-50/95 p-3.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B91C1C]">
                                  <AppIcon name="compare_arrows" className="text-base" />
                                  Khóa ghi trùng CROSS_DUPLICATE
                                </span>
                                <Badge variant="destructive" className="font-bold">
                                  CẦN HỎI LẠI
                                </Badge>
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                                Keiki dừng tự động ghi sổ và hỏi lại chủ hộ trước khi gộp hai chứng từ
                                vào làm một — giúp báo cáo thuế và dòng tiền ngân hàng không bị sai lệch.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Precision Metrics Strip */}
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div
            ref={metricsRef}
            className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-xs sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
          >
            <MetricItem
              value={4}
              label="Mẫu sổ Thông tư 152"
              detail="Xuất S1-HKD, S2-HKD, S3-HKD và Sheet Hồ sơ Vay vốn ngân hàng."
              active={metricsVisible}
            />
            <MetricItem
              value={6}
              label="Bước kiểm toán độc lập"
              detail="Tách biệt khâu AI bóc tách ngữ nghĩa với khâu Python kiểm tra số học."
              active={metricsVisible}
            />
            <MetricItem
              value={100}
              suffix="%"
              label="Chứng từ lưu đối soát"
              detail="Mọi bút toán đều đính kèm ảnh hóa đơn, biên lai VietQR hoặc ghi âm gốc tại quầy."
              active={metricsVisible}
            />
            <MetricItem
              value={0}
              label="Bút toán tự ghi khi lệch số"
              detail="Luôn tạm dừng khi nghi trùng chéo hoặc giá nhập tăng quá 30%."
              active={metricsVisible}
            />
          </div>
        </section>

        {/* Section: Interactive AI & Python Sandbox Workbench */}
        <section id="thu-nghiem" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-[#111625] sm:text-3xl">
                Xem Keiki xử lý chứng từ trước khi mở sổ
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                Kéo thanh điều chỉnh đơn giá, bật giả lập VietQR hoặc chuyển giữa các tình huống thực
                tế bên dưới để xem tầng Python bắt lỗi và xuất sổ ô ly ngay trên màn hình.
              </p>
            </div>
            <Button
              type="button"
              variant="link"
              onClick={() => onNavigateLogin('login')}
              className="h-auto px-0 text-xs font-bold text-[#2E2396]"
            >
              <span>Dùng thử với ảnh hóa đơn thật của bạn</span>
              <AppIcon name="arrow_forward" className="text-base" />
            </Button>
          </div>

          <AuditWorkbench />
        </section>

        {/* Section: Dual-Engine Architecture + Live Signal Flow Diagram */}
        <section id="quy-trinh" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-[#111625] sm:text-3xl">
              AI không tự ý làm phép tính thuế thay kế toán
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
              Keiki tách rạch ròi vai trò: mô hình ngôn ngữ chỉ đọc hiểu tiếng Việt và chứng từ mờ;
              toàn bộ phép nhân đơn giá, so sánh lịch sử và phát hiện trùng chéo chạy bằng mã Python xác
              định.
            </p>
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden py-0">
            {/* Top Animated Signal Pipeline Strip */}
            <div className="border-b border-border bg-[#F6F8FB] px-5 py-4 sm:px-8">
              <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-7">
                <div className="flex items-center gap-2.5 md:col-span-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2E2396] ring-1 ring-border">
                    <AppIcon name="photo_camera" className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111625]">1. Chứng từ thô</div>
                    <div className="text-xs text-[#475569]">Hóa đơn, VietQR, Thoại</div>
                  </div>
                </div>

                <div className="hidden items-center justify-center md:flex">
                  <svg className="h-3 w-full" viewBox="0 0 80 12" fill="none" aria-hidden="true">
                    <line
                      x1="2"
                      y1="6"
                      x2="78"
                      y2="6"
                      stroke="#2E2396"
                      strokeWidth="2"
                      className="signal-flow-line"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-2.5 md:col-span-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2E2396] text-white">
                    <AppIcon name="psychology" className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111625]">2. Gemini Đọc Hiểu</div>
                    <div className="text-xs text-[#475569]">JSON + Điểm tin cậy</div>
                  </div>
                </div>

                <div className="hidden items-center justify-center md:flex">
                  <svg className="h-3 w-full" viewBox="0 0 80 12" fill="none" aria-hidden="true">
                    <line
                      x1="2"
                      y1="6"
                      x2="78"
                      y2="6"
                      stroke="#0B6E54"
                      strokeWidth="2"
                      className="signal-flow-line"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-2.5 md:col-span-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B6E54] text-white">
                    <AppIcon name="shield" className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111625]">3. Python Chốt</div>
                    <div className="text-xs text-[#475569]">Sổ S1–S4</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Column 1: AI Comprehension (5 columns) */}
              <div className="min-w-0 border-b border-border p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0">
                <h3 className="font-heading text-lg font-bold text-[#111625]">
                  Đọc hiểu giọng nói 3 miền và hóa đơn chụp vội
                </h3>
                <div className="mt-2.5">
                  <Badge variant="outline" className="border-[#2E2396]/30 text-[#2E2396]">
                    <AppIcon name="psychology" className="text-sm" />
                    Tầng Đọc Hiểu — Google Gemini
                  </Badge>
                </div>

                <ul className="mt-6 divide-y divide-border text-xs leading-relaxed text-[#475569]">
                  <li className="flex items-start gap-3 py-3.5 first:pt-0">
                    <AppIcon name="document_scanner" className="mt-0.5 shrink-0 text-base text-[#2E2396]" />
                    <span>
                      Đọc hóa đơn bán lẻ viết tay, giấy nhiệt mờ và ảnh màn hình chuyển khoản mọi ngân
                      hàng VietQR.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 py-3.5">
                    <AppIcon name="graphic_eq" className="mt-0.5 shrink-0 text-base text-[#2E2396]" />
                    <span>
                      Chuyển đổi tiếng Việt nói tự nhiên ("tá lốc", "trăm rưỡi", "mới bán thiếu") về
                      cấu trúc JSON rõ ràng.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 py-3.5 last:pb-0">
                    <AppIcon name="verified" className="mt-0.5 shrink-0 text-base text-[#2E2396]" />
                    <span>
                      Gắn điểm tin cậy cho từng trường dữ liệu để bôi vàng hỏi lại ngay khi chữ viết
                      quá mờ.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Column 2: Deterministic Python Audit (7 columns) */}
              <div className="min-w-0 bg-[#F6F8FB]/60 p-6 sm:p-8 lg:col-span-7">
                <h3 className="font-heading text-lg font-bold text-[#111625]">
                  Chặn 3 rủi ro sai sổ phổ biến nhất của hộ kinh doanh
                </h3>
                <div className="mt-2.5">
                  <Badge variant="emerald">
                    <AppIcon name="shield" className="text-sm" />
                    Tầng Kiểm Toán — Python Xác Định
                  </Badge>
                </div>

                <div className="mt-6 divide-y divide-border">
                  <div className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#111625]">
                        Chặn trùng chéo hóa đơn – VietQR (<code className="font-mono text-xs">CROSS_DUPLICATE</code>)
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                        Khi vừa chụp hóa đơn giấy vừa dán ảnh chuyển khoản cùng số tiền trong ±3 ngày,
                        Keiki hỏi gộp thành 1 bút toán đối chiếu kép.
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0 font-mono">
                      Chống tính thuế 2 lần
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#111625]">
                        Cảnh báo sốc giá nhập (<code className="font-mono text-xs">PRICE_ANOMALY</code>)
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                        So sánh đơn giá mặt hàng với trung vị lịch sử; lệch vượt +30% tự động tô vàng
                        và đọc cảnh báo cho chủ hộ.
                      </p>
                    </div>
                    <Badge variant="amber" className="shrink-0 font-mono">
                      Ngăn ghi nhầm 0 thừa
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#111625]">
                        Chống chèn công thức Excel &amp; Cô lập sổ hộ
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                        Mỗi hộ kinh doanh có kho dữ liệu độc lập qua Cookie ký số; tệp Excel xuất ra
                        được vô hiệu hóa chuỗi công thức độc hại.
                      </p>
                    </div>
                    <Badge variant="emerald" className="shrink-0 font-mono">
                      Sẵn sàng Production
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Section: Circular 152 Interactive Sheet Preview */}
        <section id="so-tt152" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-[#111625] sm:text-3xl">
                Trọn bộ 4 sổ Thông tư 152/2025 &amp; Hồ sơ vay vốn
              </h2>
            </div>

            <Tabs
              value={activeSheet}
              onValueChange={(val) => setActiveSheet(val as SheetKey)}
            >
              <TabsList className="flex h-auto flex-wrap gap-1 bg-slate-200/70 p-1">
                {SHEET_SPECS.map((spec) => {
                  const isActive = activeSheet === spec.code;
                  return (
                    <TabsTrigger
                      key={spec.code}
                      value={spec.code}
                      className={`relative h-8 cursor-pointer font-mono text-xs font-bold transition-colors data-active:bg-transparent data-active:shadow-none ${
                        isActive ? 'text-white' : 'text-[#334155] hover:text-[#111625]'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="tt152-sheet-pill"
                          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                          className="absolute inset-0 rounded-md bg-[#2E2396]"
                        />
                      )}
                      <span className="relative z-10">{spec.code}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden py-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[#F6F8FB] px-5 py-4">
              <div>
                <h3 className="font-heading text-base font-bold text-[#111625]">
                  {selectedSheet.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#475569]">{selectedSheet.subtitle}</p>
              </div>
              <Badge variant="outline" className="font-mono font-bold text-[#2E2396]">
                {selectedSheet.code}
              </Badge>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSheet.code}
                initial={{ opacity: 0.78, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.78, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      {selectedSheet.columns.map((col, idx) => (
                        <TableHead
                          key={col}
                          className={`px-5 py-3 text-xs font-bold tracking-wider text-[#475569] uppercase ${
                            idx === selectedSheet.columns.length - 1 ? 'text-right' : ''
                          }`}
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSheet.rows.map((row, rIdx) => (
                      <TableRow key={rIdx} className="hover:bg-[#F6F8FB]">
                        {row.map((cell, cIdx) => {
                          const isLast = cIdx === row.length - 1;
                          const isPositive = cell.startsWith('+');
                          return (
                            <TableCell
                              key={cIdx}
                              className={`px-5 py-3.5 text-xs ${
                                isLast ? 'text-right font-mono font-extrabold tabular-nums' : ''
                              } ${
                                cIdx === 0 ? 'font-mono text-[#475569]' : 'text-[#111625]'
                              } ${isPositive ? 'text-[#0B6E54]' : ''}`}
                            >
                              {cell}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-[#F6F8FB]/70 px-5 py-3 text-xs text-[#475569]">
              <span>{selectedSheet.summary}</span>
              <span className="font-mono text-xs font-bold text-[#0B6E54]">
                Định dạng .XLSX &amp; .ZIP chứng từ
              </span>
            </div>
          </Card>
        </section>

        {/* Section: Integrated Auth Gate */}
        <section id="dang-nhap" className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="min-w-0 space-y-4 lg:col-span-5">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-[#111625] sm:text-3xl">
                Mở sổ kế toán riêng cho cửa hàng của bạn
              </h2>
              <p className="text-sm leading-relaxed text-[#475569]">
                Đăng nhập bằng Google hoặc Số điện thoại. Toàn bộ chứng từ, sổ thuế S1–S4 và lịch sử
                kiểm toán được cô lập riêng cho từng hộ kinh doanh.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-[#111625]">
                <div className="flex items-center gap-2">
                  <AppIcon name="qr_code_scanner" className="text-lg text-[#0B6E54]" />
                  <span>Cài đặt nhanh trên điện thoại bằng mã QR để chụp hóa đơn tại quầy</span>
                </div>
                <div className="flex items-center gap-2">
                  <AppIcon name="key" className="text-lg text-[#0B6E54]" />
                  <span>Tùy chọn kết nối Google Gemini API cá nhân hoặc dùng chế độ tích hợp</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenMobileModal}
                  className="h-9 text-xs font-bold"
                >
                  <AppIcon name="smartphone" className="text-base text-[#2E2396]" />
                  Mở trên Điện thoại (QR)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateLogin('login')}
                  className="h-9 text-xs font-bold text-[#2E2396]"
                >
                  <span>Mở màn hình Đăng nhập riêng</span>
                  <AppIcon name="open_in_new" className="text-base" />
                </Button>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <AuthPanel variant="embedded" onLoginSuccess={onLoginSuccess} />
            </div>
          </div>
        </section>

        {/* Clean Minimal Footer with Desktop Dock Safe Clearance */}
        <footer className="border-t border-border bg-white py-6 lg:pb-24">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-[#475569] sm:px-6">
            <div className="flex items-center gap-2 font-semibold text-[#111625]">
              <KeikiMark className="h-6 w-6" />
              <span>Keiki — Sổ Kế Toán Tự Nhiên</span>
            </div>
            <p className="text-xs">{vi.legalFooter}</p>
          </div>
        </footer>

        {/* Awwwards-Style Desktop Sticky Navigation Dock */}
        <FloatingNavPill
          items={FLOATING_NAV_ITEMS}
          onNavigate={scrollToSection}
          onStartDemo={() => scrollToSection('dang-nhap')}
        />
      </div>
    </MotionConfig>
  );
}
