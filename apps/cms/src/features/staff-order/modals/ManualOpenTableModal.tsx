import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface ManualOpenTableModalProps {
  openTableModal: { tableId: string; tableName: string } | null;
  guestCount: number;
  onGuestCountChange: (count: number) => void;
  isOpeningTable: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ManualOpenTableModal: React.FC<ManualOpenTableModalProps> = ({
  openTableModal,
  guestCount,
  onGuestCountChange,
  isOpeningTable,
  onConfirm,
  onClose,
}) => {
  if (!openTableModal) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <Icon name="key" size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">Mở Bàn Thủ Công</h3>
            <p className="text-xs text-slate-500 mt-1">{openTableModal.tableName}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Số lượng khách:</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onGuestCountChange(n)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    guestCount === n
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
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
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isOpeningTable}
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-xs font-black bg-emerald-800 hover:bg-emerald-900 text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isOpeningTable ? (
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
