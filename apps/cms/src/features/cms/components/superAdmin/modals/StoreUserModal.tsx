import React, { useState, useEffect } from "react";
import { Portal, Icon } from "@/components/ui";
import { PlatformStoreUserRecord, TenantStoreRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface StoreUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<PlatformStoreUserRecord>, password?: string) => Promise<void>;
  editingUser: PlatformStoreUserRecord | null;
  stores: TenantStoreRecord[];
  defaultStoreId?: string;
}

export const STORE_ROLES = [
  { value: "STORE_OWNER", label: "Chủ Quán (Toàn quyền)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "STORE_MANAGER", label: "Quản Lý Điểm Bán", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "CASHIER", label: "Thu Ngân (POS Bán Hàng)", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "CHEF", label: "Đầu Bếp (Màn KDS Bếp)", color: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "WAITER", label: "Nhân Viên Phục Vụ", color: "text-slate-700 bg-slate-100 border-slate-200" },
];

export const StoreUserModal: React.FC<StoreUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  stores,
  defaultStoreId,
}) => {
  const [storeId, setStoreId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STORE_OWNER");
  const [pinCode, setPinCode] = useState("1111");
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setStoreId(editingUser.storeId || defaultStoreId || (stores[0]?.id || ""));
      setName(editingUser.name || "");
      setEmail(editingUser.email || "");
      setRole(editingUser.role || "STORE_MANAGER");
      setPinCode(editingUser.pinCode || "1111");
      setPassword("");
      setChangePassword(false);
      setIsActive(editingUser.isActive !== false);
    } else {
      setStoreId(defaultStoreId || (stores[0]?.id || ""));
      setName("");
      setEmail("");
      setRole("STORE_OWNER");
      setPinCode("1111");
      setPassword("");
      setChangePassword(true);
      setIsActive(true);
    }
  }, [editingUser, isOpen, stores, defaultStoreId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId) {
      toast.error("Vui lòng chọn Cửa hàng trực thuộc.");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập Họ và tên nhân sự.");
      return;
    }
    if (!pinCode.trim() || pinCode.length < 4) {
      toast.error("Mã PIN đăng nhập nhanh phải có ít nhất 4 số.");
      return;
    }
    if (!editingUser && !password.trim() && role === "STORE_OWNER") {
      toast.error("Tài khoản Chủ Quán cần mật khẩu đăng nhập trang Quản Trị.");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedStore = stores.find((s) => s.id === storeId);
      await onSave(
        {
          ...(editingUser ? { id: editingUser.id } : {}),
          storeId,
          storeName: selectedStore?.name || "",
          storePlan: selectedStore?.plan || "STARTER",
          name: name.trim(),
          email: email.trim(),
          role,
          pinCode: pinCode.trim(),
          isActive,
        },
        changePassword ? password.trim() : undefined
      );
      toast.success(editingUser ? "Cập nhật tài khoản thành công!" : "Tạo tài khoản mới thành công!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi lưu tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 flex items-center justify-center shadow-xs">
                <Icon name={editingUser ? "edit" : "users"} size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingUser ? "Chỉnh Sửa Tài Khoản Quán" : "Thêm Tài Khoản User Quán"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser ? "Cập nhật quyền hạn và thông tin đăng nhập" : "Cấp tài khoản mới cho chủ quán hoặc nhân sự"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-medium">
            {/* Chọn Cửa hàng */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Cửa Hàng Trực Thuộc <span className="text-rose-500">*</span>
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              >
                {stores.length === 0 ? (
                  <option value="">Chưa có quán nào</option>
                ) : (
                  stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.plan} - {s.owner})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Họ và Tên Nhân Sự <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn Chiến, Trần Mai Lan..."
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            {/* Email & Vai trò */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Đăng Nhập
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: owner@tiemtra.vn"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Vai Trò Trong Quán <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                >
                  {STORE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mã PIN 4 số đăng nhập POS & Tablet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Mã PIN Fast-Login (POS/Tablet) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPinCode(Math.floor(1000 + Math.random() * 9000).toString())}
                  className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Tạo mã ngẫu nhiên
                </button>
              </div>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="4 số (VD: 1111, 2345)"
                maxLength={6}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dùng cho thu ngân và nhân viên order/bếp đăng nhập ca làm việc tức thì trên tablet/máy POS.
              </p>
            </div>

            {/* Mật khẩu Web CMS */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Icon name="lock" size={13} className="text-slate-500" />
                  <span>Mật Khẩu Đăng Nhập CMS</span>
                </label>
                {editingUser && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-700">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Đặt lại mật khẩu</span>
                  </label>
                )}
              </div>

              {(!editingUser || changePassword) && (
                <div className="space-y-1.5">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                  <p className="text-[10px] text-slate-400">
                    Cần thiết nếu tài khoản là Chủ quán hoặc Quản lý cần đăng nhập CMS quản trị.
                  </p>
                </div>
              )}
            </div>

            {/* Trạng thái tài khoản */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-xs font-bold text-slate-800">
                  {isActive ? "Tài khoản đang Hoạt động" : "Tài khoản đang bị Tạm khóa"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl bg-brand-900 text-xs font-bold text-white shadow-sm hover:bg-brand-800 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="refresh" size={14} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Icon name="checkCircle" size={14} />
                    <span>{editingUser ? "Lưu Thay Đổi" : "Khởi Tạo Tài Khoản"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
