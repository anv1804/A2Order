import React, { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { AuthUser } from "@/types";
import { API_BASE_URL } from "@/services/api/apiClient";

interface AdminLoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string, rememberMe: boolean) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [portalType, setPortalType] = useState<"SUPER_ADMIN" | "STORE_OWNER">("SUPER_ADMIN");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSwitchPortal = (type: "SUPER_ADMIN" | "STORE_OWNER") => {
    setPortalType(type);
    setErrorMessage("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
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
        setErrorMessage(data.message || "Tài khoản hoặc mật khẩu không chính xác.");
        setIsSubmitting(false);
        return;
      }

      // Kiểm tra quyền theo đúng luồng portal đã chọn
      if (portalType === "SUPER_ADMIN" && data.user.role !== "SUPER_ADMIN") {
        setErrorMessage("Tài khoản này là Chủ Quán. Vui lòng chuyển sang tab 'Chủ Quán' để đăng nhập.");
        setIsSubmitting(false);
        return;
      }

      if (portalType === "STORE_OWNER" && data.user.role === "SUPER_ADMIN") {
        setErrorMessage("Tài khoản này là Super Admin. Vui lòng chuyển sang tab 'Admin Hệ Thống'.");
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(data.user, data.token, rememberMe);
    } catch (err: any) {
      setErrorMessage("Không thể kết nối đến máy chủ A2Order. Vui lòng kiểm tra lại dịch vụ Backend.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#080e12] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Dynamic Background Glow Orbs */}
      <div
        className={`absolute top-[-15%] left-[-10%] w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${
          portalType === "SUPER_ADMIN" ? "bg-emerald-600/15" : "bg-blue-600/15"
        }`}
      />
      <div
        className={`absolute bottom-[-15%] right-[-10%] w-[580px] h-[580px] rounded-full blur-[130px] pointer-events-none transition-colors duration-700 ${
          portalType === "SUPER_ADMIN" ? "bg-indigo-600/15" : "bg-amber-600/15"
        }`}
      />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Login Card */}
      <div className="w-full max-w-[980px] max-h-[94dvh] overflow-y-auto grid lg:grid-cols-[.9fr_1.1fr] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/70 rounded-[28px] shadow-[0_32px_100px_rgba(0,0,0,.48)] relative z-10 animate-scaleUp">
        <aside className="hidden lg:flex relative min-h-[620px] flex-col justify-between overflow-hidden rounded-l-[27px] bg-[#12372a] p-9 text-white">
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-14 top-40 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <img src="/logo-symbol.jpg" alt="A2Order" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/20" />
            <div><span className="block text-lg font-black tracking-tight">A2Order</span><span className="text-[10px] font-bold tracking-[.18em] text-emerald-200">OPERATIONS PLATFORM</span></div>
          </div>
          <div className="relative z-10 max-w-sm py-12">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100"><Icon name="shield" size={13} />Không gian bảo mật</span>
            <h2 className="text-4xl font-black leading-[1.12] tracking-tight">Vận hành tốt bắt đầu từ một nơi.</h2>
            <p className="mt-4 text-sm leading-relaxed text-emerald-50/75">Quản lý đối tác, giấy phép và hoạt động cửa hàng trên nền tảng được thiết kế cho ngành F&B.</p>
            <div className="mt-8 space-y-3">
              {["Theo dõi cửa hàng và thiết bị", "Quản lý hợp đồng, license và hóa đơn", "Dữ liệu tập trung, thao tác rõ ràng"].map((item) => <div key={item} className="flex items-center gap-3 text-xs font-semibold text-white/85"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-emerald-200"><Icon name="check" size={13} /></span>{item}</div>)}
            </div>
          </div>
          <p className="relative z-10 text-[10px] font-medium text-white/45">© A2Order · Nền tảng quản trị F&B</p>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20 mb-3.5">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order Logo"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            {portalType === "SUPER_ADMIN" ? "Quản Trị Hệ Thống" : "Quản Trị Nhà Hàng"}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">
            {portalType === "SUPER_ADMIN"
              ? "Trung tâm điều hành nền tảng SaaS & Khách hàng chuỗi"
              : "Hệ thống quản lý thực đơn, bàn ăn và doanh thu quán"}
          </p>

          {/* Portal Switcher Tabs: Tách riêng luồng Chủ Quán và Admin */}
          <div className="w-full mt-5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 flex text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchPortal("STORE_OWNER")}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                portalType === "STORE_OWNER"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon name="store" className="w-3.5 h-3.5" />
              <span>Chủ Quán</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchPortal("SUPER_ADMIN")}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                portalType === "SUPER_ADMIN"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon name="shield" className="w-3.5 h-3.5" />
              <span>Admin Hệ Thống</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 animate-fadeIn">
            <Icon name="alertCircle" className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 font-medium leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Quản Trị
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
                placeholder="admin@tenmien.vn"
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
                id="admin-password"
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

          {/* Custom Sleek Checkbox: Ghi nhớ đăng nhập (không dùng checkbox mặc định trình duyệt) */}
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
                Ghi nhớ đăng nhập
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
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <Icon name="arrowRight" className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-7 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Icon name="shield" className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xác thực an toàn</span>
          </div>
          <span>A2Order Platform</span>
        </div>
        </div>
      </div>
    </div>
  );
};
