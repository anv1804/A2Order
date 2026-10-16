import React, { useState } from "react";
import { Panel, Badge, Icon } from "@/components/ui";
import { TableGrid } from "@/features/tables/components/TableGrid";
import { TableStatus } from "@a2order/shared";
import { formatCurrency } from "@/lib/formatters";
import { TableItem, KdsTicket } from "@/types";

export interface TablesOverviewTabProps {
  tables: TableItem[];
  kdsTickets: KdsTicket[];
  isWaiter: boolean;
  pinnedTables: string[];
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onTableClick: (table: TableItem) => void;
}

export const TablesOverviewTab: React.FC<TablesOverviewTabProps> = ({
  tables,
  kdsTickets,
  isWaiter,
  pinnedTables,
  onTogglePin,
  onTableClick,
}) => {
  const [tableSearch, setTableSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const filteredTables = tables.filter((t: any) => {
    if (selectedZone !== "ALL" && t.zone !== selectedZone) return false;
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
    if (tableSearch.trim() && !t.name.toLowerCase().includes(tableSearch.toLowerCase())) return false;
    return true;
  });

  const sortedFilteredTables = [...filteredTables].sort((a, b) => {
    const aIndex = pinnedTables.indexOf(a.id);
    const bIndex = pinnedTables.indexOf(b.id);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex; // pinned earlier comes first
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  const occupiedCount = tables.filter((t) => t.status !== TableStatus.EMPTY).length;
  const emptyCount = tables.length - occupiedCount;
  const waitingFoodCount = tables.filter((t) => t.status === TableStatus.WAITING_FOOD).length;
  const readyToServeCount = kdsTickets.flatMap((ticket) => ticket.items).filter((item) => item.status === "DONE").reduce((count, item) => count + item.quantity, 0);
  const zones = Array.from(new Set(tables.map((table) => table.zone).filter((zone): zone is string => Boolean(zone))));
  const currentTotalRevenue = tables.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-black text-ink-primary tracking-tight">Sơ Đồ Bàn Phục Vụ</h2>
        <Badge variant="success" className="font-extrabold text-[10px]">Thời Gian Thực</Badge>
      </div>

      {/* Metric KPI Cards (Forest Green Donezo style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <Panel variant="featured" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-brand-200">Đang Có Khách</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <Icon name="arrowUpRight" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight">{occupiedCount}</span>
            <span className="text-[11px] sm:text-xs text-brand-200 ml-1">/ {tables.length} bàn</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-brand-200 truncate">
            {tables.length > 0 ? Math.round((occupiedCount / tables.length) * 100) : 0}% công suất quán
          </span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Bàn Trống</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-emerald-600 shrink-0">
              <Icon name="checkCircle" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">{emptyCount}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
            Sẵn sàng đón khách
          </span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Chờ Món</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-brand-800 shrink-0">
              <Icon name="clock" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">{waitingFoodCount}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full w-fit">
            {kdsTickets.length} vé trong bếp
          </span>
        </Panel>

        {!isWaiter ? (
          <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Tạm Tính</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-brand-800 shrink-0">
                <Icon name="banknote" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
              </div>
            </div>
            <div className="my-1.5 sm:my-2">
              <span className="text-lg sm:text-2xl font-black text-brand-900 tracking-tight truncate block">
                {formatCurrency(currentTotalRevenue)}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted truncate">
              {occupiedCount} bàn chưa thanh toán
            </span>
          </Panel>
        ) : (
          <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-100 rounded-bl-full"></div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Chờ Bưng</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 shrink-0">
                <Icon name="bell" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
              </div>
            </div>
            <div className="my-1.5 sm:my-2">
              <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">{readyToServeCount}</span>
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold text-brand-800 bg-brand-100 border border-brand-200 px-2 py-0.5 rounded-full w-fit flex items-center gap-1 ${readyToServeCount > 0 ? "animate-pulse" : ""}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-800" /> {readyToServeCount > 0 ? "Sẵn sàng bưng" : "Chưa có món chờ bưng"}
            </span>
          </Panel>
        )}
      </div>

      {/* Zone, Status, and Search Filters */}
      <div className="flex flex-col gap-1.5 sticky top-16 z-30 bg-surface-canvas/95 backdrop-blur-md pt-2 pb-3 -mx-2 px-2 sm:mx-0 sm:px-0 border-b border-surface-border">
        {/* Zone Filter */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedZone("ALL")}
            className={`min-h-11 px-3 rounded-full text-xs font-bold transition-all shrink-0 border ${
              selectedZone === "ALL"
                ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                : "bg-surface-canvas text-ink-muted border-surface-border hover:text-ink-primary"
            }`}
          >
            Tất Cả Khu Vực
          </button>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`min-h-11 px-3 rounded-full text-xs font-bold transition-all shrink-0 border ${
                  selectedZone === zone
                    ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                    : "bg-white text-ink-muted border-surface-border hover:text-ink-primary"
                }`}
              >
                {zone === "T1" ? "Tầng 1" : zone === "T2" ? "Tầng 2" : zone === "VIP" ? "Phòng VIP" : zone === "SAN_VUON" ? "Khu ngoài trời" : zone}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 mt-1">
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`min-h-11 px-3 rounded-full text-xs font-bold transition-all shrink-0 border ${
              selectedStatus === "ALL"
                ? "bg-brand-100 text-brand-900 border-brand-300 shadow-sm"
                : "bg-surface-canvas text-ink-muted border-surface-border hover:text-ink-primary"
            }`}
          >
            Tất Cả Trạng Thái
          </button>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
            {[
              { id: TableStatus.EMPTY, label: "Trống" },
              { id: TableStatus.WAITING_FOOD, label: "Chờ Món" },
              { id: TableStatus.OCCUPIED, label: "Đang Dùng" },
              { id: TableStatus.PAYMENT_PENDING, label: "Chờ Tính Tiền" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`min-h-11 px-3 rounded-full text-xs font-bold transition-all shrink-0 border ${
                  selectedStatus === st.id
                    ? "bg-brand-100 text-brand-900 border-brand-300 shadow-sm"
                    : "bg-white text-ink-muted border-surface-border hover:text-ink-primary"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Reset */}
        <div className="flex items-center gap-2 mt-2 w-full">
          <div className="relative flex-1">
            <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Tìm nhanh bàn ăn..."
              className="w-full h-12 pl-9 pr-11 rounded-xl bg-white border border-surface-border text-base font-semibold text-ink-primary focus:outline-none focus:border-brand-800 shadow-sm"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-muted flex items-center justify-center text-ink-subtle hover:text-ink-primary transition-colors"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            )}
          </div>
          {(selectedZone !== "ALL" || selectedStatus !== "ALL" || tableSearch) && (
            <button
              onClick={() => {
                setTableSearch("");
                setSelectedZone("ALL");
                setSelectedStatus("ALL");
              }}
              className="min-h-11 px-3 bg-surface-card text-ink-muted rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 border border-surface-border hover:bg-surface-muted transition-colors"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Xóa Lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="pt-1 min-h-[60vh]">
        <TableGrid tables={sortedFilteredTables} onTableClick={onTableClick} pinnedTables={pinnedTables} onTogglePin={onTogglePin} />
      </div>
    </div>
  );
};
