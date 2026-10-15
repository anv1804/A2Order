import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface ZoneAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newZoneName: string;
  setNewZoneName: (val: string) => void;
}

export const ZoneAddModal: React.FC<ZoneAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newZoneName,
  setNewZoneName,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">Thêm Khu Vực Mới</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tên Khu Vực *</label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ví dụ: Tầng 3 (Rooftop)..."
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs px-4 py-2 font-bold transition"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2 shadow-2xs transition active:scale-95"
              >
                Lưu Khu Vực
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
