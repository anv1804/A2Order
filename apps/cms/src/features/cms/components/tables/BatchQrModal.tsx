import React from "react";
import { Portal, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

export interface BatchTableItem {
  id: string;
  name: string;
  zoneName: string;
  qrCodeUrl: string;
  code?: string;
}

export interface BatchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTables: BatchTableItem[];
  generateDefaultTableCode: (name: string, id?: string) => string;
}

export const BatchQrModal: React.FC<BatchQrModalProps> = ({
  isOpen,
  onClose,
  allTables,
  generateDefaultTableCode,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-sm select-none animate-fadeIn">
        <div className="w-full max-w-3xl max-h-[88vh] bg-surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-elevated border border-surface-border flex flex-col justify-between overflow-hidden animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-ink-primary">
                In Hàng Loạt Mã QR Bàn ({allTables.length} Bàn)
              </h3>
              <p className="text-xs text-ink-muted">
                Xem trước thẻ để bàn chuẩn kích thước dán mica / ép plastic
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 my-3 bg-surface-subtle rounded-2xl border border-surface-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allTables.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-surface-card rounded-2xl border border-surface-border text-center shadow-card flex flex-col items-center justify-between"
                >
                  <span className="font-black text-xs text-ink-primary">{t.name}</span>
                  <span className="text-[10px] text-ink-muted">{t.zoneName}</span>
                  <div className="w-28 h-28 my-2 p-1.5 bg-white border border-surface-border rounded-xl">
                    <img src={t.qrCodeUrl} alt={t.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[9.5px] font-mono font-black text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    Mã: {t.code || generateDefaultTableCode(t.name, t.id)} • Quét Gọi Món
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <button
              type="button"
              className="rounded-xl border border-surface-border text-ink-muted hover:bg-surface-muted text-xs px-4 py-2 font-bold transition"
              onClick={onClose}
            >
              Đóng
            </button>
            <button
              type="button"
              className="rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-black text-xs flex items-center gap-1.5 px-6 py-2 shadow-card transition active:scale-95"
              onClick={() => {
                toast.success("Đang kết nối máy in để in toàn bộ thẻ để bàn...");
                onClose();
              }}
            >
              <Icon name="print" size={14} />
              <span>In Tất Cả ({allTables.length} Thẻ)</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
