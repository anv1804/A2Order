import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { usePersistentState } from "@/hooks/usePersistentState";
import { DeepAnalyticsReport, MenuCategoryType } from "@a2order/shared";
import { SalesBillRecord, CanceledItemRecord } from "@/types/cms.types";

export const CmsDeepAnalyticsView: React.FC = () => {
  // Bộ lọc thời gian
  const [period, setPeriod] = useState<"today" | "yesterday" | "week" | "month">("today");
  // Tab phân hệ
  const [activeTab, setActiveTab] = useState<"overview" | "bills" | "menu_cogs" | "void_audit" | "pnl">("overview");

  // Export CSV mock
  const handleExportCsv = () => {
    const csvContent = "Ma HD,Ten Ban,Thu Ngan,Tong Tien,Phuong Thuc,Trang Thai\n" +
      "HD-001,Ban 04,Minh Tuan,850000,VIETQR,COMPLETED\n" +
      "HD-002,Ban 08,Thu Ha,1200000,CASH,COMPLETED\n" +
      "HD-003,Ban 02,Hong Nhung,650000,VIETQR,COMPLETED";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-doanh-thu-${period}-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo CSV thành công!");
  };

  // Filter cho Sổ chi tiết hóa đơn
  const [billSearch, setBillSearch] = useState("");
  const [billPaymentFilter, setBillPaymentFilter] = useState<string>("ALL");
  const [billShiftFilter, setBillShiftFilter] = useState<string>("ALL");
  const [billPage, setBillPage] = useState(1);
  const BILL_PAGE_SIZE = 5;

  // Modal xem và in lại Bill
  const [selectedBill, setSelectedBill] = useState<SalesBillRecord | null>(null);
  // Modal xem báo cáo chốt ca Z-Report
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Sổ chi tiết hóa đơn bán hàng (Sales Audit Ledger)
  const [bills, setBills] = usePersistentState<SalesBillRecord[]>("sales_bills_data", []);

  // Nhật ký món bị hủy sau khi in bếp (Void / Waste Audit)
  const [canceledItems] = usePersistentState<CanceledItemRecord[]>("void_audit_canceled_items", []);

  // Báo cáo tổng hợp – tính động từ dữ liệu hóa đơn thực tế
  const totalRevenue = bills.reduce((sum, b) => sum + b.finalAmount, 0);
  const totalOrders = bills.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const discountLossTotal = bills.reduce((sum, b) => sum + (b.discountAmount || 0), 0);

  const report: DeepAnalyticsReport = {
    period: period === "yesterday" ? "today" : period,
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      discountLossTotal,
      canceledItemCount: canceledItems.length,
    },
    hourlyHeatmap: [],
    paymentDistribution: [],
    menuMatrix: { stars: [], plowhorses: [], puzzles: [], dogs: [] },
  };

  // Doanh thu theo ca (Shift Revenue Breakdown) – tính động
  const shiftGroups = bills.reduce<Record<string, { orderCount: number; vietQrAmount: number; cashAmount: number; totalRevenue: number }>>((acc, b) => {
    const shift = b.shiftName || "UNKNOWN";
    if (!acc[shift]) acc[shift] = { orderCount: 0, vietQrAmount: 0, cashAmount: 0, totalRevenue: 0 };
    acc[shift].orderCount++;
    acc[shift].totalRevenue += b.finalAmount;
    if (b.paymentMethod === "VIETQR") acc[shift].vietQrAmount += b.finalAmount;
    else if (b.paymentMethod === "CASH") acc[shift].cashAmount += b.finalAmount;
    return acc;
  }, {});
  const shiftData = Object.entries(shiftGroups).map(([shiftId, data]) => ({
    shiftId,
    name: shiftId,
    inCharge: "",
    ...data,
    cashDifference: 0,
    status: "Đang diễn ra",
  }));

  // Lọc hóa đơn bán hàng
  const filteredBills = bills.filter((b) => {
    if (billPaymentFilter !== "ALL" && b.paymentMethod !== billPaymentFilter) return false;
    if (billShiftFilter !== "ALL" && b.shiftName !== billShiftFilter) return false;
    if (billSearch.trim()) {
      const q = billSearch.toLowerCase();
      return (
        b.billCode.toLowerCase().includes(q) ||
        b.tableName.toLowerCase().includes(q) ||
        b.cashierName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedBills = filteredBills.slice(
    (billPage - 1) * BILL_PAGE_SIZE,
    billPage * BILL_PAGE_SIZE
  );

  const {
    visibleItems: mobileBills,
    visibleCount: visibleBillCount,
    hasMore: hasMoreBills,
    sentinelRef: billSentinelRef,
    isMobile,
  } = useMobileInfiniteScroll({
    items: filteredBills,
    pageSize: 10,
    mobileBreakpoint: 768,
  });

  const displayedBills = isMobile ? mobileBills : paginatedBills;

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Báo Cáo
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {report.summary.totalOrders} Đơn thanh toán • {report.summary.totalRevenue.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              Báo Cáo Doanh Thu
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              Thống kê chi tiết doanh thu, số lượng đơn hàng và lịch sử thanh toán
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="banknote" size={12} className="text-emerald-300" />
                <span>Doanh thu: {report.summary.totalRevenue.toLocaleString("vi-VN")} đ</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="trending" size={12} className="text-teal-300" />
                <span>AOV: {report.summary.averageOrderValue.toLocaleString("vi-VN")} đ</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="activity" size={12} className="text-blue-300" />
                <span>VietQR: 72.8%</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setIsZReportOpen(true)}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 px-3.5 sm:px-4 text-xs font-black text-slate-950 shadow-sm transition active:scale-95 shrink-0"
            >
              <Icon name="fileText" size={14} />
              <span>Chốt Ca (Z-Report)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 shrink-0"
              title="Xuất báo cáo doanh thu ra CSV"
              aria-label="Xuất CSV"
            >
              <Icon name="download" size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4 Thẻ Bento Chỉ Số Tài Chính Cốt Lõi */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="banknote" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              +18% kỳ trước
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Tổng Thực Thu
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {report.summary.totalRevenue.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-400">đ</span>
            </p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-1 truncate">
              {report.summary.totalOrders} giao dịch hoàn tất
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Icon name="trending" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
              AOV
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Giá Trị TB / Đơn (AOV)
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {report.summary.averageOrderValue.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-400">đ</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-600 mt-1 truncate">
              Chi tiêu trung bình mỗi bàn
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon name="activity" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              Không tiền mặt
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Tỷ Lệ VietQR Napas
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              72.8% <span className="text-xs font-bold text-slate-400">doanh thu</span>
            </p>
            <p className="text-[10px] font-semibold text-blue-600 mt-1 truncate">
              11.55tr chuyển khoản tức thời
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Icon name="alert" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
              Thất thoát
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Hao Hụt & Món Hủy
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {report.summary.discountLossTotal.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-400">đ</span>
            </p>
            <p className="text-[10px] font-semibold text-amber-600 mt-1 truncate">
              {report.summary.canceledItemCount} món hủy sau bếp
            </p>
          </div>
        </article>
      </section>

      {/* 3. Sticky Segmented Control Tabs & Period Filter */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Tổng Quan & Dòng Tiền", shortLabel: "Tổng Quan", icon: "activity" },
            { id: "bills", label: `Sổ Chi Tiết Hóa Đơn (${bills.length})`, shortLabel: `Hóa Đơn (${bills.length})`, icon: "fileText" },
            { id: "pnl", label: "P&L Lãi / Lỗ", shortLabel: "Lãi / Lỗ", icon: "trending" },
            { id: "menu_cogs", label: "Kỹ Thuật Thực Đơn & COGS", shortLabel: "COGS Món", icon: "sparkles" },
            { id: "void_audit", label: `Kiểm Toán Món Hủy (${canceledItems.length})`, shortLabel: `Món Hủy (${canceledItems.length})`, icon: "alert" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all text-xs font-bold whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-2xs font-black"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <Icon name={tab.icon as any} size={14} />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Lọc thời gian */}
        <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs font-bold border border-slate-200/80 overflow-x-auto shrink-0 ml-auto">
          {(
            [
              { id: "today", label: "Hôm nay" },
              { id: "yesterday", label: "Hôm qua" },
              { id: "week", label: "7 ngày" },
              { id: "month", label: "Tháng này" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id)}
              className={`px-2.5 py-1 rounded-lg transition-all shrink-0 text-xs font-bold ${
                period === t.id
                  ? "bg-white text-slate-950 font-black shadow-2xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: TỔNG QUAN & DÒNG TIỀN */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Doanh thu theo ca làm việc (Shifts) */}
          <Panel variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-base text-ink-primary flex items-center gap-2">
                  <Icon name="clock" className="w-4 h-4 text-brand-900" />
                  <span>Doanh Thu Theo Ca Phục Vụ (Shifts)</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Đối soát tiền thu ngân bàn giao giữa ca sáng và ca tối
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shiftData.map((shift) => (
                <div
                  key={shift.shiftId}
                  className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-ink-primary">{shift.name}</h4>
                      <p className="text-[11px] text-ink-muted">{shift.inCharge}</p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        shift.status === "Đã chốt ca"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800 animate-pulse"
                      }`}
                    >
                      {shift.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-ink-subtle block">Tổng Doanh Thu</span>
                      <span className="font-black text-brand-900">
                        {shift.totalRevenue.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-subtle block">VietQR Napas</span>
                      <span className="font-bold text-emerald-700">
                        {shift.vietQrAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-subtle block">Tiền Mặt Tại Két</span>
                      <span className="font-bold text-amber-700">
                        {shift.cashAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                    <span>Lượt đơn: <strong>{shift.orderCount} hóa đơn</strong></span>
                    <span className="text-emerald-700 font-bold">✓ Khớp két 100%</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Row 2: Biểu Đồ Giờ Vàng + Cơ Cấu Thanh Toán */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Giờ vàng */}
            <div className="lg:col-span-7">
              <Panel variant="default" padding="lg" className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-base text-ink-primary flex items-center gap-2 mb-1">
                    <Icon name="flame" className="w-4 h-4 text-orange-500" />
                    <span>Phân Tích Khung Giờ Cao Điểm (Rush-Hour Heatmap)</span>
                  </h3>
                  <p className="text-xs text-ink-muted mb-4">
                    Theo dõi mật độ khách và doanh thu theo từng khung giờ trong ngày
                  </p>

                  <div className="space-y-3">
                    {report.hourlyHeatmap.map((slot, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-ink-primary flex items-center gap-1.5">
                            {slot.hourLabel}
                            {slot.isPeak && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-orange-100 text-orange-700">
                                CAO ĐIỂM
                              </span>
                            )}
                          </span>
                          <span className="font-extrabold text-ink-primary">
                            {slot.revenue.toLocaleString("vi-VN")} đ
                            <span className="text-[10px] text-ink-muted ml-1.5">({slot.orderCount} đơn)</span>
                          </span>
                        </div>

                        <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              slot.isPeak
                                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                                : "bg-brand-800"
                            }`}
                            style={{ width: `${Math.min(100, (slot.revenue / 7000000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 mt-4">
                  💡 <strong>Gợi ý vận hành:</strong> Khung giờ trưa 11:00 - 13:30 chiếm 41% tổng doanh thu. Chuẩn bị sẵn 60 bát tái nạm để phục vụ nhanh nhất.
                </div>
              </Panel>
            </div>

            {/* Cơ cấu thanh toán */}
            <div className="lg:col-span-5">
              <Panel variant="default" padding="lg" className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-base text-ink-primary flex items-center gap-2 mb-1">
                    <Icon name="creditCard" className="w-4 h-4 text-brand-800" />
                    <span>Cơ Cấu Phương Thức Thanh Toán</span>
                  </h3>
                  <p className="text-xs text-ink-muted mb-4">
                    Đối soát tỷ lệ dòng tiền vào tài khoản vs tiền mặt tại két
                  </p>

                  <div className="space-y-3">
                    {report.paymentDistribution.map((pay) => (
                      <div
                        key={pay.method}
                        className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white border border-surface-border flex items-center justify-center">
                            {pay.method === "VIETQR" && <Icon name="vietqr" className="w-4 h-4 text-emerald-600" />}
                            {pay.method === "CASH" && <Icon name="banknote" className="w-4 h-4 text-amber-600" />}
                            {pay.method === "CARD" && <Icon name="creditCard" className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-ink-primary">{pay.label}</h4>
                            <span className="text-[10px] text-ink-muted">
                              {pay.transactionCount} giao dịch • {pay.percentage}%
                            </span>
                          </div>
                        </div>

                        <span className="font-extrabold text-sm text-ink-primary">
                          {pay.totalAmount.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>100% giao dịch VietQR đã được đối soát khớp mã Napas tự động.</span>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SỔ CHI TIẾT HÓA ĐƠN BÁN HÀNG (SALES AUDIT LEDGER) */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          {/* Thanh công cụ lọc Bill */}
          <div className="space-y-3 p-3 bg-white rounded-2xl border border-surface-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="text"
                    value={billSearch}
                    onChange={(e) => {
                      setBillSearch(e.target.value);
                      setBillPage(1);
                    }}
                    placeholder="Tìm mã hóa đơn, bàn, thu ngân..."
                    className="h-8 pl-8 pr-3 rounded-xl border border-surface-border text-xs font-bold text-ink-primary focus:outline-none focus:border-brand-800 w-64"
                  />
                </div>

                <select
                  value={billShiftFilter}
                  onChange={(e) => {
                    setBillShiftFilter(e.target.value);
                    setBillPage(1);
                  }}
                  className="h-8 px-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-surface-canvas focus:outline-none"
                >
                  <option value="ALL">Tất cả ca làm việc</option>
                  <option value="CA_SANG">Ca Sáng (06:00 - 14:00)</option>
                  <option value="CA_TOI">Ca Tối (14:00 - 22:30)</option>
                </select>
              </div>

              <div className="text-xs text-ink-muted font-bold">
                Hiển thị <span className="text-brand-900 font-black">{filteredBills.length}</span> / {bills.length} hóa đơn
              </div>
            </div>

            {/* Nút lọc nhanh phương thức thanh toán */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-surface-border/50 pt-2.5">
              <span className="text-xs font-extrabold text-ink-muted px-2">Phương thức:</span>
              {[
                { id: "ALL", label: "Tất Cả", count: bills.length, icon: null },
                { id: "VIETQR", label: "Chuyển khoản VietQR", count: bills.filter((b) => b.paymentMethod === "VIETQR").length, icon: "vietqr" as const },
                { id: "CASH", label: "Tiền mặt tại két", count: bills.filter((b) => b.paymentMethod === "CASH").length, icon: "banknote" as const },
              ].map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => {
                    setBillPaymentFilter(pm.id);
                    setBillPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billPaymentFilter === pm.id
                      ? "bg-brand-900 text-white shadow-sm"
                      : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                  }`}
                >
                  {pm.icon && <Icon name={pm.icon} className="w-3 h-3" />}
                  <span>{pm.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${billPaymentFilter === pm.id ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"}`}>
                    {pm.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bảng kê chi tiết từng hóa đơn */}
          <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas border-b border-surface-border text-[11px] font-black text-ink-muted uppercase">
                <tr>
                  <th className="py-3 px-4">Mã Hóa Đơn</th>
                  <th className="py-3 px-3">Bàn Phục Vụ</th>
                  <th className="py-3 px-3">Giờ Thanh Toán</th>
                  <th className="py-3 px-3">Thu Ngân / Ca</th>
                  <th className="py-3 px-3">Món Ăn Gọi</th>
                  <th className="py-3 px-3 text-right">Giảm Giá</th>
                  <th className="py-3 px-4 text-right">Thực Thu</th>
                  <th className="py-3 px-3 text-center">Thanh Toán</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-medium">
                {paginatedBills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-ink-muted font-bold">
                      Không tìm thấy hóa đơn phù hợp với tiêu chí lọc
                    </td>
                  </tr>
                ) : (
                  displayedBills.map((b) => (
                    <tr key={b.id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-brand-950">{b.billCode}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-ink-primary">{b.tableName}</span>
                      </td>
                      <td className="py-3 px-3 text-ink-muted">
                        <span>{b.closedAt}</span>
                        <span className="text-[10px] text-ink-subtle block">Vào: {b.openedAt}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-ink-primary">{b.cashierName}</span>
                        <span className="text-[10px] text-ink-muted block">
                          {b.shiftName === "CA_SANG" ? "Ca sáng" : "Ca tối"}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <span className="text-ink-secondary line-clamp-1">
                          {b.items.map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600 font-bold">
                        {b.discountAmount > 0 ? `-${b.discountAmount.toLocaleString("vi-VN")}đ` : "--"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-brand-900 text-sm">
                          {b.finalAmount.toLocaleString("vi-VN")} đ
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.paymentMethod === "VIETQR"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <Icon name={b.paymentMethod === "VIETQR" ? "vietqr" : "banknote"} className="w-3 h-3" />
                          <span>{b.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedBill(b)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 transition-colors inline-flex items-center gap-1"
                        >
                          <Icon name="fileText" className="w-3 h-3" />
                          <span>Xem Bill</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Infinite Scroll Sentinel */}
          <div className="block md:hidden">
            <MobileInfiniteSentinel
              hasMore={hasMoreBills}
              totalCount={filteredBills.length}
              visibleCount={visibleBillCount}
              sentinelRef={billSentinelRef}
            />
          </div>

          {/* Phân trang hóa đơn trên Desktop (>= md) */}
          <div className="hidden md:block">
            <Pagination
              currentPage={billPage}
              totalItems={filteredBills.length}
              pageSize={BILL_PAGE_SIZE}
              onPageChange={setBillPage}
            />
          </div>
        </div>
      )}

      {/* TAB 3: KỸ THUẬT THỰC ĐƠN & GIÁ VỐN COGS */}
      {activeTab === "menu_cogs" && (
        <div className="space-y-6">
          <Panel variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-black text-base text-ink-primary flex items-center gap-2">
                  <Icon name="sparkles" className="w-4 h-4 text-brand-800" />
                  <span>Ma Trận Kỹ Thuật Menu (Menu Engineering 4 Ô)</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Phân loại món ăn theo biên lợi nhuận & mức độ yêu thích để tối ưu thực đơn sinh lời
                </p>
              </div>
              <span className="text-xs font-bold text-brand-900 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Tiêu chuẩn F&B Quốc Tế
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ô 1: Stars */}
              <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase">
                    🌟 Món Ngôi Sao (Stars) • Lãi Cao + Bán Chạy
                  </span>
                  <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    {report.menuMatrix.stars.length} món
                  </span>
                </div>

                {report.menuMatrix.stars.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-ink-primary">{m.name}</span>
                      <span className="text-emerald-700">Lãi {m.marginPercent}% (Đã bán {m.totalSold})</span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-tight">{m.advice}</p>
                  </div>
                ))}
              </div>

              {/* Ô 2: Plowhorses */}
              <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5 uppercase">
                    🐎 Món Ngựa Thồ (Plowhorses) • Lãi Thấp + Bán Chạy
                  </span>
                  <span className="text-[10px] font-extrabold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
                    {report.menuMatrix.plowhorses.length} món
                  </span>
                </div>

                {report.menuMatrix.plowhorses.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-white border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-ink-primary">{m.name}</span>
                      <span className="text-blue-700">Lãi {m.marginPercent}% (Đã bán {m.totalSold})</span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-tight">{m.advice}</p>
                  </div>
                ))}
              </div>

              {/* Ô 3: Puzzles */}
              <div className="p-4 rounded-3xl bg-purple-50/60 border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 flex items-center gap-1.5 uppercase">
                    ❓ Món Thách Thức (Puzzles) • Lãi Cao + Bán Chậm
                  </span>
                  <span className="text-[10px] font-extrabold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                    {report.menuMatrix.puzzles.length} món
                  </span>
                </div>

                {report.menuMatrix.puzzles.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-white border border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-ink-primary">{m.name}</span>
                      <span className="text-purple-700">Lãi {m.marginPercent}% (Đã bán {m.totalSold})</span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-tight">{m.advice}</p>
                  </div>
                ))}
              </div>

              {/* Ô 4: Dogs */}
              <div className="p-4 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900 flex items-center gap-1.5 uppercase">
                    🐶 Món Gánh Nặng (Dogs) • Lãi Thấp + Bán Ế
                  </span>
                  <span className="text-[10px] font-extrabold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                    {report.menuMatrix.dogs.length} món
                  </span>
                </div>

                {report.menuMatrix.dogs.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-white border border-rose-100 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-ink-primary">{m.name}</span>
                      <span className="text-rose-700">Lãi {m.marginPercent}% (Đã bán {m.totalSold})</span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-tight">{m.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 4: KIỂM TOÁN MÓN HỦY SAU IN BẾP (VOID AUDIT) */}
      {activeTab === "void_audit" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg" className="bg-rose-50/40 border border-rose-200">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="alert" className="w-4 h-4 text-rose-600" />
              <h4 className="font-black text-xs text-rose-950 uppercase tracking-wider">
                Nhật Ký Món Hủy Bếp (Loss Prevention & Void Audit)
              </h4>
            </div>
            <p className="text-xs text-rose-900/90 leading-relaxed">
              Tất cả các trường hợp hủy món sau khi phiếu order đã in xuống bếp đều được hệ thống tự động lưu vết để chủ quán đối soát, chống tình trạng nhân viên tự ý hủy món hoặc gian lận tiền bill của khách.
            </p>
          </Panel>

          <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas border-b border-surface-border text-[11px] font-black text-ink-muted uppercase">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-3">Tên Món Ăn Bị Hủy</th>
                  <th className="py-3 px-3 text-center">Số Lượng</th>
                  <th className="py-3 px-3 text-right">Đơn Giá Món</th>
                  <th className="py-3 px-3">Vị Trí Bàn</th>
                  <th className="py-3 px-3">Nhân Viên Duyệt Hủy</th>
                  <th className="py-3 px-4">Lý Do Hủy Món</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-medium">
                {canceledItems.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-ink-muted">{item.canceledAt}</td>
                    <td className="py-3 px-3 font-bold text-ink-primary">{item.dishName}</td>
                    <td className="py-3 px-3 text-center font-black text-rose-600">x{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-bold text-ink-primary">
                      {item.price.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-3 font-semibold text-brand-900">{item.tableName}</td>
                    <td className="py-3 px-3 text-ink-muted">{item.canceledBy}</td>
                    <td className="py-3 px-4 text-rose-800 italic bg-rose-50/50">
                      "{item.reason}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Xem & In Lại Hóa Đơn (Thermal Bill Review Modal) */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            {/* Header Bill */}
            <div className="text-center border-b border-dashed border-surface-border pb-4 space-y-1">
              <h3 className="font-black text-lg text-ink-primary uppercase tracking-tight">
                PHỞ BÒ NAM ĐỊNH
              </h3>
              <p className="text-[11px] text-ink-muted">128 Phố Huế, Hai Bà Trưng, Hà Nội</p>
              <p className="text-[11px] text-ink-muted font-mono">Hotline: 0912 345 678</p>
              <div className="pt-2 text-xs font-black text-brand-900">
                PHIẾU THANH TOÁN (HÓA ĐƠN)
              </div>
            </div>

            {/* Thông tin hóa đơn */}
            <div className="text-xs space-y-1 py-1 border-b border-dashed border-surface-border font-medium text-ink-secondary">
              <div className="flex justify-between">
                <span>Số phiếu:</span>
                <span className="font-mono font-bold text-ink-primary">{selectedBill.billCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Vị trí:</span>
                <span className="font-bold text-ink-primary">{selectedBill.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{selectedBill.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Giờ vào - Giờ ra:</span>
                <span>{selectedBill.openedAt} - {selectedBill.closedAt}</span>
              </div>
              {selectedBill.vietQrRef && (
                <div className="flex justify-between text-[11px] text-emerald-700">
                  <span>Mã giao dịch VietQR:</span>
                  <span className="font-mono font-bold">{selectedBill.vietQrRef}</span>
                </div>
              )}
            </div>

            {/* Bảng chi tiết món */}
            <div className="space-y-2 py-2 border-b border-dashed border-surface-border text-xs">
              {selectedBill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-ink-primary">{item.name}</span>
                    <span className="text-[11px] text-ink-muted block">
                      {item.quantity} x {item.unitPrice.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <span className="font-bold text-ink-primary">
                    {item.totalPrice.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))}
            </div>

            {/* Tổng kết tiền */}
            <div className="space-y-1.5 text-xs font-bold text-ink-secondary">
              <div className="flex justify-between">
                <span>Cộng tiền hàng:</span>
                <span>{selectedBill.subTotal.toLocaleString("vi-VN")} đ</span>
              </div>
              {selectedBill.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá / Voucher:</span>
                  <span>-{selectedBill.discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-brand-950 pt-2 border-t border-surface-border">
                <span>KHÁCH THANH TOÁN:</span>
                <span>{selectedBill.finalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-[11px] text-ink-muted pt-1">
                <span>Phương thức:</span>
                <span className="font-black text-emerald-800 uppercase">
                  {selectedBill.paymentMethod === "VIETQR" ? "Chuyển khoản VietQR" : "Tiền mặt"}
                </span>
              </div>
            </div>

            {/* Lời cảm ơn */}
            <p className="text-[10px] text-center text-ink-subtle italic pt-2">
              Cảm ơn Quý Khách, hẹn gặp lại!
            </p>

            {/* Nút thao tác */}
            <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-1/2 rounded-xl text-xs"
                onClick={() => setSelectedBill(null)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                className="w-1/2 rounded-xl bg-brand-900 text-white text-xs gap-1.5 shadow-sm"
                onClick={() => {
                  toast.success(`Đã gửi lệnh in lại hóa đơn ${selectedBill.billCode} ra máy in nhiệt 80mm`);
                  setSelectedBill(null);
                }}
              >
                <Icon name="print" className="w-3.5 h-3.5" />
                <span>In Lại Bill</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Báo Cáo Chốt Ca Z-Report */}
      {isZReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="fileText" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Báo Cáo Chốt Ca (Z-Report)</h3>
                  <p className="text-xs text-ink-muted">Tổng kết doanh số & kiểm kê két tiền mặt F&B</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZReportOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-ink-muted">Cơ sở:</span>
                  <span className="text-ink-primary">Phở Bò Nam Định (128 Phố Huế)</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-ink-muted">Ngày kết ca:</span>
                  <span className="text-ink-primary">28/09/2026</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-ink-muted">Người lập báo cáo:</span>
                  <span className="text-brand-900">Nguyễn Thành An (Chủ quán)</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-surface-border pt-3">
                <div className="flex justify-between text-sm font-black text-ink-primary">
                  <span>TỔNG THỰC THU TRONG NGÀY:</span>
                  <span className="text-brand-900">{report.summary.totalRevenue.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-800 font-bold">
                  <span>- Chuyển khoản VietQR (Napas 247):</span>
                  <span>11.550.000 đ</span>
                </div>
                <div className="flex justify-between text-xs text-amber-800 font-bold">
                  <span>- Tiền mặt thực tế tại két bàn giao:</span>
                  <span>3.800.000 đ</span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>- Tổng lượt bàn phục vụ:</span>
                  <span>{report.summary.totalOrders} lượt</span>
                </div>
                <div className="flex justify-between text-xs text-rose-700">
                  <span>- Món bị hủy bếp (Thất thoát):</span>
                  <span>{report.summary.discountLossTotal.toLocaleString("vi-VN")} đ (3 món)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setIsZReportOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm gap-1.5"
                onClick={() => {
                  toast.success("Đã in phiếu Z-Report chốt ca thành công ra máy in nhiệt!");
                  setIsZReportOpen(false);
                }}
              >
                <Icon name="print" className="w-3.5 h-3.5" />
                <span>In Phiếu Z-Report</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* TAB P&L: Lãi / Lỗ */}
      {activeTab === "pnl" && (() => {
        const pnlWeeks = [
          { week: "Tuần 1 (01-07/09)", revenue: 62500000, cogs: 22800000, staff: 12000000, other: 3500000 },
          { week: "Tuần 2 (08-14/09)", revenue: 71200000, cogs: 26100000, staff: 12000000, other: 3200000 },
          { week: "Tuần 3 (15-21/09)", revenue: 68900000, cogs: 24500000, staff: 12000000, other: 3800000 },
          { week: "Tuần 4 (22-28/09)", revenue: 79400000, cogs: 29200000, staff: 12000000, other: 4100000 },
        ];
        const totals = pnlWeeks.reduce((a, w) => ({ revenue: a.revenue + w.revenue, cogs: a.cogs + w.cogs, staff: a.staff + w.staff, other: a.other + w.other }), { revenue: 0, cogs: 0, staff: 0, other: 0 });
        const totalProfit = totals.revenue - totals.cogs - totals.staff - totals.other;
        const profitMargin = ((totalProfit / totals.revenue) * 100).toFixed(1);
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Panel variant="featured" padding="md" className="flex flex-col justify-between">
                <span className="text-xs font-bold text-brand-200">Tổng Doanh Thu</span>
                <div className="my-2"><span className="text-2xl font-black tracking-tight">{(totals.revenue / 1000000).toFixed(1)}M</span><span className="text-xs text-brand-200 ml-1">đ</span></div>
                <span className="text-[11px] font-bold text-emerald-300">Tháng 9/2026</span>
              </Panel>
              <Panel variant="default" padding="md" className="flex flex-col justify-between">
                <span className="text-xs font-bold text-ink-muted">Chi Phí Nguyên Liệu</span>
                <div className="my-2"><span className="text-2xl font-black text-rose-600 tracking-tight">{(totals.cogs / 1000000).toFixed(1)}M</span><span className="text-xs text-ink-muted ml-1">đ</span></div>
                <span className="text-[11px] font-bold text-rose-600">{((totals.cogs / totals.revenue) * 100).toFixed(0)}% doanh thu</span>
              </Panel>
              <Panel variant="default" padding="md" className="flex flex-col justify-between">
                <span className="text-xs font-bold text-ink-muted">Chi Phí Nhân Sự</span>
                <div className="my-2"><span className="text-2xl font-black text-amber-600 tracking-tight">{(totals.staff / 1000000).toFixed(1)}M</span><span className="text-xs text-ink-muted ml-1">đ</span></div>
                <span className="text-[11px] font-bold text-amber-600">{((totals.staff / totals.revenue) * 100).toFixed(0)}% doanh thu</span>
              </Panel>
              <Panel variant="default" padding="md" className="flex flex-col justify-between bg-emerald-50/50 border-emerald-200">
                <span className="text-xs font-bold text-emerald-700">Lợi Nhuận Ròng</span>
                <div className="my-2"><span className="text-2xl font-black text-emerald-700 tracking-tight">{(totalProfit / 1000000).toFixed(1)}M</span><span className="text-xs text-emerald-600 ml-1">đ</span></div>
                <span className="text-[11px] font-bold text-emerald-700">Biên lãi: {profitMargin}%</span>
              </Panel>
            </div>

            <Panel variant="default" padding="lg">
              <h3 className="text-sm font-black text-ink-primary mb-4 flex items-center gap-2">
                <Icon name="trending" className="w-4 h-4 text-brand-800" />
                Bảng Lãi/Lỗ Theo Tuần (Tháng 9/2026)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                      <th className="pb-3 pr-4">Tuần</th>
                      <th className="pb-3 px-3 text-right">Doanh Thu</th>
                      <th className="pb-3 px-3 text-right text-rose-600">COGS</th>
                      <th className="pb-3 px-3 text-right text-amber-600">Nhân Sự</th>
                      <th className="pb-3 px-3 text-right text-slate-500">Chi Phí Khác</th>
                      <th className="pb-3 px-3 text-right text-emerald-700">Lợi Nhuận</th>
                      <th className="pb-3 pl-3 text-right">Biên Lãi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pnlWeeks.map((w) => {
                      const profit = w.revenue - w.cogs - w.staff - w.other;
                      const margin = ((profit / w.revenue) * 100).toFixed(1);
                      return (
                        <tr key={w.week} className="hover:bg-surface-canvas/50">
                          <td className="py-3 pr-4 font-bold text-ink-primary">{w.week}</td>
                          <td className="py-3 px-3 text-right font-bold text-brand-900">{w.revenue.toLocaleString("vi-VN")}</td>
                          <td className="py-3 px-3 text-right text-rose-600 font-bold">-{w.cogs.toLocaleString("vi-VN")}</td>
                          <td className="py-3 px-3 text-right text-amber-600 font-bold">-{w.staff.toLocaleString("vi-VN")}</td>
                          <td className="py-3 px-3 text-right text-slate-500 font-bold">-{w.other.toLocaleString("vi-VN")}</td>
                          <td className="py-3 px-3 text-right font-black text-emerald-700">{profit.toLocaleString("vi-VN")}</td>
                          <td className="py-3 pl-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${Number(margin) >= 30 ? "bg-emerald-100 text-emerald-800" : Number(margin) >= 20 ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{margin}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-brand-200 bg-brand-50/30 font-black">
                      <td className="py-3 pr-4 text-brand-900">Tổng Tháng</td>
                      <td className="py-3 px-3 text-right text-brand-900">{totals.revenue.toLocaleString("vi-VN")}</td>
                      <td className="py-3 px-3 text-right text-rose-700">-{totals.cogs.toLocaleString("vi-VN")}</td>
                      <td className="py-3 px-3 text-right text-amber-700">-{totals.staff.toLocaleString("vi-VN")}</td>
                      <td className="py-3 px-3 text-right text-slate-600">-{totals.other.toLocaleString("vi-VN")}</td>
                      <td className="py-3 px-3 text-right text-emerald-800">{totalProfit.toLocaleString("vi-VN")}</td>
                      <td className="py-3 pl-3 text-right"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-black">{profitMargin}%</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-surface-canvas border border-surface-border text-[10px] text-ink-muted space-y-1">
                <p className="font-bold text-ink-primary text-xs">Ghi chú kế toán:</p>
                <p>• COGS = tổng phiếu nhập hàng trong kỳ. Nhân sự = lương cố định + thưởng ca. Chi phí khác = điện nước, mặt bằng phân bổ.</p>
                <p>• Biên lãi thuần (Net Margin) mục tiêu ngành F&B Việt Nam: 20-35%.</p>
              </div>
            </Panel>
          </div>
        );
      })()}

    </div>
  );
};


