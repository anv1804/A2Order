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
  // Tính toán tỷ lệ lấp đầy bàn
  const occupancyPct =
    liveStats.totalTables > 0
      ? Math.round((liveStats.occupiedTables / liveStats.totalTables) * 100)
      : 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {/* ============================================================== */}
      {/* HERO CARD 1: DOANH THU QUÁN (COINEST "PORTFOLIO VALUE" STYLE)   */}
      {/* ============================================================== */}
      <article
        onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "staff_order" : "analytics")}
        className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div>
          {/* Header Card */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted">
              {isAccountant ? "Tổng Thu Sổ Quỹ" : isCashier ? "Doanh Số Trong Ca" : "Doanh Thu Quán"}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-surface-canvas border border-surface-border text-ink-primary">
              <span>Hôm nay</span>
              <Icon name="chevronDown" size={12} className="text-ink-subtle" />
            </span>
          </div>

          {/* Big Metric + Trend Pill */}
          <div className="flex flex-wrap items-baseline gap-2.5 mb-4">
            <h3 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">
              {liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "0 đ"}
            </h3>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#E8F5EE] text-brand-800">
              <Icon name="trending" size={13} />
              <span>+12.4%</span>
            </span>
          </div>
        </div>

        {/* Step-Line Graph (Coinest Green Step Chart) */}
        <div className="pt-2">
          <div className="h-28 w-full flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12372A" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#12372A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Area underneath */}
              <path
                d="M 0,85 L 50,85 L 50,65 L 120,65 L 120,45 L 200,45 L 200,30 L 290,30 L 290,15 L 360,15 L 360,20 L 400,20 L 400,100 L 0,100 Z"
                fill="url(#revenueGradient)"
              />

              {/* Stepped line */}
              <path
                d="M 0,85 L 50,85 L 50,65 L 120,65 L 120,45 L 200,45 L 200,30 L 290,30 L 290,15 L 360,15 L 360,20 L 400,20"
                fill="none"
                stroke="#12372A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Peak indicator dot */}
              <circle cx="360" cy="15" r="4.5" fill="#12372A" />
              <circle cx="360" cy="15" r="8" fill="#12372A" fillOpacity="0.2" />
            </svg>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between text-[10px] font-bold text-ink-subtle mt-2 pt-2 border-t border-surface-border/50">
            <span>08:00</span>
            <span>11:00</span>
            <span>14:00</span>
            <span>17:00</span>
            <span>20:00</span>
            <span>22:00</span>
          </div>
        </div>
      </article>

      {/* ============================================================== */}
      {/* HERO CARD 2: HÓA ĐƠN & THANH TOÁN (COINEST "PROFITS" STYLE)     */}
      {/* ============================================================== */}
      <article
        onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "staff_order" : "analytics")}
        className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div>
          {/* Header Card */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted">
              {isAccountant ? "Dòng Tiền Đã Khớp" : "Hóa Đơn & Thanh Toán"}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-surface-canvas border border-surface-border text-ink-primary">
              <span>Ca hôm nay</span>
              <Icon name="chevronDown" size={12} className="text-ink-subtle" />
            </span>
          </div>

          {/* Big Metric + Breakdown Tag */}
          <div className="flex flex-wrap items-baseline gap-2.5 mb-2">
            <h3 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">
              {liveStats.totalOrders} <span className="text-sm font-bold text-ink-muted">đơn hoàn tất</span>
            </h3>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-brand-100 text-brand-900">
              <span>{liveStats.vietqrPct}% VietQR</span>
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-ink-muted mb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-brand-900" />
              <span>Chuyển Khoản VietQR</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#60997D]" />
              <span>Tiền Mặt Tại Két</span>
            </span>
          </div>
        </div>

        {/* Stacked Bar Chart SVG (Coinest Green Bar Chart) */}
        <div className="pt-2">
          <div className="h-28 w-full flex items-end justify-between gap-3 px-2">
            {[
              { label: "Sáng", qrHeight: 35, cashHeight: 25 },
              { label: "Trưa", qrHeight: 60, cashHeight: 25 },
              { label: "Chiều", qrHeight: 40, cashHeight: 20 },
              { label: "Tối (Đỉnh)", qrHeight: 70, cashHeight: 25 },
              { label: "Đêm", qrHeight: 20, cashHeight: 15 },
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group/bar">
                <div className="w-full max-w-[28px] sm:max-w-[34px] flex flex-col items-center gap-0.5">
                  {/* Top Bar (VietQR - Dark Green) */}
                  <div
                    className="w-full rounded-t-md bg-brand-900 group-hover/bar:bg-brand-800 transition-all"
                    style={{ height: `${col.qrHeight}px` }}
                  />
                  {/* Bottom Bar (Tiền Mặt - Soft Green) */}
                  <div
                    className="w-full rounded-b-md bg-[#82B39B] group-hover/bar:bg-[#60997D] transition-all"
                    style={{ height: `${col.cashHeight}px` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-ink-subtle mt-2 group-hover/bar:text-ink-primary">
                  {col.label}
                </span>
              </div>
            ))}
          </div>

          {/* Summary Strip */}
          <div className="flex justify-between items-center text-[11px] font-bold text-ink-muted mt-2 pt-2 border-t border-surface-border/50">
            <span>Tiền mặt: <strong className="text-ink-primary font-black">{formatCurrency(liveStats.cashTotal)}</strong></span>
            <span>VietQR: <strong className="text-brand-900 font-black">{formatCurrency(liveStats.vietqrTotal)}</strong></span>
          </div>
        </div>
      </article>

      {/* ============================================================== */}
      {/* CARD 3: TỶ LỆ LẤP ĐẦY BÀN (COINEST "ASSETS" DONUT GAUGE)       */}
      {/* ============================================================== */}
      <article
        onClick={() => onNavigateTab?.("tables")}
        className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-black text-ink-primary tracking-tight">
              Tỷ Lệ Lấp Đầy Bàn Ăn
            </h4>
            <p className="text-xs text-ink-muted font-medium mt-0.5">
              Theo dõi sức chứa và công suất phục vụ
            </p>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5EE] text-brand-800">
            <span className="w-2 h-2 rounded-full bg-brand-700 animate-pulse" />
            <span>Thời gian thực</span>
          </span>
        </div>

        {/* Semi-Circular Donut Gauge SVG (Coinest Assets Meter) */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-48 h-28 flex items-end justify-center">
            <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="#E8ECE9"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Active Occupied Arc */}
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="#12372A"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="204"
                strokeDashoffset={204 - (204 * Math.min(occupancyPct || 70, 100)) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center Label */}
            <div className="absolute bottom-0 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-ink-muted">Đang Phục Vụ</span>
              <span className="text-2xl font-black text-ink-primary tracking-tight leading-tight">
                {liveStats.occupiedTables} / {liveStats.totalTables || 24}
              </span>
              <span className="text-[10px] font-bold text-brand-800">
                {occupancyPct || 70}% Công Suất
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown List (Coinest Assets Breakdown) */}
        <div className="space-y-2 pt-2 border-t border-surface-border/50 text-xs font-semibold">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-900" />
              <span className="text-ink-muted">Đang Dùng Bữa</span>
            </span>
            <span className="font-bold text-ink-primary">
              {liveStats.occupiedTables} bàn ({occupancyPct || 70}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8ECE9]" />
              <span className="text-ink-muted">Bàn Trống Sẵn Sàng</span>
            </span>
            <span className="font-bold text-ink-primary">
              {Math.max(0, (liveStats.totalTables || 24) - liveStats.occupiedTables)} bàn
            </span>
          </div>
        </div>
      </article>

      {/* ============================================================== */}
      {/* CARD 4: TRẠNG THÁI BẾP & KHO (COINEST QUICK STATUS CARD)       */}
      {/* ============================================================== */}
      <article className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-black text-ink-primary tracking-tight">
                Vận Hành Bếp & Tồn Kho
              </h4>
              <p className="text-xs text-ink-muted font-medium mt-0.5">
                Cảnh báo chế biến & nguyên vật liệu
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab?.("kds")}
              className="text-xs font-bold text-brand-800 hover:underline"
            >
              Mở KDS →
            </button>
          </div>

          <div className="space-y-3">
            {/* Hàng 1: Vé Bếp KDS */}
            <div
              onClick={() => onNavigateTab?.("kds")}
              className="p-3.5 rounded-2xl bg-surface-canvas hover:bg-brand-50/50 border border-surface-border/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center shrink-0 font-bold">
                  <Icon name="kitchen" size={18} />
                </span>
                <div>
                  <h5 className="text-xs font-bold text-ink-primary">Vé Chế Biến KDS</h5>
                  <p className="text-[11px] text-ink-muted">Màn hình điều phối bếp trưởng</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-brand-900 text-white">
                  <span>{liveStats.pendingTickets} vé</span>
                </span>
              </div>
            </div>

            {/* Hàng 2: Cảnh Báo Kho */}
            <div
              onClick={() => onNavigateTab?.("inventory")}
              className="p-3.5 rounded-2xl bg-surface-canvas hover:bg-amber-50/50 border border-surface-border/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                  <Icon name="cart" size={18} />
                </span>
                <div>
                  <h5 className="text-xs font-bold text-ink-primary">Nguyên Liệu Tồn Kho</h5>
                  <p className="text-[11px] text-ink-muted">Cảnh báo dưới ngưỡng an toàn</p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                    liveStats.lowStockCount > 0
                      ? "bg-amber-500 text-white"
                      : "bg-[#E8F5EE] text-brand-900"
                  }`}
                >
                  <span>{liveStats.lowStockCount > 0 ? `${liveStats.lowStockCount} cần nhập` : "An toàn"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-surface-border/50 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-muted">Nhân viên trực ca: <strong>{liveStats.activeStaff || 6} người</strong></span>
          <button
            type="button"
            onClick={() => onNavigateTab?.("team")}
            className="font-bold text-brand-800 hover:underline"
          >
            Quản lý nhân sự →
          </button>
        </div>
      </article>
    </section>
  );
};
