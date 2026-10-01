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

  const fillDemoAccount = () => {
    setEmail("admin@a2order.vn");
    setPassword("123456");
    setErrorMessage("");
    setShowOwnerRedirectHint(false);
  };

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
      // Fallback chế độ demo offline khi backend chưa chạy hoặc mạng ngắt kết nối
      if (email.trim().toLowerCase() === "admin@a2order.vn" && password) {
        const mockAdminUser: AuthUser = {
          id: "staff-super-admin-01",
          name: "Quản Trị Viên Hệ Thống",
          email: "admin@a2order.vn",
          role: "SUPER_ADMIN",
          storeId: "store-a2platform-system",
          storeName: "A2Order Platform HQ",
        };
        onLoginSuccess(mockAdminUser, "demo-mock-admin-token", rememberMe);
        return;
      }

      setErrorMessage("Không thể kết nối đến máy chủ A2Order. Vui lòng kiểm tra lại dịch vụ Backend hoặc dùng tài khoản mẫu.");
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
      <div className="w-full max-w-[980px] max-h-[94dvh] overflow-y-auto grid lg:grid-cols-[.9fr_1.1fr] bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/20 rounded-[28px] shadow-[0_32px_100px_rgba(0,0,0,.55)] relative z-10 animate-scaleUp">
        {/* Left Hero Banner (Desktop) */}
        <aside className="hidden lg:flex relative min-h-[620px] flex-col justify-between overflow-hidden rounded-l-[27px] bg-[#0c1929] p-9 text-white">
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-indigo-400/10" />
          <div className="absolute -right-14 top-40 h-52 w-52 rounded-full border border-cyan-400/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-indigo-400/30 shadow-md"
            />
            <div>
              <span className="block text-lg font-black tracking-tight text-white">A2Order</span>
              <span className="text-[10px] font-bold tracking-[.18em] text-indigo-300">PLATFORM CORE HQ</span>
            </div>
          </div>

          <div className="relative z-10 max-w-sm py-10">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              <Icon name="shield" size={13} className="text-indigo-400" />
              Super Admin Gateway
            </span>
            <h2 className="text-4xl font-black leading-[1.14] tracking-tight text-white">
              Vận hành tập trung. Kiểm soát hạ tầng.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300/80">
              Trung tâm chỉ huy cấp cao dành cho Quản trị viên hệ thống A2Order: Điều phối tenant, license đối tác, telemetry và kịch bản toàn hệ thống.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Giám sát thời gian thực & Sức khỏe dịch vụ (Telemetry)",
                "Cấp phát License chuỗi, kịch bản ngành & Feature Flags",
                "Quản lý hóa đơn phần mềm SaaS & Phân tích MRR",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Icon name="check" size={13} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[10px] font-medium text-slate-400/60">
            © A2Order Platform · Internal Super Admin Gateway
          </p>
        </aside>

        {/* Right Form Panel */}
        <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/25 mb-3.5">
                <img
                  src="/logo-symbol.jpg"
                  alt="A2Order Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1.5">
                <Icon name="shield" size={11} />
                <span>Super Admin Access</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white">
                Quản Trị Hệ Thống SaaS
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-[320px] leading-relaxed">
                Trung tâm điều hành nền tảng SaaS & khách hàng chuỗi F&B
              </p>

              {/* Demo Helper Pill */}
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-[11px] font-semibold text-indigo-300 transition-colors cursor-pointer"
                  title="Nhấn để tự động điền tài khoản mẫu Super Admin"
                >
                  <Icon name="sparkles" size={12} className="text-indigo-400" />
                  <span>Tài khoản mẫu: admin@a2order.vn</span>
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
                {showOwnerRedirectHint && onNavigateToOwner && (
                  <button
                    type="button"
                    onClick={onNavigateToOwner}
                    className="self-start text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 ml-6 transition-colors"
                  >
                    Chuyển sang Cổng Chủ Quán F&B (/login) →
                  </button>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Quản Trị Hệ Thống
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="admin@a2order.vn"
                    className="w-full h-11 pl-10 pr-3.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật Khẩu Quản Trị
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full h-11 pl-10 pr-10 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
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
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-xs shadow-indigo-600/30"
                        : "bg-slate-950/80 border-slate-700 text-transparent hover:border-slate-500"
                    }`}
                  >
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors select-none">
                    Ghi nhớ phiên đăng nhập an toàn
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 gap-2 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực hạ tầng...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Quản Trị</span>
                      <Icon name="shield" className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer & Link to Store Owner Portal */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
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
