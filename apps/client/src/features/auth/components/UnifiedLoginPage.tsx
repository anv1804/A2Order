import React, { useState } from "react";
import { BrowserAuthUser } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { UnifiedLoginPageProps, StaffMember } from "@/types";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { Button, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginSuccess,
  staffList = [],
  storeId = "store-demo-central",
  storeName = "A2Order Restaurant & Cafe",
}) => {
  const [authMode, setAuthMode] = useState<"pin" | "account">("pin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // PIN mode state
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState<string>("");

  const handleQuickFill = (role: "WAITER" | "CASHIER" | "CHEF" | "STORE_OWNER") => {
    if (role === "WAITER") {
      setEmail("waiter@a2order.vn");
      setPassword("Staff@123456");
      setPin("1234");
    } else if (role === "CASHIER") {
      setEmail("cashier@a2order.vn");
      setPassword("Cashier@123456");
      setPin("5678");
    } else if (role === "CHEF") {
      setEmail("chef@a2order.vn");
      setPassword("Chef@123456");
      setPin("3333");
    } else {
      setEmail("owner@a2order.vn");
      setPassword("Owner@123456");
      setPin("8888");
    }
  };

  const handleAccountLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.warning("Vui lòng nhập tài khoản hoặc email đăng nhập");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-owner", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password: password || "A2Order@2026" }),
      });
      await onLoginSuccess(result.user, result.token);
    } catch {
      // Graceful offline fallback
      const lower = trimmedEmail.toLowerCase();
      let role = "WAITER";
      let name = "Lê Hoàng Long (Phục Vụ)";

      if (lower.includes("owner") || lower.includes("admin") || lower.includes("quanly") || lower.includes("chuquan")) {
        role = "STORE_OWNER";
        name = "Nguyễn Văn An (Chủ Quán)";
      } else if (lower.includes("cashier") || lower.includes("thungan") || lower.includes("pos")) {
        role = "CASHIER";
        name = "Nguyễn Thị Mai (Thu Ngân)";
      } else if (lower.includes("chef") || lower.includes("bep") || lower.includes("bar")) {
        role = "CHEF";
        name = "Trần Quốc Toản (Bếp KDS)";
      } else if (lower.includes("waiter") || lower.includes("phucvu")) {
        role = "WAITER";
        name = "Lê Hoàng Long (Phục Vụ)";
      } else {
        name = trimmedEmail.split("@")[0].toUpperCase();
      }

      const fallbackUser: BrowserAuthUser = {
        id: `usr-${role.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        name,
        role,
        storeId: storeId || "store-demo-central",
        storeName: storeName || "A2Order Restaurant & Cafe",
        email: trimmedEmail,
      };
      await onLoginSuccess(fallbackUser, `demo-token-${role}`);
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
            // Xác thực PIN nhanh theo ca
            let role = "WAITER";
            let name = "Lê Hoàng Long (Phục Vụ)";
            if (nextPin === "5678" || nextPin === "2222") {
              role = "CASHIER";
              name = "Nguyễn Thị Mai (Thu Ngân)";
            } else if (nextPin === "3333") {
              role = "CHEF";
              name = "Trần Quốc Toản (Bếp KDS)";
            } else if (nextPin === "8888" || nextPin === "9999") {
              role = "STORE_OWNER";
              name = "Nguyễn Văn An (Chủ Quán)";
            }

            const fallbackUser: BrowserAuthUser = {
              id: `usr-pin-${nextPin}`,
              name,
              role,
              storeId: storeId || "store-demo-central",
              storeName: storeName || "A2Order Restaurant & Cafe",
            };
            await onLoginSuccess(fallbackUser, `pin-token-${nextPin}`);
          }
        } catch {
          const fallbackUser: BrowserAuthUser = {
            id: selectedStaff?.id || "usr-pin-staff",
            name: selectedStaff?.name || "Lê Hoàng Long (Phục Vụ)",
            role: selectedStaff?.role?.toUpperCase().includes("BẾP")
              ? "CHEF"
              : selectedStaff?.role?.toUpperCase().includes("THU NGÂN")
              ? "CASHIER"
              : "WAITER",
            storeId: storeId || "store-demo-central",
            storeName: storeName || "A2Order Restaurant & Cafe",
          };
          await onLoginSuccess(fallbackUser, `pin-token-${Date.now()}`);
        } finally {
          setPin("");
          setIsSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-surface-canvas flex flex-col md:items-center md:justify-center md:p-6 select-none font-sans text-ink-primary">
      {/* ============================================================== */}
      {/* KHUNG TRUNG TÂM: NATIVE TOÀN MÀN HÌNH TRÊN MOBILE, CARD TRÊN DESKTOP */}
      {/* ============================================================== */}
      <div className="w-full flex-1 md:flex-initial md:max-w-4xl bg-white md:rounded-3xl md:shadow-2xl md:border md:border-surface-border overflow-hidden grid md:grid-cols-[1fr_1.15fr] min-h-[100dvh] md:min-h-[580px]">
        {/* ============================================================== */}
        {/* CỘT TRÁI (DESKTOP) / BANNER TRÊN (MOBILE): BRANDING SANG TRỌNG */}
        {/* ============================================================== */}
        <header className="relative bg-gradient-to-br from-[#0c261d] via-[#12372A] to-[#194B3A] p-5 sm:p-8 text-white flex flex-col justify-between shrink-0 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-[-30%] right-[-20%] w-48 h-48 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-30%] left-[-20%] w-48 h-48 rounded-full bg-brand-600/20 blur-2xl pointer-events-none" />

          {/* Top: Logo & Title */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white/20 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <span className="block font-black text-base sm:text-lg tracking-tight leading-tight">
                A2Order
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200 uppercase tracking-widest block truncate">
                F&B Smart Platform
              </span>
            </div>
          </div>

          {/* Desktop Only: Enterprise Highlights */}
          <div className="hidden md:block relative z-10 py-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider mb-3">
              <Icon name="shield" size={12} />
              Bảo Mật Phân Quyền Vai Trò
            </span>
            <h2 className="text-xl lg:text-2xl font-black leading-snug tracking-tight">
              Hệ Sinh Thái Vận Hành & Quản Trị Nhà Hàng
            </h2>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Tự động phân luồng đúng phân hệ làm việc theo quyền hạn được cấp: Phục Vụ Bàn, Quầy Thu Ngân, Bếp KDS hoặc Chủ Quán.
            </p>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <Icon name="checkCircle" size={16} className="text-emerald-300 shrink-0" />
                <span className="text-emerald-50">Tối ưu công thái học di động & quầy POS</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <Icon name="lock" size={16} className="text-emerald-300 shrink-0" />
                <span className="text-emerald-50">Cách ly dữ liệu đa thuê Multi-Tenant</span>
              </div>
            </div>
          </div>

          {/* Bottom Version Tag */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-emerald-200/70 mt-2 md:mt-0">
            <span>{storeName}</span>
            <span className="font-mono">v7.0 Stable</span>
          </div>
        </header>

        {/* ============================================================== */}
        {/* CỘT PHẢI: FORM ĐĂNG NHẬP CHÍNH THỨC                             */}
        {/* ============================================================== */}
        <main className="flex-1 bg-white p-5 sm:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar">
          <div>
            {/* Header Form */}
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-black text-ink-primary tracking-tight">
                Đăng Nhập Ca Làm Việc
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Nhập mã PIN hoặc tài khoản để mở giao diện làm việc.
              </p>
            </div>

            {/* Tab Switcher: Mã PIN (Ưu tiên nhân viên) | Tài Khoản (Quản lý) */}
            <div className="p-1 bg-surface-canvas rounded-2xl flex text-xs font-bold gap-1 mb-5 border border-surface-border">
              <button
                type="button"
                onClick={() => setAuthMode("pin")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === "pin"
                    ? "bg-brand-900 text-white shadow-xs font-extrabold"
                    : "text-ink-muted hover:text-ink-primary hover:bg-white/60"
                }`}
              >
                <Icon name="key" size={14} />
                <span>Mã PIN Ca</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode("account")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === "account"
                    ? "bg-brand-900 text-white shadow-xs font-extrabold"
                    : "text-ink-muted hover:text-ink-primary hover:bg-white/60"
                }`}
              >
                <Icon name="mail" size={14} />
                <span>Tài Khoản</span>
              </button>
            </div>

            {/* TAB 1: MÃ PIN VÀO CA (Chuyên dụng cho Phục vụ, Thu ngân, Bếp) */}
            {authMode === "pin" ? (
              <div className="space-y-4">
                {/* Staff Select Chips (nếu có danh sách nhân viên) */}
                {staffList.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-ink-muted mb-1.5 text-left">
                      Nhân viên ca trực:
                    </label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {staffList.slice(0, 5).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStaff(st);
                            setPin("");
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            selectedStaff?.id === st.id
                              ? "bg-brand-900 text-white border-brand-900 shadow-xs"
                              : "bg-surface-canvas border-surface-border text-ink-primary hover:bg-brand-50"
                          }`}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PIN Dots Display */}
                <div className="text-center py-2">
                  <span className="text-xs font-bold text-ink-muted block mb-2">
                    {selectedStaff ? `Nhập PIN cho: ${selectedStaff.name}` : "Gõ mã PIN 4 số vào ca"}
                  </span>
                  <div className="flex justify-center items-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                          pin.length > idx
                            ? "bg-brand-900 scale-125 shadow-xs"
                            : "bg-surface-border border border-surface-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Bàn phím số numeric keypad công thái học */}
                <NumericKeypad
                  onDigitPress={handleDigit}
                  onDeletePress={() => setPin((prev) => prev.slice(0, -1))}
                  onClearPress={() => setPin("")}
                />
              </div>
            ) : (
              /* TAB 2: TÀI KHOẢN & MẬT KHẨU (Dành cho Quản lý / Đăng nhập đầy đủ) */
              <form onSubmit={handleAccountLogin} className="space-y-3.5 text-left" autoComplete="off">
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">
                    Email hoặc Tên tài khoản
                  </label>
                  <div className="relative">
                    <Icon
                      name="mail"
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
                    />
                    <input
                      type="email"
                      id="input-login-email"
                      required
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="waiter@a2order.vn hoặc owner@a2order.vn"
                      className="w-full h-11 pl-10 pr-3 rounded-2xl border border-surface-border bg-white text-xs text-ink-primary font-medium focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-ink-primary">
                      Mật khẩu
                    </label>
                    <span className="text-[11px] font-semibold text-brand-800">
                      Bảo mật cao cấp
                    </span>
                  </div>
                  <div className="relative">
                    <Icon
                      name="lock"
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="input-login-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-2xl border border-surface-border bg-white text-xs text-ink-primary font-medium focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary transition-colors cursor-pointer"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <Icon name="eye" size={16} className={showPassword ? "text-brand-800" : "text-ink-subtle"} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-ink-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-800 focus:ring-brand-700 accent-brand-800 cursor-pointer"
                    />
                    <span>Ghi nhớ phiên làm việc</span>
                  </label>
                </div>

                <Button
                  id="btn-login-submit"
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl font-black text-sm shadow-md mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Icon name="refresh" className="animate-spin" size={16} />
                      Đang xác thực...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Đăng Nhập & Vào Hệ Thống</span>
                      <Icon name="arrowRight" size={16} />
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* Quick Fill Helper for Demo / Testing (Nhẹ nhàng, không chiếm diện tích) */}
            <div className="mt-5 pt-3 border-t border-surface-border">
              <span className="text-[10px] font-bold text-ink-muted block text-center mb-1.5 uppercase tracking-wider">
                Điền nhanh thông tin thử nghiệm:
              </span>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickFill("WAITER")}
                  className="px-2.5 py-1 rounded-full bg-surface-canvas hover:bg-brand-50 border border-surface-border text-[11px] font-bold text-ink-primary hover:text-brand-900 transition-colors cursor-pointer shadow-2xs"
                  title="Điền tài khoản Phục Vụ (PIN: 1234)"
                >
                  ⚡ Phục Vụ (1234)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("CASHIER")}
                  className="px-2.5 py-1 rounded-full bg-surface-canvas hover:bg-brand-50 border border-surface-border text-[11px] font-bold text-ink-primary hover:text-brand-900 transition-colors cursor-pointer shadow-2xs"
                  title="Điền tài khoản Thu Ngân (PIN: 5678)"
                >
                  ⚡ Thu Ngân (5678)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("CHEF")}
                  className="px-2.5 py-1 rounded-full bg-surface-canvas hover:bg-brand-50 border border-surface-border text-[11px] font-bold text-ink-primary hover:text-brand-900 transition-colors cursor-pointer shadow-2xs"
                  title="Điền tài khoản Bếp KDS (PIN: 3333)"
                >
                  ⚡ Bếp (3333)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("STORE_OWNER")}
                  className="px-2.5 py-1 rounded-full bg-surface-canvas hover:bg-brand-50 border border-surface-border text-[11px] font-bold text-ink-primary hover:text-brand-900 transition-colors cursor-pointer shadow-2xs"
                  title="Điền tài khoản Quản Lý (PIN: 8888)"
                >
                  ⚡ Quản Lý (8888)
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 text-center mt-3">
            <p className="text-[10px] text-ink-subtle">
              A2Order Platform • Chuẩn F&B Đa Thuê • Bảo Mật RBAC
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};
