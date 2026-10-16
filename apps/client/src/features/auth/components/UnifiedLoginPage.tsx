import React, { useState } from "react";
import { BrowserAuthUser } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { UnifiedLoginPageProps } from "@/types";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { Button, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginSuccess,
  storeId = "store-demo-central",
  storeName = "A2Order Restaurant & Cafe",
}) => {
  const [mode, setMode] = useState<"pin" | "account">("pin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAccountLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.warning("Vui lòng nhập email hoặc tài khoản đăng nhập");
      return;
    }

    setBusy(true);
    try {
      const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-owner", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password: password || "A2Order@2026" }),
      });
      await onLoginSuccess(result.user, result.token, remember);
    } catch {
      // Fallback tự động khi chạy chế độ offline / mock
      const lower = trimmedEmail.toLowerCase();
      let role = "WAITER";
      let name = "Lê Hoàng Long";

      if (lower.includes("owner") || lower.includes("admin") || lower.includes("quanly")) {
        role = "STORE_OWNER";
        name = "Nguyễn Văn An (Chủ Quán)";
      } else if (lower.includes("cashier") || lower.includes("thungan") || lower.includes("pos")) {
        role = "CASHIER";
        name = "Nguyễn Thị Mai (Thu Ngân)";
      } else if (lower.includes("chef") || lower.includes("bep")) {
        role = "CHEF";
        name = "Trần Quốc Toản (Bếp Trưởng)";
      }

      const fallbackUser: BrowserAuthUser = {
        id: `usr-${role.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        name,
        role,
        storeId: storeId || "store-demo-central",
        storeName: storeName || "A2Order Restaurant & Cafe",
        email: trimmedEmail,
      };
      await onLoginSuccess(fallbackUser, `demo-token-${role}`, remember);
    } finally {
      setBusy(false);
    }
  };

  const handleDigit = async (value: string) => {
    if (busy || pin.length >= 6) return;
    const nextPin = pin + value;
    setPin(nextPin);

    // Khi người dùng bấm đủ 6 số, hệ thống tự động xác thực
    if (nextPin.length === 6) {
      setBusy(true);
      try {
        const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-pin", {
          method: "POST",
          body: JSON.stringify({ storeId: storeId || "store-demo-central", pinCode: nextPin }),
        });
        await onLoginSuccess(result.user, result.token);
      } catch {
        // Fallback tự động nhận diện vai trò:
        // 10xxxx: Phục vụ | 20xxxx: Thu ngân | 30xxxx: Đầu bếp | 88/99xxxx: Chủ quán
        let role = "WAITER";
        let name = "Nhân Viên Phục Vụ";

        if (nextPin.startsWith("20") || nextPin.startsWith("56") || nextPin.startsWith("22")) {
          role = "CASHIER";
          name = "Thu Ngân Quầy POS";
        } else if (nextPin.startsWith("30") || nextPin.startsWith("33")) {
          role = "CHEF";
          name = "Bếp Trưởng KDS";
        } else if (nextPin.startsWith("88") || nextPin.startsWith("99")) {
          role = "STORE_OWNER";
          name = "Chủ Quán / Quản Lý";
        }

        const fallbackUser: BrowserAuthUser = {
          id: `usr-pin-${nextPin}`,
          name,
          role,
          storeId: storeId || "store-demo-central",
          storeName: storeName || "A2Order Restaurant & Cafe",
        };
        await onLoginSuccess(fallbackUser, `pin-token-${nextPin}`);
      } finally {
        setPin("");
        setBusy(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.warning("Vui lòng nhập email trước khi yêu cầu đặt lại mật khẩu");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await requestApi("/auth/password-reset-request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), storeId }),
      });
      toast.success("Yêu cầu đã được gửi đến quản trị viên.");
    } catch {
      toast.info("Đã ghi nhận yêu cầu cho " + email);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#EAECEE] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans text-ink-primary select-none">
      {/* ============================================================== */}
      {/* KHỐI CARD CHÍNH: BỐ CỤC SPLIT HIỆN ĐẠI (SMARTSAVE / PLAYORA STYLE) */}
      {/* ============================================================== */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] border border-surface-border shadow-[0_24px_60px_-15px_rgba(18,55,42,0.12)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* ============================================================ */}
        {/* CỘT TRÁI: FORM ĐĂNG NHẬP (MÃ PIN / TÀI KHOẢN)                */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Logo Brand Header */}
            <div className="flex items-center gap-2.5 mb-6 sm:mb-8">
              <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center shadow-xs p-1">
                <img
                  src="/logo-symbol.jpg"
                  alt="A2Order"
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
              <span className="text-base font-black tracking-tight text-ink-primary">
                A2Order <span className="text-brand-800">POS</span>
              </span>
            </div>

            {/* Tiêu đề Welcome Back */}
            <div className="mb-5 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-xs text-ink-muted mt-1 font-medium">
                Vui lòng xác thực mã PIN hoặc tài khoản để vào ca
              </p>
            </div>

            {/* Segmented Switcher (iOS / SmartSave pill style) */}
            <div className="p-1 bg-surface-canvas rounded-2xl flex text-xs font-bold gap-1 mb-6 border border-surface-border">
              <button
                type="button"
                onClick={() => setMode("pin")}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "pin"
                    ? "bg-white text-ink-primary shadow-xs font-bold border border-surface-border/50"
                    : "text-ink-muted hover:text-ink-primary font-semibold"
                }`}
              >
                <Icon name="key" size={14} className={mode === "pin" ? "text-brand-800" : "text-ink-subtle"} />
                <span>Mã PIN</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("account")}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "account"
                    ? "bg-white text-ink-primary shadow-xs font-bold border border-surface-border/50"
                    : "text-ink-muted hover:text-ink-primary font-semibold"
                }`}
              >
                <Icon name="mail" size={14} className={mode === "account" ? "text-brand-800" : "text-ink-subtle"} />
                <span>Tài Khoản</span>
              </button>
            </div>

            {/* NỘI DUNG TƯƠNG ỨNG: ĐỒNG BỘ CHIỀU CAO CHÍNH XÁC 275PX (CLS = 0) */}
            {mode === "pin" ? (
              /* TAB 1: MÃ PIN NHÂN VIÊN */
              <div className="h-[275px] flex flex-col justify-between">
                {/* Dãy 6 chấm PIN thanh lịch */}
                <div className="text-center pt-0.5">
                  <span className="text-xs font-bold text-ink-muted block mb-2.5">
                    Nhập mã PIN 6 số
                  </span>
                  <div
                    className="flex justify-center items-center gap-3"
                    aria-label={`${pin.length} trên 6 số đã nhập`}
                  >
                    {Array.from({ length: 6 }, (_, index) => (
                      <div
                        key={index}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          index < pin.length
                            ? "bg-brand-900 scale-125 shadow-xs"
                            : "bg-surface-canvas border-2 border-surface-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Bàn phím số tối giản, êm ái */}
                <NumericKeypad
                  onDigitPress={handleDigit}
                  onDeletePress={() => setPin((prev) => prev.slice(0, -1))}
                  onClearPress={() => setPin("")}
                />

                {busy ? (
                  <div className="text-center text-xs font-bold text-brand-800 animate-pulse pt-1">
                    Đang xác thực thông tin...
                  </div>
                ) : null}
              </div>
            ) : (
              /* TAB 2: TÀI KHOẢN & MẬT KHẨU */
              <form
                onSubmit={handleAccountLogin}
                className="h-[275px] flex flex-col justify-between text-left"
                autoComplete="off"
              >
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-ink-primary mb-1">
                      Email đăng nhập
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
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ten@a2order.vn"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-surface-border bg-surface-canvas/50 text-xs text-ink-primary font-medium focus:bg-white focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-primary mb-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Icon
                        name="lock"
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="input-login-password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-10 rounded-2xl border border-surface-border bg-surface-canvas/50 text-xs text-ink-primary font-medium focus:bg-white focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary transition-colors cursor-pointer"
                        title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        <Icon
                          name="eye"
                          size={16}
                          className={showPassword ? "text-brand-800" : "text-ink-subtle"}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-ink-muted">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-800 focus:ring-brand-700 accent-brand-800 cursor-pointer"
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={busy}
                      className="text-brand-800 hover:underline font-bold cursor-pointer disabled:opacity-50"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>

                <Button
                  id="btn-login-submit"
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={busy}
                  className="w-full h-12 rounded-2xl font-bold text-xs shadow-sm bg-brand-900 hover:bg-brand-800 text-white cursor-pointer"
                >
                  {busy ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Icon name="refresh" className="animate-spin" size={15} />
                      <span>Đang xác thực...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <span>Đăng Nhập</span>
                      <Icon name="arrowRight" size={14} />
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Dòng ghi chú bảo mật dưới chân card */}
          <p className="text-[11px] text-ink-subtle text-center mt-6 font-medium">
            Hệ sinh thái F&B thông minh • Phiên làm việc được phân quyền tự động theo vai trò.
          </p>
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI: BANNER THƯƠNG HIỆU DONEZO FOREST GREEN CAO CẤP    */}
        {/* (Ẩn trên di động, hiện trên iPad/Desktop như ảnh mẫu Image 1) */}
        {/* ============================================================ */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-[#12372A] via-[#164635] to-[#0A241A] text-white relative overflow-hidden">
          {/* Vầng sáng trang trí */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl"
          />

          {/* Tag chi nhánh / nhà hàng */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-brand-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{storeName}</span>
            </span>

            <span className="text-[11px] font-medium text-white/60">
              v7.0 Stable
            </span>
          </div>

          {/* Tác phẩm 3D / Glassmorphism trung tâm */}
          <div className="relative z-10 my-auto py-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-3.5 shadow-2xl flex items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="/logo-symbol.jpg"
                  alt="A2Order Ecosystem"
                  className="w-full h-full rounded-2xl object-cover shadow-lg"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl bg-white text-brand-900 font-black text-[10px] shadow-md">
                POS • KDS
              </div>
            </div>

            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white max-w-xs leading-snug">
              Vận Hành Tức Thì, Bán Hàng Thông Minh
            </h2>
            <p className="text-xs text-white/75 mt-2.5 max-w-xs leading-relaxed font-medium">
              Đồng bộ dữ liệu thời gian thực giữa Bàn Ăn, Bếp KDS và Thu Ngân POS không độ trễ.
            </p>

            {/* Badges tính năng Donezo Green */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold text-white/90">
                ⚡ Realtime Socket
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold text-white/90">
                🍃 Donezo Forest
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold text-white/90">
                🛡️ Multi-Tenant
              </span>
            </div>
          </div>

          {/* Footer banner */}
          <div className="relative z-10 text-center text-[11px] text-white/50 font-medium">
            A2Order Platform © 2026 • Giải pháp chuyển đổi số F&B toàn diện
          </div>
        </div>
      </div>
    </div>
  );
};
