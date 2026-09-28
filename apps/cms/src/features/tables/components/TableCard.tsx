import React from "react";
import { TableStatusBadge } from "@/components/shared/TableStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { Panel, Icon } from "@/components/ui";
import { TableCardProps } from "@/types";

export const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {
  return (
    <Panel
      padding="md"
      onClick={() => onClick(table)}
      className="active:scale-98 transition-all cursor-pointer flex flex-col justify-between min-h-[145px] hover:shadow-elevated hover:border-brand-500/30 select-none group"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-ink-primary group-hover:text-brand-900 transition-colors">
            {table.name}
          </h3>
          <span className="text-[11px] text-ink-muted">Khu vực Tầng 1</span>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs text-ink-muted">
        {table.occupiedMinutes !== undefined && table.occupiedMinutes > 0 ? (
          <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <Icon name="clock" className="w-3 h-3" />
            <span>{table.occupiedMinutes} phút</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 font-medium">
            <Icon name="users" className="w-3.5 h-3.5 text-ink-subtle" />
            <span>4 chỗ</span>
          </div>
        )}

        {table.totalAmount !== undefined && table.totalAmount > 0 && (
          <span className="font-extrabold text-sm text-brand-900">
            {formatCurrency(table.totalAmount)}
          </span>
        )}
      </div>
    </Panel>
  );
};
