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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Tổng Quan Vận Hành Quán
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-surface-muted text-[11px] font-mono font-bold text-ink-muted border border-surface-border">
              Snapshot {currentVersion}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Đang Mở Ca
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            Theo dõi doanh số thời gian thực, bàn ăn đang phục vụ, cảnh báo nguyên liệu và nhịp vận hành ca làm việc.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-2 text-xs border-surface-border text-ink-primary hover:bg-surface-muted"
            onClick={() => toast.info("Đang trích xuất báo cáo doanh thu ca làm việc ra file Excel...")}
          >
            <Icon name="download" className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo Ca</span>
          </Button>

          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-brand-900 text-white hover:bg-brand-950 px-4 shadow-sm"
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
            <span>Cập Nhật Thực Đơn</span>
          </Button>
        </div>
      </div>

      {/* 3. 4 Thẻ Chỉ Số Cốt Lõi Ca Làm (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu ca */}
        <Panel variant="featured" padding="lg" className="flex flex-col justify-between min-h-[150px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-brand-200">Doanh Thu Ca Hiện Tại</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Icon name="banknote" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight">
              4.850.000 đ
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-brand-200">
              <span className="font-bold">32 đơn hoàn tất</span>
              <span>•</span>
              <span className="font-semibold text-emerald-300">85% VietQR</span>
            </div>
          </div>
        </Panel>

        {/* Tỷ lệ bàn */}
        <Panel
          variant="default"
          padding="lg"
          className="flex flex-col justify-between min-h-[150px] cursor-pointer hover:border-brand-500/40 hover:shadow-md transition-all group"
          onClick={() => onNavigateTab?.("tables")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-ink-muted">Công Suất Phục Vụ Bàn</span>
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted group-hover:bg-brand-100 group-hover:text-brand-900 transition-colors">
              <Icon name="table" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-ink-primary tracking-tight">
              8 <span className="text-lg text-ink-muted font-bold">/ 12 bàn</span>
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
              <span className="font-extrabold text-amber-700">67% đang có khách</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">2 bàn chờ tính tiền</span>
            </div>
          </div>
        </Panel>

        {/* Bếp KDS */}
        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[150px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-ink-muted">Món Đang Nấu Tại Bếp</span>
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted">
              <Icon name="kitchen" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-ink-primary tracking-tight">
              7 <span className="text-lg text-ink-muted font-bold">món</span>
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-ink-muted">
              <span className="font-bold text-brand-900">SLA chờ TB: 8.5 phút</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Bếp ổn định</span>
            </div>
          </div>
        </Panel>

        {/* Cảnh báo kho & Món tạm hết */}
        <Panel
          variant="default"
          padding="lg"
          className="flex flex-col justify-between min-h-[150px] cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
          onClick={() => onNavigateTab?.("inventory")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-ink-muted">Cảnh Báo Kho & Tạm Hết Hàng</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 group-hover:scale-105 transition-transform">
              <Icon name="alert" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-rose-600 tracking-tight">
              2 <span className="text-lg text-ink-muted font-bold">cảnh báo</span>
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-ink-muted">
              <span className="font-bold text-rose-700">1 nguyên liệu sắp hết</span>
              <span>•</span>
              <span className="font-semibold text-ink-muted">1 món tạm ngưng</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* 4. Main Body: Cảnh Báo Vận Hành Khẩn + Khung Giờ Cao Điểm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Cảnh Báo Cần Xử Lý Ngay & Phân Trạm Bếp/Bar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cảnh báo việc cần xử lý ngay */}
          <Panel variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <Icon name="bell" className="w-4 h-4 text-brand-900" />
                <h3 className="font-black text-sm text-ink-primary">Cảnh Báo Vận Hành Cần Xử Lý Ngay</h3>
              </div>
              <span className="text-[11px] text-ink-muted font-semibold">Tự động cập nhật thời gian thực</span>
            </div>

            <div className="space-y-2.5">
              {/* Alert 1: Bàn gọi tính tiền */}
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Icon name="cashier" className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-rose-950">Bàn 202 gọi tính tiền (Chờ xác nhận VietQR)</h5>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Hóa đơn: <strong>420.000 đ</strong> • Khách đã quét mã VietQR tại bàn cách đây 2 phút
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs px-3.5 shrink-0"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("tables");
                    toast.success("Đã mở sơ đồ bàn đối soát thanh toán Bàn 202");
                  }}
                >
                  Xác Nhận Thu Tiền
                </Button>
              </div>

              {/* Alert 2: Nguyên liệu kho dưới mức tối thiểu */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Icon name="alert" className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-amber-950">Kho nguyên liệu: Thịt Bò Phi Lê Tươi sắp hết!</h5>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Tồn kho còn <strong>4.5 kg</strong> (Định mức an toàn tối thiểu là 5.0 kg)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-100 text-xs px-3.5 shrink-0"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("inventory");
                    toast.info("Chuyển tới phân hệ Kho & Nhập Hàng để tạo phiếu nhập kho NCC");
                  }}
                >
                  Nhập Kho Ngay
                </Button>
              </div>

              {/* Alert 3: Khách đặt bàn sắp đến */}
              <div className="p-3.5 rounded-2xl bg-brand-50/80 border border-brand-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center shrink-0">
                    <Icon name="calendarCheck" className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-brand-950">Khách đặt bàn sắp đến trong 25 phút tới</h5>
                    <p className="text-[11px] text-brand-800 mt-0.5">
                      Anh Hoàng Tuấn • <strong>6 khách</strong> • Đã gán trước <strong>Bàn 04 VIP</strong> (Đã cọc 500k)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-brand-300 text-brand-900 hover:bg-brand-100 text-xs px-3.5 shrink-0"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("reservations");
                    toast.info("Chuyển tới Lịch Đặt Bàn để kiểm tra chỗ ngồi");
                  }}
                >
                  Xem Bàn Ăn
                </Button>
              </div>
            </div>
          </Panel>

          {/* Phân Luồng Trạm Chế Biến: Bếp vs Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel variant="default" padding="lg" className="space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h4 className="font-black text-xs text-ink-primary uppercase tracking-wide">Trạm Bếp Nấu (Kitchen KDS)</h4>
                </div>
                <span className="text-xs font-black text-brand-900">5 món chờ</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between border border-surface-border">
                  <span className="font-bold text-ink-primary">Bàn 02: 2x Phở Bò Tái Nạm</span>
                  <span className="text-[11px] font-bold text-amber-700">Đang nấu (4m)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between border border-surface-border">
                  <span className="font-bold text-ink-primary">Bàn 03: 1x Bún Chả Nướng Đặc Biệt</span>
                  <span className="text-[11px] font-bold text-emerald-700">Đã xong (Chờ bưng)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between border border-surface-border">
                  <span className="font-bold text-ink-primary">Bàn 201: 1x Lẩu Đuôi Bò Nồi Đất</span>
                  <span className="text-[11px] font-bold text-ink-muted">Mới gửi (1m)</span>
                </div>
              </div>
            </Panel>

            <Panel variant="default" padding="lg" className="space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h4 className="font-black text-xs text-ink-primary uppercase tracking-wide">Trạm Pha Chế (Bar Station)</h4>
                </div>
                <span className="text-xs font-black text-blue-900">2 món chờ</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between border border-surface-border">
                  <span className="font-bold text-ink-primary">Bàn 01: 2x Cà Phê Muối Xứ Huế</span>
                  <span className="text-[11px] font-bold text-emerald-700">Đã pha xong</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-canvas flex items-center justify-between border border-surface-border">
                  <span className="font-bold text-ink-primary">Bàn 203: 1x Trà Đào Cam Sả Ít Đá</span>
                  <span className="text-[11px] font-bold text-blue-700">Đang lắc (2m)</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* Cột 3: Biểu Đồ Giờ Cao Điểm & Nhân Sự Đang Trong Ca */}
        <div className="space-y-6">
          {/* Biểu đồ giờ cao điểm nhà hàng */}
          <Panel variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h4 className="font-black text-xs text-ink-primary uppercase tracking-wide">Khung Giờ Cao Điểm (Rush Hours)</h4>
                <p className="text-[11px] text-ink-muted">Mật độ đơn theo khung giờ trong ngày</p>
              </div>
              <Icon name="clock" className="w-4 h-4 text-ink-subtle" />
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { time: "06:30 - 08:30 (Ăn Sáng)", percent: 80, isPeak: true, label: "Đông nghẹt" },
                { time: "08:30 - 11:30 (Cà Phê Sáng)", percent: 45, isPeak: false, label: "Ổn định" },
                { time: "11:30 - 13:30 (Ăn Trưa Công Sở)", percent: 95, isPeak: true, label: "Đỉnh điểm ca trưa" },
                { time: "13:30 - 17:30 (Nghỉ Giữa Ca)", percent: 25, isPeak: false, label: "Thấp điểm" },
                { time: "17:30 - 21:00 (Ăn Tối & Nhậu)", percent: 85, isPeak: true, label: "Đông đúc" },
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
                className="w-full rounded-xl text-xs font-bold text-ink-primary"
                onClick={() => toast.info("Mở chức năng kiểm kê tiền két & Chốt ca Z-Report")}
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
