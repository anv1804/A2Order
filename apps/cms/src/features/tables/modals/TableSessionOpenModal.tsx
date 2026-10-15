import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface TableSessionOpenModalProps {
  openTableModal: { table: any } | null;
  onClose: () => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  isOpeningTable: boolean;
  onOpenSession: (table: any, guestCount: number, navigateToOrder: boolean) => Promise<void> | void;
}

export const TableSessionOpenModal: React.FC<TableSessionOpenModalProps> = ({
  openTableModal,
  onClose,
  guestCount,
  setGuestCount,
  isOpeningTable,
  onOpenSession,
}) => {
  if (!openTableModal) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black">
                <Icon name="table" size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Mở Bàn Phục Vụ</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {openTableModal.table.name} ({openTableModal.table.code})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {num} khách
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[11px] text-slate-500 font-semibold">Tùy chỉnh số khách:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-8 px-2 text-center rounded-lg border border-slate-200 text-xs font-black focus:outline-none focus:border-emerald-600 bg-slate-50"
                />
                <span className="text-[11px] text-slate-500">người</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <Icon name="check" size={13} className="text-emerald-700" />
                <span>Sau khi mở bàn:</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Khách có thể quét mã QR tại bàn để xem menu và đặt món, hoặc nhân viên bấm "Mở bàn & Gọi món ngay" để sang trang chọn món.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isOpeningTable}
              onClick={() => onOpenSession(openTableModal.table, guestCount, true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Icon name="cart" size={14} />
              <span>Mở Bàn & Gọi Món Ngay</span>
            </button>
            <button
              type="button"
              disabled={isOpeningTable}
              onClick={() => onOpenSession(openTableModal.table, guestCount, false)}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95 disabled:opacity-50"
            >
              <span>Chỉ Mở Bàn (Khách Tự Quét QR)</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
