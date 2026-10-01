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

  const fillDemoAccount = () => {
    setEmail("owner@a2order.vn");
    setPassword("123456");
    setErrorMessage("");
    setShowAdminRedirectHint(false);
  };

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
      // Fallback chế độ demo offline khi backend chưa chạy hoặc mạng ngắt kết nối
      if (email.trim().toLowerCase() === "owner@a2order.vn" && password) {
        const mockOwnerUser: AuthUser = {
          id: "staff-demo-owner",
          name: "Chủ Quán A2Order",
          email: "owner@a2order.vn",
          role: "STORE_OWNER",
          storeId: "store-demo-01",
          storeName: "Nhà Hàng A2Order Central",
        };
        onLoginSuccess(mockOwnerUser, "demo-mock-owner-token", rememberMe);
        return;
      }

      setErrorMessage("Không thể kết nối đến máy chủ A2Order. Vui lòng kiểm tra lại dịch vụ Backend hoặc dùng tài khoản mẫu.");
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
      <div className="w-full max-w-[980px] max-h-[94dvh] overflow-y-auto grid lg:grid-cols-[.9fr_1.1fr] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/70 rounded-[28px] shadow-[0_32px_100px_rgba(0,0,0,.48)] relative z-10 animate-scaleUp">
        {/* Left Hero Banner (Desktop) */}
        <aside className="hidden lg:flex relative min-h-[620px] flex-col justify-between overflow-hidden rounded-l-[27px] bg-[#12372a] p-9 text-white">
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-14 top-40 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/20 shadow-md"
            />
            <div>
              <span className="block text-lg font-black tracking-tight">A2Order</span>
              <span className="text-[10px] font-bold tracking-[.18em] text-emerald-200">F&B MERCHANT PORTAL</span>
            </div>
          </div>

          <div className="relative z-10 max-w-sm py-10">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              <Icon name="store" size={13} />
              Cổng Chủ Quán & Vận Hành F&B
            </span>
            <h2 className="text-4xl font-black leading-[1.14] tracking-tight">
              Vận hành chuẩn xác. Bán lẻ tinh gọn.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-emerald-50/75">
              Kiểm soát thực đơn, đơn bàn, vé bếp KDS và kiểm soát doanh thu tự động theo thời gian thực trên một giao diện thống nhất.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "POS trạm thu ngân & KDS bếp đồng bộ tức thì",
                "Thực đơn điện tử QR Order & Thanh toán VietQR",
                "Báo cáo doanh số ca làm, quản lý kho & nhân viên",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-200">
                    <Icon name="check" size={13} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[10px] font-medium text-white/45">
            © A2Order · Cổng Dịch Vụ Chủ Quán & Đối Tác F&B
          </p>
        </aside>

        {/* Right Form Panel */}
        <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20 mb-3.5">
                <img
                  src="/logo-symbol.jpg"
                  alt="A2Order Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Đăng Nhập Chủ Quán</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 max-w-[320px] leading-relaxed">
                Hệ thống quản lý thực đơn, sơ đồ bàn ăn và doanh thu nhà hàng
              </p>

              {/* Demo Helper Pill */}
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-[11px] font-semibold text-emerald-300 transition-colors cursor-pointer"
                  title="Nhấn để tự động điền tài khoản mẫu Chủ Quán"
                >
                  <Icon name="sparkles" size={12} className="text-emerald-400" />
                  <span>Tài khoản mẫu: owner@a2order.vn</span>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col gap-2 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <Icon name="alertCircle" className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300 font-medium leading-relaxed">
                    {errorMessage}
                  </div>
                </div>
                {showAdminRedirectHint && onNavigateToAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateToAdmin}
                    className="self-start text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 ml-6 transition-colors"
                  >
                    Chuyển sang Cổng Quản Trị Hệ Thống (/admin/login) →
                  </button>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Cửa Hàng
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="owner-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="owner@nhahang.vn"
                    className="w-full h-11 pl-10 pr-3.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="owner-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full h-11 pl-10 pr-10 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <Icon name="eye" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Custom Sleek Checkbox */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      rememberMe
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-xs shadow-emerald-500/30"
                        : "bg-slate-950/80 border-slate-700 text-transparent hover:border-slate-500"
                    }`}
                  >
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors select-none">
                    Ghi nhớ phiên đăng nhập
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 gap-2 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực cửa hàng...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Cửa Hàng</span>
                      <Icon name="arrowRight" className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer & Link to Admin Portal */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
