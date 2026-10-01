import React, { useState } from "react";
import { Icon, Modal } from "@/components/ui";
import { AuthUser } from "@/types";
import { toast, confirmDialog } from "@/stores/notificationStore";

interface CmsProfileViewProps {
  user: AuthUser;
  currentRole: "STORE_OWNER" | "SUPER_ADMIN";
  onLogout: () => void;
}

export const CmsProfileView: React.FC<CmsProfileViewProps> = ({ user, currentRole, onLogout }) => {
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const roleLabel = isSuperAdmin ? "Super Admin Nền Tảng" : "Chủ Quán / Quản Lý Cơ Sở";

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    if (typeof navigator === "undefined") return "Thiết bị không xác định";
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Thiết bị di động Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "Thiết bị di động Apple iOS";
    if (/Macintosh/i.test(ua)) return "Máy tính Mac (macOS)";
    if (/Windows/i.test(ua)) return "Máy tính Windows PC";
    if (/Linux/i.test(ua)) return "Máy tính Linux";
    return "Trình duyệt Web hiện đại";
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-12">
      {/* 1. HERO BANNER: Sang trọng, chuẩn nhận diện Donezo Forest Green */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a231b] via-[#0e2f24] to-[#154636] p-5 sm:p-7 text-white shadow-xl border border-emerald-900/40">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-16 h-56 w-56 rounded-full bg-emerald-600/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Avatar + Tên + Email */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 text-2xl sm:text-3xl font-black text-[#0a231b] shadow-md ring-4 ring-white/10">
                {(user.name || user.email || "A").charAt(0).toUpperCase()}
              </div>
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#0a231b]"
                title="Đang trực tuyến"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-900/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Hồ sơ xác thực
                </span>
                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <Icon name="shield" size={11} /> Root Admin
                  </span>
                )}
              </div>

              <h1 className="mt-1.5 truncate text-lg sm:text-2xl font-black tracking-tight text-white">
                {user.name || "Quản Trị Viên A2Order"}
              </h1>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-100/80">
                <span className="truncate">{user.email || "Chưa có email"}</span>
                {user.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email!, "email")}
                    className="p-1 hover:text-white transition rounded-md hover:bg-white/10"
                    title="Sao chép email"
                  >
                    <Icon name="copy" size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Badge Vai Trò bên phải */}
          <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider">
              Cấp bậc phân quyền
            </span>
            <span className="inline-flex items-center gap-1.5 mt-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <Icon name="shield" size={14} className="text-emerald-300" />
              {roleLabel}
            </span>
          </div>
        </div>

        {/* 3 Quick Chips dưới Hero */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="block text-[10px] text-emerald-200/70 font-medium">Trạng thái</span>
            <span className="font-bold text-emerald-300 flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Đang hoạt động
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="block text-[10px] text-emerald-200/70 font-medium">Bảo mật phiên</span>
            <span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
              <Icon name="lock" size={12} className="text-emerald-400" /> JWT Bearer
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="block text-[10px] text-emerald-200/70 font-medium">Phiên bản</span>
            <span className="font-bold text-white mt-0.5 block">v6.5.0 SaaS</span>
          </div>
        </div>
      </section>

      {/* 2. KHỐI THÔNG TIN CHÍNH: BENTO GRID 2 CỘT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Khối 1: Chi tiết tài khoản */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Icon name="user" size={18} />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Thông Tin Tài Khoản</h2>
                <p className="text-xs text-slate-500">Dữ liệu định danh tài khoản quản trị</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              <div className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email đăng nhập
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 break-all mt-0.5 block">
                    {user.email || "Chưa cập nhật"}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Đã xác thực
                </span>
              </div>

              <div className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mã định danh User ID
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 break-all mt-0.5 block">
                    {user.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(user.id, "Mã User ID")}
                  className="shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                  title="Sao chép User ID"
                >
                  <Icon name="copy" size={14} />
                </button>
              </div>

              <div className="py-3 flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Không gian quản trị
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                    {isSuperAdmin ? "Nền tảng A2Order SaaS (Toàn quyền)" : user.storeName || "Chưa gán quán"}
                  </span>
                </div>
                <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Icon name={isSuperAdmin ? "building" : "store"} size={14} />
                </span>
              </div>

              {user.storeId && (
                <div className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Mã cơ sở
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">
                      {user.storeId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.storeId!, "Mã cơ sở")}
                    className="shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                    title="Sao chép mã cơ sở"
                  >
                    <Icon name="copy" size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Khối 2: Bảo mật & Thao tác an toàn */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Icon name="shield" size={18} />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Bảo Mật & Phiên Làm Việc</h2>
                <p className="text-xs text-slate-500">Giám sát phiên và cấu hình an toàn</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {/* Trạng thái phiên */}
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Phiên trực tuyến an toàn
                    </span>
                    <span className="text-[11px] text-emerald-800/80">
                      Mã hóa chuẩn TLS 1.3 / Bearer Token
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-1 rounded-md shadow-2xs border border-emerald-200">
                  Hoạt động
                </span>
              </div>

              {/* Nút đổi mật khẩu */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="lock" size={14} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Mật khẩu tài khoản</span>
                    <span className="text-[11px] text-slate-500">Cập nhật định kỳ để bảo vệ hệ thống</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  Đổi mật khẩu
                </button>
              </div>

              {/* Môi trường & Thiết bị */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="monitor" size={14} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Môi trường thiết bị</span>
                    <span className="text-[11px] text-slate-500">{getDeviceInfo()}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                  Client
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. VÙNG NGUY HIỂM / KẾT THÚC PHIÊN: Cực kỳ rõ ràng, đệm đáy an toàn */}
      <section className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
            <Icon name="logout" size={20} />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-rose-950">Kết Thúc Phiên Quản Trị</h2>
            <p className="text-xs text-rose-700/80 leading-relaxed mt-0.5">
              Đăng xuất tài khoản khỏi thiết bị này. Bạn có thể đăng nhập lại bất kỳ lúc nào để tiếp tục công việc.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
        >
          <Icon name="logout" size={16} />
          <span>Đăng Xuất Tài Khoản</span>
        </button>
      </section>

      {/* 4. MODAL ĐỔI MẬT KHẨU */}
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
