import React, { useState } from "react";
import { UserCheck, ShieldCheck, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { StaffMember } from "@/types";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { Button } from "@/components/ui/Button";

interface UnifiedAuthModalProps {
  isOpen: boolean;
  staffList: StaffMember[];
  onPinSubmit: (staffId: string, pin: string) => void;
  onAdminLogin?: (email: string, pass: string) => void;
  onClose: () => void;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  staffList,
  onPinSubmit,
  onAdminLogin,
  onClose,
}) => {
  const [authMode, setAuthMode] = useState<"pin" | "admin">("admin");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState<string>("");
  const [email, setEmail] = useState<string>("admin@a2order.vn");
  const [password, setPassword] = useState<string>("••••••••");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4 && selectedStaff) {
        onPinSubmit(selectedStaff.id, nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onAdminLogin) {
        onAdminLogin(email, password);
      } else {
        onClose();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Top Header Card */}
        <div className="bg-brand-950 text-white p-6 pb-5 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-brand-800/40 blur-2xl" />
          <div className="absolute right-4 top-4">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-wide text-brand-200 border border-white/10">
              v1.0.0 Stable
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
            />
            <div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                A2Order <span className="text-brand-400 font-extrabold text-sm">Security</span>
              </h3>
              <p className="text-xs text-brand-200/80 mt-0.5">
                Hệ thống xác thực & Phân quyền thông minh
              </p>
            </div>
          </div>

          {/* Mode Switcher Pill */}
          <div className="mt-5 p-1 bg-white/10 backdrop-blur-sm rounded-full flex text-xs font-bold">
            <button
              onClick={() => {
                setAuthMode("admin");
                setSelectedStaff(null);
                setPin("");
              }}
              className={`flex-1 py-1.5 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                authMode === "admin"
                  ? "bg-white text-brand-950 shadow-sm"
                  : "text-brand-200 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chủ Quán / Quản Lý</span>
            </button>

            <button
              onClick={() => {
                setAuthMode("pin");
              }}
              className={`flex-1 py-1.5 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                authMode === "pin"
                  ? "bg-white text-brand-950 shadow-sm"
                  : "text-brand-200 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mã PIN Ca Làm</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {authMode === "admin" ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="text-left mb-4">
                <h4 className="text-base font-extrabold text-ink-primary">
                  Đăng nhập Quản Trị CMS
                </h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Truy cập toàn quyền báo cáo doanh thu, menu và vận hành
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1.5">
                  Email Quản Trị
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="chuquan@a2order.vn"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-ink-muted">
                    Mật khẩu
                  </label>
                  <a href="#forgot" className="text-[11px] font-bold text-brand-700 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-extrabold text-xs shadow-md gap-2"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? "Đang xác thực..." : "Đăng Nhập CMS"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[11px] text-ink-subtle">
                  Dữ liệu quán ăn được mã hóa AES-256 tiêu chuẩn F&B
                </span>
              </div>
            </form>
          ) : (
            /* PIN Mode for Staff */
            <div>
              {!selectedStaff ? (
                <div className="space-y-3">
                  <div className="text-left mb-3">
                    <h4 className="text-base font-extrabold text-ink-primary">
                      Chọn Tên Nhân Viên Vào Ca
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Đăng nhập nhanh 1 giây qua mã PIN độc lập
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto p-1">
                    {staffList.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setSelectedStaff(staff)}
                        className="p-3 rounded-2xl bg-surface-canvas border border-surface-border active:scale-95 transition-all text-left flex items-center gap-3 hover:border-brand-600 hover:bg-brand-50/50"
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-ink-primary truncate">{staff.name}</h5>
                          <span className="text-[10px] text-ink-muted">{staff.role}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaff(null);
                      setPin("");
                    }}
                    className="text-xs text-brand-700 font-bold mb-2 hover:underline"
                  >
                    ← Chọn nhân viên khác
                  </button>

                  <h4 className="text-base font-black text-ink-primary">{selectedStaff.name}</h4>
                  <p className="text-xs text-ink-muted mb-4">Nhập mã PIN 4 số của bạn</p>

                  <div className="flex gap-3 mb-6">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          index < pin.length
                            ? "bg-brand-700 border-brand-700 scale-125"
                            : "border-surface-border bg-surface-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <NumericKeypad
                    onDigitPress={handleDigit}
                    onDeletePress={handleDelete}
                    onClearPress={handleClear}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-surface-canvas border-t border-surface-border flex items-center justify-between px-6">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Sparkles className="w-3.5 h-3.5 text-brand-700" />
            <span>A2Order Fast-Login</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-ink-muted hover:text-ink-primary px-3 py-1.5 rounded-lg hover:bg-surface-muted transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
