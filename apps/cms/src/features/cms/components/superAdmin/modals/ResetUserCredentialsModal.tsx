import React, { useState, useEffect } from "react";
import { Portal, Icon } from "@/components/ui";
import { PlatformStoreUserRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface ResetUserCredentialsModalProps {
  user: PlatformStoreUserRecord | null;
  onClose: () => void;
  onReset: (userId: string, payload: { password?: string; pinCode?: string }) => Promise<void>;
}

export const ResetUserCredentialsModal: React.FC<ResetUserCredentialsModalProps> = ({
  user,
  onClose,
  onReset,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [resetType, setResetType] = useState<"BOTH" | "PASSWORD_ONLY" | "PIN_ONLY">("BOTH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setNewPassword("A2@" + Math.floor(100000 + Math.random() * 900000));
      setNewPin(Math.floor(1000 + Math.random() * 9000).toString());
      setResetType("BOTH");
      setCopied(false);
    }
  }, [user]);

  if (!user) return null;

  const handleGenerateRandom = () => {
    setNewPassword("A2@" + Math.floor(100000 + Math.random() * 900000));
    setNewPin(Math.floor(1000 + Math.random() * 9000).toString());
    toast.info("Đã tạo mật khẩu và mã PIN ngẫu nhiên mới.");
  };

  const handleCopySummary = () => {
    const summary = `[A2Order] Thông tin đăng nhập tài khoản:\n- Họ tên: ${user.name}\n- Quán: ${user.storeName}\n${
      resetType !== "PIN_ONLY" ? `- Mật khẩu CMS: ${newPassword}\n` : ""
    }${resetType !== "PASSWORD_ONLY" ? `- Mã PIN POS: ${newPin}\n` : ""}- Link đăng nhập: https://a2order.vn/login`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Đã sao chép thông tin tài khoản vào bộ nhớ tạm!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: { password?: string; pinCode?: string } = {};
    if (resetType === "BOTH" || resetType === "PASSWORD_ONLY") {
      if (!newPassword.trim()) {
        toast.error("Vui lòng nhập mật khẩu mới.");
        return;
      }
      payload.password = newPassword.trim();
    }
    if (resetType === "BOTH" || resetType === "PIN_ONLY") {
      if (!newPin.trim() || newPin.length < 4) {
        toast.error("Mã PIN phải có ít nhất 4 số.");
        return;
      }
      payload.pinCode = newPin.trim();
    }

    try {
      setIsSubmitting(true);
      await onReset(user.id, payload);
      toast.success(`Đã cập nhật mật khẩu & PIN cho tài khoản "${user.name}" thành công!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi đặt lại thông tin bảo mật.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-xs">
                <Icon name="key" size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Cấp Lại Mật Khẩu / PIN
                </h3>
                <p className="text-xs text-slate-500">
                  Đặt lại thông tin đăng nhập cho nhân viên
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
            {/* User Target Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-black flex items-center justify-center shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 truncate">{user.name}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user.email || "Chưa có email"} • {user.storeName}
                </div>
              </div>
            </div>

            {/* Kiểu đặt lại */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Nội Dung Muốn Cấp Lại
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setResetType("BOTH")}
                  className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                    resetType === "BOTH"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cả Hai (Pass + PIN)
                </button>
                <button
                  type="button"
                  onClick={() => setResetType("PASSWORD_ONLY")}
                  className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                    resetType === "PASSWORD_ONLY"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Chỉ Mật Khẩu
                </button>
                <button
                  type="button"
                  onClick={() => setResetType("PIN_ONLY")}
                  className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                    resetType === "PIN_ONLY"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Chỉ Mã PIN POS
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            {(resetType === "BOTH" || resetType === "PASSWORD_ONLY") && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Mật Khẩu CMS Mới
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            )}

            {/* Mã PIN mới */}
            {(resetType === "BOTH" || resetType === "PIN_ONLY") && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Mã PIN Fast-Login Mới (POS/Tablet)
                </label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="VD: 1234"
                  maxLength={6}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            )}

            {/* Action Helper */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Icon name="refresh" size={12} />
                <span>Tạo ngẫu nhiên lại</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Icon name={copied ? "check" : "copy"} size={12} />
                <span>{copied ? "Đã sao chép!" : "Sao chép thông tin"}</span>
              </button>
            </div>

            {/* Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
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
                className="h-10 px-5 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="refresh" size={14} className="animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Icon name="checkCircle" size={14} />
                    <span>Lưu Mật Khẩu & PIN</span>
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
