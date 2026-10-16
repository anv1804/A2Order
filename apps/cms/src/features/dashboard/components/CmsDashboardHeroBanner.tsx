import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/stores/notificationStore";
import { CmsDashboardHeroBannerProps } from "@/types";

export const CmsDashboardHeroBanner: React.FC<CmsDashboardHeroBannerProps> = ({
  isAccountant,
  isCashier,
  liveStats,
  isRefreshing,
  onRefresh,
  onNavigateTab,
}) => {
  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isAccountant ? "Sổ Quỹ Kế Toán" : isCashier ? "Ca Thu Ngân" : "Tổng Quan"}
            </span>
            <span className="text-[10px] text-emerald-100/70 font-semibold truncate font-mono">
              {isAccountant ? "Tài Chính" : isCashier ? "Két Ca #02" : "Hôm Nay"}
            </span>
          </div>

          <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
            {isAccountant
              ? "Sổ Quỹ & Doanh Thu"
              : isCashier
              ? "Doanh Số Ca Thu Ngân"
              : "Tổng Quan Quán"}
          </h2>
          <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
            {isAccountant
              ? "Theo dõi dòng tiền, tiền mặt, chuyển khoản VietQR và giá vốn"
              : isCashier
              ? "Kiểm tra hóa đơn trong ca và tổng tiền thu thực tế"
              : "Tình hình kinh doanh, bàn ăn và doanh số trong ngày"}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
            {isAccountant ? (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="banknote" size={12} className="text-emerald-300" />
                  <span>Thực thu: {liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "0đ"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="cashier" size={12} className="text-amber-300" />
                  <span>Tiền mặt két: {liveStats.cashTotal > 0 ? formatCurrency(liveStats.cashTotal) : "0đ"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="vietqr" size={12} className="text-teal-300" />
                  <span>VietQR: {liveStats.vietqrTotal > 0 ? formatCurrency(liveStats.vietqrTotal) : "0đ"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="trending" size={12} className="text-blue-300" />
                  <span>{liveStats.totalOrders} Đơn hoàn tất</span>
                </span>
              </>
            ) : isCashier ? (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="checkCircle" size={12} className="text-emerald-300" />
                  <span>{liveStats.totalOrders} Đơn đã thanh toán</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="banknote" size={12} className="text-amber-300" />
                  <span>Tiền mặt két: {liveStats.cashTotal > 0 ? formatCurrency(liveStats.cashTotal) : "0đ"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="table" size={12} className="text-rose-300" />
                  <span>{liveStats.totalTables > 0 ? `${liveStats.occupiedTables}/${liveStats.totalTables} Bàn có khách` : "Chưa có bàn"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="history" size={12} className="text-blue-300" />
                  <span>Ca bán hoạt động</span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="table" size={12} className="text-emerald-300" />
                  <span>{liveStats.totalTables > 0 ? `${liveStats.occupiedTables}/${liveStats.totalTables} Bàn có khách` : "Chưa có bàn"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="kitchen" size={12} className="text-amber-300" />
                  <span>{liveStats.pendingTickets > 0 ? `${liveStats.pendingTickets} Món đang nấu` : "Bếp trống"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="banknote" size={12} className="text-teal-300" />
                  <span>{liveStats.totalRevenue > 0 ? `${formatCurrency(liveStats.totalRevenue)} • ${liveStats.totalOrders} đơn` : "0đ • 0 đơn hôm nay"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                  <Icon name="activity" size={12} className="text-blue-300" />
                  <span>Hệ thống trực tuyến</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Đồng bộ dữ liệu ca"
            aria-label="Đồng bộ dữ liệu"
            className="inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-60 shrink-0"
          >
            <Icon name="refresh" size={15} className={isRefreshing ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => {
              toast.info("Đang trích xuất báo cáo doanh thu ca làm việc ra file Excel...");
            }}
            title="Xuất Báo Cáo Ca"
            aria-label="Xuất Báo Cáo Ca"
            className="inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 shrink-0"
          >
            <Icon name="download" size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAccountant) onNavigateTab?.("analytics");
              else onNavigateTab?.("staff_order");
            }}
            className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 sm:px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-emerald-300 active:scale-95 shrink-0"
          >
            <Icon name={isAccountant ? "trending" : "cart"} size={14} />
            <span>{isAccountant ? "Xem Báo Cáo P&L" : isCashier ? "Vào Thu Ngân POS" : "Gọi Món POS"}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
