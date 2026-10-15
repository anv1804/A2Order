import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface EditingTableItem {
  id: string;
  name: string;
  code: string;
  zoneId: string;
  capacity?: number;
  [key: string]: any;
}

export interface TableEditModalProps<T extends { id: string; name: string; code: string; zoneId: string; capacity?: number } = any> {
  isOpen: boolean;
  editingTable: T | null;
  setEditingTable: React.Dispatch<React.SetStateAction<T | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  zones: Array<{ id: string; name: string }>;
  generateDefaultTableCode: (name: string, id?: string) => string;
  buildTableOrderQr: (storeId: string, code: string, id: string) => { qrCodeUrl: string };
  getOrderBaseUrl: () => string;
  storeId: string;
}

export function TableEditModal<T extends { id: string; name: string; code: string; zoneId: string; capacity?: number }>({
  isOpen,
  editingTable,
  setEditingTable,
  onClose,
  onSubmit,
  zones,
  generateDefaultTableCode,
  buildTableOrderQr,
  getOrderBaseUrl,
  storeId,
}: TableEditModalProps<T>) {
  if (!isOpen || !editingTable) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Icon name="edit" size={15} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Chỉnh Sửa Bàn</h3>
                <p className="text-[10.5px] text-slate-400">Đồng bộ trực tiếp vào Database</p>
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

          <form onSubmit={onSubmit} className="space-y-3.5">
            {/* 1. Tên Bàn */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Tên Bàn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingTable.name}
                onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                placeholder="VD: Bàn 01 (Cửa sổ), Bàn VIP 02..."
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            {/* 2. Mã Bàn Định Danh Sinh QR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Mã Bàn (Sinh QR Gọi Món) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTable({
                      ...editingTable,
                      code: generateDefaultTableCode(editingTable.name, editingTable.id),
                    })
                  }
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition"
                >
                  Tự động tạo
                </button>
              </div>
              <input
                type="text"
                required
                value={editingTable.code}
                onChange={(e) =>
                  setEditingTable({
                    ...editingTable,
                    code: e.target.value.toUpperCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="VD: TB-01, BAN-02..."
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
              />
              <p className="text-[10.5px] text-slate-400 mt-1">
                Mã định danh riêng của bàn để sinh mã QR cho khách quét gọi món.
              </p>
            </div>

            {/* 3. Khu Vực */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Khu Vực Phân Bổ
              </label>
              <select
                value={editingTable.zoneId}
                onChange={(e) => setEditingTable({ ...editingTable, zoneId: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Sức Chứa */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Sức Chứa (Số Người)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 4, 6, 8].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setEditingTable({ ...editingTable, capacity: cap })}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                      editingTable.capacity === cap
                        ? "bg-[#102d25] text-white border-[#102d25] shadow-2xs font-black"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cap} chỗ
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Live QR Preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center shadow-2xs">
                <img
                  src={buildTableOrderQr(storeId, editingTable.code || generateDefaultTableCode(editingTable.name, editingTable.id), editingTable.id).qrCodeUrl}
                  alt="QR Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black uppercase text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    {editingTable.code || "TB-..."}
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-700">QR Gọi Món Riêng</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-1">
                  {getOrderBaseUrl()}/order?store={storeId}&table={editingTable.code || "..."}
                </p>
              </div>
            </div>

            {/* Nút Hành Động */}
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
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
