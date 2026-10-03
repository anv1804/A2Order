import React from "react";
import { Icon, Button, Portal } from "@/components/ui";
import { WaiterTableOrder } from "@/types";

interface TransferMergeModalProps {
  isOpen: boolean;
  activeTable: WaiterTableOrder;
  tables: WaiterTableOrder[];
  transferMode: "MOVE" | "MERGE";
  onSelectTransferMode: (mode: "MOVE" | "MERGE") => void;
  targetTableId: string;
  onSelectTargetTableId: (id: string) => void;
  onClose: () => void;
  onExecute: () => void;
}

export const TransferMergeModal: React.FC<TransferMergeModalProps> = ({
  isOpen,
  activeTable,
  tables,
  transferMode,
  onSelectTransferMode,
  targetTableId,
  onSelectTargetTableId,
  onClose,
  onExecute,
}) => {
  if (!isOpen) return null;

  const target = tables.find((t) => t.tableId === targetTableId);

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-5 sm:p-6 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-base font-black text-ink-primary">
                {transferMode === "MOVE" ? "Chuyển Bàn Ăn" : "Gộp Bàn (Khách Đến Sau / Đi Chung)"}
              </h3>
              <p className="text-xs text-ink-muted">
                Bàn hiện tại: <span className="font-bold text-brand-900">{activeTable.tableName}</span> (
                {activeTable.guestCount || 0} khách • {activeTable.items.length} món •{" "}
                {activeTable.totalAmount.toLocaleString("vi-VN")} đ)
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

          {/* Chọn hình thức */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-canvas rounded-2xl border border-surface-border text-xs font-bold">
            <button
              type="button"
              onClick={() => onSelectTransferMode("MOVE")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                transferMode === "MOVE"
                  ? "bg-white text-brand-900 shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon name="refresh" size={13} />
              <span>Chuyển Sang Bàn Khác</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTransferMode("MERGE")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                transferMode === "MERGE"
                  ? "bg-white text-brand-900 shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon name="table" size={13} />
              <span>Gộp 2 Bàn Chung Bill</span>
            </button>
          </div>

          {/* Chọn bàn đích */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-ink-secondary block">
              {transferMode === "MOVE"
                ? "Chọn Bàn Đích Cần Chuyển Sang:"
                : "Chọn Bàn Đang Có Khách Muốn Gộp Vào:"}
            </label>
            <select
              value={targetTableId}
              onChange={(e) => onSelectTargetTableId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
            >
              <option value="">-- Chọn bàn đích --</option>
              {tables
                .filter((t) => t.tableId !== activeTable.tableId)
                .map((t) => (
                  <option key={t.tableId} value={t.tableId}>
                    {t.tableName} ({t.zoneName}) -{" "}
                    {t.status === "EMPTY"
                      ? "Bàn trống"
                      : `Đang có khách (${t.guestCount || 0} khách • ${t.totalAmount.toLocaleString("vi-VN")} đ)`}
                  </option>
                ))}
            </select>
          </div>

          {/* TRỰC QUAN HÓA SO SÁNH TRƯỚC KHI GỘP / CHUYỂN */}
          {target && (
            transferMode === "MERGE" ? (
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 space-y-2.5 text-xs animate-fadeIn">
                <div className="flex items-center gap-1.5 text-brand-950 font-black">
                  <Icon name="check" size={14} className="text-brand-800" />
                  <span>Xem trước kết quả sau khi gộp bàn:</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-brand-200/60 shadow-2xs">
                    <div className="text-ink-muted font-bold">Bàn nguồn (sẽ trả về trống):</div>
                    <div className="text-ink-primary font-black text-xs mt-0.5">{activeTable.tableName}</div>
                    <div className="text-ink-muted">
                      {activeTable.guestCount || 0} khách • {activeTable.totalAmount.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-brand-200/60 shadow-2xs">
                    <div className="text-ink-muted font-bold">Bàn giữ lại (nhận đơn):</div>
                    <div className="text-ink-primary font-black text-xs mt-0.5">{target.tableName}</div>
                    <div className="text-ink-muted">
                      {target.guestCount || 0} khách • {target.totalAmount.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-200/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-brand-950">Tổng khách & Bill gộp mới:</span>
                  <span className="font-black text-sm text-brand-900">
                    {(activeTable.guestCount || 0) + (target.guestCount || 0)} khách •{" "}
                    {activeTable.items.length + target.items.length} món •{" "}
                    {(activeTable.totalAmount + target.totalAmount).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <Icon name="arrowRight" size={13} className="text-brand-900" />
                  <span>
                    Chuyển từ <strong className="text-brand-950">{activeTable.tableName}</strong> sang{" "}
                    <strong className="text-brand-950">{target.tableName}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Toàn bộ {activeTable.items.length} món và{" "}
                  {activeTable.totalAmount.toLocaleString("vi-VN")} đ sẽ được dời sang {target.tableName}. Bàn{" "}
                  {activeTable.tableName} sẽ được trả về trạng thái BÀN TRỐNG.
                </p>
              </div>
            )
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!targetTableId}
              className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold disabled:opacity-40"
              onClick={onExecute}
            >
              {transferMode === "MERGE" ? "Xác Nhận Gộp Bàn Ngay" : "Xác Nhận Chuyển Bàn"}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
