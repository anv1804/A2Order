import React from "react";
import { Icon } from "@/components/ui";
import type { ReservationFilterBarProps } from "@/types";

export const ReservationFilterBar: React.FC<ReservationFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterDate,
  onFilterDateChange,
  filterStatus,
  onFilterStatusChange,
  pendingCount,
  confirmedCount,
  lateCount,
  arrivedCount,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-surface-border p-3 shadow-xs space-y-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Ô Tìm Kiếm Thanh Thoát */}
        <div className="relative w-full min-w-0 max-w-md lg:flex-1">
          <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên khách, số điện thoại, số bàn..."
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-surface-canvas/40 focus:bg-white focus:outline-none focus:border-brand-700 transition-all placeholder:text-ink-muted/60"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nhóm Bộ Lọc Thời Gian */}
        <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-surface-border/60 bg-surface-canvas p-1 no-scrollbar sm:w-auto">
          {(
            [
              { id: "ALL", label: "Tất cả ngày" },
              { id: "TODAY", label: "Hôm nay" },
              { id: "TOMORROW", label: "Ngày mai" },
              { id: "THIS_WEEK", label: "Tuần này" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterDateChange(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterDate === tab.id
                  ? "bg-white text-ink-primary shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hàng Tab Trạng Thái Thanh Thoát */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5 border-t border-surface-border/50 text-xs">
        {[
          { id: "ALL", label: "Tất Cả", count: totalCount },
          { id: "PENDING", label: "Chờ Duyệt", count: pendingCount, highlight: pendingCount > 0 ? "text-amber-700 bg-amber-50" : "" },
          { id: "CONFIRMED", label: "Đã Giữ Bàn", count: confirmedCount },
          { id: "LATE", label: "Trễ Giờ (Grace)", count: lateCount, highlight: lateCount > 0 ? "text-amber-800 bg-amber-100 font-extrabold animate-pulse" : "" },
          { id: "ARRIVED", label: "Đang Tại Quán", count: arrivedCount },
          { id: "NO_SHOW", label: "Vắng Mặt", count: 0 },
          { id: "CANCELLED", label: "Đã Hủy", count: 0 },
        ].map((st) => {
          const isActive = filterStatus === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onFilterStatusChange(st.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border ${
                isActive
                  ? "bg-brand-950 text-white border-brand-950 shadow-xs"
                  : "bg-white border-surface-border text-ink-muted hover:text-ink-primary hover:border-slate-300"
              }`}
            >
              <span>{st.label}</span>
              {st.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : st.highlight || "bg-surface-canvas text-ink-muted"
                  }`}
                >
                  {st.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
