import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsBentoKpiGridProps } from "@/types";

export const CmsBentoKpiGrid: React.FC<CmsBentoKpiGridProps> = ({
  isAccountant,
  isCashier,
  liveStats,
  onNavigateTab,
}) => {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* Metric 1: Doanh thu */}
      <article
        onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "staff_order" : "analytics")}
        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-emerald-200 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Icon name="banknote" size={16} />
          </span>
          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
            {liveStats.vietqrPct > 0 ? `${liveStats.vietqrPct}% VietQR` : "—"}
          </span>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
            {isAccountant ? "Thực Thu" : isCashier ? "Thu Trong Ca" : "Doanh Thu"}
          </h4>
          <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "—"}{" "}
            <span className="text-xs font-bold text-slate-400">{liveStats.totalRevenue > 0 ? "" : "chưa có dữ liệu"}</span>
          </p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
            {liveStats.totalOrders > 0 ? `${liveStats.totalOrders} đơn` : "Chưa có đơn"}
          </p>
        </div>
      </article>

      {/* Metric 2: Bàn / Két */}
      <article
        onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "staff_order" : "tables")}
        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-blue-200 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Icon name={isAccountant || isCashier ? "cashier" : "table"} size={16} />
          </span>
          <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
            {isAccountant ? "Đối soát" : isCashier ? "Khớp két" : liveStats.totalTables > 0 ? `${Math.round((liveStats.occupiedTables / liveStats.totalTables) * 100)}% lấp đầy` : "—"}
          </span>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
            {isAccountant || isCashier ? "Tiền Mặt Tại Két" : "Bàn Ăn"}
          </h4>
          <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {isAccountant || isCashier ? (
              <>{liveStats.cashTotal > 0 ? formatCurrency(liveStats.cashTotal) : "—"} <span className="text-xs font-bold text-slate-400">{liveStats.cashTotal === 0 ? "chưa có dữ liệu" : ""}</span></>
            ) : (
              <>{liveStats.occupiedTables} <span className="text-xs font-bold text-slate-400">/ {liveStats.totalTables} bàn</span></>
            )}
          </p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
            {isAccountant || isCashier ? "Tiền mặt trong ca" : liveStats.totalTables === 0 ? "Chưa có sơ đồ bàn" : `${liveStats.totalTables - liveStats.occupiedTables} bàn trống`}
          </p>
        </div>
      </article>

      {/* Metric 3: KDS / VietQR */}
      <article
        onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "tables" : "kds")}
        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-amber-200 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Icon name={isAccountant ? "vietqr" : isCashier ? "clock" : "kitchen"} size={16} />
          </span>
          <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
            {isAccountant ? "VietQR" : isCashier ? "In bill" : "KDS"}
          </span>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
            {isAccountant ? "Chuyển Khoản & VietQR" : isCashier ? "Chờ Thanh Toán" : "Bếp (KDS)"}
          </h4>
          <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {isAccountant ? (
              <>{liveStats.vietqrTotal > 0 ? formatCurrency(liveStats.vietqrTotal) : "—"}</>
            ) : isCashier ? (
              <>{liveStats.pendingTickets} <span className="text-xs font-bold text-slate-400">ticket</span></>
            ) : (
              <>{liveStats.pendingTickets} <span className="text-xs font-bold text-slate-400">món đang nấu</span></>
            )}
          </p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
            {isAccountant ? "Thanh toán không tiền mặt" : isCashier ? "Từ KDS" : liveStats.pendingTickets === 0 ? "Bếp trống" : "Đang chế biến"}
          </p>
        </div>
      </article>

      {/* Metric 4: Kho / VietQR % */}
      <article
        onClick={() => onNavigateTab?.(isAccountant ? "inventory" : isCashier ? "staff_order" : "inventory")}
        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-rose-200 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Icon name={isAccountant ? "fileText" : isCashier ? "vietqr" : "alert"} size={16} />
          </span>
          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${liveStats.lowStockCount > 0 ? "text-rose-700 bg-rose-50 border border-rose-100" : "text-slate-400 bg-slate-100"}`}>
            {isAccountant ? "COGS" : isCashier ? "VietQR" : liveStats.lowStockCount > 0 ? "Cần xử lý" : "Ổn định"}
          </span>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
            {isAccountant ? "Giá Vốn (COGS)" : isCashier ? "Tỷ Lệ VietQR" : "Tồn Kho"}
          </h4>
          <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {isAccountant ? (
              <span className="text-sm text-slate-400 font-semibold">Chưa có dữ liệu</span>
            ) : isCashier ? (
              <>{liveStats.vietqrPct} <span className="text-xs font-bold text-slate-400">%</span></>
            ) : (
              <>{liveStats.lowStockCount} <span className="text-xs font-bold text-slate-400">cảnh báo</span></>
            )}
          </p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
            {isAccountant ? "Cần dữ liệu định lượng" : isCashier ? "Khách quét mã" : liveStats.lowStockCount === 0 ? "Kho ổn định" : "Có nguyên liệu dưới ngưỡng"}
          </p>
        </div>
      </article>
    </section>
  );
};
