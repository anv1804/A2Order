import React from "react";
import { TableStatus } from "@a2order/shared";
import { TableStatusBadge } from "@/components/shared/TableStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { Panel, Icon } from "@/components/ui";
import { TableCardProps } from "@/types";

export const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {
  const isEmpty = table.status === TableStatus.EMPTY;

  return (
    <Panel
      padding="md"
      onClick={() => onClick(table)}
      className="active:scale-95 transition-all cursor-pointer flex flex-col justify-between min-h-[148px] hover:shadow-elevated hover:border-brand-500/40 select-none group border border-surface-border"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base sm:text-lg font-black text-ink-primary group-hover:text-brand-900 transition-colors truncate">
              {table.name}
            </h3>
            {/* Icon giỏ hàng đặt bàn theo yêu cầu */}
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isEmpty
                  ? "bg-brand-50 text-brand-800 group-hover:bg-brand-900 group-hover:text-white"
                  : "bg-amber-100 text-amber-900"
              }`}
              title={isEmpty ? "Đặt bàn & Gọi món" : "Đang có giỏ món"}
            >
              <Icon name="cart" size={13} />
            </div>
          </div>
          <span className="text-[11px] text-ink-muted block truncate">
            {table.zone === "T2" ? "Khu Tầng 2" : table.zone === "VIP" ? "Phòng VIP" : table.zone === "SAN_VUON" ? "Sân Vườn" : "Khu Tầng 1"}
          </span>
        </div>

        <TableStatusBadge status={table.status} />
      </div>

      <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center justify-between text-xs text-ink-muted">
        {table.occupiedMinutes !== undefined && table.occupiedMinutes > 0 ? (
          <div className="flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
            <Icon name="clock" className="w-3 h-3 text-amber-700" size={12} />
            <span>{table.occupiedMinutes}p</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 font-medium text-[11px]">
            <Icon name="users" className="w-3.5 h-3.5 text-ink-subtle" size={13} />
            <span>4 chỗ</span>
          </div>
        )}

        {table.totalAmount !== undefined && table.totalAmount > 0 ? (
          <div className="flex items-center gap-1 text-brand-950 font-black text-xs sm:text-sm">
            <Icon name="cart" size={12} className="text-brand-800" />
            <span>{formatCurrency(table.totalAmount)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-brand-800 font-extrabold text-[11px] group-hover:translate-x-0.5 transition-transform">
            <span>+ Đặt món</span>
          </div>
        )}
      </div>
    </Panel>
  );
};
