import React, { useState, useMemo, useEffect } from "react";
import { Button, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { CmsDashboardProps } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { usePersistentState } from "@/hooks/usePersistentState";
import { tableApi } from "@/services/api/tableApi";
import { staffApi } from "@/services/api/staffApi";
import { DashboardCalendarWidget } from "./dashboard/DashboardCalendarWidget";

export const CmsDashboard: React.FC<CmsDashboardProps> = ({ onNavigateTab, currentRole = "STORE_OWNER" }) => {
  const [currentVersion, setCurrentVersion] = useState("v1.0.3");
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAccountant = currentRole === "ACCOUNTANT";
  const isCashier = currentRole === "CASHIER";

  // Lấy storeId thực tế từ phiên đăng nhập
  const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") || localStorage.getItem("a2order_auth_user") : null;
  const storeId = userStr ? JSON.parse(userStr).storeId || "store-bubble-tea" : "store-bubble-tea";

  // Đọc dữ liệu thực từ localStorage của các module khác
  const [bills] = usePersistentState<any[]>("sales_bills_data", []);
  const [tablesZones, setTablesZones] = usePersistentState<any[]>("tables_zones_data", []);
  const [staffList, setStaffList] = usePersistentState<any[]>("staff_list", []);
  const [ingredients] = usePersistentState<any[]>("inventory_ingredients", []);
  const [kdsTickets] = usePersistentState<any[]>("kds_tickets_data", []);

  // Xác định ca làm việc theo thời gian thực
  const now = new Date();
  const currentHour = now.getHours();
  const isMorningCurrent = currentHour >= 6 && currentHour < 14;
  const isEveningCurrent = currentHour >= 14 && currentHour < 23;

  // Slide xem ca làm việc: Vòng lặp vô tận (Infinite Circular Loop)
  const [carouselIndex, setCarouselIndex] = useState<number>(isEveningCurrent ? 2 : 1);
  const [enableTransition, setEnableTransition] = useState<boolean>(true);
  const [isShiftPaused, setIsShiftPaused] = useState<boolean>(false);
  const [autoCloseShift, setAutoCloseShift] = usePersistentState<boolean>("auto_close_shift_enabled", true);

  const activeShift: "MORNING" | "EVENING" =
    carouselIndex === 1 || carouselIndex === 3 ? "MORNING" : "EVENING";

  const goNext = React.useCallback(() => {
    setEnableTransition(true);
    setCarouselIndex((prev) => prev + 1);
  }, []);

  const goPrev = React.useCallback(() => {
    setEnableTransition(true);
    setCarouselIndex((prev) => prev - 1);
  }, []);

  // Xử lý reset vị trí tức thì khi chạm biên clone (đảm bảo vòng lặp vô tận trượt 1 chiều)
  useEffect(() => {
    if (carouselIndex >= 3) {
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setCarouselIndex(1);
      }, 510);
      return () => clearTimeout(timer);
    }
    if (carouselIndex <= 0) {
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setCarouselIndex(2);
      }, 510);
      return () => clearTimeout(timer);
    }
  }, [carouselIndex]);

  // Kích hoạt lại transition sau cú snap tức thì
  useEffect(() => {
    if (!enableTransition) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setEnableTransition(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [enableTransition]);

  // Tự động loop trượt ca làm việc theo vòng tròn tiến tới (mỗi 5s trượt tiếp, dừng khi rê chuột)
  useEffect(() => {
    if (isShiftPaused) return;
    const timer = setInterval(() => {
      goNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isShiftPaused, goNext]);

  const selectShift = (target: "MORNING" | "EVENING") => {
    if (target === activeShift) return;
    goNext();
  };

  const morningStaff = useMemo(() => {
    return staffList.filter((s: any) => s.isActive && (s.shift === "MORNING" || !s.shift));
  }, [staffList]);

  const eveningStaff = useMemo(() => {
    return staffList.filter((s: any) => s.isActive && s.shift === "EVENING");
  }, [staffList]);

  // Tự động đồng bộ sơ đồ bàn thực tế từ Database PostgreSQL
  useEffect(() => {
    tableApi
      .getTableZones(storeId)
      .then((serverZones) => {
        if (Array.isArray(serverZones) && serverZones.length > 0) {
          setTablesZones(serverZones);
        }
      })
      .catch(() => {});
  }, [storeId]);

  // Tự động đồng bộ nhân sự thực tế từ Database PostgreSQL
  useEffect(() => {
    staffApi
      .getStaff({ storeId })
      .then((serverStaff) => {
        if (Array.isArray(serverStaff)) {
          setStaffList(serverStaff);
        }
      })
      .catch(() => {});
  }, [storeId]);

  // Tính các KPI động
  const liveStats = useMemo(() => {
    const totalRevenue = bills.reduce((s: number, b: any) => s + (b.finalAmount || 0), 0);
    const totalOrders = bills.length;
    const discountTotal = bills.reduce((s: number, b: any) => s + (b.discountAmount || 0), 0);
    const vietqrTotal = bills.filter((b: any) => b.paymentMethod === "VIETQR").reduce((s: number, b: any) => s + (b.finalAmount || 0), 0);
    const vietqrPct = totalRevenue > 0 ? Math.round((vietqrTotal / totalRevenue) * 100) : 0;
    const cashTotal = bills.filter((b: any) => b.paymentMethod === "CASH").reduce((s: number, b: any) => s + (b.finalAmount || 0), 0);

    // Tables
    const allTables = tablesZones.flatMap((z: any) => z.tables || []);
    const occupiedTables = allTables.filter((t: any) => t.status === "OCCUPIED" || t.status === "SERVING").length;
    const totalTables = allTables.length;

    // Staff on duty
    const activeStaff = staffList.filter((s: any) => s.isActive).length;

    // Inventory alerts (below min)
    const lowStockCount = ingredients.filter((i: any) => i.currentStock <= (i.minStock || 0)).length;

    // KDS pending tickets
    const pendingTickets = kdsTickets.filter((t: any) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;

    return { totalRevenue, totalOrders, discountTotal, vietqrPct, cashTotal, vietqrTotal, occupiedTables, totalTables, activeStaff, lowStockCount, pendingTickets };
  }, [bills, tablesZones, staffList, ingredients, kdsTickets]);

  // Xử lý Publish bản snapshot cấu hình quán
  const handlePublishChanges = async () => {
    const confirmed = await confirmDialog({
      title: "Áp Dụng Thay Đổi Cho Quán?",
      message:
        "Khi bấm xác nhận, hệ thống sẽ nâng version snapshot của quán lên và phát thông báo cập nhật tới các máy POS/KDS tại quán bạn. Các máy POS và điện thoại nhân viên sẽ tự động nhận menu và giá mới.",
      confirmText: "Áp Dụng Ngay",
      cancelText: "Hủy",
      variant: "primary",
    });

    if (!confirmed) return;

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      const nextVerNum = Number(currentVersion.replace("v1.0.", "")) + 1;
      const nextVer = `v1.0.${nextVerNum}`;
      setCurrentVersion(nextVer);
      setHasUnpublishedChanges(false);
      toast.success(`Đã xuất bản thành công phiên bản ${nextVer}! Các máy POS/KDS tại quán đã nhận cấu hình mới.`);
    }, 800);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(
        isAccountant
          ? "Đã đồng bộ số dư két và dữ liệu doanh thu P&L mới nhất."
          : isCashier
          ? "Đã làm mới danh sách hóa đơn và két tiền ca trực."
          : "Dữ liệu vận hành quán và trạng thái bàn đã được đồng bộ mới nhất."
      );
    }, 600);
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Alert Banner khi có bản nháp chưa Publish (Chỉ hiển thị cho Chủ Quán) */}
      {!isAccountant && !isCashier && hasUnpublishedChanges && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Icon name="alert" size={16} />
            </span>
            <div className="text-xs">
              <span className="font-extrabold">Bạn có thay đổi chưa áp dụng! </span>
              <span className="text-amber-800">
                Các máy phục vụ tại quán vẫn đang dùng cache cũ (bản {currentVersion}). Nhấn "Áp Dụng Thay Đổi" để phát lệnh cập nhật tới POS/KDS.
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white gap-1.5 text-xs font-bold shrink-0 shadow-2xs"
            onClick={handlePublishChanges}
            disabled={isPublishing}
          >
            <Icon name="refresh" size={14} className={isPublishing ? "animate-spin" : ""} />
            <span>{isPublishing ? "Đang xuất bản..." : "Áp Dụng Thay Đổi (Publish)"}</span>
          </Button>
        </div>
      )}

      {/* 2. Hero Header Banner - Chuẩn Sang Trọng Emerald PRO theo từng Role */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Tiêu đề & Trạng thái ca vận hành */}
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

            {/* Quick Live Stats Chips */}
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

          {/* Right: Thao tác nhanh */}
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
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

      {/* 3. Main Dashboard: Cột Trái (Vận hành & Số liệu) + Cột Phải (Đồng hồ, Lịch & Ghi chú) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3.5 sm:gap-5 items-start">
        {/* CỘT TRÁI: VẬN HÀNH & BÁO CÁO */}
        <div className="space-y-3.5 sm:space-y-5 min-w-0">
          {/* Bento Grid: 4 Chỉ Số Cốt Lõi Ca Bán Theo Từng Role */}
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
              {liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "—"} <span className="text-xs font-bold text-slate-400">{liveStats.totalRevenue > 0 ? "" : "chưa có dữ liệu"}</span>
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
              {isAccountant ? "Đối soát" : isCashier ? "Khớp két" : liveStats.totalTables > 0 ? `${liveStats.totalTables > 0 ? Math.round((liveStats.occupiedTables / liveStats.totalTables) * 100) : 0}% lấp đầy` : "—"}
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
                <>{liveStats.vietqrTotal > 0 ? formatCurrency(liveStats.vietqrTotal) : "—"} <span className="text-xs font-bold text-slate-400">{liveStats.vietqrTotal === 0 ? "" : ""}</span></>
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

      {/* 4. Thân Chính: Cảnh Báo Vận Hành Khẩn Cấp & Phân Luồng Trạm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        {/* Cột 1 & 2 */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3.5 sm:gap-5">
          {/* Cảnh báo việc cần xử lý ngay */}
          <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <Icon name="bell" size={15} />
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Cảnh Báo Vận Hành Ca
                  </h3>
                  {liveStats.lowStockCount > 0 && (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {liveStats.lowStockCount} cảnh báo kho
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                  Đồng bộ từ dữ liệu thực tế
                </span>
              </div>

              {liveStats.lowStockCount === 0 && liveStats.pendingTickets === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                    <Icon name="checkCircle" size={20} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Không có cảnh báo</p>
                  <p className="text-xs text-slate-400 mt-0.5">Vận hành ca ổn định</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {liveStats.lowStockCount > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Icon name="alert" size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-900">{liveStats.lowStockCount} nguyên liệu dưới ngưỡng an toàn!</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Cần nhập kho sớm để không gián đoạn chế biến</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (onNavigateTab) onNavigateTab("inventory"); }}
                        className="rounded-xl border border-amber-300 text-amber-900 bg-white hover:bg-amber-50 text-xs px-3.5 py-2 shrink-0 font-black shadow-2xs whitespace-nowrap active:scale-95 transition"
                      >
                        Nhập Kho
                      </button>
                    </div>
                  )}

                  {liveStats.pendingTickets > 0 && (
                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                          <Icon name="kitchen" size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-900">{liveStats.pendingTickets} ticket KDS đang xử lý</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Bếp đang chế biến, theo dõi tại màn hình KDS</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (onNavigateTab) onNavigateTab("kds"); }}
                        className="rounded-xl border border-blue-300 text-blue-900 bg-white hover:bg-blue-50 text-xs px-3.5 py-2 shrink-0 font-black shadow-2xs whitespace-nowrap active:scale-95 transition"
                      >
                        Xem KDS
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Phân Luồng Trạm: KDS Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide truncate">Trạm Bếp Nấu (KDS)</h4>
                </div>
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                  {liveStats.pendingTickets} ticket
                </span>
              </div>
              {liveStats.pendingTickets === 0 ? (
                <div className="py-5 text-center text-slate-400 text-xs">
                  <Icon name="checkCircle" size={18} className="mx-auto mb-1 text-emerald-400" />
                  Bếp trống – Chờ đơn mới
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  {liveStats.pendingTickets} ticket đang xử lý. <button type="button" onClick={() => onNavigateTab?.("kds")} className="text-emerald-700 font-bold underline">Mở KDS →</button>
                </p>
              )}
            </section>

            <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide truncate">Đơn Hàng Ca Bán</h4>
                </div>
                <span className="text-[11px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                  {liveStats.totalOrders} đơn
                </span>
              </div>
              {liveStats.totalOrders === 0 ? (
                <div className="py-5 text-center text-slate-400 text-xs">
                  <Icon name="cart" size={18} className="mx-auto mb-1 text-slate-300" />
                  Chưa có đơn hàng trong ca
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  {liveStats.totalOrders} đơn • {formatCurrency(liveStats.totalRevenue)} doanh thu
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Cột 3: Nhân viên ca này (Dạng Slide Vòng Lặp Vô Tận - Infinite Circular Carousel) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <section
            onMouseEnter={() => setIsShiftPaused(true)}
            onMouseLeave={() => setIsShiftPaused(false)}
            className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs h-full flex flex-col justify-between space-y-2.5"
          >
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header: Tiêu đề + Dots + Nút điều hướng */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide truncate">
                    Nhân Viên Theo Ca
                  </h4>
                  {/* Dots Indicator */}
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 rounded-full transition-all duration-300 ${activeShift === "MORNING" ? "w-3.5 bg-emerald-600" : "w-1.5 bg-slate-300"}`} />
                    <span className={`h-1.5 rounded-full transition-all duration-300 ${activeShift === "EVENING" ? "w-3.5 bg-emerald-600" : "w-1.5 bg-slate-300"}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={goPrev}
                    title="Ca trước"
                    aria-label="Ca trước"
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
                  >
                    <Icon name="chevronLeft" size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    title="Ca tiếp theo"
                    aria-label="Ca tiếp theo"
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
                  >
                    <Icon name="chevronRight" size={13} />
                  </button>
                </div>
              </div>

              {/* Tabs chuyển ca: Đồng bộ chính xác 100% với slide đang hiển thị */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/90 mb-2.5 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => selectShift("MORNING")}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-between gap-1 whitespace-nowrap ${
                    activeShift === "MORNING"
                      ? "bg-white text-slate-900 shadow-2xs font-black ring-1 ring-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isMorningCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                    <span className={activeShift === "MORNING" && isMorningCurrent ? "text-emerald-700 font-black" : "text-slate-700"}>Sáng</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">06:00-14:00</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectShift("EVENING")}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-between gap-1 whitespace-nowrap ${
                    activeShift === "EVENING"
                      ? "bg-white text-slate-900 shadow-2xs font-black ring-1 ring-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isEveningCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                    <span className={activeShift === "EVENING" && isEveningCurrent ? "text-emerald-700 font-black" : "text-slate-700"}>Tối</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">14:00-22:30</span>
                </button>
              </div>

              {/* CAROUSEL VIEWPORT: Track 4 slide vòng lặp vô tận (Luôn trượt vòng tròn tiến tới, không bao giờ bị giật lùi) */}
              <div className="relative overflow-hidden w-full flex-1 min-h-[95px]">
                <div
                  className="flex h-full w-[400%]"
                  style={{
                    transform: `translateX(-${carouselIndex * 25}%)`,
                    transition: enableTransition ? "transform 500ms ease-in-out" : "none",
                  }}
                >
                  {[
                    { type: "EVENING" as const, key: "clone-evening" },
                    { type: "MORNING" as const, key: "real-morning" },
                    { type: "EVENING" as const, key: "real-evening" },
                    { type: "MORNING" as const, key: "clone-morning" },
                  ].map((slide) => {
                    const isMorning = slide.type === "MORNING";
                    const staff = isMorning ? morningStaff : eveningStaff;
                    const isCurrent = isMorning ? isMorningCurrent : isEveningCurrent;

                    return (
                      <div key={slide.key} className="w-1/4 px-1 flex flex-col justify-center shrink-0 overflow-hidden h-[95px]">
                        {staff.length === 0 ? (
                          <div className="h-full rounded-xl bg-slate-50/80 border border-dashed border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Icon name="users" size={13} />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-slate-700 truncate leading-tight">Chưa xếp ca</h5>
                                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">Thu ngân & phục vụ</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onNavigateTab?.("team")}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] transition active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
                            >
                              + Xếp Ca
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 overflow-y-auto max-h-[95px] pr-0.5">
                            {staff.map((s: any) => (
                              <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/90 border border-slate-100 hover:border-slate-200 transition">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg ${isMorning ? "bg-[#102d25]" : "bg-slate-700"} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                                    {s.name?.charAt(0) || "?"}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-xs text-slate-900 truncate leading-tight">{s.name}</h5>
                                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                      {s.role === "STORE_OWNER" ? "Chủ Quán" : s.role === "CASHIER" ? "Thu Ngân" : s.role === "WAITER" ? "Phục Vụ" : s.role === "CHEF" ? "Bếp Trưởng" : s.role}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                                  isCurrent ? "text-emerald-700 bg-emerald-50 border-emerald-100 font-black" : "text-slate-400 bg-slate-100 border-slate-200 font-medium"
                                }`}>
                                  {isCurrent ? "Đang trực" : isMorning ? "Đã xong" : "Chưa tới"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PHẦN AUTO CHỐT CA: Luôn đồng bộ với ca đang hiển thị */}
            <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                    autoCloseShift ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}>
                    <Icon name="clock" size={13} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 whitespace-nowrap">Auto Chốt Ca</span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                        autoCloseShift
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {activeShift === "MORNING" ? "14:00" : "22:30"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {autoCloseShift ? "Tự khóa sổ & kết ca" : "Chưa kích hoạt"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={autoCloseShift}
                  onClick={() => {
                    const nextState = !autoCloseShift;
                    setAutoCloseShift(nextState);
                    if (nextState) {
                      toast.success(`Đã BẬT Auto Chốt Ca (${activeShift === "MORNING" ? "14:00" : "22:30"}). Tự động lưu Z-Report.`);
                    } else {
                      toast.info("Đã TẮT Auto Chốt Ca. Bạn sẽ chốt ca thủ công.");
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoCloseShift ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoCloseShift ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Bottom Action Buttons - Ngắn gọn, không rớt dòng */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("team")}
                  className="py-1.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-98 shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Icon name="users" size={13} className="shrink-0 text-slate-500" />
                  <span className="whitespace-nowrap font-bold">+ NV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.info("Chuyển tới Báo Cáo Doanh Thu & Kiểm Kê Ca Làm Việc (Z-Report)");
                    onNavigateTab?.("analytics");
                  }}
                  className="py-1.5 px-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs font-black text-emerald-800 transition active:scale-98 shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Icon name="checkCircle" size={13} className="shrink-0 text-emerald-600" />
                  <span className="whitespace-nowrap font-black">Chốt Ca</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 5. Biểu Đồ Doanh Thu & Top Món */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
        {/* Doanh Thu Ca (Col 7) */}
        <section className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon name="trending" size={15} />
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  Nhịp Độ Doanh Thu Theo Giờ Trong Ca
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">Biểu đồ đối soát doanh số thực tế</p>
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="trending" size={28} className="text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-500">Chưa có dữ liệu doanh thu</p>
              <p className="text-xs text-slate-400 mt-1">Bắt đầu gọi món và thanh toán để hiện biểu đồ</p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-2 px-1 sm:px-2">
              {(() => {
                const hourlyMap: Record<string, number> = {};
                bills.forEach((b: any) => {
                  const hour = b.closedAt ? b.closedAt.slice(0, 2) + ":00" : "?";
                  hourlyMap[hour] = (hourlyMap[hour] || 0) + (b.finalAmount || 0);
                });
                const slots = Object.entries(hourlyMap).sort(([a], [b]) => a.localeCompare(b));
                const maxVal = Math.max(...slots.map(([, v]) => v), 1);
                return slots.map(([hour, amount]) => {
                  const heightPct = Math.max((amount / maxVal) * 100, 12);
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                      <div className="w-full max-w-[36px] rounded-t-xl bg-emerald-600 hover:bg-emerald-800 transition-all duration-300" style={{ height: `${heightPct}%` }} />
                      <span className="text-[10px] font-bold text-slate-400 mt-2">{hour}</span>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
            <span>Tổng đơn: <strong className="text-slate-800">{liveStats.totalOrders}</strong></span>
            <span>Doanh thu: <strong className="text-slate-800">{liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "—"}</strong></span>
          </div>
        </section>

        {/* Top Món (Col 5) */}
        <section className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Icon name="flame" size={15} />
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Top Món Bán Chạy Trong Ca</h4>
              </div>
              <p className="text-[11px] text-slate-400">Xếp hạng theo số lượng đã phục vụ</p>
            </div>
            <button type="button" onClick={() => onNavigateTab?.("menu")} className="text-xs font-black text-emerald-800 hover:underline">
              Thực đơn →
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon name="flame" size={28} className="text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-500">Chưa có dữ liệu</p>
              <p className="text-xs text-slate-400 mt-1">Top món sẽ hiện khi có đơn hàng</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const dishCount: Record<string, { name: string; sold: number; revenue: number }> = {};
                bills.forEach((b: any) => {
                  (b.items || []).forEach((item: any) => {
                    if (!dishCount[item.name]) dishCount[item.name] = { name: item.name, sold: 0, revenue: 0 };
                    dishCount[item.name].sold += item.quantity || 1;
                    dishCount[item.name].revenue += item.totalPrice || 0;
                  });
                });
                return Object.values(dishCount)
                  .sort((a, b) => b.sold - a.sold)
                  .slice(0, 5)
                  .map((dish, idx) => (
                    <div key={dish.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-500"}`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{dish.name}</p>
                          <p className="text-[10px] text-slate-400">Đã bán {dish.sold}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900 shrink-0">{formatCurrency(dish.revenue)}</span>
                    </div>
                  ));
              })()}
            </div>
          )}
        </section>
      </div>

      {/* 6. Dòng Đơn Gần Nhất */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon name="cart" size={15} />
              </span>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Dòng Đơn Hàng Gọi & Thanh Toán Gần Nhất
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">Theo dõi trạng thái phục vụ và thanh toán các bàn đang ăn</p>
          </div>
          <button type="button" onClick={() => onNavigateTab?.("tables")} className="text-xs font-black text-emerald-800 hover:underline">
            Sơ đồ bàn →
          </button>
        </div>

        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Icon name="cart" size={28} className="text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-500">Chưa có đơn hàng</p>
            <p className="text-xs text-slate-400 mt-1">Đơn hàng mới sẽ hiện ở đây khi được tạo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...bills].reverse().slice(0, 4).map((b: any) => (
              <div key={b.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-2xs transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900">{b.tableName || "—"}</span>
                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {b.status === "COMPLETED" ? "Đã trả tiền" : "Đang ăn"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  {(b.items || []).slice(0, 2).map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                  <span className="font-black text-slate-900">{formatCurrency(b.finalAmount || 0)}</span>
                  <span className="text-[10px] text-slate-400">{b.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </div>

        {/* CỘT PHẢI: ĐỒNG HỒ THỜI GIAN THỰC, LỊCH THÁNG & GHI CHÚ QUAN TRỌNG */}
        <div className="xl:sticky xl:top-1.5 self-start space-y-3 sm:space-y-3.5">
          <DashboardCalendarWidget onNavigateTab={onNavigateTab} />
        </div>
      </div>
    </div>
  );
};
