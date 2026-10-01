import React, { useState, useMemo, useEffect } from "react";
import { TenantDesktopTable } from "./TenantDesktopTable";
import { TenantMobileCards } from "./TenantMobileCards";
import { Panel, Icon, Pagination, SearchableSelect, SearchableSelectOption, Portal } from "@/components/ui";
import { TenantStoreRecord } from "@/types/cms.types";
import { useScrollHideKpi } from "@/hooks/useScrollHideKpi";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

export interface TenantManagerProps {
  stores: TenantStoreRecord[];
  storeSearch: string;
  setStoreSearch: (val: string) => void;
  storeStatusFilter: string;
  setStoreStatusFilter: (val: string) => void;
  storePlanFilter: string;
  setStorePlanFilter: (val: string) => void;
  storeProvinceFilter: string;
  setStoreProvinceFilter: (val: string) => void;
  tenantPage: number;
  setTenantPage: (page: number) => void;
  filteredStores: TenantStoreRecord[];
  paginatedStores: TenantStoreRecord[];
  TENANT_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
  onOpenNewStoreModal?: () => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({
  stores,
  storeSearch,
  setStoreSearch,
  storeStatusFilter,
  setStoreStatusFilter,
  storePlanFilter,
  setStorePlanFilter,
  storeProvinceFilter,
  setStoreProvinceFilter,
  tenantPage,
  setTenantPage,
  filteredStores,
  paginatedStores,
  TENANT_PAGE_SIZE,
  downloadCsv,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
  onOpenNewStoreModal,
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
}) => {
  const activeCount = stores.filter((s) => s.status === "ACTIVE").length;
  const expiringCount = stores.filter((s) => s.status === "EXPIRING_SOON").length;
  const suspendedCount = stores.filter((s) => s.status === "SUSPENDED").length;
  const totalDevices = stores.reduce((sum, s) => sum + s.activeDevices, 0);

  // Chế độ phóng to toàn màn hình (Fullscreen / Maximize) - Hỗ trợ controlled từ ngoài hoặc uncontrolled nội bộ
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

  // Quản lý chọn các quán (Select & Select All)
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const currentPageStoreIds = useMemo(() => paginatedStores.map((s) => s.id), [paginatedStores]);

  const {
    visibleItems: mobileStores,
    visibleCount: visibleStoreCount,
    hasMore: hasMoreStores,
    sentinelRef: storeSentinelRef,
  } = useMobileInfiniteScroll({
    items: filteredStores,
    pageSize: 10,
  });

  const isAllSelected = useMemo(
    () => currentPageStoreIds.length > 0 && currentPageStoreIds.every((id) => selectedStoreIds.includes(id)),
    [currentPageStoreIds, selectedStoreIds]
  );

  const isIndeterminate = useMemo(
    () => currentPageStoreIds.some((id) => selectedStoreIds.includes(id)) && !isAllSelected,
    [currentPageStoreIds, selectedStoreIds, isAllSelected]
  );

  const handleToggleSelectStore = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStoreIds((prev) => prev.filter((id) => !currentPageStoreIds.includes(id)));
    } else {
      setSelectedStoreIds((prev) => Array.from(new Set([...prev, ...currentPageStoreIds])));
    }
  };

  // Cấu hình options cho SearchableSelect
  const statusOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Trạng Thái", badge: stores.length },
      { value: "ACTIVE", label: "Đang Hoạt Động", badge: activeCount },
      { value: "EXPIRING_SOON", label: "Sắp Hết Hạn", badge: expiringCount },
      { value: "EXPIRED", label: "Đã Hết Hạn", badge: stores.filter((s) => s.status === "EXPIRED").length },
      { value: "SUSPENDED", label: "Tạm Khóa", badge: suspendedCount },
    ],
    [stores, activeCount, expiringCount, suspendedCount]
  );

  const planOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Các Gói", badge: stores.length },
      { value: "PRO", label: "Gói Pro (599k/th)", badge: stores.filter((s) => s.plan === "PRO").length },
      { value: "GROWTH", label: "Gói Vừa (399k/th)", badge: stores.filter((s) => s.plan === "GROWTH").length },
      { value: "STARTER", label: "Gói Nhỏ (199k/th)", badge: stores.filter((s) => s.plan === "STARTER").length },
    ],
    [stores]
  );

  const provinceOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Tỉnh Thành" },
      { value: "TP.HCM", label: "TP. Hồ Chí Minh" },
      { value: "Hà Nội", label: "Hà Nội" },
      { value: "Đà Nẵng", label: "Đà Nẵng" },
      { value: "Bình Dương", label: "Bình Dương" },
      { value: "Đồng Nai", label: "Đồng Nai" },
      { value: "Cần Thơ", label: "Cần Thơ" },
      { value: "Hải Phòng", label: "Hải Phòng" },
      { value: "Khác", label: "Tỉnh thành khác" },
    ],
    []
  );

  const hasActiveFilters =
    storeSearch.trim().length > 0 ||
    storeStatusFilter !== "ALL" ||
    storePlanFilter !== "ALL" ||
    storeProvinceFilter !== "ALL";

  const handleResetFilters = () => {
    setStoreSearch("");
    setStoreStatusFilter("ALL");
    setStorePlanFilter("ALL");
    setStoreProvinceFilter("ALL");
    setTenantPage(1);
  };

  const kpiCards = [
    {
      label: "Quán Đang Hoạt Động",
      val: activeCount,
      sub: expiringCount > 0 ? `${expiringCount} quán sắp đến hạn gia hạn` : "Hợp đồng hoạt động ổn định",
      icon: "store" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Đang Bị Tạm Khóa",
      val: suspendedCount,
      sub: suspendedCount > 0 ? "Quán quá hạn hoặc vi phạm" : "Không có quán nào bị khóa",
      icon: "shield" as const,
      wrapBg: suspendedCount > 0 ? "bg-rose-50/70 border-rose-200" : "bg-slate-50/50 border-slate-200/80",
      iconBg: suspendedCount > 0 ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-300 text-slate-700",
      textColor: suspendedCount > 0 ? "text-rose-700" : "text-slate-800",
    },
    {
      label: "Thiết Bị POS & KDS Online",
      val: totalDevices,
      sub: "Đồng bộ socket thời gian thực",
      icon: "monitor" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
  ];

  return (
    <div className={`flex-1 min-h-0 flex flex-col space-y-2 sm:space-y-3.5 ${isMaximized ? "h-full" : ""}`}>
      {/* KHỐI THỐNG KÊ (MINI DASHBOARD) - ẨN KHI PHÓNG TO HOẶC KHI CUỘN ĐỂ NHƯỜNG TRỌN VẸN CHIỀU CAO CHO BẢNG */}
      {!isMaximized && !isScrolled && (
        <section className="shrink-0 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
          {kpiCards.map((m, i) => (
            <article
              key={i}
              className={`rounded-2xl border p-2.5 sm:p-4 shadow-[0_4px_20px_rgba(15,23,42,.03)] flex items-center justify-between transition-all hover:shadow-md ${m.wrapBg}`}
            >
              <div>
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
                  {m.label}
                </h4>
                <p className={`text-base sm:text-2xl font-black tracking-tight ${m.textColor}`}>
                  {m.val}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 hidden sm:block">
                  {m.sub}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.iconBg}`}>
                <Icon name="store" size={16} className="sm:w-5 sm:h-5" />
              </div>
            </article>
          ))}
        </section>
      )}

      {/* DANH SÁCH QUÁN THUÊ & BỘ LỌC (GIỮ NGUYÊN HEADER & SIDEBAR, TỐI ĐA CHIỀU CAO KHUNG LÀM VIỆC) */}
      <Panel
        variant="default"
        padding="none"
        className={`transition-all duration-200 flex flex-col p-2.5 sm:p-5 lg:p-6 ${
          isMaximized
            ? "flex-1 min-h-0 h-full shadow-sm border border-slate-200"
            : "flex-1 min-h-[calc(100dvh-5.5rem)] sm:min-h-[calc(100vh-6rem)] lg:min-h-[480px] lg:h-[calc(100vh-230px)] sticky top-2 z-10 shadow-sm"
        }`}
      >
        {/* Header Toolbar */}
        <div className="shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="sm:hidden">Quán Thuê</span>
              <span className="hidden sm:inline">Quán Thuê & Điểm Bán</span>
            </h3>
            <span className="h-6 inline-flex items-center text-[10px] sm:text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-2 rounded-lg">
              {filteredStores.length} <span className="hidden sm:inline">/ {stores.length}</span> quán
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Nút Thêm Quán (Icon-only) */}
            {onOpenNewStoreModal && (
              <button
                type="button"
                onClick={onOpenNewStoreModal}
                title="Thêm quán mới"
                aria-label="Thêm quán mới"
                className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-brand-900 text-xs font-bold text-white shadow-xs transition hover:bg-brand-800 active:scale-95 cursor-pointer shrink-0"
              >
                <Icon name="plus" size={14} className="text-white" />
              </button>
            )}

            {/* Nút Xuất CSV (Icon-only) */}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "a2order-danh-sach-quan.csv",
                  ["Tên quán", "Chủ quán", "Email", "Số điện thoại", "Địa chỉ", "Gói", "Trạng thái", "Ngày hết hạn", "License"],
                  filteredStores.map((store) => [
                    store.name,
                    store.owner,
                    store.ownerEmail || "",
                    store.phone,
                    store.address,
                    store.plan,
                    store.status,
                    store.expiresAt,
                    store.licenseKey,
                  ])
                )
              }
              title="Xuất CSV danh sách quán"
              aria-label="Xuất CSV danh sách quán"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="download" size={14} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className={`inline-flex h-8 sm:h-9 w-8 sm:w-auto items-center justify-center gap-1.5 rounded-xl border text-xs font-bold shadow-xs transition cursor-pointer px-0 sm:px-3 active:scale-95 shrink-0 ${
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

        {/* Thanh tìm kiếm & Bộ lọc (Select Dropdown có Search, Gói, Tỉnh thành) */}
        <div className="shrink-0 space-y-2 sm:space-y-3 mb-2.5 sm:mb-3 p-2 sm:p-3 bg-slate-50/75 rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2.5 items-center">
            {/* Search Input - 2 cols on mobile/sm, 4 cols on lg */}
            <div className="relative col-span-2 sm:col-span-2 lg:col-span-4">
              <Icon name="search" className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => {
                  setStoreSearch(e.target.value);
                  setTenantPage(1);
                }}
                placeholder="Tìm tên quán, chủ quán, SĐT, key, địa chỉ..."
                className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-7 sm:pr-8 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              {storeSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setStoreSearch("");
                    setTenantPage(1);
                  }}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>

            {/* Filter Trạng Thái (SearchableSelect có ô tìm kiếm) - 1 col on mobile, 3 cols on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-3">
              <SearchableSelect
                options={statusOptions}
                value={storeStatusFilter}
                onChange={(val) => {
                  setStoreStatusFilter(val);
                  setTenantPage(1);
                }}
                placeholder="Trạng thái..."
                searchPlaceholder="Tìm trạng thái..."
                showSearch={true}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Filter Gói Cước - 1 col on mobile, 2 cols on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={planOptions}
                value={storePlanFilter}
                onChange={(val) => {
                  setStorePlanFilter(val);
                  setTenantPage(1);
                }}
                placeholder="Gói cước..."
                showSearch={false}
                align="right"
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Filter Tỉnh Thành (SearchableSelect có ô tìm kiếm) - 1 col on mobile, 2 cols on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={provinceOptions}
                value={storeProvinceFilter}
                onChange={(val) => {
                  setStoreProvinceFilter(val);
                  setTenantPage(1);
                }}
                placeholder="Tỉnh / Thành..."
                searchPlaceholder="Tìm tỉnh thành..."
                showSearch={true}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Nút Reset Filter Chuyên Dụng (Luôn hiển thị trên thanh công cụ) - 1 col on mobile, 1 col on lg */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1">
              <button
                type="button"
                onClick={handleResetFilters}
                title="Đặt lại toàn bộ bộ lọc về mặc định"
                className={`w-full h-8 sm:h-10 px-2 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs cursor-pointer ${
                  hasActiveFilters
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon name="refresh" size={12} className={hasActiveFilters ? "text-emerald-700" : "text-slate-400"} />
                <span className="truncate">Đặt lại</span>
              </button>
            </div>
          </div>

          {/* Active Filters Bar / Quick Reset */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Đang lọc:
              </span>
              {storeSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                  <span>Từ khóa: "{storeSearch}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreSearch("");
                      setTenantPage(1);
                    }}
                    className="hover:text-emerald-950 cursor-pointer"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              {storeStatusFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                  <span>{statusOptions.find((o) => o.value === storeStatusFilter)?.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreStatusFilter("ALL");
                      setTenantPage(1);
                    }}
                    className="hover:text-blue-950 cursor-pointer"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              {storePlanFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[11px]">
                  <span>{planOptions.find((o) => o.value === storePlanFilter)?.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStorePlanFilter("ALL");
                      setTenantPage(1);
                    }}
                    className="hover:text-indigo-950 cursor-pointer"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}
              {storeProvinceFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                  <span>Khu vực: {storeProvinceFilter}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreProvinceFilter("ALL");
                      setTenantPage(1);
                    }}
                    className="hover:text-amber-950 cursor-pointer"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-[11px] font-bold text-slate-500 hover:text-rose-600 transition flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-rose-50 cursor-pointer"
              >
                <Icon name="trash" size={12} />
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* Khối Bảng & Phân Trang (Kéo dài xuống đáy màn hình, cuộn nội bộ) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          {/* Vùng cuộn nội bộ cho Bảng / Thẻ */}
          <div onScroll={handleInnerScroll} className="flex-1 min-h-[200px] lg:min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin border-0 sm:border rounded-none sm:rounded-2xl border-slate-200/70 bg-transparent sm:bg-white shadow-none sm:shadow-2xs">
            {/* Desktop Table View (>= lg) */}
            <TenantDesktopTable
              paginatedStores={paginatedStores}
              selectedStoreIds={selectedStoreIds}
              onToggleSelectStore={handleToggleSelectStore}
              onToggleSelectAll={handleToggleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              setViewingStoreDetails={setViewingStoreDetails}
              setLicenseTargetStore={setLicenseTargetStore}
              handleToggleStoreStatus={handleToggleStoreStatus}
            />

            {/* Mobile / Tablet Cards View (< lg) với Cuộn Tải Thêm (Infinite Scroll) */}
            <div className="block lg:hidden">
              <TenantMobileCards
                paginatedStores={mobileStores}
                selectedStoreIds={selectedStoreIds}
                onToggleSelectStore={handleToggleSelectStore}
                setViewingStoreDetails={setViewingStoreDetails}
                setLicenseTargetStore={setLicenseTargetStore}
                handleToggleStoreStatus={handleToggleStoreStatus}
              />
              <MobileInfiniteSentinel
                hasMore={hasMoreStores}
                totalCount={filteredStores.length}
                visibleCount={visibleStoreCount}
                sentinelRef={storeSentinelRef}
              />
            </div>
          </div>

          {/* Thanh tác vụ chọn hàng loạt (Batch Actions Bar) */}
          {selectedStoreIds.length > 0 && (
            <>
              {/* 1. Desktop: Nằm gọn gàng bên trong Panel */}
              <div className="hidden lg:flex shrink-0 mt-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-950 text-white flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold pl-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Đã chọn <strong className="text-emerald-300 font-black">{selectedStoreIds.length}</strong> quán
                  </span>
                  {selectedStoreIds.length < filteredStores.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStoreIds(filteredStores.map((s) => s.id));
                      }}
                      className="text-xs font-semibold text-emerald-300 hover:text-white underline underline-offset-2 ml-2 cursor-pointer transition"
                    >
                      Chọn tất cả {filteredStores.length} quán
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const selectedStores = stores.filter((s) => selectedStoreIds.includes(s.id));
                      downloadCsv(
                        `a2order-da-chon-${selectedStoreIds.length}-quan.csv`,
                        ["Tên quán", "Chủ quán", "Email", "Số điện thoại", "Địa chỉ", "Gói", "Trạng thái", "Ngày hết hạn", "License"],
                        selectedStores.map((store) => [
                          store.name,
                          store.owner,
                          store.ownerEmail || "",
                          store.phone,
                          store.address,
                          store.plan,
                          store.status,
                          store.expiresAt,
                          store.licenseKey,
                        ])
                      );
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Icon name="download" size={12} />
                    <span>Xuất CSV ({selectedStoreIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStoreIds([])}
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
                        {selectedStoreIds.length}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white leading-tight truncate">
                          Đã chọn {selectedStoreIds.length} quán
                        </span>
                        {selectedStoreIds.length < filteredStores.length ? (
                          <button
                            type="button"
                            onClick={() => setSelectedStoreIds(filteredStores.map((s) => s.id))}
                            className="text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 text-left leading-tight cursor-pointer active:underline"
                          >
                            Chọn hết ({filteredStores.length})
                          </button>
                        ) : (
                          <span className="text-[9.5px] font-medium text-emerald-400/80 leading-tight">
                            Toàn bộ quán
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pr-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const selectedStores = stores.filter((s) => selectedStoreIds.includes(s.id));
                          downloadCsv(
                            `a2order-da-chon-${selectedStoreIds.length}-quan.csv`,
                            ["Tên quán", "Chủ quán", "Email", "Số điện thoại", "Địa chỉ", "Gói", "Trạng thái", "Ngày hết hạn", "License"],
                            selectedStores.map((store) => [
                              store.name,
                              store.owner,
                              store.ownerEmail || "",
                              store.phone,
                              store.address,
                              store.plan,
                              store.status,
                              store.expiresAt,
                              store.licenseKey,
                            ])
                          );
                        }}
                        className="inline-flex h-8 items-center gap-1 px-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        title="Xuất file CSV các quán đã chọn"
                      >
                        <Icon name="download" size={12} />
                        <span>Xuất</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStoreIds([])}
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

          {/* Phân Trang Chuẩn Đồng Bộ (Chỉ hiển thị trên Desktop >= lg, Mobile dùng Infinite Scroll) */}
          <div className="shrink-0 mt-3 pt-2 sm:pt-3 border-t border-slate-100 hidden lg:block">
            <Pagination
              currentPage={tenantPage}
              totalItems={filteredStores.length}
              pageSize={TENANT_PAGE_SIZE}
              onPageChange={setTenantPage}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
};
