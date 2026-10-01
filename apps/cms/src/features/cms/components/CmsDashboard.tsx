import React, { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { CmsDashboardProps } from "@/types";
import { formatCurrency } from "@/lib/formatters";

export const CmsDashboard: React.FC<CmsDashboardProps> = ({ onNavigateTab, currentRole = "STORE_OWNER" }) => {
  const [currentVersion, setCurrentVersion] = useState("v1.0.3");
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAccountant = currentRole === "ACCOUNTANT";
  const isCashier = currentRole === "CASHIER";

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
                {isAccountant
                  ? "Phân Hệ Kế Toán & Quản Trị Tài Chính"
                  : isCashier
                  ? "Ca Thu Ngân Đang Hoạt Động"
                  : "Ca Đang Hoạt Động"}
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate font-mono">
                {isAccountant ? "Sổ Quỹ Kế Toán" : isCashier ? "Két Ca #02" : `Snapshot ${currentVersion}`}
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              {isAccountant
                ? "Sổ Quỹ & Tổng Quan Dòng Tiền"
                : isCashier
                ? "Tổng Kết Két Tiền & Doanh Số Ca Trực"
                : "Trung Tâm Điều Hành & Vận Hành Quán"}
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              {isAccountant
                ? "Theo dõi doanh thu thực thu, tiền mặt két vs chuyển khoản VietQR, giá vốn hàng bán và kết ca kế toán."
                : isCashier
                ? "Kiểm tra số hóa đơn đã xuất trong ca, số tiền đã thu, tiền tip và chuẩn bị bàn giao ca thu ngân."
                : "Theo dõi doanh số thời gian thực, bàn ăn đang phục vụ, tiến độ bếp KDS và điều phối ca làm."}
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              {isAccountant ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="banknote" size={12} className="text-emerald-300" />
                    <span>Thực thu: 4.850.000đ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="cashier" size={12} className="text-amber-300" />
                    <span>Tiền mặt két: 1.250.000đ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="vietqr" size={12} className="text-teal-300" />
                    <span>VietQR / CK: 3.600.000đ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="trending" size={12} className="text-blue-300" />
                    <span>Tỷ suất lãi gộp: ~68.5%</span>
                  </span>
                </>
              ) : isCashier ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="checkCircle" size={12} className="text-emerald-300" />
                    <span>32 Đơn đã thanh toán</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="banknote" size={12} className="text-amber-300" />
                    <span>Két tiền: 1.250.000đ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="clock" size={12} className="text-rose-300" />
                    <span>3 Bàn chờ tính tiền</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="history" size={12} className="text-blue-300" />
                    <span>Mở két lúc 07:30</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="table" size={12} className="text-emerald-300" />
                    <span>8/12 Bàn có khách (67%)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="kitchen" size={12} className="text-amber-300" />
                    <span>7 Món đang nấu (SLA 8.5p)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="banknote" size={12} className="text-teal-300" />
                    <span>4.850.000đ • 32 đơn</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                    <Icon name="activity" size={12} className="text-blue-300" />
                    <span>3/3 Trạm POS/KDS online</span>
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

      {/* 3. Bento Grid: 4 Chỉ Số Cốt Lõi Ca Bán Theo Từng Role */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1 */}
        <article
          onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "staff_order" : "analytics")}
          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-emerald-200 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="banknote" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              +18.5%
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              {isAccountant ? "Doanh Thu Thực Thu" : isCashier ? "Doanh Thu Trong Ca" : "Doanh Thu Ca Bán"}
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              4.850.000 <span className="text-xs font-bold text-slate-400">đ</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              32 đơn • <span className="text-emerald-600 font-bold">85% VietQR</span>
            </p>
          </div>
        </article>

        {/* Metric 2 */}
        <article
          onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "staff_order" : "tables")}
          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-blue-200 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon name={isAccountant || isCashier ? "cashier" : "table"} size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              {isAccountant ? "Đối soát két" : isCashier ? "Khớp sổ két" : "67% lấp đầy"}
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              {isAccountant || isCashier ? "Tiền Mặt Tại Két" : "Công Suất Bàn Ăn"}
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {isAccountant || isCashier ? (
                <>1.250.000 <span className="text-xs font-bold text-slate-400">đ</span></>
              ) : (
                <>8 <span className="text-xs font-bold text-slate-400">/ 12 bàn</span></>
              )}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              {isAccountant || isCashier ? "Đã kiểm đếm đầu ca & thực tế" : "2 bàn chờ thanh toán • 2 bàn trống"}
            </p>
          </div>
        </article>

        {/* Metric 3 */}
        <article
          onClick={() => onNavigateTab?.(isAccountant ? "analytics" : isCashier ? "tables" : "kds")}
          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-amber-200 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Icon name={isAccountant ? "vietqr" : isCashier ? "clock" : "kitchen"} size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
              {isAccountant ? "Tự động" : isCashier ? "Cần in bill" : "SLA 8.5p"}
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              {isAccountant ? "Chuyển Khoản & VietQR" : isCashier ? "Bàn Chờ Thanh Toán" : "Bếp Nấu & Pha Chế (KDS)"}
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {isAccountant ? (
                <>3.600.000 <span className="text-xs font-bold text-slate-400">đ</span></>
              ) : isCashier ? (
                <>3 <span className="text-xs font-bold text-slate-400">bàn gọi bill</span></>
              ) : (
                <>7 <span className="text-xs font-bold text-slate-400">món đang nấu</span></>
              )}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              {isAccountant
                ? "Tài khoản nhận tiền VietQR động"
                : isCashier
                ? "Bàn 101, Bàn 202, Bàn 204"
                : "5 món bếp chảo • 2 món quầy bar"}
            </p>
          </div>
        </article>

        {/* Metric 4 */}
        <article
          onClick={() => onNavigateTab?.(isAccountant ? "inventory" : isCashier ? "staff_order" : "inventory")}
          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md hover:border-rose-200 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Icon name={isAccountant ? "fileText" : isCashier ? "vietqr" : "alert"} size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
              {isAccountant ? "31.3% Doanh số" : isCashier ? "Không tiền mặt" : "Cần xử lý"}
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              {isAccountant ? "Giá Vốn Hàng Bán (COGS)" : isCashier ? "Tỷ Lệ Quét VietQR" : "Cảnh Báo Tồn Kho"}
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {isAccountant ? (
                <>1.520.000 <span className="text-xs font-bold text-slate-400">đ</span></>
              ) : isCashier ? (
                <>74.2 <span className="text-xs font-bold text-slate-400">%</span></>
              ) : (
                <>2 <span className="text-xs font-bold text-slate-400">cảnh báo</span></>
              )}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              {isAccountant
                ? "Dựa trên định lượng BOM và phiếu nhập"
                : isCashier
                ? "Khách quét mã chuyển khoản nhanh"
                : "1 nguyên liệu sắp cạn • 1 tạm dừng"}
            </p>
          </div>
        </article>
      </section>

      {/* 4. Thân Chính: Cảnh Báo Vận Hành Khẩn Cấp & Phân Luồng Trạm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Cột 1 & 2: Cảnh Báo Cần Xử Lý Ngay & Phân Trạm Bếp/Bar */}
        <div className="lg:col-span-2 space-y-3.5 sm:space-y-5">
          {/* Cảnh báo việc cần xử lý ngay */}
          <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Icon name="bell" size={15} />
                </span>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  Cảnh Báo Vận Hành Ca
                </h3>
                <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  3 việc cần xử lý
                </span>
              </div>
              <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                Tự động đồng bộ thời gian thực
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Alert 1: Bàn gọi tính tiền */}
              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Icon name="cashier" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-slate-900 truncate">Bàn 202 gọi tính tiền</h5>
                      <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded shrink-0">VietQR</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Hóa đơn <strong>420.000đ</strong> • Khách yêu cầu 2 phút trước
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("tables");
                    toast.success("Đang mở sơ đồ bàn đối soát thanh toán Bàn 202");
                  }}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-2 shrink-0 font-black shadow-2xs whitespace-nowrap active:scale-95 transition"
                >
                  Thu Tiền
                </button>
              </div>

              {/* Alert 2: Nguyên liệu kho dưới mức tối thiểu */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Icon name="alert" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-slate-900 truncate">Thịt Bò Phi Lê sắp hết!</h5>
                      <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded shrink-0">Kho Hàng</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Tồn <strong>4.5kg</strong> • Ngưỡng an toàn tối thiểu 5.0kg
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("inventory");
                    toast.info("Chuyển tới phân hệ Kho & Nhập Hàng");
                  }}
                  className="rounded-xl border border-amber-300 text-amber-900 bg-white hover:bg-amber-50 text-xs px-3.5 py-2 shrink-0 font-black shadow-2xs whitespace-nowrap active:scale-95 transition"
                >
                  Nhập Kho
                </button>
              </div>

              {/* Alert 3: Khách đặt bàn sắp đến */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Icon name="calendarCheck" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-slate-900 truncate">Khách đặt bàn sắp đến (25p)</h5>
                      <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded shrink-0">Đặt Bàn</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Anh Tuấn (6 khách) • Bàn 04 VIP (Đã cọc 500k)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("reservations");
                    toast.info("Chuyển tới Lịch Đặt Bàn");
                  }}
                  className="rounded-xl border border-emerald-300 text-emerald-900 bg-white hover:bg-emerald-50 text-xs px-3.5 py-2 shrink-0 font-black shadow-2xs whitespace-nowrap active:scale-95 transition"
                >
                  Xem Bàn
                </button>
              </div>
            </div>
          </section>

          {/* Phân Luồng Trạm Chế Biến: Bếp Nấu KDS vs Quầy Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Trạm Bếp */}
            <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide truncate">Trạm Bếp Nấu (KDS)</h4>
                </div>
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                  5 món chờ
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 border border-slate-100">
                  <span className="font-bold text-slate-800 truncate">Bàn 02: 2x Phở Bò Tái Nạm</span>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">Nấu (4m)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 border border-slate-100">
                  <span className="font-bold text-slate-800 truncate">Bàn 03: 1x Bún Chả Nướng</span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">Chờ bưng</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 border border-slate-100">
                  <span className="font-bold text-slate-800 truncate">Bàn 201: 1x Lẩu Đuôi Bò</span>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Mới gửi (1m)</span>
                </div>
              </div>
            </section>

            {/* Trạm Quầy Pha Chế */}
            <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide truncate">Trạm Pha Chế (Bar)</h4>
                </div>
                <span className="text-[11px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                  2 món chờ
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 border border-slate-100">
                  <span className="font-bold text-slate-800 truncate">Bàn 01: 2x Cà Phê Muối</span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">Đã xong</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 border border-slate-100">
                  <span className="font-bold text-slate-800 truncate">Bàn 203: 1x Trà Đào Cam Sả</span>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">Đang pha (2m)</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Cột 3: Khung Giờ Cao Điểm & Nhân Viên Đang Trực Ca */}
        <div className="space-y-3.5 sm:space-y-5">
          {/* Biểu đồ mật độ giờ cao điểm */}
          <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div>
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">Giờ Cao Điểm (Rush Hours)</h4>
                <p className="text-[11px] text-slate-400">Mật độ order theo khung giờ</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <Icon name="clock" size={15} />
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { time: "06:30 - 08:30 (Sáng)", percent: 80, isPeak: true, label: "Đông khách" },
                { time: "08:30 - 11:30 (Cà phê)", percent: 45, isPeak: false, label: "Ổn định" },
                { time: "11:30 - 13:30 (Trưa)", percent: 95, isPeak: true, label: "Đỉnh điểm" },
                { time: "13:30 - 17:30 (Chiều)", percent: 25, isPeak: false, label: "Thấp điểm" },
                { time: "17:30 - 21:00 (Tối)", percent: 85, isPeak: true, label: "Đông đúc" },
              ].map((slot, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-800">{slot.time}</span>
                    <span className={slot.isPeak ? "text-emerald-700 font-extrabold" : "text-slate-400"}>
                      {slot.label}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        slot.isPeak ? "bg-emerald-600" : "bg-emerald-400/60"
                      }`}
                      style={{ width: `${slot.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Nhân sự đang trực ca */}
          <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">Nhân Viên Trực Ca</h4>
                <p className="text-[11px] text-slate-400">Ca Sáng (06:00 - 14:00)</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                3 nhân sự
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-xs">
                    H
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Nguyễn Văn Hùng</h5>
                    <span className="text-[10px] text-slate-400">Bếp Trưởng • PIN: ••••</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Tại Bếp
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                    L
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Chị Lan</h5>
                    <span className="text-[10px] text-slate-400">Thu Ngân Quầy • PIN: ••••</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Tại Két
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs">
                    A
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Tuấn Anh</h5>
                    <span className="text-[10px] text-slate-400">Phục Vụ Bàn • PIN: ••••</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Sàn Bàn
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  toast.info("Chuyển tới Báo Cáo Doanh Thu & Kiểm Kê Ca Làm Việc (Z-Report)");
                  onNavigateTab?.("analytics");
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 transition active:scale-98 shadow-2xs"
              >
                Chốt Ca & Bàn Giao Két Tiền
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* 5. Biểu Đồ Doanh Thu Ca & Top Món Bán Chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
        {/* Biểu Đồ Doanh Thu (Col 7/12) */}
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
              <p className="text-[11px] text-slate-400">Biểu đồ đối soát doanh số và số lượng order thực tế</p>
            </div>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg">
              Đỉnh điểm: 12:00 - 13:00
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-2 px-1 sm:px-2">
            {[
              { hour: "07:00", amount: 320000, orders: 4, isPeak: false },
              { hour: "08:00", amount: 650000, orders: 8, isPeak: false },
              { hour: "09:00", amount: 480000, orders: 5, isPeak: false },
              { hour: "10:00", amount: 390000, orders: 3, isPeak: false },
              { hour: "11:00", amount: 890000, orders: 11, isPeak: false },
              { hour: "12:00", amount: 1450000, orders: 18, isPeak: true },
              { hour: "13:00", amount: 670000, orders: 7, isPeak: false },
            ].map((slot) => {
              const maxVal = 1450000;
              const heightPct = Math.max((slot.amount / maxVal) * 100, 12);
              return (
                <div key={slot.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                  {/* Tooltip hover */}
                  <div className="absolute -top-11 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                    <div>{slot.hour}: {formatCurrency(slot.amount)}</div>
                    <div className="text-emerald-300 font-normal">{slot.orders} đơn order</div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                      slot.isPeak
                        ? "bg-emerald-800 shadow-sm"
                        : "bg-emerald-500/70 hover:bg-emerald-600"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Hour */}
                  <span className="text-[10px] font-bold text-slate-400 mt-2 group-hover:text-slate-900">
                    {slot.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
            <span>Tổng thời gian ca: <strong className="text-slate-800">7 giờ</strong></span>
            <span>Giá trị TB / bàn: <strong className="text-slate-800">151.000đ</strong></span>
          </div>
        </section>

        {/* Top 5 Món Bán Chạy (Col 5/12) */}
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
            <button
              type="button"
              onClick={() => onNavigateTab?.("menu")}
              className="text-xs font-black text-emerald-800 hover:underline"
            >
              Thực đơn →
            </button>
          </div>

          <div className="space-y-2">
            {[
              { rank: 1, name: "Phở Bò Tái Nạm Gầu", sold: 28, revenue: 1820000, category: "Món Nước", trend: "+12%" },
              { rank: 2, name: "Cà Phê Muối Kem Béo", sold: 34, revenue: 1190000, category: "Đồ Uống", trend: "+25%" },
              { rank: 3, name: "Cơm Tấm Sườn Bì Chả", sold: 19, revenue: 1235000, category: "Cơm Mặn", trend: "+8%" },
              { rank: 4, name: "Bún Chả Nướng Than Hoa", sold: 16, revenue: 960000, category: "Món Nước", trend: "+5%" },
              { rank: 5, name: "Trà Đào Cam Sả Tươi", sold: 22, revenue: 770000, category: "Đồ Uống", trend: "+14%" },
            ].map((dish) => (
              <div
                key={dish.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      dish.rank === 1
                        ? "bg-amber-400 text-amber-950 shadow-2xs"
                        : dish.rank === 2
                        ? "bg-slate-200 text-slate-800"
                        : dish.rank === 3
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {dish.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{dish.name}</p>
                    <p className="text-[10px] text-slate-400">{dish.category} • Đã bán {dish.sold}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 block">{formatCurrency(dish.revenue)}</span>
                  <span className="text-[10px] font-bold text-emerald-700">{dish.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 6. Dòng Đơn Hàng Gần Nhất (Live Order Stream) */}
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
          <button
            type="button"
            onClick={() => onNavigateTab?.("tables")}
            className="text-xs font-black text-emerald-800 hover:underline"
          >
            Sơ đồ bàn →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: "ord-881", table: "Bàn 04", time: "1 phút trước", amount: 260000, items: "2x Phở Bò, 1x Trà Đào", status: "COOKING", payMethod: "VietQR" },
            { id: "ord-880", table: "Bàn 02", time: "5 phút trước", amount: 185000, items: "1x Cơm Tấm, 1x Cafe Muối", status: "SERVED", payMethod: "Tiền mặt" },
            { id: "ord-879", table: "Mang Về #12", time: "8 phút trước", amount: 130000, items: "2x Cà Phê Muối", status: "PAID", payMethod: "VietQR" },
            { id: "ord-878", table: "Bàn VIP 01", time: "15 phút trước", amount: 850000, items: "1x Lẩu Đuôi Bò, 4x Bia", status: "SERVED", payMethod: "Chờ thanh toán" },
          ].map((ord) => (
            <div
              key={ord.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-2xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">{ord.table}</span>
                <span
                  className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md ${
                    ord.status === "COOKING"
                      ? "bg-amber-100 text-amber-800"
                      : ord.status === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {ord.status === "COOKING" ? "Bếp nấu" : ord.status === "PAID" ? "Đã trả tiền" : "Đang ăn"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium">{ord.items}</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="font-black text-slate-900">{formatCurrency(ord.amount)}</span>
                <span className="text-[10px] text-slate-400">{ord.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
