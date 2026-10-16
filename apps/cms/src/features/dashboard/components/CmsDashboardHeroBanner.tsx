import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/stores/notificationStore";
import { CmsDashboardHeroBannerProps } from "@/types";

export const CmsDashboardHeroBanner: React.FC<CmsDashboardHeroBannerProps> = ({
  currentRole,
  isAccountant,
  isCashier,
  liveStats,
  isRefreshing,
  onRefresh,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentRole === "SUPER_ADMIN";

  // Super Admin view retains traditional dark container if ever rendered
  if (isSuperAdmin) {
    return (
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-4 sm:p-6 text-white shadow-lg border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Nền Tảng Quản Trị HQ
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Hệ Thống SaaS A2Order</h2>
            <p className="text-xs text-emerald-100/70 font-medium mt-0.5">Giám sát tổng quan toàn bộ chuỗi nhà hàng và đối tác thuê bao</p>
          </div>
        </div>
      </section>
    );
  }

  // Store Owner & Store Staff view: Modern Coinest Executive Header
  return (
    <section className="rounded-3xl border border-surface-border bg-white p-4 sm:p-6 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Info & Live Tags */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5EE] text-brand-900 border border-brand-200/50">
              <span className="w-2 h-2 rounded-full bg-brand-700 animate-pulse" />
              <span>{isAccountant ? "Sổ Quỹ Kế Toán" : isCashier ? "Ca Thu Ngân Trực Tuyến" : "Trực Tuyến • Ca Bán Hàng"}</span>
            </span>

            <span className="text-xs font-semibold text-ink-muted">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-ink-primary tracking-tight">
            {isAccountant
              ? "Báo Cáo Sổ Quỹ & Dòng Tiền"
              : isCashier
              ? "Doanh Số & Thu Ngân Ca Hiện Tại"
              : "Tổng Quan Nhà Hàng"}
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted font-medium mt-1 max-w-2xl leading-relaxed">
            {isAccountant
              ? "Theo dõi dòng tiền thu thực tế, tiền mặt két, thanh toán VietQR và đối soát hóa đơn."
              : isCashier
              ? "Kiểm soát các bàn chờ thanh toán, doanh số trong ca và khớp số dư két tiền mặt."
              : "Dữ liệu vận hành tự động đồng bộ thời gian thực giữa quầy POS, sơ đồ bàn và màn hình bếp KDS."}
          </p>

          {/* Quick status chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border text-xs font-bold text-ink-primary">
              <Icon name="banknote" size={13} className="text-brand-800" />
              <span>Thực thu: <strong className="text-brand-900 font-black">{liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "0 đ"}</strong></span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border text-xs font-bold text-ink-primary">
              <Icon name="checkCircle" size={13} className="text-emerald-700" />
              <span>{liveStats.totalOrders} đơn hoàn tất</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border text-xs font-bold text-ink-primary">
              <Icon name="table" size={13} className="text-amber-700" />
              <span>{liveStats.totalTables > 0 ? `${liveStats.occupiedTables}/${liveStats.totalTables} Bàn có khách` : "24 Bàn sẵn sàng"}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border text-xs font-bold text-ink-primary">
              <Icon name="kitchen" size={13} className="text-rose-700" />
              <span>{liveStats.pendingTickets > 0 ? `${liveStats.pendingTickets} Món đang nấu` : "Bếp trống"}</span>
            </span>
          </div>
        </div>

        {/* Right Actions (Coinest Action Buttons) */}
        <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-surface-border shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Đồng bộ dữ liệu ca"
            aria-label="Đồng bộ dữ liệu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-surface-canvas text-ink-primary transition hover:bg-surface-border/60 active:scale-95 disabled:opacity-60 shrink-0"
          >
            <Icon name="refresh" size={16} className={isRefreshing ? "animate-spin text-brand-900" : "text-ink-primary"} />
          </button>

          <button
            type="button"
            onClick={() => {
              toast.info("Đang trích xuất báo cáo doanh thu ca làm việc ra file Excel...");
            }}
            title="Xuất Báo Cáo Ca"
            aria-label="Xuất Báo Cáo Ca"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-surface-canvas text-ink-primary transition hover:bg-surface-border/60 active:scale-95 shrink-0"
          >
            <Icon name="download" size={16} className="text-ink-primary" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAccountant) onNavigateTab?.("analytics");
              else onNavigateTab?.("staff_order");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-900 px-5 text-xs font-black text-white shadow-xs transition hover:bg-brand-800 active:scale-95 shrink-0"
          >
            <Icon name={isAccountant ? "trending" : "cart"} size={15} />
            <span>{isAccountant ? "Xem Báo Cáo P&L" : isCashier ? "Vào Thu Ngân POS" : "Mở POS Bán Hàng →"}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
