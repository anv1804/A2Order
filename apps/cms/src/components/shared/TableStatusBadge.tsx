import React from "react";
import { TableStatus, TableStatusConfig } from "@a2order/shared";
import { clsx } from "clsx";
import { TableStatusBadgeProps } from "@/types";

export const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({ status, className }) => {
  const config = TableStatusConfig[status] || TableStatusConfig[TableStatus.EMPTY];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.bgClass,
        className
      )}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
};
