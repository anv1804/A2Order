import React from "react";
import { TableCard } from "./TableCard";
import { TableGridProps } from "@/types";

export const TableGrid: React.FC<TableGridProps> = ({ tables, onTableClick }) => {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <p className="text-sm font-medium">Chưa có bàn nào trong khu vực này</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 py-1">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} onClick={onTableClick} />
      ))}
    </div>
  );
};
