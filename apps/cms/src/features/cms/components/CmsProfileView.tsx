import React, { useState } from "react";
import { Icon, Modal } from "@/components/ui";
import { AuthUser } from "@/types";
import { CmsAppRole } from "@/types/cms.types";
import { toast, confirmDialog } from "@/stores/notificationStore";

interface CmsProfileViewProps {
  user: AuthUser;
  currentRole: CmsAppRole;
  onLogout: () => void;
}

export const CmsProfileView: React.FC<CmsProfileViewProps> = ({ user, currentRole, onLogout }) => {
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const getRoleTitle = (role: CmsAppRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin Nền Tảng";
      case "STORE_OWNER":
        return "Chủ Quán / Quản Lý Cơ Sở";
      case "ACCOUNTANT":
        return "Kế Toán Trưởng";
      case "CASHIER":
        return "Thu Ngân";
      case "CHEF":
        return "Bếp Trưởng / Pha Chế";
      case "WAITER":
        return "Phục Vụ Bàn & POS";
      default:
        return role;
    }
  };
  const roleLabel = getRoleTitle(currentRole);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Trạng thái che / hiện thông tin nhạy cảm (bảo vệ quyền riêng tư, chống hớ hênh)
  const [showUserId, setShowUserId] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const maskEmail = (email?: string | null) => {
    if (!email) return "Chưa cập nhật";
    const atIndex = email.indexOf("@");
    if (atIndex <= 0) return email;
    const name = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    if (name.length <= 3) return `${name[0]}•••${domain}`;
    return `${name.slice(0, 3)}••••••${domain}`;
  };

  const maskUserId = (id?: string | null) => {
    if (!id) return "Chưa cập nhật";
    if (id.length <= 10) return `${id.slice(0, 3)}••••`;
    return `${id.slice(0, 6)}••••••••${id.slice(-4)}`;
  };

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}!`);
    }
  };

  const handleLogoutClick = async () => {
    const ok = await confirmDialog({
      title: "Đăng Xuất Khỏi Hệ Thống?",
      message: "Bạn có chắc muốn kết thúc phiên làm việc hiện tại trên thiết bị này?",
      confirmText: "Đăng Xuất",
      cancelText: "Ở lại",
      variant: "danger",
    });
    if (ok) {
      onLogout();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    toast.success("Cập nhật mật khẩu mới thành công!");
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const getDeviceInfo = () => {
    if (typeof navigator === "undefined") return "Thiết bị hiện đại";
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Thiết bị di động Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "Thiết bị di động Apple iOS";
    if (/Macintosh/i.test(ua)) return "Máy tính Mac (macOS)";
    if (/Windows/i.test(ua)) return "Máy tính Windows PC";
    if (/Linux/i.test(ua)) return "Máy tính Linux";
    return "Trình duyệt Web";
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5">
      {/* 1. HERO BANNER: Tinh tế, bảo mật cao, không bẻ dòng */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a231b] via-[#0e2f24] to-[#154636] p-4 sm:p-6 text-white shadow-xl border border-emerald-900/40">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-16 h-56 w-56 rounded-full bg-emerald-600/10 blur-3xl" />

        <div className="relative flex items-center gap-3.5 sm:gap-5 min-w-0">
          {/* Avatar với Online Dot */}
          <div className="relative shrink-0">
            <div className="flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 text-xl sm:text-2xl font-black text-[#0a231b] shadow-md ring-4 ring-white/10">
              {(user.name || user.email || "A").charAt(0).toUpperCase()}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0a231b]"
              title="Đang trực tuyến"
            />
          </div>

          {/* Tên + Vai trò + Email */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-base sm:text-xl font-black tracking-tight text-white">
                {user.name || "Quản Trị Viên A2Order"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shrink-0">
                <Icon name="shield" size={11} />
                {isSuperAdmin ? "Super Admin" : "Chủ Quán"}
              </span>
            </div>

            {/* Email dòng gọn, có nút ẩn/hiện và sao chép */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-100/80">
              <Icon name="mail" size={12} className="text-emerald-300/80 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-md font-medium">
                {showEmail ? (user.email || "Chưa có email") : maskEmail(user.email)}
              </span>
              {user.email && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmail((prev) => !prev)}
                    className="p-1 hover:text-white transition rounded-md hover:bg-white/10 cursor-pointer"
                    title={showEmail ? "Ẩn email" : "Hiện đầy đủ email"}
                  >
                    <Icon name={showEmail ? "eyeOff" : "eye"} size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email!, "email")}
                    className="p-1 hover:text-white transition rounded-md hover:bg-white/10 cursor-pointer"
                    title="Sao chép email"
                  >
                    <Icon name="copy" size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thanh trạng thái dưới cùng: 1 dòng thanh lịch, không bẻ chữ */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-100/90 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-semibold text-emerald-200 text-[11px] sm:text-xs">Phiên kết nối an toàn</span>
          </div>
          <span className="text-[11px] font-medium text-emerald-300/70 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 shrink-0">
            A2Order SaaS v6.5
          </span>
        </div>
      </section>

      {/* 2. KHỐI THÔNG TIN CHÍNH: BENTO GRID 2 CỘT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Khối 1: Thông tin định danh */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Icon name="user" size={16} />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Thông Tin Định Danh</h2>
                <p className="text-[11px] text-slate-500">Tài khoản và quyền hạn hệ thống</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Họ tên */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Họ và tên</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {user.name || "Quản trị viên"}
                </span>
              </div>

              {/* Email đăng nhập */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Email đăng nhập</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {showEmail ? (user.email || "—") : maskEmail(user.email)}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Đã xác minh
                  </span>
                </div>
              </div>

              {/* User ID - MẶC ĐỊNH CHE BẢO MẬT (CHỐNG HỚ HÊNH) */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Mã User ID</span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate">
                    {showUserId ? user.id : maskUserId(user.id)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowUserId((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition shrink-0 cursor-pointer"
                    title={showUserId ? "Ẩn User ID" : "Hiện đầy đủ User ID"}
                  >
                    <Icon name={showUserId ? "eyeOff" : "eye"} size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.id, "Mã User ID")}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition shrink-0 cursor-pointer"
                    title="Sao chép User ID"
                  >
                    <Icon name="copy" size={13} />
                  </button>
                </div>
              </div>

              {/* Cấp phân quyền */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Cấp phân quyền</span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {roleLabel}
                </span>
              </div>

              {/* Phạm vi hoạt động */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Phạm vi</span>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {isSuperAdmin ? "Hệ thống A2Order SaaS" : (user.storeName || "Cơ sở vận hành")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Khối 2: Bảo mật & Thiết bị */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Icon name="shield" size={16} />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Bảo Mật & Phiên Làm Việc</h2>
                <p className="text-[11px] text-slate-500">Mật khẩu và thiết bị đăng nhập</p>
              </div>
            </div>

            <div className="space-y-3 mt-3.5">
              {/* Mật khẩu */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="lock" size={14} />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">Mật khẩu quản trị</span>
                    <span className="text-[11px] font-mono tracking-widest text-slate-400 block">••••••••••••</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  Đổi mật khẩu
                </button>
              </div>

              {/* Thiết bị */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="monitor" size={14} />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">Thiết bị hiện tại</span>
                    <span className="text-[11px] text-slate-500 block truncate">{getDeviceInfo()}</span>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-md whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trực tuyến
                </span>
              </div>

              {/* Trạng thái xác thực */}
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="checkCircle" size={14} />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-emerald-950 block truncate">Chứng thực phiên</span>
                    <span className="text-[11px] text-emerald-800/80 block truncate">Phiên làm việc đã mã hóa</span>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-200 shadow-2xs whitespace-nowrap">
                  An toàn
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. VÙNG KẾT THÚC PHIÊN: Gọn gàng, rõ ràng, không bẻ dòng */}
      <section className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
            <Icon name="logout" size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-rose-950 truncate">Kết Thúc Phiên Làm Việc</h2>
            <p className="text-xs text-rose-700/80 mt-0.5 truncate">
              Đăng xuất tài khoản an toàn khỏi thiết bị này
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="shrink-0 w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
        >
          <Icon name="logout" size={15} />
          <span>Đăng Xuất</span>
        </button>
      </section>

      {/* 4. Khoảng đệm vật lý an toàn chống che khuất bởi Mobile Bottom Dock trên Safari/iOS */}
      <div className="h-32 sm:h-20 lg:hidden w-full shrink-0 select-none pointer-events-none" aria-hidden="true" />

      {/* 5. MODAL ĐỔI MẬT KHẨU */}
      {isPasswordModalOpen && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title="Đổi Mật Khẩu Quản Trị"
          maxWidth="sm"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu hiện tại <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition active:scale-95"
              >
                Cập Nhật Mật Khẩu
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CmsProfileView;
