import React from "react";
import { Panel, Badge, Icon } from "@/components/ui";
import { TableGrid } from "@/features/tables/components/TableGrid";
import { TableStatus } from "@a2order/shared";
import { TableItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface TablesDashboardProps {
  tables: TableItem[];
  tableSearch: string;
  setTableSearch: (v: string) => void;
  selectedZone: string;
  setSelectedZone: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  onTableClick: (table: TableItem) => void;
  myStaffSales: number;
  myServedTablesCount: number;
  occupiedCount: number;
  emptyCount: number;
  waitingFoodCount: number;
  currentTotalRevenue: number;
}

const ZONES = [
  { id: "ALL", label: "Tất Cả Khu Vực" },
  { id: "T1", label: "Tầng 1 (Máy Lạnh)" },
  { id: "T2", label: "Tầng 2 (Sân Vườn)" },
  { id: "VIP", label: "Phòng VIP" },
  { id: "SAN_VUON", label: "Khu Ngoài Trời" },
];

const STATUSES = [
  { id: "ALL", label: "Tất Cả" },
  { id: TableStatus.EMPTY, label: "Trống" },
  { id: TableStatus.WAITING_FOOD, label: "Chờ Món" },
  { id: TableStatus.OCCUPIED, label: "Đang Dùng" },
  { id: TableStatus.PAYMENT_PENDING, label: "Chờ Tính Tiền" },
];

export const TablesDashboard: React.FC<TablesDashboardProps> = ({
  tables,
  tableSearch, setTableSearch,
  selectedZone, setSelectedZone,
  selectedStatus, setSelectedStatus,
  onTableClick,
  myStaffSales, myServedTablesCount,
  occupiedCount, emptyCount, waitingFoodCount, currentTotalRevenue,
}) => {
  // Lọc bàn ăn
  const filteredTables = tables.filter((t: any) => {
    if (selectedZone !== "ALL" && t.zone !== selectedZone) return false;
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
    if (tableSearch.trim() && !t.name.toLowerCase().includes(tableSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight whitespace-nowrap">
              Sơ Đồ Bàn Phục Vụ
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] whitespace-nowrap shrink-0">
              Thời Gian Thực
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Chạm vào bàn trống để gọi món • Chạm vào bàn có khách để xem bill hoặc gọi thêm
          </p>
        </div>

        {/* Thanh Tìm Kiếm */}
        <div className="w-full sm:w-80 md:w-96 lg:w-[420px] shrink-0">
          <div className="relative w-full">
            <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Tìm nhanh bàn ăn theo tên, số bàn hoặc tầng..."
              className="w-full h-11 pl-9 pr-9 rounded-2xl bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-800 shadow-sm transition-colors"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-muted text-ink-subtle flex items-center justify-center text-xs hover:text-ink-primary"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        <Panel variant="featured" padding="sm" className="p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-brand-200 truncate">Doanh Số Của Bạn</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <Icon name="banknote" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" size={14} />
            </div>
          </div>
          <div className="my-1 sm:my-2">
            <span className="text-base sm:text-2xl font-black text-white tracking-tight truncate block">
              {formatCurrency(myStaffSales)}
            </span>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-brand-200 truncate block">
            {myServedTablesCount} bàn • Tip: +{formatCurrency(Math.round(myStaffSales * 0.03))}
          </span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-ink-muted truncate">Bàn Có Khách</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-amber-600 shrink-0">
              <Icon name="arrowUpRight" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={14} />
            </div>
          </div>
          <div className="my-1 sm:my-2 flex items-baseline">
            <span className="text-xl sm:text-3xl font-black text-ink-primary tracking-tight">{occupiedCount}</span>
            <span className="text-[10px] sm:text-xs text-ink-muted ml-1">/ {tables.length} bàn</span>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full w-fit truncate">
            {Math.round((occupiedCount / tables.length) * 100)}% công suất
          </span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-ink-muted truncate">Bàn Trống</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-emerald-600 shrink-0">
              <Icon name="checkCircle" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={14} />
            </div>
          </div>
          <div className="my-1 sm:my-2 flex items-baseline">
            <span className="text-xl sm:text-3xl font-black text-ink-primary tracking-tight">{emptyCount}</span>
            <span className="text-[10px] sm:text-xs text-ink-muted ml-1">sẵn sàng</span>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit truncate">
            Sẵn sàng đón khách
          </span>
        </Panel>

        <Panel variant="default" padding="sm" className="p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-ink-muted truncate">Doanh Thu Quán</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-brand-800 shrink-0">
              <Icon name="chart" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={14} />
            </div>
          </div>
          <div className="my-1 sm:my-2">
            <span className="text-base sm:text-2xl font-black text-brand-900 tracking-tight truncate block">
              {formatCurrency(currentTotalRevenue)}
            </span>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-ink-muted truncate block">
            {waitingFoodCount} chờ bếp • {occupiedCount} có khách
          </span>
        </Panel>
      </div>

      {/* Zone & Status Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 rounded-2xl bg-white border border-surface-border">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {ZONES.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                selectedZone === z.id
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-surface-border/50">
          {STATUSES.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all shrink-0 whitespace-nowrap ${
                selectedStatus === st.id
                  ? "bg-brand-100 text-brand-900 border border-brand-300"
                  : "text-ink-muted hover:text-ink-primary bg-surface-canvas/60 sm:bg-transparent"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="pt-1">
        <TableGrid tables={filteredTables} onTableClick={onTableClick} />
      </div>
    </div>
  );
};
