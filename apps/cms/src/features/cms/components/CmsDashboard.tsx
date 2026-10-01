import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { CmsDashboardProps } from "@/types";
import { formatCurrency } from "@/lib/formatters";

export const CmsDashboard: React.FC<CmsDashboardProps> = ({ onNavigateTab }) => {
  const [currentVersion, setCurrentVersion] = useState("v1.0.3");
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Xử lý Publish bản snapshot cấu hình quán
  const handlePublishChanges = async () => {
    const confirmed = await confirmDialog({
      title: "Áp Dụng Thay Đổi Cho Quán?",
      message:
        "Khi bấm xác nhận, hệ thống sẽ nâng version snapshot của quán lên và phát thông báo cập nhật tới các máy POS/KDS tại quán bạn. Các quán khác trong hệ thống hoàn toàn không bị ảnh hưởng và vẫn ăn cache cũ.",
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

  return (
    <div className="space-y-6 animate-fadeIn pb-16 lg:pb-10">
      {/* 1. Cache Version & Publish Alert Banner */}
      {hasUnpublishedChanges ? (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Icon name="alert" className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold">Bạn có thay đổi chưa áp dụng! </span>
              <span className="text-amber-800">
                Các máy phục vụ tại quán vẫn đang dùng cache cũ (bản {currentVersion}). Nhấn "Áp Dụng Thay Đổi" khi sẵn sàng.
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className="rounded-full bg-amber-700 hover:bg-amber-800 text-white gap-1.5 text-xs font-bold shrink-0 shadow-sm"
            onClick={handlePublishChanges}
            disabled={isPublishing}
          >
            <Icon name="refresh" className="w-3.5 h-3.5" />
            <span>{isPublishing ? "Đang xuất bản..." : "Áp Dụng Thay Đổi (Publish)"}</span>
          </Button>
        </div>
      ) : null}

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Tổng Quan Vận Hành Quán
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-surface-canvas text-ink-muted border border-surface-border font-mono shadow-2xs">
              Snapshot {currentVersion}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Đang Mở Ca
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Theo dõi doanh số thời gian thực, bàn ăn đang phục vụ và nhịp vận hành ca
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-white border-surface-border text-ink-primary hover:bg-surface-canvas font-bold shadow-2xs shrink-0"
            onClick={() => toast.info("Đang trích xuất báo cáo doanh thu ca làm việc ra file Excel...")}
            title="Xuất Báo Cáo"
            aria-label="Xuất Báo Cáo"
          >
            <Icon name="download" className="w-4 h-4 text-ink-muted" />
          </Button>

          <Button
            size="sm"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-brand-950 text-white hover:bg-black font-bold shadow-sm transition-all shrink-0"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab("menu");
              } else {
                setHasUnpublishedChanges(true);
                toast.info("Đã ghi nhận thay đổi vào bản nháp. Nhấn [Áp Dụng Thay Đổi] để đồng bộ ra máy POS.");
              }
            }}
            title="Cập Nhật Menu"
            aria-label="Cập Nhật Menu"
          >
            <Icon name="plus" className="w-4 h-4 text-brand-400" />
          </Button>
        </div>
      </div>

      {/* 3. 4 Thẻ Chỉ Số Cốt Lõi Ca Làm (Bento Grid) - Tỉ lệ chuẩn 2 cột mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Doanh thu ca */}
        <Panel
          variant="featured"
          padding="sm"
          className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] relative overflow-hidden cursor-pointer hover:border-brand-300 hover:shadow-md transition-all group rounded-2xl"
          onClick={() => onNavigateTab?.("analytics")}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-brand-200 truncate">Doanh Thu Ca</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors shrink-0">
              <Icon name="banknote" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                4.850.000
              </span>
              <span className="text-xs text-brand-200 ml-1 font-normal">đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-200 truncate font-medium">
              <span className="truncate">32 đơn</span>
              <span>•</span>
              <span className="text-emerald-300">85% QR</span>
            </div>
          </div>
        </Panel>

        {/* Tỷ lệ bàn */}
        <Panel
          variant="default"
          padding="sm"
          className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] cursor-pointer hover:border-brand-500/40 hover:shadow-md transition-all group rounded-2xl"
          onClick={() => onNavigateTab?.("tables")}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Công Suất Bàn</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted group-hover:bg-brand-100 group-hover:text-brand-900 transition-colors shrink-0">
              <Icon name="table" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
                8
              </span>
              <span className="text-xs text-ink-muted ml-1 font-normal">/ 12 bàn</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="font-semibold text-amber-800">67% khách</span>
              <span>•</span>
              <span className="text-ink-secondary">2 bàn chờ</span>
            </div>
          </div>
        </Panel>

        {/* Bếp KDS */}
        <Panel
          variant="default"
          padding="sm"
          className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] cursor-pointer hover:border-brand-500/40 hover:shadow-md transition-all group rounded-2xl"
          onClick={() => onNavigateTab?.("kds")}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Món Bếp Đang Nấu</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted group-hover:bg-brand-100 group-hover:text-brand-900 transition-colors shrink-0">
              <Icon name="kitchen" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
                7
              </span>
              <span className="text-xs text-ink-muted ml-1 font-normal">món</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted truncate font-medium">
              <span className="truncate">SLA: 8.5p</span>
              <span>•</span>
              <span className="text-emerald-700">Ổn định</span>
            </div>
          </div>
        </Panel>

        {/* Cảnh báo kho & Món tạm hết */}
        <Panel
          variant="default"
          padding="sm"
          className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group rounded-2xl"
          onClick={() => onNavigateTab?.("inventory")}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Cảnh Báo Kho</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 group-hover:scale-105 transition-transform shrink-0">
              <Icon name="alert" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
                2
              </span>
              <span className="text-xs text-ink-muted ml-1 font-normal">cảnh báo</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted truncate font-medium">
              <span className="text-amber-800 font-semibold">1 sắp hết</span>
              <span>•</span>
              <span className="text-ink-muted">1 ngưng</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* 4. Main Body: Cảnh Báo Vận Hành Khẩn + Khung Giờ Cao Điểm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Cảnh Báo Cần Xử Lý Ngay & Phân Trạm Bếp/Bar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cảnh báo việc cần xử lý ngay */}
          <Panel variant="default" padding="lg" className="space-y-3.5 p-3.5 sm:p-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <div className="flex items-center gap-2">
                <Icon name="bell" className="w-4 h-4 text-brand-900" />
                <h3 className="font-bold text-sm text-ink-primary">
                  Cảnh Báo Vận Hành <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full ml-1">3</span>
                </h3>
              </div>
              <span className="hidden sm:inline text-xs text-ink-muted">Tự động cập nhật thời gian thực</span>
            </div>

            <div className="space-y-2">
              {/* Alert 1: Bàn gọi tính tiền */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                    <Icon name="cashier" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-ink-primary truncate">Bàn 202 gọi tính tiền</h5>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded shrink-0">VietQR</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                      Hóa đơn <strong>420.000đ</strong> • Quét 2 phút trước
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl bg-brand-900 hover:bg-brand-950 text-white text-xs px-3 h-8 shrink-0 font-bold shadow-xs whitespace-nowrap"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("tables");
                    toast.success("Đã mở sơ đồ bàn đối soát thanh toán Bàn 202");
                  }}
                >
                  Thu Tiền
                </Button>
              </div>

              {/* Alert 2: Nguyên liệu kho dưới mức tối thiểu */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Icon name="alert" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-ink-primary truncate">Thịt Bò Phi Lê sắp hết!</h5>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded shrink-0">Kho</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                      Tồn <strong>4.5kg</strong> • Ngưỡng an toàn 5.0kg
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-amber-300 text-amber-900 bg-white hover:bg-amber-100 text-xs px-3 h-8 shrink-0 font-bold shadow-xs whitespace-nowrap"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("inventory");
                    toast.info("Chuyển tới phân hệ Kho & Nhập Hàng để tạo phiếu nhập kho NCC");
                  }}
                >
                  Nhập Kho
                </Button>
              </div>

              {/* Alert 3: Khách đặt bàn sắp đến */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-brand-50/70 border border-brand-200/70 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center shrink-0">
                    <Icon name="calendarCheck" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-ink-primary truncate">Khách đặt sắp đến (25p)</h5>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-brand-100 text-brand-900 rounded shrink-0">Đặt Bàn</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                      Anh Tuấn (6 khách) • Bàn 04 VIP (Cọc 500k)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-brand-300 text-brand-900 bg-white hover:bg-brand-100 text-xs px-3 h-8 shrink-0 font-bold shadow-xs whitespace-nowrap"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("reservations");
                    toast.info("Chuyển tới Lịch Đặt Bàn để kiểm tra chỗ ngồi");
                  }}
                >
                  Xem Bàn
                </Button>
              </div>
            </div>
          </Panel>

          {/* Phân Luồng Trạm Chế Biến: Bếp vs Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Panel variant="default" padding="lg" className="space-y-3 p-3.5 sm:p-5">
              <div className="flex items-center justify-between border-b border-surface-border pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <h4 className="font-bold text-xs text-ink-primary uppercase tracking-wide truncate">Trạm Bếp Nấu (KDS)</h4>
                </div>
                <span className="text-xs font-bold text-brand-900 shrink-0 ml-1">5 món chờ</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between gap-2 border border-surface-border">
                  <span className="font-semibold text-ink-primary truncate">Bàn 02: 2x Phở Bò Tái Nạm</span>
                  <span className="text-[11px] font-bold text-amber-700 shrink-0">Nấu (4m)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between gap-2 border border-surface-border">
                  <span className="font-semibold text-ink-primary truncate">Bàn 03: 1x Bún Chả Nướng</span>
                  <span className="text-[11px] font-bold text-emerald-700 shrink-0">Chờ bưng</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between gap-2 border border-surface-border">
                  <span className="font-semibold text-ink-primary truncate">Bàn 201: 1x Lẩu Đuôi Bò</span>
                  <span className="text-[11px] font-bold text-ink-muted shrink-0">Mới gửi (1m)</span>
                </div>
              </div>
            </Panel>

            <Panel variant="default" padding="lg" className="space-y-3 p-3.5 sm:p-5">
              <div className="flex items-center justify-between border-b border-surface-border pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <h4 className="font-bold text-xs text-ink-primary uppercase tracking-wide truncate">Trạm Pha Chế (Bar)</h4>
                </div>
                <span className="text-xs font-bold text-blue-900 shrink-0 ml-1">2 món chờ</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between gap-2 border border-surface-border">
                  <span className="font-semibold text-ink-primary truncate">Bàn 01: 2x Cà Phê Muối</span>
                  <span className="text-[11px] font-bold text-emerald-700 shrink-0">Đã xong</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between gap-2 border border-surface-border">
                  <span className="font-semibold text-ink-primary truncate">Bàn 203: 1x Trà Đào Cam Sả</span>
                  <span className="text-[11px] font-bold text-blue-700 shrink-0">Đang pha (2m)</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* Cột 3: Biểu Đồ Giờ Cao Điểm & Nhân Sự Đang Trong Ca */}
        <div className="space-y-6">
          {/* Biểu đồ giờ cao điểm nhà hàng */}
          <Panel variant="default" padding="lg" className="space-y-3.5 p-3.5 sm:p-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <div>
                <h4 className="font-bold text-xs text-ink-primary uppercase tracking-wide">Giờ Cao Điểm (Rush Hours)</h4>
                <p className="text-[11px] text-ink-muted">Mật độ đơn theo khung giờ</p>
              </div>
              <Icon name="clock" className="w-4 h-4 text-ink-subtle" />
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
                    <span className="text-ink-primary">{slot.time}</span>
                    <span className={slot.isPeak ? "text-brand-900 font-extrabold" : "text-ink-muted"}>
                      {slot.label}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        slot.isPeak ? "bg-brand-900" : "bg-brand-500/60"
                      }`}
                      style={{ width: `${slot.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Nhân sự đang trong ca làm việc */}
          <Panel variant="default" padding="lg" className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <div>
                <h4 className="font-black text-xs text-ink-primary uppercase tracking-wide">Nhân Viên Trong Ca</h4>
                <p className="text-[11px] text-ink-muted">Ca Sáng (06:00 - 14:00)</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-100 text-brand-800">
                3 nhân sự
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-900 text-white flex items-center justify-center font-bold text-xs">
                    H
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-ink-primary">Nguyễn Văn Hùng</h5>
                    <span className="text-[10px] text-ink-muted">Bếp Trưởng • PIN: ••••</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Tại Bếp
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                    L
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-ink-primary">Chị Lan</h5>
                    <span className="text-[10px] text-ink-muted">Thu Ngân Quầy • PIN: ••••</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Tại Két
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-ink-primary">Tuấn Anh</h5>
                    <span className="text-[10px] text-ink-muted">Phục Vụ Bàn • PIN: ••••</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Sàn Tầng 1
                </span>
              </div>
            </div>

            <div className="pt-1">
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl text-xs font-bold text-ink-primary hover:bg-brand-50 hover:text-brand-900 transition-colors"
                onClick={() => {
                  toast.info("Chuyển tới Báo Cáo Doanh Thu & Kiểm Kê Ca Làm Việc (Z-Report)");
                  onNavigateTab?.("analytics");
                }}
              >
                Chốt Ca & Bàn Giao Két Tiền
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      {/* 5. Biểu Đồ Doanh Thu Ca Theo Giờ & Top 5 Món Bán Chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu Đồ Doanh Thu Theo Khung Giờ (Col 7/12) */}
        <Panel variant="default" padding="lg" className="lg:col-span-7 space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="trending" className="w-4 h-4 text-brand-900" />
                <h4 className="font-bold text-sm text-ink-primary">Nhịp Độ Doanh Thu Theo Giờ Trong Ca</h4>
              </div>
              <p className="text-[11px] text-ink-muted">Biểu đồ đối soát doanh số và số lượng order thực tế</p>
            </div>
            <span className="text-[11px] font-bold text-brand-900 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-lg">
              Đỉnh điểm: 12:00 - 13:00
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
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
              const heightPct = Math.max((slot.amount / maxVal) * 100, 10);
              return (
                <div key={slot.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                    <div>{slot.hour}: {formatCurrency(slot.amount)}</div>
                    <div className="text-brand-300 font-normal">{slot.orders} đơn order</div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                      slot.isPeak
                        ? "bg-brand-900 shadow-sm"
                        : "bg-brand-500/70 hover:bg-brand-700"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Hour */}
                  <span className="text-[10px] font-bold text-ink-muted mt-2 group-hover:text-ink-primary">
                    {slot.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs border-t border-surface-border pt-3 text-ink-muted">
            <span>Tổng giờ phục vụ: <strong>7 tiếng</strong></span>
            <span>Trung bình đơn: <strong>151.000đ / bàn</strong></span>
          </div>
        </Panel>

        {/* Top 5 Món Bán Chạy Nhất (Col 5/12) */}
        <Panel variant="default" padding="lg" className="lg:col-span-5 space-y-3.5 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="flame" className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-sm text-ink-primary">Top 5 Món Bán Chạy Trong Ca</h4>
              </div>
              <p className="text-[11px] text-ink-muted">Xếp hạng theo số lượng đĩa/ly đã xuất</p>
            </div>
            <button
              onClick={() => onNavigateTab?.("menu")}
              className="text-xs font-bold text-brand-900 hover:underline"
            >
              Thực đơn →
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { rank: 1, name: "Phở Bò Tái Nạm Gầu", sold: 28, revenue: 1820000, category: "Món Nước", trend: "+12%" },
              { rank: 2, name: "Cà Phê Muối Kem Béo", sold: 34, revenue: 1190000, category: "Đồ Uống", trend: "+25%" },
              { rank: 3, name: "Cơm Tấm Sườn Bì Chả", sold: 19, revenue: 1235000, category: "Cơm Mặn", trend: "+8%" },
              { rank: 4, name: "Bún Chả Nướng Than Hoa", sold: 16, revenue: 960000, category: "Món Nước", trend: "+5%" },
              { rank: 5, name: "Trà Đào Cam Sả Tươi", sold: 22, revenue: 770000, category: "Đồ Uống", trend: "+14%" },
            ].map((dish) => (
              <div
                key={dish.name}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas border border-surface-border hover:border-brand-200 transition-colors"
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
                        : "bg-surface-muted text-ink-muted"
                    }`}
                  >
                    {dish.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink-primary truncate">{dish.name}</p>
                    <p className="text-[10px] text-ink-muted">{dish.category} • Đã bán {dish.sold}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-ink-primary block">{formatCurrency(dish.revenue)}</span>
                  <span className="text-[10px] font-bold text-emerald-700">{dish.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* 6. Bảng Đơn Hàng Gần Nhất (Live Order Stream) */}
      <Panel variant="default" padding="lg" className="space-y-3.5 p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="cart" className="w-4 h-4 text-brand-900" />
              <h4 className="font-bold text-sm text-ink-primary">Dòng Đơn Hàng Vừa Gọi & Thanh Toán Gần Nhất</h4>
            </div>
            <p className="text-[11px] text-ink-muted">Theo dõi trạng thái phục vụ và thanh toán các bàn đang ăn</p>
          </div>
          <button
            onClick={() => onNavigateTab?.("tables")}
            className="text-xs font-bold text-brand-900 hover:underline"
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
              className="p-3 rounded-2xl bg-surface-canvas border border-surface-border hover:border-brand-300 hover:shadow-xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-ink-primary">{ord.table}</span>
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
              <p className="text-[11px] text-ink-muted truncate font-medium">{ord.items}</p>
              <div className="flex items-center justify-between pt-1 border-t border-surface-border text-xs">
                <span className="font-black text-brand-900">{formatCurrency(ord.amount)}</span>
                <span className="text-[10px] text-ink-muted">{ord.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};
