import React, { useState, useMemo, useEffect } from "react";
import { LicenseDesktopTable } from "./LicenseDesktopTable";
import { LicenseMobileCards } from "./LicenseMobileCards";
import { Panel, Icon, Pagination, SearchableSelect, SearchableSelectOption, Portal } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";
import { useScrollHideKpi } from "@/hooks/useScrollHideKpi";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

export interface LicenseManagerProps {
  licenses: LicenseKeyRecord[];
  licenseSearch: string;
  setLicenseSearch: (val: string) => void;
  licenseStatusFilter: string;
  setLicenseStatusFilter: (val: string) => void;
  licensePage: number;
  setLicensePage: (page: number) => void;
  filteredLicenses: LicenseKeyRecord[];
  paginatedLicenses: LicenseKeyRecord[];
  LICENSE_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setIsCreateLicenseModalOpen: (val: boolean) => void;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const LicenseManager: React.FC<LicenseManagerProps> = ({
  licenses,
  licenseSearch,
  setLicenseSearch,
  licenseStatusFilter,
  setLicenseStatusFilter,
  licensePage,
  setLicensePage,
  filteredLicenses,
  paginatedLicenses,
  LICENSE_PAGE_SIZE,
  downloadCsv,
  setIsCreateLicenseModalOpen,
  handleCopyKey,
  handleRevokeKey,
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
}) => {
  // KPI counts
  const activeCount = licenses.filter((l) => l.status === "ACTIVE").length;
  const unassignedCount = licenses.filter((l) => l.status === "UNASSIGNED").length;
  const expiringCount = licenses.filter((l) => l.status === "EXPIRING_SOON").length;
  const expiredCount = licenses.filter((l) => l.status === "EXPIRED").length;
  const revokedCount = licenses.filter((l) => l.status === "REVOKED").length;

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

  // Bộ lọc gói cước nội bộ
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Quản lý chọn các key (Select & Select All)
  const [selectedLicenseIds, setSelectedLicenseIds] = useState<string[]>([]);

  const currentPageLicenseIds = useMemo(
    () => paginatedLicenses.map((l) => l.id),
    [paginatedLicenses]
  );

  const isAllSelected = useMemo(
    () => currentPageLicenseIds.length > 0 && currentPageLicenseIds.every((id) => selectedLicenseIds.includes(id)),
    [currentPageLicenseIds, selectedLicenseIds]
  );

  const isIndeterminate = useMemo(
    () => currentPageLicenseIds.some((id) => selectedLicenseIds.includes(id)) && !isAllSelected,
    [currentPageLicenseIds, selectedLicenseIds, isAllSelected]
  );

  const handleToggleSelectLicense = (licenseId: string) => {
    setSelectedLicenseIds((prev) =>
      prev.includes(licenseId) ? prev.filter((id) => id !== licenseId) : [...prev, licenseId]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLicenseIds((prev) => prev.filter((id) => !currentPageLicenseIds.includes(id)));
    } else {
      setSelectedLicenseIds((prev) => Array.from(new Set([...prev, ...currentPageLicenseIds])));
    }
  };

  // Cấu hình options cho SearchableSelect
  const statusOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Trạng Thái", badge: licenses.length },
      { value: "ACTIVE", label: "Đang Kích Hoạt", badge: activeCount },
      { value: "UNASSIGNED", label: "Chưa Cấp Phát", badge: unassignedCount },
      { value: "EXPIRING_SOON", label: "Sắp Hết Hạn", badge: expiringCount },
      { value: "EXPIRED", label: "Đã Hết Hạn", badge: expiredCount },
      { value: "REVOKED", label: "Đã Thu Hồi", badge: revokedCount },
    ],
    [licenses.length, activeCount, unassignedCount, expiringCount, expiredCount, revokedCount]
  );

  const planOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Các Gói", badge: licenses.length },
      { value: "PRO", label: "Gói Pro", badge: licenses.filter((l) => l.plan === "PRO").length },
      { value: "GROWTH", label: "Gói Growth", badge: licenses.filter((l) => l.plan === "GROWTH").length },
      { value: "STARTER", label: "Gói Starter", badge: licenses.filter((l) => l.plan === "STARTER").length },
    ],
    [licenses]
  );

  const hasActiveFilters =
    licenseSearch.trim().length > 0 ||
    licenseStatusFilter !== "ALL" ||
    planFilter !== "ALL";

  const handleResetFilters = () => {
    setLicenseSearch("");
    setLicenseStatusFilter("ALL");
    setPlanFilter("ALL");
    setLicensePage(1);
  };

  // Lọc thêm theo planFilter
  const fullyFilteredLicenses = useMemo(() => {
    return filteredLicenses.filter((lic) => {
      if (planFilter !== "ALL" && lic.plan !== planFilter) return false;
      return true;
    });
  }, [filteredLicenses, planFilter]);

  const displayPaginatedLicenses = useMemo(() => {
    const start = (licensePage - 1) * LICENSE_PAGE_SIZE;
    return fullyFilteredLicenses.slice(start, start + LICENSE_PAGE_SIZE);
  }, [fullyFilteredLicenses, licensePage, LICENSE_PAGE_SIZE]);

  const {
    visibleItems: mobileLicenses,
    visibleCount: visibleLicenseCount,
    hasMore: hasMoreLicenses,
    sentinelRef: licenseSentinelRef,
  } = useMobileInfiniteScroll({
    items: fullyFilteredLicenses,
    pageSize: 10,
  });

  const kpiCards = [
    {
      label: "Tổng License Phát Hành",
      val: licenses.length,
      sub: "Bao gồm cả key dự phòng",
      icon: "key" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
    {
      label: "Đang Kích Hoạt",
      val: activeCount,
      sub: expiringCount > 0 ? `${expiringCount} key sắp hết hạn` : "Hoạt động ổn định trên POS",
      icon: "checkCircle" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Chưa Cấp Phát",
      val: unassignedCount,
      sub: "Sẵn sàng kích hoạt cho quán mới",
      icon: "clock" as const,
      wrapBg: "bg-sky-50/50 border-sky-100/80",
      iconBg: "bg-sky-600 text-white shadow-sky-500/20",
      textColor: "text-sky-950",
    },
    {
      label: "Thu Hồi & Hết Hạn",
      val: expiredCount + revokedCount,
      sub: revokedCount > 0 ? `${revokedCount} key đã bị khóa` : "Chưa có sự cố bản quyền",
      icon: "shield" as const,
      wrapBg: expiredCount + revokedCount > 0 ? "bg-rose-50/70 border-rose-200" : "bg-slate-50/50 border-slate-200/80",
      iconBg: expiredCount + revokedCount > 0 ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-300 text-slate-700",
      textColor: expiredCount + revokedCount > 0 ? "text-rose-700" : "text-slate-800",
    },
  ];

  return (
    <div className={`flex-1 min-h-0 flex flex-col space-y-2 sm:space-y-3.5 ${isMaximized ? "h-full" : ""}`}>
      {/* KHỐI THỐNG KÊ (MINI DASHBOARD) - GỌN GÀNG 2X2 TRÊN MOBILE, ẨN KHI PHÓNG TO HOẶC CUỘN */}
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

      {/* DANH SÁCH LICENSE & BỘ LỌC */}
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
              <span className="sm:hidden">License Key</span>
              <span className="hidden sm:inline">Quản Lý & Phát Hành License Key</span>
            </h3>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              Phát hành key bản quyền độc lập hoặc gán theo quán, kiểm soát hạn sử dụng và thiết bị
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="h-6 inline-flex items-center text-[10px] sm:text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-2 rounded-lg">
              {fullyFilteredLicenses.length} <span className="hidden sm:inline">/ {licenses.length}</span> key
            </span>

            {/* Nút Sinh Key (Icon-only) */}
            <button
              type="button"
              onClick={() => setIsCreateLicenseModalOpen(true)}
              title="Sinh Key mới"
              aria-label="Sinh Key mới"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-brand-900 text-xs font-bold text-white shadow-xs transition hover:bg-brand-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="plus" size={14} className="text-white" />
            </button>

            {/* Nút Xuất CSV (Icon-only) */}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "a2order-license-keys.csv",
                  ["Mã license", "Cửa hàng", "Gói", "Thiết bị tối đa", "Thời hạn (tháng)", "Ngày cấp", "Ngày hết hạn", "Trạng thái"],
                  fullyFilteredLicenses.map((lic) => [
                    lic.keyCode,
                    lic.storeName || "",
                    lic.plan,
                    lic.maxDevices,
                    lic.durationMonths,
                    lic.issuedAt,
                    lic.expiresAt,
                    lic.status,
                  ])
                )
              }
              title="Xuất danh sách License Key ra CSV"
              aria-label="Xuất CSV"
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
                value={licenseSearch}
                onChange={(e) => {
                  setLicenseSearch(e.target.value);
                  setLicensePage(1);
                }}
                placeholder="Tìm mã License Key, quán liên kết..."
                className="w-full h-8 sm:h-9 pl-8 pr-2.5 rounded-lg sm:rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Filter Trạng thái */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-3">
              <SearchableSelect
                options={statusOptions}
                value={licenseStatusFilter}
                onChange={(val) => {
                  setLicenseStatusFilter(val);
                  setLicensePage(1);
                }}
                placeholder="Trạng thái"
                searchPlaceholder="Tìm trạng thái..."
                triggerClassName="h-8 sm:h-9 text-[11px] sm:text-xs px-2 sm:px-3 rounded-lg sm:rounded-xl"
              />
            </div>

            {/* Filter Gói cước */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={planOptions}
                value={planFilter}
                onChange={(val) => {
                  setPlanFilter(val);
                  setLicensePage(1);
                }}
                placeholder="Gói cước"
                searchPlaceholder="Tìm gói..."
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
        <div
          onScroll={handleInnerScroll}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-y-contain scrollbar-thin rounded-none sm:rounded-xl border-0 sm:border border-slate-100 bg-transparent sm:bg-white"
        >
          <LicenseDesktopTable
            paginatedLicenses={displayPaginatedLicenses}
            selectedLicenseIds={selectedLicenseIds}
            onToggleSelectLicense={handleToggleSelectLicense}
            onToggleSelectAll={handleToggleSelectAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            handleCopyKey={handleCopyKey}
            handleRevokeKey={handleRevokeKey}
          />
          {/* Mobile / Tablet Cards View (< lg) với Cuộn Tải Thêm (Infinite Scroll) */}
          <div className="block lg:hidden pb-24 lg:pb-0">
            <LicenseMobileCards
              paginatedLicenses={mobileLicenses}
              selectedLicenseIds={selectedLicenseIds}
              onToggleSelectLicense={handleToggleSelectLicense}
              handleCopyKey={handleCopyKey}
              handleRevokeKey={handleRevokeKey}
            />
            <MobileInfiniteSentinel
              hasMore={hasMoreLicenses}
              totalCount={fullyFilteredLicenses.length}
              visibleCount={visibleLicenseCount}
              sentinelRef={licenseSentinelRef}
            />
          </div>
        </div>

        {/* Banner tác vụ hàng loạt khi có key được chọn */}
        {selectedLicenseIds.length > 0 && (
          <>
            {/* 1. Desktop: Nằm gọn gàng bên trong Panel */}
            <div className="hidden lg:flex shrink-0 mt-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-950 text-white flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold pl-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Đã chọn <strong className="text-emerald-300 font-black">{selectedLicenseIds.length}</strong> key
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const selectedList = licenses.filter((l) => selectedLicenseIds.includes(l.id));
                    downloadCsv(
                      "a2order-license-da-chon.csv",
                      ["Mã license", "Cửa hàng", "Gói", "Thiết bị", "Thời hạn", "Ngày cấp", "Ngày hết hạn", "Trạng thái"],
                      selectedList.map((lic) => [
                        lic.keyCode,
                        lic.storeName || "",
                        lic.plan,
                        lic.maxDevices,
                        lic.durationMonths,
                        lic.issuedAt,
                        lic.expiresAt,
                        lic.status,
                      ])
                    );
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Icon name="download" size={12} />
                  <span>Xuất file ({selectedLicenseIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLicenseIds([])}
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
                      {selectedLicenseIds.length}
                    </span>
                    <span className="text-[11px] font-bold text-white leading-tight truncate">
                      Đã chọn {selectedLicenseIds.length} key
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pr-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const selectedList = licenses.filter((l) => selectedLicenseIds.includes(l.id));
                        downloadCsv(
                          "a2order-license-da-chon.csv",
                          ["Mã license", "Cửa hàng", "Gói", "Thiết bị", "Thời hạn", "Ngày cấp", "Ngày hết hạn", "Trạng thái"],
                          selectedList.map((lic) => [
                            lic.keyCode,
                            lic.storeName || "",
                            lic.plan,
                            lic.maxDevices,
                            lic.durationMonths,
                            lic.issuedAt,
                            lic.expiresAt,
                            lic.status,
                          ])
                        );
                      }}
                      className="inline-flex h-8 items-center gap-1 px-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      title="Xuất file các key đã chọn"
                    >
                      <Icon name="download" size={12} />
                      <span>Xuất</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLicenseIds([])}
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
            currentPage={licensePage}
            totalPages={Math.max(1, Math.ceil(fullyFilteredLicenses.length / LICENSE_PAGE_SIZE))}
            onPageChange={setLicensePage}
            totalItems={fullyFilteredLicenses.length}
            pageSize={LICENSE_PAGE_SIZE}
          />
        </div>
      </Panel>
    </div>
  );
};
