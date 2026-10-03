import React from "react";
import { Portal, Icon } from "@/components/ui";
import { CmsTableItem } from "@/types/cms.types";

export interface OpenTableModalProps {
  openTableModal: { table: CmsTableItem; zoneId: string } | null;
  onClose: () => void;
  isOpeningTable: boolean;
  guestCount: number;
  setGuestCount: (v: number) => void;
  onConfirm: (table: CmsTableItem, guestCount: number, navigateToOrder: boolean) => void;
}

export const OpenTableModal: React.FC<OpenTableModalProps> = ({
  openTableModal,
  onClose,
  isOpeningTable,
  guestCount,
  setGuestCount,
  onConfirm,
}) => {
  if (!openTableModal) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-surface-card w-full max-w-sm rounded-3xl shadow-elevated p-5 sm:p-6 border border-surface-border space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center font-black">
                <Icon name="table" size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">Mở Bàn Phục Vụ</h3>
                <p className="text-xs text-ink-muted font-medium">
                  {openTableModal.table.name} ({openTableModal.table.code})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-ink-primary block mb-1.5">
                Số Lượng Khách Tại Bàn
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      guestCount === num
                        ? "bg-brand-800 text-white shadow-card"
                        : "bg-surface-muted text-ink-primary hover:bg-surface-border"
                    }`}
                  >
                    {num} khách
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[11px] text-ink-muted font-semibold">Tùy chỉnh số khách:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-8 px-2 text-center rounded-lg border border-surface-border text-xs font-black focus:outline-none focus:border-brand-600 bg-surface-subtle"
                />
                <span className="text-[11px] text-ink-muted">người</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-brand-50/70 border border-brand-200 text-xs text-brand-900 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <Icon name="check" size={13} className="text-brand-700" />
                <span>Sau khi mở bàn:</span>
              </div>
              <p className="text-[11px] text-brand-800 leading-relaxed">
                Khách có thể quét mã QR tại bàn để xem menu và đặt món, hoặc nhân viên bấm "Mở bàn & Gọi món ngay" để sang trang chọn món.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-surface-border">
            <button
              type="button"
              disabled={isOpeningTable}
              onClick={() => onConfirm(openTableModal.table, guestCount, true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-brand-800 hover:bg-brand-900 shadow-card flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Icon name="cart" size={14} />
              <span>Mở Bàn & Gọi Món Ngay 🚀</span>
            </button>
            <button
              type="button"
              disabled={isOpeningTable}
              onClick={() => onConfirm(openTableModal.table, guestCount, false)}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-ink-primary bg-surface-muted hover:bg-surface-border transition active:scale-95 disabled:opacity-50"
            >
              <span>Chỉ Mở Bàn (Khách Tự Quét QR)</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
