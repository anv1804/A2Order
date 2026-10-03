import React, { useState } from "react";
import {
  Panel,
  Button,
  Badge,
  Icon,
  Pagination,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  SearchInput,
  FilterSelect,
  DataTableCard,
} from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { toast } from "@/stores/notificationStore";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { usePersistentState } from "@/hooks/usePersistentState";
import { DeepAnalyticsReport, MenuCategoryType } from "@a2order/shared";
import { SalesBillRecord, CanceledItemRecord } from "@/types/cms.types";

const INITIAL_SALES_BILLS: SalesBillRecord[] = [
  {
    id: "bill-1",
    billCode: "HD-2026-0081",
    tableName: "Bàn 04 (Tầng 1)",
    cashierName: "Nguyễn Minh Tuấn",
    shiftName: "CA_SANG",
    openedAt: "11:15",
    closedAt: "12:30",
    items: [
      { id: "it-1", name: "Lẩu Nấm Hải Sản", quantity: 1, unitPrice: 450000, totalPrice: 450000 },
      { id: "it-2", name: "Bò Wagyu Nướng Đá", quantity: 2, unitPrice: 380000, totalPrice: 760000 },
      { id: "it-3", name: "Trà Đào Cam Sả", quantity: 4, unitPrice: 45000, totalPrice: 180000 },
    ],
    subTotal: 1390000,
    discountAmount: 100000,
    vatAmount: 103200,
    finalAmount: 1393200,
    paymentMethod: "VIETQR",
    status: "COMPLETED",
    vietQrRef: "QR99827361",
  },
  {
    id: "bill-2",
    billCode: "HD-2026-0082",
    tableName: "Bàn 12 (VIP Lầu 2)",
    cashierName: "Trần Thu Hà",
    shiftName: "CA_SANG",
    openedAt: "11:45",
    closedAt: "13:10",
    items: [
      { id: "it-4", name: "Sashimi Cá Hồi Thượng Hạng", quantity: 2, unitPrice: 280000, totalPrice: 560000 },
      { id: "it-5", name: "Rượu Vang Đỏ Cabernet", quantity: 1, unitPrice: 850000, totalPrice: 850000 },
      { id: "it-6", name: "Salad Cá Ngừ Sốt Chanh Dây", quantity: 1, unitPrice: 120000, totalPrice: 120000 },
    ],
    subTotal: 1530000,
    discountAmount: 0,
    vatAmount: 122400,
    finalAmount: 1652400,
    paymentMethod: "VIETQR",
    status: "COMPLETED",
    vietQrRef: "QR11827490",
  },
  {
    id: "bill-3",
    billCode: "HD-2026-0083",
    tableName: "Bàn 02 (Sân Vườn)",
    cashierName: "Lê Hồng Nhung",
    shiftName: "CA_SANG",
    openedAt: "12:10",
    closedAt: "13:25",
    items: [
      { id: "it-7", name: "Cơm Chiên Hải Sản Hoàng Kim", quantity: 2, unitPrice: 120000, totalPrice: 240000 },
      { id: "it-8", name: "Canh Chua Cá Bớp", quantity: 1, unitPrice: 180000, totalPrice: 180000 },
      { id: "it-9", name: "Nước Ép Dưa Hấu", quantity: 2, unitPrice: 40000, totalPrice: 80000 },
    ],
    subTotal: 500000,
    discountAmount: 50000,
    vatAmount: 36000,
    finalAmount: 486000,
    paymentMethod: "CASH",
    status: "COMPLETED",
  },
  {
    id: "bill-4",
    billCode: "HD-2026-0084",
    tableName: "Bàn 08 (Tầng 1)",
    cashierName: "Nguyễn Minh Tuấn",
    shiftName: "CA_TOI",
    openedAt: "18:20",
    closedAt: "19:40",
    items: [
      { id: "it-10", name: "Bò Lúc Lắc Khoai Tây", quantity: 1, unitPrice: 220000, totalPrice: 220000 },
      { id: "it-11", name: "Mì Ý Sốt Bò Bằm", quantity: 2, unitPrice: 110000, totalPrice: 220000 },
      { id: "it-12", name: "Bia Thủ Công IPA", quantity: 4, unitPrice: 65000, totalPrice: 260000 },
    ],
    subTotal: 700000,
    discountAmount: 0,
    vatAmount: 56000,
    finalAmount: 756000,
    paymentMethod: "VIETQR",
    status: "COMPLETED",
    vietQrRef: "QR77625143",
  },
  {
    id: "bill-5",
    billCode: "HD-2026-0085",
    tableName: "Bàn 06 (Lầu 1)",
    cashierName: "Trần Thu Hà",
    shiftName: "CA_TOI",
    openedAt: "19:00",
    closedAt: "20:15",
    items: [
      { id: "it-13", name: "Gà Nướng Mật Ong Tiêu Rừng", quantity: 1, unitPrice: 280000, totalPrice: 280000 },
      { id: "it-14", name: "Khoai Tây Chiên Lắc Phô Mai", quantity: 1, unitPrice: 60000, totalPrice: 60000 },
      { id: "it-15", name: "Trà Sữa Trân Châu Hoàng Gia", quantity: 3, unitPrice: 50000, totalPrice: 150000 },
    ],
    subTotal: 490000,
    discountAmount: 49000,
    vatAmount: 35280,
    finalAmount: 476280,
    paymentMethod: "CASH",
    status: "COMPLETED",
  },
  {
    id: "bill-6",
    billCode: "HD-2026-0086",
    tableName: "Bàn 15 (VIP Lầu 2)",
    cashierName: "Lê Hồng Nhung",
    shiftName: "CA_TOI",
    openedAt: "19:30",
    closedAt: "21:20",
    items: [
      { id: "it-16", name: "Cua Huỳnh Đế Hấp Rượu Vang", quantity: 1, unitPrice: 1850000, totalPrice: 1850000 },
      { id: "it-17", name: "Tôm Hùm Nướng Bơ Tỏi", quantity: 2, unitPrice: 750000, totalPrice: 1500000 },
      { id: "it-18", name: "Rượu Champagne Moet", quantity: 1, unitPrice: 2200000, totalPrice: 2200000 },
    ],
    subTotal: 5550000,
    discountAmount: 500000,
    vatAmount: 404000,
    finalAmount: 5454000,
    paymentMethod: "VIETQR",
    status: "COMPLETED",
    vietQrRef: "QR33918274",
  },
];

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
  const [bills, setBills] = usePersistentState<SalesBillRecord[]>("sales_bills_data", INITIAL_SALES_BILLS);

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
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Báo Cáo", dot: true }}
        tagline={`${report.summary.totalOrders} Đơn thanh toán • ${report.summary.totalRevenue.toLocaleString("vi-VN")} đ`}
        title="Báo Cáo Doanh Thu"
        description="Thống kê chi tiết doanh thu, số lượng đơn hàng và lịch sử thanh toán"
        chips={[
          {
            icon: "banknote",
            label: `Doanh thu: ${report.summary.totalRevenue.toLocaleString("vi-VN")} đ`,
            variant: "default",
          },
          {
            icon: "trending",
            label: `AOV: ${report.summary.averageOrderValue.toLocaleString("vi-VN")} đ`,
            variant: "teal",
          },
          {
            icon: "activity",
            label: "VietQR: 72.8%",
            variant: "blue",
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsZReportOpen(true)}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
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
          </>
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số Tài Chính Cốt Lõi */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="banknote"
          title="Tổng Thực Thu"
          value={
            <>
              {report.summary.totalRevenue.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-ink-muted">đ</span>
            </>
          }
          subtext={`${report.summary.totalOrders} giao dịch hoàn tất`}
          badge={{ text: "+18% kỳ trước", variant: "success" }}
          variant="success"
        />

        <StatCard
          icon="trending"
          title="Giá Trị TB / Đơn (AOV)"
          value={
            <>
              {report.summary.averageOrderValue.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-ink-muted">đ</span>
            </>
          }
          subtext="Chi tiêu trung bình mỗi bàn"
          badge={{ text: "AOV", variant: "info" }}
          variant="info"
        />

        <StatCard
          icon="activity"
          title="Tỷ Lệ VietQR Napas"
          value={
            <>
              72.8% <span className="text-xs font-bold text-ink-muted">doanh thu</span>
            </>
          }
          subtext="11.55tr chuyển khoản tức thời"
          badge="Không tiền mặt"
          variant="default"
        />

        <StatCard
          icon="alert"
          title="Hao Hụt & Món Hủy"
          value={
            <>
              {report.summary.discountLossTotal.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-ink-muted">đ</span>
            </>
          }
          subtext={`${report.summary.canceledItemCount} món hủy sau bếp`}
          badge={{ text: "Thất thoát", variant: "warning" }}
          variant="warning"
        />
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
        <DataTableCard
          searchPlaceholder="Tìm mã hóa đơn, bàn, thu ngân..."
          searchValue={billSearch}
          onSearchChange={(val) => {
            setBillSearch(val);
            setBillPage(1);
          }}
          onSearchClear={() => {
            setBillSearch("");
            setBillPage(1);
          }}
          filters={
            <>
              <FilterSelect
                labelPrefix="Ca: "
                value={billShiftFilter}
                onChange={(val) => {
                  setBillShiftFilter(val);
                  setBillPage(1);
                }}
                options={[
                  { value: "ALL", label: "Tất cả ca" },
                  { value: "CA_SANG", label: "Ca Sáng (06:00 - 14:00)" },
                  { value: "CA_TOI", label: "Ca Tối (14:00 - 22:30)" },
                ]}
                className="w-48"
              />

              <FilterSelect
                labelPrefix="Thanh toán: "
                value={billPaymentFilter}
                onChange={(val) => {
                  setBillPaymentFilter(val);
                  setBillPage(1);
                }}
                options={[
                  { value: "ALL", label: "Tất cả", count: bills.length },
                  { value: "VIETQR", label: "VietQR", count: bills.filter((b) => b.paymentMethod === "VIETQR").length },
                  { value: "CASH", label: "Tiền mặt", count: bills.filter((b) => b.paymentMethod === "CASH").length },
                ]}
                className="w-full sm:w-40 shrink-0"
              />
            </>
          }
          hasActiveFilters={billShiftFilter !== "ALL" || billPaymentFilter !== "ALL" || billSearch.trim() !== ""}
          onResetFilters={() => {
            setBillShiftFilter("ALL");
            setBillPaymentFilter("ALL");
            setBillSearch("");
            setBillPage(1);
          }}
          summaryText={`Hiển thị ${filteredBills.length} / ${bills.length} hóa đơn`}
          pagination={{
            currentPage: billPage,
            totalItems: filteredBills.length,
            pageSize: BILL_PAGE_SIZE,
            onPageChange: setBillPage,
          }}
          footer={
            <div className="block md:hidden">
              <MobileInfiniteSentinel
                hasMore={hasMoreBills}
                totalCount={filteredBills.length}
                visibleCount={visibleBillCount}
                sentinelRef={billSentinelRef}
              />
            </div>
          }
        >

          {/* Bảng kê chi tiết từng hóa đơn */}
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Hóa Đơn</TableHead>
                  <TableHead>Bàn Phục Vụ</TableHead>
                  <TableHead>Giờ Thanh Toán</TableHead>
                  <TableHead>Thu Ngân / Ca</TableHead>
                  <TableHead>Món Ăn Gọi</TableHead>
                  <TableHead align="right">Giảm Giá</TableHead>
                  <TableHead align="right">Thực Thu</TableHead>
                  <TableHead align="center">Thanh Toán</TableHead>
                  <TableHead align="center">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBills.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    title="Không tìm thấy hóa đơn"
                    description="Không có hóa đơn nào phù hợp với tiêu chí tìm kiếm hoặc bộ lọc ca/thanh toán."
                    action={
                      filteredBills.length === 0 && bills.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 font-bold"
                          onClick={() => {
                            setBillShiftFilter("ALL");
                            setBillPaymentFilter("ALL");
                            setBillSearch("");
                            setBillPage(1);
                          }}
                        >
                          <Icon name="x" className="w-3.5 h-3.5" />
                          <span>Xóa Bộ Lọc</span>
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  displayedBills.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <span className="font-mono font-black text-brand-950">{b.billCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-ink-primary">{b.tableName}</span>
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        <span>{b.closedAt}</span>
                        <span className="text-[10px] text-ink-subtle block">Vào: {b.openedAt}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-ink-primary">{b.cashierName}</span>
                        <span className="text-[10px] text-ink-muted block">
                          {b.shiftName === "CA_SANG" ? "Ca sáng" : "Ca tối"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-ink-secondary line-clamp-1">
                          {b.items.map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="text-rose-600 font-bold">
                        {b.discountAmount > 0 ? `-${b.discountAmount.toLocaleString("vi-VN")}đ` : "--"}
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-black text-brand-900 text-sm">
                          {b.finalAmount.toLocaleString("vi-VN")} đ
                        </span>
                      </TableCell>
                      <TableCell align="center">
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
                      </TableCell>
                      <TableCell align="center">
                        <button
                          type="button"
                          onClick={() => setSelectedBill(b)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Icon name="fileText" className="w-3 h-3" />
                          <span>Xem Bill</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </DataTableCard>
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

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời Gian</TableHead>
                  <TableHead>Tên Món Ăn Bị Hủy</TableHead>
                  <TableHead align="center">Số Lượng</TableHead>
                  <TableHead align="right">Đơn Giá Món</TableHead>
                  <TableHead>Vị Trí Bàn</TableHead>
                  <TableHead>Nhân Viên Duyệt Hủy</TableHead>
                  <TableHead>Lý Do Hủy Món</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {canceledItems.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    title="Không có món hủy nào"
                    description="Tuyệt vời! Chưa có món ăn nào bị hủy sau khi in bếp trong khoảng thời gian này."
                  />
                ) : (
                  canceledItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-rose-50/30">
                      <TableCell className="font-mono text-ink-muted">{item.canceledAt}</TableCell>
                      <TableCell className="font-bold text-ink-primary">{item.dishName}</TableCell>
                      <TableCell align="center" className="font-black text-rose-600">x{item.quantity}</TableCell>
                      <TableCell align="right" className="font-bold text-ink-primary">
                        {item.price.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell className="font-semibold text-brand-900">{item.tableName}</TableCell>
                      <TableCell className="text-ink-muted">{item.canceledBy}</TableCell>
                      <TableCell className="text-rose-800 italic bg-rose-50/30">
                        "{item.reason}"
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tuần</TableHead>
                      <TableHead align="right">Doanh Thu</TableHead>
                      <TableHead align="right" className="text-rose-600">COGS</TableHead>
                      <TableHead align="right" className="text-amber-600">Nhân Sự</TableHead>
                      <TableHead align="right" className="text-slate-500">Chi Phí Khác</TableHead>
                      <TableHead align="right" className="text-emerald-700">Lợi Nhuận</TableHead>
                      <TableHead align="right">Biên Lãi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pnlWeeks.map((w) => {
                      const profit = w.revenue - w.cogs - w.staff - w.other;
                      const margin = ((profit / w.revenue) * 100).toFixed(1);
                      return (
                        <TableRow key={w.week}>
                          <TableCell className="font-bold text-ink-primary">{w.week}</TableCell>
                          <TableCell align="right" className="font-bold text-brand-900">{w.revenue.toLocaleString("vi-VN")}</TableCell>
                          <TableCell align="right" className="text-rose-600 font-bold">-{w.cogs.toLocaleString("vi-VN")}</TableCell>
                          <TableCell align="right" className="text-amber-600 font-bold">-{w.staff.toLocaleString("vi-VN")}</TableCell>
                          <TableCell align="right" className="text-slate-500 font-bold">-{w.other.toLocaleString("vi-VN")}</TableCell>
                          <TableCell align="right" className="font-black text-emerald-700">{profit.toLocaleString("vi-VN")}</TableCell>
                          <TableCell align="right">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${Number(margin) >= 30 ? "bg-emerald-100 text-emerald-800" : Number(margin) >= 20 ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{margin}%</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 border-brand-200 bg-brand-50/30 font-black hover:bg-brand-50/40">
                      <TableCell className="text-brand-900 font-black">Tổng Tháng</TableCell>
                      <TableCell align="right" className="text-brand-900 font-black">{totals.revenue.toLocaleString("vi-VN")}</TableCell>
                      <TableCell align="right" className="text-rose-700 font-black">-{totals.cogs.toLocaleString("vi-VN")}</TableCell>
                      <TableCell align="right" className="text-amber-700 font-black">-{totals.staff.toLocaleString("vi-VN")}</TableCell>
                      <TableCell align="right" className="text-slate-600 font-black">-{totals.other.toLocaleString("vi-VN")}</TableCell>
                      <TableCell align="right" className="text-emerald-800 font-black">{totalProfit.toLocaleString("vi-VN")}</TableCell>
                      <TableCell align="right"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-black">{profitMargin}%</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
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


