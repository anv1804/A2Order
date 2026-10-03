import React from "react";
import { Icon, Portal } from "@/components/ui";

interface OpenTableModalProps {
  modalData: { tableId: string; tableName: string } | null;
  guestCount: number;
  onSelectGuestCount: (count: number) => void;
  isOpening: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const OpenTableModal: React.FC<OpenTableModalProps> = ({
  modalData,
  guestCount,
  onSelectGuestCount,
  isOpening,
  onClose,
  onConfirm,
}) => {
  if (!modalData) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-5 space-y-4 border border-surface-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-900 border border-brand-200 flex items-center justify-center mx-auto mb-3">
              <Icon name="key" size={24} />
            </div>
            <h3 className="text-base font-black text-ink-primary">Mở Bàn Thủ Công</h3>
            <p className="text-xs text-ink-muted mt-1">{modalData.tableName}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-secondary block mb-2">Số lượng khách:</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSelectGuestCount(n)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    guestCount === n
                      ? "bg-brand-900 text-white border-brand-900 font-black"
                      : "bg-surface-canvas text-ink-primary border-surface-border hover:bg-slate-100"
                  }`}
                >
                  {n} người
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-ink-muted bg-surface-canvas hover:bg-slate-200 border border-surface-border transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isOpening}
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-xs font-black bg-brand-900 hover:bg-brand-800 text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isOpening ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Icon name="check" className="w-4 h-4" />
                  <span>Mở Bàn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
