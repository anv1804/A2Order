import React from "react";
import { Icon, Button, Portal } from "@/components/ui";
import { WaiterOrderItem } from "@/types";

interface VoidCookingModalProps {
  isOpen: boolean;
  item: WaiterOrderItem | null;
  tableName: string;
  reason: string;
  onChangeReason: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const VoidCookingModal: React.FC<VoidCookingModalProps> = ({
  isOpen,
  item,
  tableName,
  reason,
  onChangeReason,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-5 sm:p-6 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Icon name="alert" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-950">
                  Hủy Món Đang Chế Biến
                </h3>
                <p className="text-xs text-ink-muted">
                  {item.name} • {tableName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <Icon name="alert" size={15} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý:</strong> Món này đã gửi tới Bếp KDS. Sau khi xác nhận hủy, hệ thống sẽ{" "}
              <strong>thông báo khẩn tới Bếp để dừng chế biến</strong>, trừ{" "}
              {(item.price * item.quantity).toLocaleString("vi-VN")} đ khỏi bill và lưu vào sổ kiểm toán hủy món.
            </div>
          </div>

          {/* Chọn lý do hủy nhanh bằng Chip */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-secondary block">
              Lý do hủy món:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Khách đợi quá lâu (> 20 phút)",
                "Khách đổi sang món khác",
                "Bếp báo hết nguyên liệu",
                "Nhân viên order nhầm bàn",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChangeReason(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reason === r
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-rose-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-secondary block">
              Hoặc ghi rõ chi tiết:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => onChangeReason(e.target.value)}
              placeholder="Nhập lý do hủy..."
              className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-rose-600"
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
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs px-5 shadow-sm font-bold"
              onClick={onConfirm}
            >
              Xác Nhận Hủy & Báo Bếp Dừng
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
