import React from "react";
import { Icon, Button, Portal } from "@/components/ui";
import { WaiterOrderItem } from "@/types";

interface ServedActionModalProps {
  isOpen: boolean;
  item: WaiterOrderItem | null;
  tableName: string;
  mode: "CHOICE" | "REMAKE" | "RETURN";
  reason: string;
  onSelectMode: (mode: "CHOICE" | "REMAKE" | "RETURN") => void;
  onChangeReason: (reason: string) => void;
  onClose: () => void;
  onConfirmRemake: () => void;
  onConfirmReturn: () => void;
}

export const ServedActionModal: React.FC<ServedActionModalProps> = ({
  isOpen,
  item,
  tableName,
  mode,
  reason,
  onSelectMode,
  onChangeReason,
  onClose,
  onConfirmRemake,
  onConfirmReturn,
}) => {
  if (!isOpen || !item) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-5 sm:p-6 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-base font-black text-ink-primary">
                Xử Lý Món Đã Lên Bàn
              </h3>
              <p className="text-xs text-ink-muted">
                {item.quantity}x <span className="font-bold text-ink-primary">{item.name}</span> • {tableName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          {mode === "CHOICE" && (
            <div className="space-y-3">
              <p className="text-xs text-ink-muted leading-relaxed">
                Món ăn đã được phục vụ lên bàn cho khách. Vui lòng chọn đúng nghiệp vụ xử lý:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lựa chọn 1: Bếp làm lại */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectMode("REMAKE");
                    onChangeReason("Món bị nguội lạnh");
                  }}
                  className="p-3.5 rounded-2xl border-2 border-brand-200 hover:border-brand-600 bg-brand-50/40 text-left transition-all group flex flex-col justify-between space-y-2 hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-950 font-black text-xs">
                      <span className="p-1 rounded-lg bg-brand-800 text-white group-hover:scale-110 transition-transform">
                        <Icon name="refresh" size={13} />
                      </span>
                      <span>1. Đổi Món / Làm Lại</span>
                    </div>
                    <p className="text-[11px] text-brand-900/80 leading-snug">
                      Khách phàn nàn món nguội, có dị vật, sai khẩu vị. Bếp làm lại đĩa mới, <strong>KHÔNG tính tiền thêm</strong>.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-brand-900 group-hover:underline flex items-center gap-1">
                    <span>Gửi vé làm lại</span>
                    <Icon name="arrowRight" size={10} />
                  </span>
                </button>

                {/* Lựa chọn 2: Trả món hoàn tiền */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectMode("RETURN");
                    onChangeReason("Lên món quá trễ (khách đã ăn no)");
                  }}
                  className="p-3.5 rounded-2xl border-2 border-rose-200 hover:border-rose-600 bg-rose-50/40 text-left transition-all group flex flex-col justify-between space-y-2 hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-950 font-black text-xs">
                      <span className="p-1 rounded-lg bg-rose-600 text-white group-hover:scale-110 transition-transform">
                        <Icon name="trash" size={13} />
                      </span>
                      <span>2. Trả Món & Trừ Bill</span>
                    </div>
                    <p className="text-[11px] text-rose-900/80 leading-snug">
                      Khách từ chối nhận món hoặc trả nguyên đĩa. <strong>Trừ tiền khỏi bill</strong> và ghi nhận kiểm toán hủy.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-rose-700 group-hover:underline flex items-center gap-1">
                    <span>Trừ tiền bill</span>
                    <Icon name="arrowRight" size={10} />
                  </span>
                </button>
              </div>
            </div>
          )}

          {mode === "REMAKE" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-brand-950">Quy Trình: Đổi Món / Bếp Làm Lại</span>
                <button
                  type="button"
                  onClick={() => onSelectMode("CHOICE")}
                  className="text-ink-muted hover:text-ink-primary font-bold text-[11px]"
                >
                  ← Đổi phương án
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-secondary block">
                  Lý do khách yêu cầu làm lại:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Món bị nguội lạnh",
                    "Có dị vật / sợi tóc trong đĩa",
                    "Bếp làm sai khẩu vị dặn trước",
                    "Thức ăn chưa chín tới",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChangeReason(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        reason === r
                          ? "bg-brand-900 text-white shadow-xs"
                          : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-secondary block">
                  Ghi chú thêm cho Bếp:
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => onChangeReason(e.target.value)}
                  placeholder="Ghi chú thêm..."
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
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold flex items-center gap-1.5"
                  onClick={onConfirmRemake}
                >
                  <Icon name="kitchen" size={13} />
                  <span>Bắn Vé Làm Lại Ưu Tiên Xuống Bếp</span>
                </Button>
              </div>
            </div>
          )}

          {mode === "RETURN" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-rose-950">Quy Trình: Trả Món & Trừ Tiền Bill</span>
                <button
                  type="button"
                  onClick={() => onSelectMode("CHOICE")}
                  className="text-ink-muted hover:text-ink-primary font-bold text-[11px]"
                >
                  ← Đổi phương án
                </button>
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 flex items-center justify-between">
                <span>Số tiền sẽ trừ khỏi bàn:</span>
                <span className="font-black text-sm text-rose-700">
                  -{(item.price * item.quantity).toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-secondary block">
                  Lý do trả món:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Lên món quá trễ (khách đã ăn no)",
                    "Khách từ chối nhận món",
                    "Chất lượng món không đạt yêu cầu",
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
                  Ghi chú đối soát:
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => onChangeReason(e.target.value)}
                  placeholder="Ghi chú lý do trả món..."
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
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs px-5 shadow-sm font-bold"
                  onClick={onConfirmReturn}
                >
                  Xác Nhận Trừ Bill & Thu Hồi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};
