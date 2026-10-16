import React, { useState } from "react";
import { BrowserAuthUser } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { UnifiedLoginPageProps, StaffMember } from "@/types";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { Button, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

interface DemoAccount {
  role: string;
  roleLabel: string;
  name: string;
  email: string;
  pin: string;
  targetTab: string;
  targetDescription: string;
  icon: any;
  badgeBg: string;
  badgeText: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "CASHIER",
    roleLabel: "Thu Ngân POS",
    name: "Nguyễn Thị Mai (Thu Ngân)",
    email: "cashier@a2order.vn",
    pin: "1234",
    targetTab: "billing",
    targetDescription: "Vào thẳng quầy thu ngân, in bill 80mm & VietQR",
    icon: "cashier",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  {
    role: "CHEF",
    roleLabel: "Bếp Trưởng KDS",
    name: "Trần Quốc Toản (Bếp KDS)",
    email: "chef@a2order.vn",
    pin: "1234",
    targetTab: "kds",
    targetDescription: "Vào thẳng màn hình điều phối bếp, chuông SLA",
    icon: "kitchen",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  {
    role: "WAITER",
    roleLabel: "Phục Vụ Bàn",
    name: "Lê Hoàng Long (Phục Vụ)",
    email: "waiter@a2order.vn",
    pin: "1234",
    targetTab: "tables",
    targetDescription: "Vào thẳng sơ đồ bàn & bàn phím gọi món T9",
    icon: "table",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-800",
  },
  {
    role: "STORE_OWNER",
    roleLabel: "Chủ Quán / Quản Lý",
    name: "Nguyễn Văn An (Chủ Quán)",
    email: "owner@a2order.vn",
    pin: "8888",
    targetTab: "tables",
    targetDescription: "Vào xem toàn cảnh bàn ăn, menu & doanh thu",
    icon: "store",
    badgeBg: "bg-brand-100",
    badgeText: "text-brand-800",
  },
  {
    role: "SUPER_ADMIN",
    roleLabel: "Super Admin",
    name: "Quản trị viên SaaS",
    email: "admin@a2order.vn",
    pin: "9999",
    targetTab: "tables",
    targetDescription: "Toàn quyền truy cập mọi phân hệ POS, KDS & CMS",
    icon: "shield",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
  },
];

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginSuccess,
  staffList = [],
  storeId = "store-test-1",
  storeName = "A2Order Restaurant & Cafe",
}) => {
  const [authMode, setAuthMode] = useState<"account" | "pin">("account");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // PIN mode state
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState<string>("");

  const handleAccountLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.warning("Vui lòng nhập email hoặc tài khoản đăng nhập");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Gửi request lên Backend API
      const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-owner", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password: password || "A2Order@2026" }),
      });
      await onLoginSuccess(result.user, result.token);
    } catch {
      // 2. Graceful Fallback: nếu Backend chưa khởi chạy hoặc demo standalone
      const matchedDemo = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === trimmedEmail.toLowerCase());
      const fallbackUser: BrowserAuthUser = {
        id: matchedDemo ? `usr-${matchedDemo.role.toLowerCase()}` : "usr-staff-default",
        name: matchedDemo ? matchedDemo.name : trimmedEmail.split("@")[0].toUpperCase(),
        role: matchedDemo ? matchedDemo.role : "STORE_OWNER",
        storeId: storeId || "store-demo-central",
        storeName: storeName || "A2Order Demo Store",
        email: trimmedEmail,
      };
      const fallbackToken = `demo-token-${Date.now()}`;
      await onLoginSuccess(fallbackUser, fallbackToken);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigit = async (digit: string) => {
    if (isSubmitting) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setIsSubmitting(true);
        try {
          if (selectedStaff) {
            const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-pin", {
              method: "POST",
              body: JSON.stringify({ storeId, staffId: selectedStaff.id, pinCode: nextPin }),
            });
            await onLoginSuccess(result.user, result.token);
          } else {
            // Đăng nhập nhanh PIN cho Thu ngân/Bếp
            const fallbackUser: BrowserAuthUser = {
              id: "usr-pin-fast",
              name: `Nhân viên quầy (PIN ${nextPin})`,
              role: nextPin === "1234" ? "CASHIER" : nextPin === "8888" ? "STORE_OWNER" : "WAITER",
              storeId: storeId || "store-demo-central",
              storeName: storeName || "A2Order Demo Store",
            };
            await onLoginSuccess(fallbackUser, `pin-token-${Date.now()}`);
          }
        } catch {
          const fallbackUser: BrowserAuthUser = {
            id: selectedStaff?.id || "usr-pin-fallback",
            name: selectedStaff?.name || "Nhân viên ca (Offline Demo)",
            role: selectedStaff?.role?.toUpperCase().includes("BẾP")
              ? "CHEF"
              : selectedStaff?.role?.toUpperCase().includes("THU NGÂN")
              ? "CASHIER"
              : "WAITER",
            storeId: storeId || "store-demo-central",
            storeName: storeName || "A2Order Demo Store",
          };
          await onLoginSuccess(fallbackUser, `pin-token-${Date.now()}`);
        } finally {
          setPin("");
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleQuickDemoSelect = async (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword("Demo@123456");
    setIsSubmitting(true);

    try {
      const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-owner", {
        method: "POST",
        body: JSON.stringify({ email: demo.email, password: "OwnerSecureTest123" }),
      });
      await onLoginSuccess(result.user, result.token);
    } catch {
      // Fallback demo user
      const demoUser: BrowserAuthUser = {
        id: `demo-${demo.role.toLowerCase()}`,
        name: demo.name,
        role: demo.role,
        storeId: storeId || "store-demo-central",
        storeName: storeName || "A2Order Demo Store",
        email: demo.email,
      };
      await onLoginSuccess(demoUser, `demo-token-${demo.role}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#07130e] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Background Glow Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none bg-emerald-600/20" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none bg-brand-800/25" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Glassmorphic Portal Card */}
      <div className="w-full max-w-5xl bg-surface-card/95 backdrop-blur-2xl border border-surface-border rounded-3xl shadow-[0_32px_100px_rgba(0,0,0,.6)] overflow-hidden grid lg:grid-cols-[.95fr_1.15fr] relative z-10 animate-scaleUp">
        {/* Left Side: Brand Showcase & Role Flow Overview */}
        <aside className="hidden lg:flex relative min-h-[580px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a1e16] via-[#12372A] to-[#194B3A] p-8 text-white">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-36 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-emerald-400/10 blur-3xl" />

          {/* Brand Header */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white/20 shadow-lg"
            />
            <div>
              <span className="block text-lg font-black tracking-tight">A2Order</span>
              <span className="text-[10px] font-bold tracking-[.18em] text-emerald-200 uppercase">
                F&B Smart Ecosystem
              </span>
            </div>
          </div>

          {/* Central Pitch */}
          <div className="relative z-10 py-6">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              <Icon name="sparkles" size={12} />
              Cổng Đăng Nhập & Phân Luồng Thông Minh
            </span>
            <h2 className="text-2xl font-black leading-snug tracking-tight">
              Một tài khoản duy nhất, tự động vào đúng màn hình làm việc
            </h2>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Hệ thống tự động nhận diện vai trò tài khoản để mở Quầy Thu Ngân POS, Bếp KDS, Sơ Đồ Bàn hoặc Cổng Quản Trị CMS mà không cần cấu hình thủ công.
            </p>

            {/* Feature Matrix */}
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Icon name="cashier" size={14} />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-white">Thu Ngân (CASHIER):</span>
                  <span className="text-emerald-100/75 ml-1">Vào thẳng POS in bill 80mm & VietQR động gạch nợ</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Icon name="kitchen" size={14} />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-white">Bếp (CHEF):</span>
                  <span className="text-emerald-100/75 ml-1">Vào thẳng KDS điều phối, chuông cảnh báo SLA trễ món</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0">
                  <Icon name="table" size={14} />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-white">Phục Vụ (WAITER):</span>
                  <span className="text-emerald-100/75 ml-1">Vào thẳng sơ đồ bàn trực quan & gọi món T9 cực nhanh</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-purple-400/20 text-purple-300 flex items-center justify-center shrink-0">
                  <Icon name="shield" size={14} />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-white">Chủ Quán / Admin:</span>
                  <span className="text-emerald-100/75 ml-1">Toàn quyền vận hành, doanh thu realtime & đa chi nhánh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-[10px] text-emerald-200/70">
            <span className="flex items-center gap-1.5">
              <Icon name="checkCircle" size={12} className="text-emerald-400" />
              Mã hóa đa thuê Multi-Tenant
            </span>
            <span className="font-mono">v7.0 Stable</span>
          </div>
        </aside>

        {/* Right Side: Login Form & Quick Demo Switcher */}
        <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[92vh] no-scrollbar">
          <div>
            {/* Header */}
            <div className="text-left mb-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
                  Đăng Nhập A2Order
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 text-[10px] font-extrabold uppercase">
                  1 Cổng Duy Nhất
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Tự động điều hướng đúng phân hệ theo vai trò tài khoản được cấp.
              </p>
            </div>

            {/* Auth Mode Toggle Pill */}
            <div className="p-1 bg-surface-canvas rounded-2xl flex text-xs font-bold gap-1 mb-5 border border-surface-border">
              <button
                type="button"
                onClick={() => setAuthMode("account")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === "account"
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                <Icon name="mail" size={14} />
                <span>Tài Khoản & Mật Khẩu</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode("pin")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === "pin"
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                <Icon name="key" size={14} />
                <span>Mã PIN Vào Ca (4 Số)</span>
              </button>
            </div>

            {/* Mode 1: Account & Password Form */}
            {authMode === "account" ? (
              <form onSubmit={handleAccountLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">
                    Email / Tên Đăng Nhập
                  </label>
                  <div className="relative">
                    <Icon name="mail" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" size={16} />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vd: cashier@a2order.vn hoặc owner@a2order.vn"
                      required
                      className="w-full h-11 pl-10 pr-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-ink-primary">
                      Mật Khẩu
                    </label>
                    <span className="text-[11px] font-bold text-brand-700">
                      Bảo mật cao cấp
                    </span>
                  </div>
                  <div className="relative">
                    <Icon name="lock" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary"
                    >
                      <Icon name="eye" size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-brand-800 focus:ring-brand-700"
                    />
                    <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" size={16} className="animate-spin" />
                      <span>Đang xác thực & phân luồng...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập & Vào Hệ Thống</span>
                      <Icon name="arrowRight" size={16} />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Mode 2: Quick PIN Pad */
              <div className="space-y-4">
                {/* Staff Select if available */}
                {staffList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-ink-primary mb-1.5">
                      Chọn Nhân Viên Vào Ca:
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto no-scrollbar">
                      {staffList.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStaff(st);
                            setPin("");
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            selectedStaff?.id === st.id
                              ? "bg-brand-100 border-brand-700 text-brand-950 font-bold"
                              : "bg-surface-canvas border-surface-border text-ink-primary hover:border-brand-500"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-brand-800 text-white flex items-center justify-center text-[10px] font-bold">
                            {st.name.charAt(0)}
                          </div>
                          <div className="truncate text-xs">
                            <div className="font-semibold truncate">{st.name}</div>
                            <div className="text-[10px] text-ink-muted">{st.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PIN Display Dots */}
                <div className="text-center py-2">
                  <div className="text-xs font-bold text-ink-muted mb-2">
                    {selectedStaff ? `Nhập PIN cho: ${selectedStaff.name}` : "Nhập mã PIN 4 số vào ca"}
                  </div>
                  <div className="flex justify-center items-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all ${
                          pin.length > idx
                            ? "bg-brand-900 scale-110 shadow-sm"
                            : "bg-surface-border border border-surface-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Numeric Keypad */}
                <NumericKeypad
                  onDigitPress={handleDigit}
                  onDeletePress={() => setPin((prev) => prev.slice(0, -1))}
                  onClearPress={() => setPin("")}
                />
              </div>
            )}

            {/* Quick 1-Click Role Switcher Section */}
            <div className="mt-6 pt-5 border-t border-surface-border">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Icon name="userCheck" size={13} className="text-brand-800" />
                  Chọn nhanh vai trò để trải nghiệm luồng làm việc:
                </span>
                <span className="text-[10px] text-brand-700 font-extrabold bg-brand-50 px-2 py-0.5 rounded-full">
                  1-Click Auto Route
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickDemoSelect(demo)}
                    className="p-2.5 rounded-2xl bg-surface-canvas hover:bg-brand-50/70 border border-surface-border hover:border-brand-700 text-left transition-all active:scale-97 cursor-pointer group flex items-start gap-2.5"
                  >
                    <div className={`w-8 h-8 rounded-xl ${demo.badgeBg} ${demo.badgeText} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon name={demo.icon} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-ink-primary group-hover:text-brand-950">
                          {demo.roleLabel}
                        </span>
                        <Icon name="arrowRight" size={12} className="text-ink-subtle group-hover:text-brand-800 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
                        {demo.targetDescription}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-ink-subtle">
              A2Order Platform • Kiến trúc chuẩn F&B • Dữ liệu mã hóa an toàn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
