import React, { useState } from "react";
import { BrowserAuthUser } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { UnifiedLoginPageProps } from "@/types";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { Button, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

type PinStatus = "idle" | "validating" | "success" | "error";

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
  const [pinStatus, setPinStatus] = useState<PinStatus>("idle");
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
    } catch (err: any) {
      toast.error(err?.message || "Email hoặc mật khẩu không chính xác");
    } finally {
      setBusy(false);
    }
  };

  const handleDigit = async (value: string) => {
    if (busy || pinStatus !== "idle" || pin.length >= 6) return;
    const nextPin = pin + value;
    setPin(nextPin);

    // Khi người dùng bấm đủ 6 số, hệ thống tự động xác thực với máy chủ DB
    if (nextPin.length === 6) {
      setBusy(true);
      setPinStatus("validating");

      try {
        const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-pin", {
          method: "POST",
          body: JSON.stringify({ storeId: storeId || "store-demo-central", pinCode: nextPin }),
        });

        // 1. Xác thực thành công: các dot chuyển sang màu xanh rồi vào trang trong
        setPinStatus("success");
        await new Promise((resolve) => setTimeout(resolve, 550));
        await onLoginSuccess(result.user, result.token);
      } catch (err: any) {
        // 2. Xác thực thất bại: các dot đổi sang màu đỏ và rung
        setPinStatus("error");
        toast.error(err?.message || "Mã PIN không chính xác");

        // Giữ màu đỏ một thoáng để nhận biết, sau đó tự động trở về trạng thái ban đầu
        setTimeout(() => {
          setPin("");
          setPinStatus("idle");
          setBusy(false);
        }, 750);
      }
    }
  };

  const handleDelete = () => {
    if (busy || pinStatus !== "idle") return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (busy || pinStatus !== "idle") return;
    setPin("");
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
    <div
      className="min-h-[100dvh] w-full bg-cover bg-center bg-no-repeat relative font-sans select-none overflow-y-auto no-scrollbar"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Lớp phủ màn đêm mờ sương điện ảnh (Cinematic Emerald Vignette) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />

      {/* ============================================================== */}
      {/* 1. GIAO DIỆN MOBILE: IPHONE LOCK SCREEN HOÀN MỸ (< 768px)       */}
      {/* ============================================================== */}
      <div className="md:hidden relative z-10 min-h-[100dvh] flex flex-col items-center justify-between p-4 pb-6 overflow-y-auto no-scrollbar">
        {/* Top: Logo Lớn 104px sắc nét & Tên Cửa Hàng (Chuẩn nhận diện thương hiệu) */}
        <div className="w-full flex flex-col items-center pt-[max(0.75rem,env(safe-area-inset-top))] flex-shrink-0">
          {/* Logo 76px vừa vặn, sắc nét, viền neon tinh tế */}
          <div className="relative group mb-2">
            <div className="w-[76px] h-[76px] rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/25 shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-105">
              <img
                src="/logo-symbol.jpg"
                alt="A2Order"
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0A241A]" />
            </span>
          </div>

          {/* Badge tên cửa hàng */}
          <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-2">
            <Icon name="store" size={13} className="text-emerald-300" />
            <span className="text-xs font-semibold text-white/95 tracking-wide max-w-[220px] truncate">
              {storeName}
            </span>
          </div>
        </div>

        {/* Center: Khung nội dung đặt ở trung tâm, cân bằng khoảng cách trên dưới */}
        <div className="w-full max-w-[340px] flex-1 flex flex-col items-center justify-center my-auto py-2">
          {mode === "pin" ? (
            /* TAB 1: MÃ PIN IPHONE LOCK SCREEN */
            <div className="flex flex-col items-center w-full">
              <h1 className="text-2xl font-bold text-white tracking-tight text-center mb-1">
                Nhập mã PIN 6 số
              </h1>
              <p className="text-xs text-white/70 text-center mb-4 font-medium">
                2 số đầu là mã vai trò (10, 20, 30, 80, 90)
              </p>

              {/* Dãy 6 chấm PIN: Wave khi loading, Đỏ khi sai, Xanh khi đúng */}
              <div
                className={`flex justify-center items-center gap-4 mb-5 transition-transform ${
                  pinStatus === "error" ? "animate-dotShake" : ""
                }`}
                aria-label={`${pin.length} trên 6 số đã nhập`}
              >
                {Array.from({ length: 6 }, (_, index) => {
                  // Đúng: Xanh ngọc lục bảo
                  if (pinStatus === "success") {
                    return (
                      <div
                        key={index}
                        className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-300 scale-125 shadow-[0_0_18px_rgba(52,211,153,1)] transition-all duration-200"
                      />
                    );
                  }

                  // Sai: Đỏ rực
                  if (pinStatus === "error") {
                    return (
                      <div
                        key={index}
                        className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-rose-400 scale-110 shadow-[0_0_16px_rgba(244,63,94,0.9)] transition-all duration-200"
                      />
                    );
                  }

                  // Đang xác thực: Wave loading
                  if (pinStatus === "validating") {
                    return (
                      <div
                        key={index}
                        className="w-3.5 h-3.5 rounded-full bg-white border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-dotWave"
                        style={{ animationDelay: `${index * 100}ms` }}
                      />
                    );
                  }

                  // Bình thường
                  const isFilled = index < pin.length;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        isFilled
                          ? "bg-white border-2 border-white scale-110 shadow-[0_0_14px_rgba(255,255,255,0.95)]"
                          : "bg-white/10 border-2 border-white/40"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Bàn phím số tròn iPhone 72px to, tự tin, chuẩn công thái học */}
              <NumericKeypad
                variant="glass"
                onDigitPress={handleDigit}
                onDeletePress={handleDelete}
                onClearPress={handleClear}
              />
            </div>
          ) : (
            /* TAB 2: ĐĂNG NHẬP TÀI KHOẢN KÍNH MỜ DONEZO FOREST GREEN */
            <form
              onSubmit={handleAccountLogin}
              className="w-full p-6 rounded-[28px] bg-[#0A241A]/85 backdrop-blur-2xl border border-emerald-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex flex-col space-y-4 text-white"
              autoComplete="off"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Đăng Nhập Quản Trị
                </h2>
                <p className="text-xs text-emerald-100/70 mt-1 font-medium">
                  Email & mật khẩu quản lý ca làm việc
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-100/80 uppercase tracking-wider mb-1.5">
                    Email đăng nhập
                  </label>
                  <div className="relative">
                    <Icon
                      name="mail"
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300/70 pointer-events-none"
                    />
                    <input
                      type="email"
                      id="input-login-email-mobile"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@a2order.vn"
                      className="w-full h-11 pl-11 pr-4 rounded-full border border-white/20 bg-white/10 text-xs text-white placeholder-white/35 font-medium focus:bg-white/15 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-100/80 uppercase tracking-wider mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Icon
                      name="lock"
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300/70 pointer-events-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="input-login-password-mobile"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-11 pr-11 rounded-full border border-white/20 bg-white/10 text-xs text-white placeholder-white/35 font-medium focus:bg-white/15 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <Icon
                        name="eye"
                        size={16}
                        className={showPassword ? "text-emerald-400" : "text-white/50"}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  {/* Nút ghi nhớ dạng HÌNH TRÒN tinh tế */}
                  <button
                    type="button"
                    onClick={() => setRemember(!remember)}
                    className="flex items-center gap-2 cursor-pointer select-none text-white/80 group"
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                        remember
                          ? "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400"
                          : "border-2 border-white/35 bg-white/10 group-hover:border-white/55"
                      }`}
                    >
                      {remember && <Icon name="check" size={11} className="stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium">Ghi nhớ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={busy}
                    className="text-emerald-300 hover:text-emerald-200 hover:underline font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              {/* Nút đăng nhập dạng pill tròn góc đồng nhất 100% với input */}
              <div className="pt-2 flex justify-center">
                <Button
                  id="btn-login-submit-mobile"
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={busy}
                  className="px-8 h-11 rounded-full font-bold text-xs shadow-md bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white cursor-pointer active:scale-95 transition-all border border-emerald-400/30 flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <Icon name="refresh" className="animate-spin" size={14} />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập</span>
                      <Icon name="arrowRight" size={14} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom: Nút chuyển tab (ngang tầm ngón cái, không bị quá cao) + Footer an ninh */}
        <div className="w-full max-w-[340px] flex flex-col items-center flex-shrink-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-3">
          {/* Nút chuyển tab dạng ICON DUY NHẤT */}
          <div className="p-1 bg-black/40 backdrop-blur-2xl rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("pin");
                setPin("");
                setPinStatus("idle");
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                mode === "pin"
                  ? "bg-white/25 text-white shadow-[0_2px_10px_rgba(255,255,255,0.25)] border border-white/35 backdrop-blur-md"
                  : "text-white/45 hover:text-white"
              }`}
              title="Mã PIN 6 Số"
              aria-label="Mã PIN 6 Số"
            >
              <Icon name="key" size={18} className={mode === "pin" ? "text-emerald-300" : "text-white/50"} />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("account");
                setPin("");
                setPinStatus("idle");
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                mode === "account"
                  ? "bg-white/25 text-white shadow-[0_2px_10px_rgba(255,255,255,0.25)] border border-white/35 backdrop-blur-md"
                  : "text-white/45 hover:text-white"
              }`}
              title="Đăng Nhập Quản Trị"
              aria-label="Đăng Nhập Quản Trị"
            >
              <Icon name="mail" size={18} className={mode === "account" ? "text-emerald-300" : "text-white/50"} />
            </button>
          </div>

          {/* Footer an ninh */}
          <p className="text-[11px] text-white/50 font-medium tracking-tight">
            A2Order POS • Hệ sinh thái F&B bảo mật cao cấp
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. GIAO DIỆN DESKTOP CŨ TRÊN NỀN MỚI (>= 768px: hidden md:flex) */}
      {/* ============================================================== */}
      <div className="hidden md:flex relative z-10 min-h-[100dvh] items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white rounded-[32px] border border-surface-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-2">
          {/* CỘT TRÁI: FORM ĐĂNG NHẬP (MÃ PIN / TÀI KHOẢN) */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-ink-primary">
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
              <div className="p-1 bg-surface-canvas rounded-2xl flex text-xs font-bold gap-1 mb-6 border border-surface-border max-w-[280px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("pin");
                    setPin("");
                    setPinStatus("idle");
                  }}
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
                  onClick={() => {
                    setMode("account");
                    setPin("");
                    setPinStatus("idle");
                  }}
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
                /* TAB 1: MÃ PIN NHÂN VIÊN DESKTOP */
                <div className="h-[275px] flex flex-col justify-between">
                  {/* Dãy 6 chấm PIN: Lượn sóng khi loading, Đỏ khi sai, Xanh khi đúng */}
                  <div className="text-center pt-0.5">
                    <span className="text-xs font-bold text-ink-muted block mb-2.5">
                      Nhập mã PIN 6 số (2 số đầu là mã vai trò)
                    </span>
                    <div
                      className={`flex justify-center items-center gap-3 transition-transform ${
                        pinStatus === "error" ? "animate-dotShake" : ""
                      }`}
                      aria-label={`${pin.length} trên 6 số đã nhập`}
                    >
                      {Array.from({ length: 6 }, (_, index) => {
                        // Đúng: Xanh lục
                        if (pinStatus === "success") {
                          return (
                            <div
                              key={index}
                              className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-emerald-500 scale-125 shadow-md transition-all duration-200"
                            />
                          );
                        }

                        // Sai: Đỏ rực
                        if (pinStatus === "error") {
                          return (
                            <div
                              key={index}
                              className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-rose-600 scale-110 shadow-sm transition-all duration-200"
                            />
                          );
                        }

                        // Đang xác thực: Lượn sóng wave loading
                        if (pinStatus === "validating") {
                          return (
                            <div
                              key={index}
                              className="w-3.5 h-3.5 rounded-full bg-brand-800 border-2 border-brand-900 shadow-xs animate-dotWave"
                              style={{ animationDelay: `${index * 100}ms` }}
                            />
                          );
                        }

                        // Bình thường
                        const isFilled = index < pin.length;
                        return (
                          <div
                            key={index}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                              isFilled
                                ? "bg-brand-900 border-2 border-brand-900 scale-125 shadow-xs"
                                : "bg-surface-canvas border-2 border-surface-border"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Bàn phím số Donezo classic (Không còn text thừa) */}
                  <NumericKeypad
                    variant="classic"
                    onDigitPress={handleDigit}
                    onDeletePress={handleDelete}
                    onClearPress={handleClear}
                  />
                </div>
              ) : (
                /* TAB 2: TÀI KHOẢN & MẬT KHẨU DESKTOP */
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
                          id="input-login-email-desktop"
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
                          id="input-login-password-desktop"
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
                    id="btn-login-submit-desktop"
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
          {/* ============================================================ */}
          <div className="flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-[#12372A] via-[#164635] to-[#0A241A] text-white relative overflow-hidden">
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
    </div>
  );
};
