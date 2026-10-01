import React, { useState, useMemo, useEffect } from "react";
import { Panel, Icon, Pagination, SearchableSelect, SearchableSelectOption, Portal } from "@/components/ui";
import { SoftwareInvoiceRecord } from "@/types/cms.types";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceDesktopTable } from "./InvoiceDesktopTable";
import { InvoiceMobileCards } from "./InvoiceMobileCards";
import { useScrollHideKpi } from "@/hooks/useScrollHideKpi";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

export interface InvoiceManagerProps {
  invoices: SoftwareInvoiceRecord[];
  invoiceSearch: string;
  setInvoiceSearch: (val: string) => void;
  invoiceStatusFilter: string;
  setInvoiceStatusFilter: (val: string) => void;
  invoicePage: number;
  setInvoicePage: (page: number) => void;
  filteredInvoices: SoftwareInvoiceRecord[];
  paginatedInvoices: SoftwareInvoiceRecord[];
  INVOICE_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  invoiceSearch,
  setInvoiceSearch,
  invoiceStatusFilter,
  setInvoiceStatusFilter,
  invoicePage,
  setInvoicePage,
  filteredInvoices,
  paginatedInvoices,
  INVOICE_PAGE_SIZE,
  downloadCsv,
  setViewingInvoice,
  handleConfirmInvoice,
  confirmingInvoiceId,
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
}) => {
  // Financial metrics
  const financialMetrics = useMemo(() => {
    const paidList = invoices.filter((i) => i.status === "PAID");
    const pendingList = invoices.filter((i) => i.status === "PENDING");
    const cancelledList = invoices.filter((i) => i.status === "CANCELLED");
    return {
      collected: paidList.reduce((sum, i) => sum + i.finalAmount, 0),
      collectedCount: paidList.length,
      pending: pendingList.reduce((sum, i) => sum + i.finalAmount, 0),
      pendingCount: pendingList.length,
      overdue: cancelledList.reduce((sum, i) => sum + i.finalAmount, 0),
      overdueCount: cancelledList.length,
      total: invoices.reduce((sum, i) => sum + i.finalAmount, 0),
    };
  }, [invoices]);

  // Chế độ phóng to toàn màn hình
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = propIsMaximized !== undefined ? propIsMaximized : internalMaximized;
  const setIsMaximized = propSetIsMaximized || setInternalMaximized;
  const { isScrolled, handleInnerScroll } = useScrollHideKpi(isMaximized);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, setIsMaximized]);

  // Bộ lọc kỳ hạn nội bộ
  const [durationFilter, setDurationFilter] = useState<string>("ALL");

  // Quản lý chọn các hóa đơn (Select & Select All)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const currentPageInvoiceIds = useMemo(
    () => paginatedInvoices.map((i) => i.id),
    [paginatedInvoices]
  );

  const isAllSelected = useMemo(
    () => currentPageInvoiceIds.length > 0 && currentPageInvoiceIds.every((id) => selectedInvoiceIds.includes(id)),
    [currentPageInvoiceIds, selectedInvoiceIds]
  );

  const isIndeterminate = useMemo(
    () => currentPageInvoiceIds.some((id) => selectedInvoiceIds.includes(id)) && !isAllSelected,
    [currentPageInvoiceIds, selectedInvoiceIds, isAllSelected]
  );

  const handleToggleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedInvoiceIds((prev) => prev.filter((id) => !currentPageInvoiceIds.includes(id)));
    } else {
      setSelectedInvoiceIds((prev) => Array.from(new Set([...prev, ...currentPageInvoiceIds])));
    }
  };

  // Cấu hình options cho SearchableSelect
  const statusOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Trạng Thái", badge: invoices.length },
      { value: "PAID", label: "Đã Thu Tiền", badge: financialMetrics.collectedCount },
      { value: "PENDING", label: "Chờ Đối Soát", badge: financialMetrics.pendingCount },
      { value: "CANCELLED", label: "Quá Hạn / Đã Hủy", badge: financialMetrics.overdueCount },
    ],
    [invoices.length, financialMetrics]
  );

  const durationOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Kỳ Cước", badge: invoices.length },
      { value: "1", label: "1 Tháng", badge: invoices.filter((i) => i.durationMonths === 1).length },
      { value: "3", label: "3 Tháng", badge: invoices.filter((i) => i.durationMonths === 3).length },
      { value: "6", label: "6 Tháng", badge: invoices.filter((i) => i.durationMonths === 6).length },
      { value: "12", label: "12 Tháng", badge: invoices.filter((i) => i.durationMonths === 12).length },
      { value: "24", label: "24 Tháng", badge: invoices.filter((i) => i.durationMonths === 24).length },
    ],
    [invoices]
  );

  const hasActiveFilters =
    invoiceSearch.trim().length > 0 ||
    invoiceStatusFilter !== "ALL" ||
    durationFilter !== "ALL";

  const handleResetFilters = () => {
    setInvoiceSearch("");
    setInvoiceStatusFilter("ALL");
    setDurationFilter("ALL");
    setInvoicePage(1);
  };

  // Lọc thêm theo durationFilter
  const fullyFilteredInvoices = useMemo(() => {
    return filteredInvoices.filter((inv) => {
      if (durationFilter !== "ALL" && inv.durationMonths !== Number(durationFilter)) return false;
      return true;
    });
  }, [filteredInvoices, durationFilter]);

  const displayPaginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * INVOICE_PAGE_SIZE;
    return fullyFilteredInvoices.slice(start, start + INVOICE_PAGE_SIZE);
  }, [fullyFilteredInvoices, invoicePage, INVOICE_PAGE_SIZE]);

  const {
    visibleItems: mobileInvoices,
    visibleCount: visibleInvoiceCount,
    hasMore: hasMoreInvoices,
    sentinelRef: invoiceSentinelRef,
  } = useMobileInfiniteScroll({
    items: fullyFilteredInvoices,
    pageSize: 10,
  });

  const kpiCards = [
    {
      label: "Đã Thu Thành Công",
      val: formatCurrency(financialMetrics.collected),
      sub: `${financialMetrics.collectedCount} hóa đơn đã đối soát`,
      icon: "checkCircle" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Đang Chờ Đối Soát",
      val: formatCurrency(financialMetrics.pending),
      sub: `${financialMetrics.pendingCount} hóa đơn VietQR đang chờ`,
      icon: "clock" as const,
      wrapBg: "bg-amber-50/50 border-amber-100/80",
      iconBg: "bg-amber-600 text-white shadow-amber-500/20",
      textColor: "text-amber-950",
    },
    {
      label: "Nợ Quá Hạn / Đã Hủy",
      val: formatCurrency(financialMetrics.overdue),
      sub: `${financialMetrics.overdueCount} đơn cước chưa thanh toán`,
      icon: "alert" as const,
      wrapBg: financialMetrics.overdue > 0 ? "bg-rose-50/70 border-rose-200" : "bg-slate-50/50 border-slate-200/80",
      iconBg: financialMetrics.overdue > 0 ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-300 text-slate-700",
      textColor: financialMetrics.overdue > 0 ? "text-rose-700" : "text-slate-800",
    },
    {
      label: "Tổng Cước Phát Hành",
      val: formatCurrency(financialMetrics.total),
      sub: `${invoices.length} kỳ cước phần mềm`,
      icon: "fileText" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
  ];

  return (
    <div className={`flex-1 min-h-0 flex flex-col space-y-2 sm:space-y-3.5 ${isMaximized ? "h-full" : ""}`}>
      {/* KHỐI THỐNG KÊ (MINI DASHBOARD TÀI CHÍNH) - GỌN GÀNG 2X2 TRÊN MOBILE, ẨN KHI PHÓNG TO HOẶC KHI CUỘN */}
      {!isMaximized && !isScrolled && (
        <section className="shrink-0 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
          {kpiCards.map((m, i) => (
            <article
              key={i}
              className={`rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-[0_2px_12px_rgba(15,23,42,.03)] flex items-center justify-between transition-all hover:shadow-md ${m.wrapBg}`}
            >
              <div className="min-w-0 flex-1 pr-1">
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 mb-0.5 truncate">
                  {m.label}
                </h4>
                <p className={`text-sm xs:text-base sm:text-2xl font-black tracking-tight truncate ${m.textColor}`}>
                  {m.val}
                </p>
                <p className="hidden sm:block text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  {m.sub}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.iconBg}`}>
                <Icon name={m.icon} size={15} className="sm:hidden" />
                <Icon name={m.icon} size={20} className="hidden sm:block" />
              </div>
            </article>
          ))}
        </section>
      )}

      {/* DANH SÁCH HÓA ĐƠN & BỘ LỌC */}
      <Panel
        variant="default"
        padding="none"
        className={`transition-all duration-200 flex flex-col p-2.5 sm:p-5 lg:p-6 ${
          isMaximized
            ? "flex-1 min-h-0 h-full shadow-sm border border-slate-200"
            : "flex-1 min-h-[calc(100dvh-5.5rem)] sm:min-h-[calc(100vh-6rem)] lg:min-h-[440px] lg:h-[calc(100vh-230px)] sticky top-0 sm:top-2 z-10 shadow-sm"
        }`}
      >
        {/* Header Toolbar */}
        <div className="shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="sm:hidden">Hóa Đơn Cước</span>
              <span className="hidden sm:inline">Theo Dõi Công Nợ & Thu Phí</span>
            </h3>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              Hóa đơn điện tử VAT, thanh toán VietQR tự động và đối soát thanh toán cước phần mềm
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
              {fullyFilteredInvoices.length} <span className="hidden sm:inline">/ {invoices.length}</span> hđ
            </span>

            {/* Nút Xuất Dữ Liệu (Icon-only) */}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "a2order-hoa-don-phan-mem.csv",
                  ["Mã hóa đơn", "Tên quán", "Kỳ cước", "Số tiền (VND)", "Trạng thái", "Phương thức", "Ngày lập"],
                  fullyFilteredInvoices.map((inv) => [
                    inv.invoiceCode || inv.id,
                    inv.storeName,
                    `${inv.durationMonths} tháng`,
                    inv.finalAmount,
                    inv.status,
                    inv.paymentMethod,
                    inv.createdAt,
                  ])
                )
              }
              title="Xuất dữ liệu hóa đơn ra CSV"
              aria-label="Xuất dữ liệu hóa đơn"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="download" size={14} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className={`inline-flex h-8 sm:h-9 w-8 sm:w-auto items-center justify-center gap-1.5 rounded-xl border text-xs font-bold shadow-xs transition cursor-pointer px-0 sm:px-3 active:scale-95 ${
                isMaximized
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
              title={isMaximized ? "Thu nhỏ lại (Phím Esc)" : "Phóng to toàn khung làm việc"}
            >
              <Icon name={isMaximized ? "minimize" : "maximize"} size={14} className="shrink-0" />
              <span className="hidden sm:inline">{isMaximized ? "Thu nhỏ" : "Phóng to"}</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc tinh gọn */}
        <div className="shrink-0 space-y-1.5 sm:space-y-3 mb-2 sm:mb-3 p-2 sm:p-3 bg-slate-50/75 rounded-xl sm:rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2.5 items-center">
            {/* Search Input */}
            <div className="relative col-span-2 sm:col-span-2 lg:col-span-6">
              <Icon name="search" className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => {
                  setInvoiceSearch(e.target.value);
                  setInvoicePage(1);
                }}
                placeholder="Tìm mã HĐ, tên quán, gói..."
                className="w-full h-8 sm:h-9 pl-8 pr-2.5 rounded-lg sm:rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Filter Trạng thái */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-3">
              <SearchableSelect
                options={statusOptions}
                value={invoiceStatusFilter}
                onChange={(val) => {
                  setInvoiceStatusFilter(val);
                  setInvoicePage(1);
                }}
                placeholder="Trạng thái"
                searchPlaceholder="Tìm trạng thái..."
                triggerClassName="h-8 sm:h-9 text-[11px] sm:text-xs px-2 sm:px-3 rounded-lg sm:rounded-xl"
              />
            </div>

            {/* Filter Kỳ cước */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={durationOptions}
                value={durationFilter}
                onChange={(val) => {
                  setDurationFilter(val);
                  setInvoicePage(1);
                }}
                placeholder="Kỳ cước"
                searchPlaceholder="Tìm kỳ..."
                triggerClassName="h-8 sm:h-9 text-[11px] sm:text-xs px-2 sm:px-3 rounded-lg sm:rounded-xl"
              />
            </div>

            {/* Nút đặt lại bộ lọc */}
            {hasActiveFilters && (
              <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full h-7.5 sm:h-9 inline-flex items-center justify-center gap-1 px-2 rounded-lg sm:rounded-xl border border-rose-200 bg-rose-50 text-[11px] sm:text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="Xóa tất cả bộ lọc"
                >
                  <Icon name="x" size={12} />
                  <span>Đặt lại</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Khung nội dung bảng cuộn mượt mà */}
        <div onScroll={handleInnerScroll} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-y-contain scrollbar-thin border-0 sm:border rounded-none sm:rounded-xl border-slate-100 bg-transparent sm:bg-white">
          <InvoiceDesktopTable
            paginatedInvoices={displayPaginatedInvoices}
            selectedInvoiceIds={selectedInvoiceIds}
            onToggleSelectInvoice={handleToggleSelectInvoice}
            onToggleSelectAll={handleToggleSelectAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            setViewingInvoice={setViewingInvoice}
            handleConfirmInvoice={handleConfirmInvoice}
            confirmingInvoiceId={confirmingInvoiceId}
          />
          {/* Mobile / Tablet Cards View (< lg) với Cuộn Tải Thêm (Infinite Scroll) */}
          <div className="block lg:hidden pb-24 lg:pb-0">
            <InvoiceMobileCards
              paginatedInvoices={mobileInvoices}
              selectedInvoiceIds={selectedInvoiceIds}
              onToggleSelectInvoice={handleToggleSelectInvoice}
              setViewingInvoice={setViewingInvoice}
              handleConfirmInvoice={handleConfirmInvoice}
              confirmingInvoiceId={confirmingInvoiceId}
            />
            <MobileInfiniteSentinel
              hasMore={hasMoreInvoices}
              totalCount={fullyFilteredInvoices.length}
              visibleCount={visibleInvoiceCount}
              sentinelRef={invoiceSentinelRef}
            />
          </div>
        </div>

        {/* Banner tác vụ hàng loạt khi có hóa đơn được chọn */}
        {selectedInvoiceIds.length > 0 && (
          <>
            {/* 1. Desktop: Nằm gọn gàng bên trong Panel */}
            <div className="hidden lg:flex shrink-0 mt-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-950 text-white flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold pl-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Đã chọn <strong className="text-emerald-300 font-black">{selectedInvoiceIds.length}</strong> hóa đơn
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const selectedList = invoices.filter((i) => selectedInvoiceIds.includes(i.id));
                    downloadCsv(
                      "a2order-hoa-don-da-chon.csv",
                      ["Mã hóa đơn", "Tên quán", "Kỳ cước", "Số tiền (VND)", "Trạng thái", "Phương thức", "Ngày lập"],
                      selectedList.map((inv) => [
                        inv.invoiceCode || inv.id,
                        inv.storeName,
                        `${inv.durationMonths} tháng`,
                        inv.finalAmount,
                        inv.status,
                        inv.paymentMethod,
                        inv.createdAt,
                      ])
                    );
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Icon name="download" size={12} />
                  <span>Xuất file ({selectedInvoiceIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* 2. Mobile: Nổi đè lên che phủ trọn vẹn Bottom Navigation Bar (Dùng Portal để thoát Stacking Context) */}
            <Portal>
              <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pointer-events-none lg:hidden animate-slideUp">
                <div className="pointer-events-auto mx-auto flex h-[58px] w-full max-w-[330px] items-center justify-between rounded-full border border-emerald-400/40 bg-[#0e2720] shadow-[0_12px_36px_rgba(0,0,0,0.6)] ring-1 ring-black/30 p-1.5 px-3">
                  <div className="flex items-center gap-2 pl-1 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-[#0e2720] shadow-xs shrink-0">
                      {selectedInvoiceIds.length}
                    </span>
                    <span className="text-[11px] font-bold text-white leading-tight truncate">
                      Đã chọn {selectedInvoiceIds.length} hóa đơn
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pr-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const selectedList = invoices.filter((i) => selectedInvoiceIds.includes(i.id));
                        downloadCsv(
                          "a2order-hoa-don-da-chon.csv",
                          ["Mã hóa đơn", "Tên quán", "Kỳ cước", "Số tiền (VND)", "Trạng thái", "Phương thức", "Ngày lập"],
                          selectedList.map((inv) => [
                            inv.invoiceCode || inv.id,
                            inv.storeName,
                            `${inv.durationMonths} tháng`,
                            inv.finalAmount,
                            inv.status,
                            inv.paymentMethod,
                            inv.createdAt,
                          ])
                        );
                      }}
                      className="inline-flex h-8 items-center gap-1 px-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      title="Xuất file các hóa đơn đã chọn"
                    >
                      <Icon name="download" size={12} />
                      <span>Xuất</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceIds([])}
                      className="inline-flex h-8 items-center px-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 hover:text-white text-xs font-semibold transition cursor-pointer"
                      title="Bỏ chọn tất cả"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              </div>
            </Portal>
          </>
        )}

        {/* Phân trang đồng bộ - Ẩn trên Mobile (< lg) */}
        <div className="shrink-0 pt-2 sm:pt-3 border-t border-slate-100 hidden lg:block">
          <Pagination
            currentPage={invoicePage}
            totalPages={Math.max(1, Math.ceil(fullyFilteredInvoices.length / INVOICE_PAGE_SIZE))}
            onPageChange={setInvoicePage}
            totalItems={fullyFilteredInvoices.length}
            pageSize={INVOICE_PAGE_SIZE}
          />
        </div>
      </Panel>
    </div>
  );
};
