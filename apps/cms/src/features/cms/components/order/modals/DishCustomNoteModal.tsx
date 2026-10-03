import React from "react";
import { Icon, Button, Portal } from "@/components/ui";
import { DishItem } from "@/types";

interface DishCustomNoteModalProps {
  modifyingDish: DishItem | null;
  dishModifiers: string[];
  dishCustomNote: string;
  onToggleModifier: (modifier: string) => void;
  onChangeCustomNote: (note: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const DishCustomNoteModal: React.FC<DishCustomNoteModalProps> = ({
  modifyingDish,
  dishModifiers,
  dishCustomNote,
  onToggleModifier,
  onChangeCustomNote,
  onClose,
  onConfirm,
}) => {
  if (!modifyingDish) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated p-5 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
            <div>
              <h3 className="text-sm font-black text-ink-primary">{modifyingDish.name}</h3>
              <span className="text-xs font-bold text-brand-900">
                {modifyingDish.price.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chọn nhanh modifier */}
          {modifyingDish.modifiers && modifyingDish.modifiers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink-secondary block">
                Khẩu vị khách yêu cầu:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {modifyingDish.modifiers.map((m) => {
                  const isSelected = dishModifiers.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onToggleModifier(m)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-brand-900 text-white shadow-xs"
                          : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ghi chú tự do */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-secondary block">
              Ghi chú riêng cho đầu bếp:
            </label>
            <input
              type="text"
              value={dishCustomNote}
              onChange={(e) => onChangeCustomNote(e.target.value)}
              placeholder="VD: Cay vừa, làm nóng, bỏ đá riêng..."
              className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
              onClick={onConfirm}
            >
              Xác Nhận Thêm
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
