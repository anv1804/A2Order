import React from "react";
import { Icon, Portal } from "@/components/ui";
import { StaffRole } from "@/types/cms.types";

export interface StaffFormData {
  name: string;
  role: StaffRole;
  phone: string;
  shift: "MORNING" | "EVENING" | "FULL_TIME";
  pin: string;
  email: string;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: StaffFormData;
  setForm: React.Dispatch<React.SetStateAction<StaffFormData>>;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-200/80 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Icon name="users" size={16} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Thêm Nhân Sự Mới</h3>
                <p className="text-xs text-slate-500 font-medium">Cấp mã PIN đăng nhập POS và phân ca</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ Và Tên Nhân Viên *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vai Trò (Role)
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as StaffRole })
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                >
                  <option value="WAITER">Phục Vụ Bàn</option>
                  <option value="CASHIER">Thu Ngân</option>
                  <option value="CHEF">Bếp / Bar</option>
                  <option value="STORE_MANAGER">Quản Lý Ca</option>
                  <option value="ACCOUNTANT">Kế Toán</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ca Làm Việc
                </label>
                <select
                  value={form.shift}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      shift: e.target.value as "MORNING" | "EVENING" | "FULL_TIME",
                    })
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                >
                  <option value="MORNING">Ca Sáng (06h - 14h)</option>
                  <option value="EVENING">Ca Tối (14h - 22h30)</option>
                  <option value="FULL_TIME">Toàn Thời Gian</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số Điện Thoại *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09xx xxx xxx"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã PIN 4 Số Vào Ca
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-black tracking-widest text-center text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email (Tùy chọn)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nhanvien@a2order.vn"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black shadow-sm active:scale-95 transition"
              >
                Lưu Nhân Viên
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
