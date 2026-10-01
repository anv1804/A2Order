import React, { useState, useMemo, useEffect } from "react";
import { Panel, Icon, Pagination, SearchableSelect, SearchableSelectOption } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";
import { AuditDesktopTable } from "./AuditDesktopTable";
import { AuditMobileCards } from "./AuditMobileCards";
import { AuditDetailModal } from "./modals/AuditDetailModal";
import { useScrollHideKpi } from "@/hooks/useScrollHideKpi";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

export interface AuditLogViewerProps {
  auditLogs: SystemAuditLogRecord[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  downloadCsv?: (filename: string, headers: string[], rows: unknown[][]) => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  auditLogs,
  onRefresh,
  isRefreshing = false,
  downloadCsv,
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
}) => {
  // Chế độ xem: Bảng Dữ Liệu hoặc Dòng Thời Gian (Timeline)
  const [viewMode, setViewMode] = useState<"TABLE" | "TIMELINE">("TABLE");

  // Chế độ phóng to toàn màn hình
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = propIsMaximized !== undefined ? propIsMaximized : internalMaximized;
  const setIsMaximized = propSetIsMaximized || setInternalMaximized;

  // Tự động thu gọn KPI thống kê khi cuộn danh sách (tối ưu không gian mobile)
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

  // Bộ lọc & Tìm kiếm
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionGroupFilter, setActionGroupFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Modal chi tiết
  const [viewingLog, setViewingLog] = useState<SystemAuditLogRecord | null>(null);

  // Phân loại nhóm hành động
  const getActionGroup = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("AUTH") || act.includes("LOGIN")) return "AUTH";
    if (act.includes("LICENSE") || act.includes("KEY")) return "LICENSE";
    if (act.includes("INVOICE") || act.includes("PAY")) return "INVOICE";
    if (act.includes("MODULE") || act.includes("CONFIG")) return "MODULE";
    if (act.includes("STORE") || act.includes("TENANT")) return "STORE";
    return "OTHER";
  };

  // Lọc danh sách logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
      if (actionGroupFilter !== "ALL" && getActionGroup(log.action) !== actionGroupFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchActor = log.actor.toLowerCase().includes(q);
        const matchStore = (log.storeName || "").toLowerCase().includes(q);
        const matchIp = (log.ipAddress || "").toLowerCase().includes(q);
        const matchDetails = (log.details || "").toLowerCase().includes(q);
        if (!matchAction && !matchActor && !matchStore && !matchIp && !matchDetails) return false;
      }
      return true;
    });
  }, [auditLogs, statusFilter, actionGroupFilter, search]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, page, PAGE_SIZE]);

  const {
    visibleItems: mobileLogs,
    visibleCount: visibleLogCount,
    hasMore: hasMoreLogs,
    sentinelRef: logSentinelRef,
  } = useMobileInfiniteScroll({
    items: filteredLogs,
    pageSize: 10,
  });

  // Nhóm log theo ngày cho chế độ Timeline
  const groupedLogs = useMemo(() => {
    const groups: Record<string, SystemAuditLogRecord[]> = {};
    paginatedLogs.forEach((log) => {
      let date = "Hôm nay";
      const ts = log.timestamp || "";
      if (ts.includes("Hôm qua")) date = "Hôm qua";
      else if (ts.includes("/")) date = ts.split(" ")[0];
      else if (ts.includes("-")) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) date = d.toLocaleDateString("vi-VN");
      }
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [paginatedLogs]);

  // Options cho SearchableSelect
  const successCount = auditLogs.filter((l) => l.status === "SUCCESS").length;
  const warningCount = auditLogs.filter((l) => l.status === "WARNING").length;
  const failedCount = auditLogs.filter((l) => l.status === "FAILED").length;

  const statusOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Trạng Thái", badge: auditLogs.length },
      { value: "SUCCESS", label: "Thành Công", badge: successCount },
      { value: "WARNING", label: "Cảnh Báo", badge: warningCount },
      { value: "FAILED", label: "Thất Bại / Lỗi", badge: failedCount },
    ],
    [auditLogs.length, successCount, warningCount, failedCount]
  );

  const actionGroupOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất Cả Nghiệp Vụ", badge: auditLogs.length },
      { value: "AUTH", label: "Đăng Nhập / Xác Thực", badge: auditLogs.filter((l) => getActionGroup(l.action) === "AUTH").length },
      { value: "LICENSE", label: "License & Bản Quyền", badge: auditLogs.filter((l) => getActionGroup(l.action) === "LICENSE").length },
      { value: "INVOICE", label: "Hóa Đơn & Thu Phí", badge: auditLogs.filter((l) => getActionGroup(l.action) === "INVOICE").length },
      { value: "MODULE", label: "Cấu Hình & Module", badge: auditLogs.filter((l) => getActionGroup(l.action) === "MODULE").length },
      { value: "STORE", label: "Quán & Chuỗi", badge: auditLogs.filter((l) => getActionGroup(l.action) === "STORE").length },
    ],
    [auditLogs]
  );

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "ALL" || actionGroupFilter !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setActionGroupFilter("ALL");
    setPage(1);
  };

  const handleExportCsv = () => {
    if (downloadCsv) {
      downloadCsv(
        "a2order-nhat-ky-kiem-toan.csv",
        ["ID", "Thời gian", "IP", "Người thực hiện", "Vai trò", "Quán", "Hành động", "Chi tiết", "Trạng thái"],
        filteredLogs.map((l) => [
          l.id,
          l.timestamp,
          l.ipAddress || "",
          l.actor,
          l.actorRole,
          l.storeName || "Toàn hệ thống",
          l.action,
          l.details,
          l.status,
        ])
      );
    }
  };

  const kpiCards = [
    {
      label: "Tổng Sự Kiện Ghi Nhận",
      val: auditLogs.length,
      sub: "Bất biến & truy vết thời gian thực",
      icon: "activity" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
    {
      label: "Thao Tác Thành Công",
      val: successCount,
      sub: "Hệ thống vận hành chính xác",
      icon: "checkCircle" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Cảnh Báo An Ninh",
      val: warningCount,
      sub: warningCount > 0 ? "Cần rà soát quyền hạn người dùng" : "An ninh đạt chuẩn",
      icon: "shield" as const,
      wrapBg: warningCount > 0 ? "bg-amber-50/70 border-amber-200" : "bg-slate-50/50 border-slate-200/80",
      iconBg: warningCount > 0 ? "bg-amber-600 text-white shadow-amber-500/20" : "bg-slate-300 text-slate-700",
      textColor: warningCount > 0 ? "text-amber-800" : "text-slate-800",
    },
    {
      label: "Lỗi Hệ Thống / Thất Bại",
      val: failedCount,
      sub: failedCount > 0 ? "Cần kỹ thuật kiểm tra nhật ký" : "Không có ngoại lệ",
      icon: "alert" as const,
      wrapBg: failedCount > 0 ? "bg-rose-50/70 border-rose-200" : "bg-slate-50/50 border-slate-200/80",
      iconBg: failedCount > 0 ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-300 text-slate-700",
      textColor: failedCount > 0 ? "text-rose-700" : "text-slate-800",
    },
  ];

  return (
    <div className={`flex-1 min-h-0 flex flex-col space-y-3.5 ${isMaximized ? "h-full" : ""}`}>
      {/* KHỐI THỐNG KÊ (MINI DASHBOARD) - ẨN KHI PHÓNG TO HOẶC CUỘN */}
      {!isMaximized && !isScrolled && (
        <section className="shrink-0 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
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
                <Icon name={m.icon} size={16} className="sm:w-5 sm:h-5" />
              </div>
            </article>
          ))}
        </section>
      )}

      {/* DANH SÁCH KIỂM TOÁN & BỘ LỌC */}
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
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 mb-2.5 sm:mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="sm:hidden">Kiểm Toán Hệ Thống</span>
              <span className="hidden sm:inline">Nhật Ký Kiểm Toán & Giám Sát Hệ Thống</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Lưu vết bất biến mọi thao tác quản trị, phân quyền, cấu hình license và đăng nhập
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto flex-wrap">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg">
              {filteredLogs.length} / {auditLogs.length} <span className="hidden sm:inline">sự kiện</span>
            </span>

            {/* View Mode Toggle: Bảng vs Dòng thời gian */}
            <div className="flex items-center p-0.5 rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                  viewMode === "TABLE"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                title="Xem dạng bảng chi tiết"
              >
                <Icon name="grid" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Dạng Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TIMELINE")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                  viewMode === "TIMELINE"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                title="Xem dạng dòng thời gian"
              >
                <Icon name="history" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex h-8 sm:h-9 items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer disabled:opacity-50"
                title="Làm mới dữ liệu kiểm toán"
              >
                <Icon name="refresh" size={13} className={`sm:w-3.5 sm:h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Làm Mới</span>
              </button>
            )}

            {downloadCsv && (
              <button
                type="button"
                onClick={handleExportCsv}
                title="Xuất nhật ký kiểm toán ra CSV"
                aria-label="Xuất CSV"
                className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer shrink-0"
              >
                <Icon name="download" size={14} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

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

        {/* Thanh tìm kiếm & Bộ lọc (SearchableSelect có Search, Trạng thái, Nghiệp vụ) */}
        <div className="shrink-0 space-y-2 sm:space-y-3 mb-2.5 sm:mb-3 p-2 sm:p-3 bg-slate-50/75 rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2.5 items-center">
            {/* Search Input */}
            <div className="relative col-span-2 sm:col-span-2 lg:col-span-6">
              <Icon name="search" className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo IP, người thực hiện, hành động, tên quán..."
                className="w-full h-8 sm:h-9 pl-8 sm:pl-9 pr-3 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Filter Trạng thái */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-3">
              <SearchableSelect
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
                placeholder="Trạng thái"
                searchPlaceholder="Tìm trạng thái..."
                triggerClassName="h-8 sm:h-9 text-[11px] sm:text-xs"
              />
            </div>

            {/* Filter Nghiệp vụ */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={actionGroupOptions}
                value={actionGroupFilter}
                onChange={(val) => {
                  setActionGroupFilter(val);
                  setPage(1);
                }}
                placeholder="Nghiệp vụ"
                searchPlaceholder="Tìm nghiệp vụ..."
                triggerClassName="h-8 sm:h-9 text-[11px] sm:text-xs"
              />
            </div>

            {/* Nút đặt lại bộ lọc */}
            {hasActiveFilters && (
              <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full h-8 sm:h-9 inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 rounded-xl border border-rose-200 bg-rose-50 text-[11px] sm:text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="Xóa tất cả bộ lọc"
                >
                  <Icon name="x" size={12} />
                  <span>Đặt lại</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Khung nội dung bảng hoặc timeline cuộn mượt mà */}
        <div
          onScroll={handleInnerScroll}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-none sm:rounded-xl border-0 sm:border border-slate-100 bg-transparent sm:bg-white"
        >
          {viewMode === "TABLE" ? (
            <>
              <AuditDesktopTable
                paginatedLogs={paginatedLogs}
                onViewDetails={setViewingLog}
              />
              <div className="block lg:hidden">
                <AuditMobileCards
                  paginatedLogs={mobileLogs}
                  onViewDetails={setViewingLog}
                />
                <MobileInfiniteSentinel
                  hasMore={hasMoreLogs}
                  totalCount={filteredLogs.length}
                  visibleCount={visibleLogCount}
                  sentinelRef={logSentinelRef}
                />
              </div>
            </>
          ) : (
            /* TIMELINE VIEW */
            <div className="p-4 sm:p-6 space-y-6 relative before:absolute before:inset-y-6 before:left-8 before:w-0.5 before:bg-slate-200/70">
              {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date} className="relative">
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs py-1.5 mb-3 -ml-2 pl-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black tracking-wide border border-slate-200">
                      <Icon name="calendar" size={12} /> {date}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="relative flex gap-4 group">
                        {/* Dot icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-white shadow-2xs z-10 relative group-hover:scale-105 transition-transform ${
                            log.status === "FAILED"
                              ? "border-rose-200 text-rose-600"
                              : log.status === "WARNING"
                              ? "border-amber-200 text-amber-600"
                              : "border-emerald-200 text-emerald-600"
                          }`}
                        >
                          <Icon name="shield" size={16} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900">{log.action}</span>
                              <span
                                className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                                  log.status === "SUCCESS"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : log.status === "WARNING"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-rose-50 text-rose-700 border border-rose-100"
                                }`}
                              >
                                {log.status}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                              {log.timestamp}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2.5">
                            {log.details}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                              {log.actor} ({log.actorRole})
                            </span>
                            {log.storeName && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {log.storeName}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 font-mono">
                              {log.ipAddress || "Internal"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingLog(log)}
                              className="ml-auto text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
                            >
                              Xem JSON →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {paginatedLogs.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="shield" size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Không có nhật ký nào</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phân trang đồng bộ - Ẩn trên Mobile (< lg) */}
        <div className="shrink-0 pt-2 sm:pt-3 border-t border-slate-100 hidden lg:block">
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))}
            onPageChange={setPage}
            totalItems={filteredLogs.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </Panel>

      {/* MODAL CHI TIẾT JSON */}
      <AuditDetailModal log={viewingLog} onClose={() => setViewingLog(null)} />
    </div>
  );
};
