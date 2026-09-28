import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { CmsDashboardProps } from "@/types";

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
    <div className="space-y-6 animate-fadeIn pb-10">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-ink-primary tracking-tight">
              Tổng Quan Vận Hành Quán
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-surface-muted text-xs font-mono font-bold text-ink-muted border border-surface-border shrink-0">
              Snapshot {currentVersion}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Đang Mở Ca
            </span>
          </div>
          <p className="text-xs text-ink-muted line-clamp-1 sm:line-clamp-none">
            Theo dõi doanh số thời gian thực, bàn ăn đang phục vụ và nhịp vận hành ca.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs border-surface-border text-ink-primary hover:bg-surface-muted flex-1 sm:flex-none whitespace-nowrap h-9"
            onClick={() => toast.info("Đang trích xuất báo cáo doanh thu ca làm việc ra file Excel...")}
          >
            <Icon name="download" className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo</span>
          </Button>

          <Button
            size="sm"
            className="rounded-xl gap-1.5 text-xs bg-brand-900 text-white hover:bg-brand-950 px-3.5 shadow-sm flex-1 sm:flex-none whitespace-nowrap h-9"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab("menu");
              } else {
                setHasUnpublishedChanges(true);
                toast.info("Đã ghi nhận thay đổi vào bản nháp. Nhấn [Áp Dụng Thay Đổi] để đồng bộ ra máy POS.");
              }
            }}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>Cập Nhật Menu</span>
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
    </div>
  );
};
