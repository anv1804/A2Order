import React, { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { AuthUser } from "@/types";
import { API_BASE_URL } from "@/services/api/apiClient";

interface AdminLoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string, rememberMe: boolean) => void;
  onNavigateToOwner?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToOwner,
}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showOwnerRedirectHint, setShowOwnerRedirectHint] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setShowOwnerRedirectHint(false);
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
        setErrorMessage(data.message || "Tài khoản hoặc mật khẩu quản trị không chính xác.");
        setIsSubmitting(false);
        return;
      }

      // Kiểm soát vai trò: Cổng này CHỈ dành cho SUPER_ADMIN
      if (data.user.role !== "SUPER_ADMIN") {
        setErrorMessage("Tài khoản này là Chủ Quán F&B. Vui lòng đăng nhập tại Cổng Quản Trị Cửa Hàng.");
        setShowOwnerRedirectHint(true);
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
    <div className="min-h-screen w-screen bg-[#06090e] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[540px] h-[540px] rounded-full blur-[130px] pointer-events-none bg-indigo-600/15" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[580px] h-[580px] rounded-full blur-[140px] pointer-events-none bg-emerald-600/15" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Login Card */}
      <div className="w-full max-w-[960px] max-h-[96dvh] overflow-y-auto lg:overflow-visible no-scrollbar grid lg:grid-cols-[.9fr_1.1fr] bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/20 rounded-[28px] shadow-[0_32px_100px_rgba(0,0,0,.55)] relative z-10 animate-scaleUp">
        {/* Left Hero Banner (Desktop) */}
        <aside className="hidden lg:flex relative min-h-[520px] flex-col justify-between overflow-hidden rounded-l-[27px] bg-[#0c1929] p-7 lg:p-8 text-white">
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-indigo-400/10" />
          <div className="absolute -right-14 top-40 h-52 w-52 rounded-full border border-cyan-400/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-indigo-400/30 shadow-md"
            />
            <div>
              <span className="block text-base font-black tracking-tight text-white">A2Order</span>
              <span className="text-[9.5px] font-bold tracking-[.18em] text-indigo-300">PLATFORM CORE HQ</span>
            </div>
          </div>

          <div className="relative z-10 max-w-sm py-6">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-indigo-200">
              <Icon name="shield" size={12} className="text-indigo-400" />
              Super Admin Gateway
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[30px] font-black leading-[1.18] tracking-tight text-white">
              Vận hành tập trung. Kiểm soát hạ tầng.
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-300/80">
              Trung tâm chỉ huy cấp cao dành cho Quản trị viên hệ thống A2Order: Điều phối tenant, license đối tác, telemetry và kịch bản toàn hệ thống.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                "Giám sát thời gian thực & Sức khỏe dịch vụ (Telemetry)",
                "Cấp phát License chuỗi, kịch bản ngành & Feature Flags",
                "Quản lý hóa đơn phần mềm SaaS & Phân tích MRR",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs font-semibold text-white/90">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Icon name="check" size={11} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[9.5px] font-medium text-slate-400/60">
            © A2Order Platform · Internal Super Admin Gateway
          </p>
        </aside>

        {/* Right Form Panel */}
        <div className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="flex flex-col items-center text-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/25 mb-2">
                <img
                  src="/logo-symbol.jpg"
                  alt="A2Order Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9.5px] font-black uppercase tracking-widest text-indigo-300 mb-1">
                <Icon name="shield" size={10} />
                <span>Super Admin Access</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Quản Trị Hệ Thống SaaS
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[320px] leading-relaxed">
                Trung tâm điều hành nền tảng SaaS & khách hàng chuỗi F&B
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
                {showOwnerRedirectHint && onNavigateToOwner && (
                  <button
                    type="button"
                    onClick={onNavigateToOwner}
                    className="self-start text-[10.5px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 ml-5.5 transition-colors"
                  >
                    Chuyển sang Cổng Chủ Quán F&B (/login) →
                  </button>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Email Quản Trị Hệ Thống
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="admin@a2order.vn"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mật Khẩu Quản Trị
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
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
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-xs shadow-indigo-600/30"
                        : "bg-slate-950/80 border-slate-700 text-transparent hover:border-slate-500"
                    }`}
                  >
                    <Icon name="check" className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors select-none">
                    Ghi nhớ phiên đăng nhập an toàn
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 gap-2 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xác thực hạ tầng...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Quản Trị</span>
                      <Icon name="shield" className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer & Link to Store Owner Portal */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Xác thực an toàn cấp hạ tầng</span>
            </div>

            {onNavigateToOwner && (
              <button
                type="button"
                onClick={onNavigateToOwner}
                className="text-slate-400 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>← Quay lại</span>
                <span className="text-emerald-400 underline underline-offset-2">Cổng Chủ Quán F&B</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
