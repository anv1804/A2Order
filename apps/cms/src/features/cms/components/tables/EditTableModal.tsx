import React from "react";
import { Portal, Icon } from "@/components/ui";
import { CmsTableItem, TableZoneData } from "@/types/cms.types";

export interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingTable: CmsTableItem | null;
  setEditingTable: React.Dispatch<React.SetStateAction<CmsTableItem | null>>;
  zones: TableZoneData[];
  storeId: string;
  generateDefaultTableCode: (name: string, id?: string) => string;
  buildTableOrderQr: (storeId: string, tableCode: string, tableId?: string) => { orderUrl: string; qrCodeUrl: string };
  getOrderBaseUrl: () => string;
}

export const EditTableModal: React.FC<EditTableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTable,
  setEditingTable,
  zones,
  storeId,
  generateDefaultTableCode,
  buildTableOrderQr,
  getOrderBaseUrl,
}) => {
  if (!isOpen || !editingTable) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-surface-card w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-6 border border-surface-border space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <Icon name="edit" size={15} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink-primary">Chỉnh Sửa Bàn</h3>
                <p className="text-[10.5px] text-ink-muted">Đồng bộ trực tiếp vào Database</p>
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

          <form onSubmit={onSubmit} className="space-y-3.5">
            {/* 1. Tên Bàn */}
            <div>
              <label className="text-xs font-bold text-ink-primary mb-1.5 block">
                Tên Bàn <span className="text-status-danger-text">*</span>
              </label>
              <input
                type="text"
                required
                value={editingTable.name}
                onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                placeholder="VD: Bàn 01 (Cửa sổ), Bàn VIP 02..."
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
              />
            </div>

            {/* 2. Mã Bàn Định Danh Sinh QR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-primary">
                  Mã Bàn (Sinh QR Gọi Món) <span className="text-status-danger-text">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTable({
                      ...editingTable,
                      code: generateDefaultTableCode(editingTable.name, editingTable.id),
                    })
                  }
                  className="text-[11px] font-bold text-brand-700 hover:text-brand-800 transition"
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
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-mono font-bold text-ink-primary uppercase focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
              />
              <p className="text-[10.5px] text-ink-muted mt-1">
                Mã định danh riêng của bàn để sinh mã QR cho khách quét gọi món.
              </p>
            </div>

            {/* 3. Khu Vực */}
            <div>
              <label className="text-xs font-bold text-ink-primary mb-1.5 block">
                Khu Vực Phân Bổ
              </label>
              <select
                value={editingTable.zoneId}
                onChange={(e) => setEditingTable({ ...editingTable, zoneId: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
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
              <label className="text-xs font-bold text-ink-primary mb-1.5 block">
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
                        ? "bg-brand-900 text-white border-brand-900 shadow-card font-black"
                        : "bg-surface-subtle text-ink-primary border-surface-border hover:bg-surface-muted"
                    }`}
                  >
                    {cap} chỗ
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Live QR Preview */}
            <div className="p-3 bg-surface-subtle rounded-2xl border border-surface-border flex items-center gap-3">
              <div className="w-14 h-14 bg-white p-1 rounded-xl border border-surface-border shrink-0 flex items-center justify-center shadow-card">
                <img
                  src={buildTableOrderQr(storeId, editingTable.code || generateDefaultTableCode(editingTable.name, editingTable.id), editingTable.id).qrCodeUrl}
                  alt="QR Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black uppercase text-brand-800 bg-brand-100 px-1.5 py-0.5 rounded">
                    {editingTable.code || "TB-..."}
                  </span>
                  <span className="text-[10.5px] font-bold text-ink-primary">QR Gọi Món Riêng</span>
                </div>
                <p className="text-[10px] text-ink-muted truncate mt-1">
                  {getOrderBaseUrl()}/order?store={storeId}&table={editingTable.code || "..."}
                </p>
              </div>
            </div>

            {/* Nút Hành Động */}
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
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
