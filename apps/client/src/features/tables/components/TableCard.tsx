import React from "react";
import { TableStatus } from "@a2order/shared";
import { TableStatusBadge } from "@/components/shared/TableStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { Panel, Icon } from "@/components/ui";
import { TableCardProps } from "@/types";

export const TableCard: React.FC<TableCardProps> = ({ table, onClick, isPinned = false, onTogglePin }) => {
  const isEmpty = table.status === TableStatus.EMPTY;

  const zoneLabel =
    table.zone === "T2"
      ? "Tầng 2"
      : table.zone === "VIP"
      ? "Phòng VIP"
      : table.zone === "SAN_VUON"
      ? "Sân Vườn"
      : "Tầng 1";

  return (
    <div
      onClick={() => onClick(table)}
      className={`group active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between p-2.5 sm:p-3.5 rounded-2xl border select-none min-w-0 overflow-hidden relative ${
        isEmpty
          ? "bg-white border-surface-border hover:border-brand-500/50 hover:shadow-card"
          : "bg-amber-50/30 border-amber-200/90 hover:border-amber-400 hover:shadow-card"
      } ${isPinned ? "ring-2 ring-brand-500 shadow-md" : ""}`}
    >
      {/* Hàng 1: Ghim & Khu vực, Trạng thái phân tách 2 góc rõ ràng */}
      <div className="flex items-center justify-between gap-1 pb-1 min-w-0">
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.(table.id, e);
            }}
            className={`p-1 -ml-1 rounded-full transition-colors shrink-0 ${isPinned ? "text-brand-700 bg-brand-50" : "text-ink-subtle hover:bg-surface-hover hover:text-ink-primary"}`}
          >
            <Icon name="pin" className={`w-3 h-3 ${isPinned ? "fill-brand-700" : ""}`} />
          </button>
          <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider truncate shrink-0 max-w-[55px] sm:max-w-none">
            {zoneLabel}
          </span>
        </div>
        <div className="shrink-0 min-w-0">
          <TableStatusBadge status={table.status} />
        </div>
      </div>

      {/* Hàng 2: Tên bàn to, đậm, rõ ràng 100% không bị cắt chữ B... */}
      <div className="my-1 min-w-0">
        <div className="flex items-center justify-between gap-1 min-w-0">
          <h3 className="text-sm sm:text-base font-black text-ink-primary group-hover:text-brand-900 transition-colors truncate">
            {table.name}
          </h3>
        </div>

        {/* Thông tin phụ: Thời gian ngồi hoặc sức chứa */}
        <p className="text-[10px] sm:text-[11px] text-ink-muted mt-0.5 truncate font-medium">
          {!isEmpty && table.occupiedMinutes !== undefined && table.occupiedMinutes > 0
            ? `⏱ Ngồi ${table.occupiedMinutes} phút`
            : "Sức chứa 4 - 6 chỗ"}
        </p>
      </div>

      {/* Hàng 3: Đáy thẻ - Tạm tính hoặc Nút Mở bàn */}
      <div className="mt-1 pt-1.5 border-t border-surface-border/70 flex items-center justify-between min-w-0">
        {table.totalAmount !== undefined && table.totalAmount > 0 ? (
          <div className="flex items-baseline justify-between w-full min-w-0 gap-1">
            <span className="text-[9px] sm:text-[10px] text-ink-subtle font-medium truncate shrink-0">Tạm tính:</span>
            <span className="text-xs sm:text-sm font-black text-brand-900 truncate">
              {formatCurrency(table.totalAmount)}
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-1 py-1 rounded-xl bg-brand-50/80 text-brand-900 font-extrabold text-[10px] sm:text-[11px] group-hover:bg-brand-900 group-hover:text-white transition-all whitespace-nowrap">
            <span>+ Đặt Món</span>
          </div>
        )}
      </div>
    </div>
  );
};
