import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { Reservation } from "@/types/cms.types";

interface AssignTableModalProps {
  target: Reservation | null;
  onClose: () => void;
  onConfirm: () => void;
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  availableTables: string[];
}

export const AssignTableModal: React.FC<AssignTableModalProps> = ({
  target,
  onClose,
  onConfirm,
  selectedTable,
  setSelectedTable,
  availableTables,
}) => {
  if (!target) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated border border-surface-border p-5 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-black text-ink-primary">Xếp Bàn Cho Khách</h3>
              <span className="text-[11px] text-ink-muted font-bold">
                {target.guestName} ({target.guestCount} người)
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-canvas"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-ink-secondary">
              Chọn Bàn Trống Sẵn Sàng
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {availableTables.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTable(t)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    selectedTable === t
                      ? "bg-brand-50 border border-brand-800 text-brand-950 font-black shadow-2xs"
                      : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                  }`}
                >
                  <span>{t}</span>
                  {selectedTable === t && <Icon name="check" size={14} className="text-brand-900" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-brand-900 text-white text-xs font-bold px-4"
              onClick={onConfirm}
            >
              Xác Nhận Xếp Bàn
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
