import React from "react";
import { Portal, Icon } from "@/components/ui";
import { TableZoneData } from "@/types/cms.types";

export interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  capacity: number;
  setCapacity: (v: number) => void;
  zoneId: string;
  setZoneId: (v: string) => void;
  zones: TableZoneData[];
  isCodeManual: boolean;
  setIsCodeManual: (v: boolean) => void;
  generateDefaultTableCode: (name: string) => string;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  name,
  setName,
  code,
  setCode,
  capacity,
  setCapacity,
  zoneId,
  setZoneId,
  zones,
  setIsCodeManual,
  generateDefaultTableCode,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-surface-card w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-6 border border-surface-border space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-base font-extrabold text-ink-primary">Thêm Bàn Ăn Mới</h3>
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
              <label className="text-xs font-bold text-ink-muted mb-1.5 block">Khu Vực Phân Bổ *</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1.5 block">Tên Bàn Ăn *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  setCode(generateDefaultTableCode(val));
                }}
                placeholder="Ví dụ: Bàn 05, Bàn Tròn VIP..."
                required
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-muted">Mã Bàn (Sinh QR Gọi Món) *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCodeManual(false);
                    setCode(generateDefaultTableCode(name));
                  }}
                  className="text-[11px] font-bold text-brand-700 hover:text-brand-800 transition"
                >
                  Tự động sinh
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setIsCodeManual(true);
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, "-"));
                }}
                placeholder="Ví dụ: TB-05, VIP-03, ST-02..."
                required
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-mono font-bold text-ink-primary uppercase focus:outline-none focus:border-brand-600 bg-surface-subtle focus:bg-white transition"
              />
              <p className="text-[10.5px] text-ink-muted mt-1">
                Mã bàn sinh mã QR và link truy cập gọi món cho khách.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1.5 block">Sức Chứa (Số Người)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
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
                Tạo Bàn & Sinh QR
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
