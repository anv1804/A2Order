import React from "react";
import { Portal, Icon } from "@/components/ui";

export interface AddZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newZoneName: string;
  setNewZoneName: (v: string) => void;
}

export const AddZoneModal: React.FC<AddZoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newZoneName,
  setNewZoneName,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-surface-card w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-6 border border-surface-border space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-base font-extrabold text-ink-primary">Thêm Khu Vực Mới</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-ink-muted mb-1.5 block">Tên Khu Vực *</label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ví dụ: Tầng 3 (Rooftop)..."
                required
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                className="rounded-xl border border-surface-border text-ink-muted hover:bg-surface-muted text-xs px-4 py-2 font-bold transition"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs px-5 py-2 shadow-card transition active:scale-95"
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
