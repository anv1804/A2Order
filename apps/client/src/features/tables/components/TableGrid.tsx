import React from "react";
import { TableCard } from "./TableCard";
import { TableGridProps } from "@/types";
import { Icon } from "@/components/ui";

export const TableGrid: React.FC<TableGridProps> = ({ tables, onTableClick, pinnedTables = [], onTogglePin }) => {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border border-surface-border bg-surface-card text-center">
        <Icon name="table" size={32} className="text-brand-800 mb-3" />
        <p className="text-sm font-bold text-ink-primary">Chưa có bàn để hiển thị</p>
        <p className="text-xs text-ink-muted mt-1">Kiểm tra bộ lọc hoặc cấu hình bàn của cửa hàng.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 py-1">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} onClick={onTableClick} isPinned={pinnedTables.includes(table.id)} onTogglePin={onTogglePin} />
      ))}
    </div>
  );
};
