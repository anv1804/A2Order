import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface TableAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newTableName: string;
  setNewTableName: (val: string) => void;
  newTableCode: string;
  setNewTableCode: (val: string) => void;
  newTableCapacity: number;
  setNewTableCapacity: (val: number) => void;
  isCodeManual: boolean;
  setIsCodeManual: (val: boolean) => void;
  generateDefaultTableCode: (name: string) => string;
}

export const TableAddModal: React.FC<TableAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newTableName,
  setNewTableName,
  newTableCode,
  setNewTableCode,
  newTableCapacity,
  setNewTableCapacity,
  isCodeManual,
  setIsCodeManual,
  generateDefaultTableCode,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">Thêm Bàn Ăn Mới</h3>
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
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tên Bàn *</label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewTableName(val);
                  if (!isCodeManual) {
                    setNewTableCode(generateDefaultTableCode(val));
                  }
                }}
                placeholder="Ví dụ: Bàn 05, VIP 03, Sân Thượng 2..."
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600">Mã Bàn (Sinh QR Gọi Món) *</label>
                <div className="flex items-center gap-1.5">
                  {isCodeManual && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCodeManual(false);
                        setNewTableCode(generateDefaultTableCode(newTableName));
                      }}
                      className="text-[10.5px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                    >
                      Tự động lại
                    </button>
                  )}
                  <span className="text-[10.5px] text-slate-400 font-medium">Tự sinh theo tên</span>
                </div>
              </div>
              <input
                type="text"
                value={newTableCode}
                onChange={(e) => {
                  setIsCodeManual(true);
                  setNewTableCode(e.target.value.toUpperCase().replace(/\s+/g, "-"));
                }}
                placeholder="Ví dụ: TB-05, VIP-03, ST-02..."
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition"
              />
              <p className="text-[10.5px] text-slate-400 mt-1">
                Mã bàn sinh mã QR và link truy cập gọi món cho khách.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Sức Chứa (Số Người)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(Number(e.target.value))}
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
                Tạo Bàn & Sinh QR
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
