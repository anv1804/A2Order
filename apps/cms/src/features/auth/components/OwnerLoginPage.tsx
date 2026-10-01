import React, { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { AuthUser } from "@/types";
import { API_BASE_URL } from "@/services/api/apiClient";

interface OwnerLoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string, rememberMe: boolean) => void;
  onNavigateToAdmin?: () => void;
}

export const OwnerLoginPage: React.FC<OwnerLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToAdmin,
}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showAdminRedirectHint, setShowAdminRedirectHint] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setShowAdminRedirectHint(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Tài khoản hoặc mật khẩu cửa hàng không chính xác.");
        setIsSubmitting(false);
        return;
      }

      // Kiểm soát vai trò: Cổng này chỉ dành cho Chủ Quán & nhân viên F&B
      if (data.user.role === "SUPER_ADMIN") {
        setErrorMessage("Tài khoản này là Quản trị viên SaaS (Super Admin). Vui lòng chuyển sang Cổng Quản Trị Hệ Thống.");
        setShowAdminRedirectHint(true);
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(data.user, data.token, rememberMe);
    } catch (err: any) {
      setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ Backend.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#080e12] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[520px] h-[520px] rounded-full blur-[130px] pointer-events-none bg-emerald-600/15" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none bg-teal-600/15" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Login Card */}
      <div className="w-full max-w-[960px] max-h-[96dvh] overflow-y-auto lg:overflow-visible no-scrollbar grid lg:grid-cols-[.9fr_1.1fr] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/70 rounded-[28px] shadow-[0_32px_100px_rgba(0,0,0,.48)] relative z-10 animate-scaleUp">
        {/* Left Hero Banner (Desktop) */}
        <aside className="hidden lg:flex relative min-h-[520px] flex-col justify-between overflow-hidden rounded-l-[27px] bg-[#12372a] p-7 lg:p-8 text-white">
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-14 top-40 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20 shadow-md"
            />
            <div>
              <span className="block text-base font-black tracking-tight">A2Order</span>
              <span className="text-[9.5px] font-bold tracking-[.18em] text-emerald-200">F&B MERCHANT PORTAL</span>
            </div>
          </div>

          <div className="relative z-10 max-w-sm py-6">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-emerald-100">
              <Icon name="store" size={12} />
              Cổng Chủ Quán & Vận Hành F&B
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[30px] font-black leading-[1.18] tracking-tight">
              Vận hành chuẩn xác. Bán lẻ tinh gọn.
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-emerald-50/75">
              Kiểm soát thực đơn, đơn bàn, vé bếp KDS và kiểm soát doanh thu tự động theo thời gian thực trên một giao diện thống nhất.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                "POS trạm thu ngân & KDS bếp đồng bộ tức thì",
                "Thực đơn điện tử QR Order & Thanh toán VietQR",
                "Báo cáo doanh số ca làm, quản lý kho & nhân viên",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs font-semibold text-white/90">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 text-emerald-200">
                    <Icon name="check" size={11} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[9.5px] font-medium text-white/45">
            © A2Order · Cổng Dịch Vụ Chủ Quán & Đối Tác F&B
          </p>
        </aside>

        {/* Right Form Panel */}
        <div className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="flex flex-col items-center text-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20 mb-2">
                <img
                  src="/logo-symbol.jpg"
                  alt="A2Order Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Đăng Nhập Chủ Quán</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[320px] leading-relaxed">
                Hệ thống quản lý thực đơn, sơ đồ bàn ăn và doanh thu nhà hàng
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col gap-1.5 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <Icon name="alertCircle" className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-[11.5px] text-rose-300 font-medium leading-snug">
                    {errorMessage}
                  </div>
                </div>
                {showAdminRedirectHint && onNavigateToAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    className="self-start text-[10.5px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 ml-5.5 transition-colors"
                  >
                    Chuyển sang Cổng Quản Trị Hệ Thống (/admin/login) →
                  </button>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Email Cửa Hàng
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="owner-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="owner@nhahang.vn"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="owner-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <Icon name="eye" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Custom Sleek Checkbox */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      rememberMe
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-xs shadow-emerald-500/30"
                        : "bg-slate-950/80 border-slate-700 text-transparent hover:border-slate-500"
                    }`}
                  >
                    <Icon name="check" className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors select-none">
                    Ghi nhớ phiên đăng nhập
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 gap-2 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xác thực cửa hàng...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Cửa Hàng</span>
                      <Icon name="arrowRight" className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer & Link to Admin Portal */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Cổng Dịch Vụ Chủ Quán F&B</span>
            </div>

            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="text-slate-400 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Quản trị viên SaaS?</span>
                <span className="text-emerald-400 underline underline-offset-2">Admin Portal →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
