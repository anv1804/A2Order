import React from "react";
import { TableStatus, TableStatusConfig } from "@a2order/shared";
import { clsx } from "clsx";
import { TableStatusBadgeProps } from "@/types";

const SHORT_LABELS: Record<string, string> = {
  [TableStatus.EMPTY]: "Trống",
  [TableStatus.OCCUPIED]: "Gọi món",
  [TableStatus.WAITING_FOOD]: "Chờ món",
  [TableStatus.SERVED]: "Đủ món",
  [TableStatus.PAYMENT_PENDING]: "Tính tiền",
};

export const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({ status, className }) => {
  const config = TableStatusConfig[status] || TableStatusConfig[TableStatus.EMPTY];
  const shortLabel = SHORT_LABELS[status] || config.label;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap overflow-hidden shrink-0",
        config.bgClass,
        className
      )}
      title={config.label}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: config.color }}
      />
      <span className="truncate">{shortLabel}</span>
    </span>
  );
};
