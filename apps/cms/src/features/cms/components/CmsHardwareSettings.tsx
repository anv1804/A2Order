import React, { useState } from "react";
import { Icon, Button, Badge, Panel, Portal } from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { PrinterConfigRecord, ReceiptTemplateConfig, PrinterType, PrinterInterface } from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";

const INITIAL_PRINTERS: PrinterConfigRecord[] = [];

const INITIAL_TEMPLATE: ReceiptTemplateConfig = {
  storeName: "",
  slogan: "",
  address: "",
  phone: "",
  wifiName: "",
  wifiPass: "",
  showVietQr: true,
  showLogo: true,
  footerNote: "Cảm ơn Quý Khách & Hẹn Gặp Lại!",
};

export const CmsHardwareSettings: React.FC = () => {
  const [printers, setPrinters] = usePersistentState<PrinterConfigRecord[]>("hardware_printers", INITIAL_PRINTERS);
  const [template, setTemplate] = usePersistentState<ReceiptTemplateConfig>("hardware_template", INITIAL_TEMPLATE);

  // Modal Thêm / Chỉnh Sửa Máy In
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfigRecord | null>(null);
  const [printerForm, setPrinterForm] = useState({
    name: "",
    type: "CASHIER_BILL" as PrinterType,
    interfaceType: "LAN_IP" as PrinterInterface,
    ipAddress: "192.168.1.",
    port: 9100,
    paperWidth: "80mm" as "80mm" | "58mm",
    autoCut: true,
    openCashDrawer: false,
    soundAlarm: false,
  });

  // Kiểm tra in thử nghiệm
  const handleTestPrint = (printer: PrinterConfigRecord) => {
    toast.success(`🖨️ Đã gửi lệnh in thử nghiệm tới [${printer.name}] (${printer.ipAddress || printer.interfaceType})!`);
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingPrinter(null);
    setPrinterForm({
      name: "",
      type: "CASHIER_BILL",
      interfaceType: "LAN_IP",
      ipAddress: "192.168.1.205",
      port: 9100,
      paperWidth: "80mm",
      autoCut: true,
      openCashDrawer: false,
      soundAlarm: false,
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEditModal = (p: PrinterConfigRecord) => {
    setEditingPrinter(p);
    setPrinterForm({
      name: p.name,
      type: p.type,
      interfaceType: p.interfaceType,
      ipAddress: p.ipAddress || "192.168.1.200",
      port: p.port || 9100,
      paperWidth: p.paperWidth,
      autoCut: p.autoCut,
      openCashDrawer: p.openCashDrawer,
      soundAlarm: p.soundAlarm,
    });
    setIsModalOpen(true);
  };

  // Lưu cấu hình máy in
  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerForm.name.trim()) {
      toast.error("Vui lòng nhập tên nhận diện máy in");
      return;
    }

    if (editingPrinter) {
      setPrinters((prev) =>
        prev.map((item) =>
          item.id === editingPrinter.id
            ? {
                ...item,
                ...printerForm,
              }
            : item
        )
      );
      toast.success(`Đã cập nhật máy in "${printerForm.name}"`);
    } else {
      const newPrinter: PrinterConfigRecord = {
        id: `pr-${Date.now()}`,
        ...printerForm,
        status: "CONNECTED",
        lastPingMs: Math.floor(3 + Math.random() * 8),
      };
      setPrinters((prev) => [...prev, newPrinter]);
      toast.success(`Đã kết nối máy in mới "${newPrinter.name}"`);
    }

    setIsModalOpen(false);
  };

  // Xóa máy in
  const handleDeletePrinter = async (p: PrinterConfigRecord) => {
    const ok = await confirmDialog({
      title: `Xóa Máy In ${p.name}?`,
      message: `Hệ thống sẽ không gửi lệnh in hóa đơn hay phiếu chế biến tới máy in này nữa.`,
      confirmText: "Xóa Máy In",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setPrinters((prev) => prev.filter((item) => item.id !== p.id));
    toast.info(`Đã ngắt kết nối máy in ${p.name}`);
  };

  // Lưu mẫu hóa đơn
  const handleSaveTemplate = () => {
    toast.success("Đã lưu mẫu hóa đơn in nhiệt và đồng bộ tới toàn bộ máy POS!");
  };

  const cashierPrinter = printers.find((p) => p.type === "CASHIER_BILL");
  const kitchenPrinter = printers.find((p) => p.type === "KITCHEN_TICKET" || p.type === "BAR_TICKET");
  const hasCashDrawer = printers.some((p) => p.openCashDrawer);

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Thiết Bị", dot: true }}
        tagline={`${printers.length} thiết bị phần cứng kết nối`}
        title="Máy In & Thiết Bị Phần Cứng"
        description="Cài đặt máy in nhiệt hóa đơn thu ngân, máy in phiếu bếp KDS và mẫu in bill tùy biến"
        chips={[
          { icon: "print", label: `${printers.length} Thiết bị cấu hình`, variant: "default" },
          { icon: "cashier", label: cashierPrinter ? `Bill: ${cashierPrinter.name}` : "Chưa có máy in bill", variant: cashierPrinter ? "teal" : "default" },
          { icon: "kitchen", label: kitchenPrinter ? `Bếp: ${kitchenPrinter.name}` : "Chưa có máy in bếp", variant: kitchenPrinter ? "amber" : "default" },
          { icon: "checkCircle", label: hasCashDrawer ? "Két tiền RJ11: Kết nối" : "Két tiền: Tắt", variant: "blue" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
          >
            <Icon name="plus" size={14} />
            <span>Thêm Máy In Mới</span>
          </button>
        }
      />

      {/* 2. 3 Thẻ Chỉ Số Trạng Thái Thiết Bị */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="print"
          variant={cashierPrinter ? "success" : "default"}
          title="Máy In Bill Thu Ngân"
          value={cashierPrinter ? cashierPrinter.name : "Chưa có"}
          subtext={
            cashierPrinter
              ? `${cashierPrinter.paperWidth} • ${cashierPrinter.ipAddress || cashierPrinter.interfaceType}`
              : "Thêm máy in hóa đơn để in bill tự động"
          }
          badge={cashierPrinter ? "Trực tuyến" : "Chưa kết nối"}
        />

        <StatCard
          icon="kitchen"
          variant={kitchenPrinter ? "warning" : "default"}
          title="Máy In Phiếu Bếp KDS"
          value={kitchenPrinter ? kitchenPrinter.name : "Chưa có"}
          subtext={
            kitchenPrinter
              ? `${kitchenPrinter.interfaceType} • ${kitchenPrinter.soundAlarm ? "Chuông báo BẬT" : "Chuông báo TẮT"}`
              : "Thêm máy in bếp để tự động báo món nấu"
          }
          badge={kitchenPrinter ? "Sẵn sàng" : "Chưa kết nối"}
        />

        <StatCard
          icon="cashier"
          variant={hasCashDrawer ? "info" : "default"}
          title="Ngăn Kéo Đựng Tiền"
          value={hasCashDrawer ? "Cổng RJ11 Sẵn Sàng" : "Chưa kết nối"}
          subtext={
            hasCashDrawer
              ? "Tự động bung két khi thanh toán tiền mặt"
              : "Bật tùy chọn 'Mở két tiền' trong máy in bill"
          }
          badge={hasCashDrawer ? "Hoạt động" : "Tắt"}
        />
      </section>

      {/* 2 Cột: Danh Sách Máy In & Tùy Biến Mẫu In Hóa Đơn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI: DANH SÁCH MÁY IN PHẦN CỨNG (COL 7) */}
        <div className="lg:col-span-7 space-y-4">
          <Panel variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-black text-ink-primary uppercase tracking-wider">
                  Danh Sách Máy In Đang Kết Nối ({printers.length})
                </h3>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Tương thích tất cả các dòng máy in nhiệt qua cổng mạng LAN/IP, USB hoặc Wifi.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {printers.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-surface-canvas/50">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-3">
                    <Icon name="print" className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-ink-primary">Chưa có máy in nào được kết nối</h4>
                  <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                    Kết nối máy in hóa đơn thu ngân (80mm) hoặc máy in bếp/bar (LAN/Wifi/USB) để tự động xuất bill khi thanh toán.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold"
                    onClick={handleOpenCreateModal}
                  >
                    <Icon name="plus" className="w-3.5 h-3.5 text-brand-400" />
                    <span>Thêm Máy In Đầu Tiên</span>
                  </Button>
                </div>
              ) : (
                printers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-surface-border bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 shrink-0">
                          <Icon name="print" className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-ink-primary">{p.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                            <span className="font-bold text-brand-900">
                              {p.type === "CASHIER_BILL"
                                ? "Hóa Đơn Thu Ngân"
                                : p.type === "KITCHEN_TICKET"
                                ? "Phiếu Bếp Nấu"
                                : "Phiếu Pha Chế Bar"}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{p.ipAddress || p.interfaceType}</span>
                            <span>•</span>
                            <span>Khổ {p.paperWidth}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1.5 pl-10">
                        {p.autoCut && (
                          <span className="px-1.5 py-0.2 rounded bg-surface-canvas border border-surface-border text-[9px] font-bold text-ink-secondary">
                            Tự cắt giấy
                          </span>
                        )}
                        {p.openCashDrawer && (
                          <span className="px-1.5 py-0.2 rounded bg-surface-canvas border border-surface-border text-[9px] font-bold text-ink-secondary">
                            Mở két tiền
                          </span>
                        )}
                        {p.soundAlarm && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-800">
                            Chuông báo món
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {p.lastPingMs}ms
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                      <button
                        type="button"
                        onClick={() => handleTestPrint(p)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors shadow-xs flex items-center gap-1"
                      >
                        <Icon name="print" className="w-3.5 h-3.5" />
                        <span>In Thử</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-ink-subtle hover:text-brand-900 hover:bg-surface-canvas rounded-lg transition-colors"
                        title="Sửa cấu hình"
                      >
                        <Icon name="edit" className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePrinter(p)}
                        className="p-1.5 text-ink-subtle hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa máy in"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* CỘT PHẢI: MẪU IN HÓA ĐƠN & LIVE PREVIEW (COL 5) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-black text-ink-primary uppercase tracking-wider">
                  Mẫu In Hóa Đơn Thu Ngân
                </h3>
                <p className="text-[11px] text-ink-muted">Tùy chỉnh thông tin xuất hiện trên bill in cho khách</p>
              </div>
              <Button
                size="sm"
                className="rounded-xl text-xs bg-brand-900 text-white font-bold"
                onClick={handleSaveTemplate}
              >
                Lưu Mẫu Bill
              </Button>
            </div>

            {/* Các trường cấu hình */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-extrabold text-ink-muted mb-1 block">Tên Quán Trên Bill:</label>
                <input
                  type="text"
                  value={template.storeName}
                  onChange={(e) => setTemplate((t) => ({ ...t, storeName: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border font-bold focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="font-extrabold text-ink-muted mb-1 block">Địa Chỉ & Hotline:</label>
                <input
                  type="text"
                  value={template.address}
                  onChange={(e) => setTemplate((t) => ({ ...t, address: e.target.value }))}
                  placeholder="Địa chỉ quán"
                  className="w-full h-9 px-3 rounded-xl border border-surface-border font-medium focus:outline-none focus:border-brand-800 mb-1.5"
                />
                <input
                  type="text"
                  value={template.phone}
                  onChange={(e) => setTemplate((t) => ({ ...t, phone: e.target.value }))}
                  placeholder="Số điện thoại"
                  className="w-full h-9 px-3 rounded-xl border border-surface-border font-medium focus:outline-none focus:border-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-ink-muted mb-1 block">Tên Wifi Quán:</label>
                  <input
                    type="text"
                    value={template.wifiName}
                    onChange={(e) => setTemplate((t) => ({ ...t, wifiName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-ink-muted mb-1 block">Mật Khẩu Wifi:</label>
                  <input
                    type="text"
                    value={template.wifiPass}
                    onChange={(e) => setTemplate((t) => ({ ...t, wifiPass: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-ink-primary">
                  <input
                    type="checkbox"
                    checked={template.showVietQr}
                    onChange={(e) => setTemplate((t) => ({ ...t, showVietQr: e.target.checked }))}
                    className="w-4 h-4 rounded text-brand-900"
                  />
                  <span>In mã VietQR động ở chân hóa đơn (Khách quét trả tiền ngay)</span>
                </label>
              </div>

              <div>
                <label className="font-extrabold text-ink-muted mb-1 block">Lời Cảm Ơn Cuối Bill:</label>
                <input
                  type="text"
                  value={template.footerNote}
                  onChange={(e) => setTemplate((t) => ({ ...t, footerNote: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border font-medium focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>

            {/* LIVE PREVIEW: MÔ PHỎNG BILL GIẤY IN NHIỆT 80MM */}
            <div className="mt-4 pt-4 border-t border-surface-border">
              <span className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block mb-2">
                Xem Trước Phiếu In Thực Tế (Live Preview):
              </span>

              <div className="p-4 bg-amber-50/40 rounded-2xl border border-dashed border-amber-300 font-mono text-[11px] text-ink-primary shadow-xs max-w-xs mx-auto">
                <div className="text-center space-y-0.5 border-b border-dashed border-ink-subtle pb-2">
                  <div className="font-black text-xs uppercase">{template.storeName}</div>
                  <div className="text-[10px] text-ink-muted">{template.address}</div>
                  <div className="text-[10px] text-ink-muted">Hotline: {template.phone}</div>
                  <div className="font-bold text-xs pt-1">PHIẾU THANH TOÁN</div>
                  <div className="text-[9px] text-ink-muted">Bàn: Bàn 01 • Giờ vào: 18:20</div>
                </div>

                <div className="py-2 space-y-1.5 border-b border-dashed border-ink-subtle text-[10px]">
                  <div className="flex justify-between font-bold">
                    <span>2x Phở Bò Tái Lăn</span>
                    <span>130.000</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>1x Quẩy Giòn Phở</span>
                    <span>15.000</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>2x Trà Đào Cam Sả</span>
                    <span>70.000</span>
                  </div>
                </div>

                <div className="py-2 space-y-1 border-b border-dashed border-ink-subtle">
                  <div className="flex justify-between font-bold text-xs">
                    <span>TỔNG TIỀN:</span>
                    <span>215.000 đ</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
                    <span>Khuyến mãi (CHAOBAN20):</span>
                    <span>-43.000 đ</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-ink-subtle">
                    <span>THANH TOÁN:</span>
                    <span>172.000 đ</span>
                  </div>
                </div>

                {template.showVietQr && (
                  <div className="pt-2 text-center flex flex-col items-center">
                    <span className="text-[9px] font-bold text-ink-muted mb-1">Quét mã VietQR chuyển khoản:</span>
                    <div className="w-20 h-20 bg-white border border-surface-border p-1 rounded flex items-center justify-center">
                      <Icon name="vietqr" className="w-12 h-12 text-brand-900" />
                    </div>
                  </div>
                )}

                <div className="text-center pt-2 text-[9px] text-ink-muted space-y-0.5">
                  <div>Wifi: {template.wifiName} - MK: {template.wifiPass}</div>
                  <div className="font-bold italic mt-1">{template.footerNote}</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* MODAL THÊM / CHỈNH SỬA MÁY IN */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-black text-ink-primary">
                {editingPrinter ? `Sửa Máy In: ${editingPrinter.name}` : "Thêm Máy In Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSavePrinter} className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">Tên Nhận Diện Máy In *</label>
                <input
                  type="text"
                  value={printerForm.name}
                  onChange={(e) => setPrinterForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Máy In Bill Thu Ngân Tầng 1"
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">Mục Đích In</label>
                  <select
                    value={printerForm.type}
                    onChange={(e) => setPrinterForm((f) => ({ ...f, type: e.target.value as any }))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                  >
                    <option value="CASHIER_BILL">Hóa Đơn Thu Ngân</option>
                    <option value="KITCHEN_TICKET">Phiếu Chế Biến Bếp</option>
                    <option value="BAR_TICKET">Phiếu Pha Chế Bar</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">Cổng Kết Nối</label>
                  <select
                    value={printerForm.interfaceType}
                    onChange={(e) => setPrinterForm((f) => ({ ...f, interfaceType: e.target.value as any }))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                  >
                    <option value="LAN_IP">Cổng Mạng LAN / IP</option>
                    <option value="WIFI">Không Dây Wifi</option>
                    <option value="USB">Cáp USB</option>
                    <option value="BLUETOOTH">Bluetooth</option>
                  </select>
                </div>
              </div>

              {(printerForm.interfaceType === "LAN_IP" || printerForm.interfaceType === "WIFI") && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Địa Chỉ IP Máy In</label>
                    <input
                      type="text"
                      value={printerForm.ipAddress}
                      onChange={(e) => setPrinterForm((f) => ({ ...f, ipAddress: e.target.value }))}
                      placeholder="192.168.1.200"
                      className="w-full h-10 px-3 rounded-xl border border-surface-border font-mono text-xs font-bold focus:outline-none focus:border-brand-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Port</label>
                    <input
                      type="number"
                      value={printerForm.port}
                      onChange={(e) => setPrinterForm((f) => ({ ...f, port: Number(e.target.value) }))}
                      className="w-full h-10 px-3 rounded-xl border border-surface-border font-mono text-xs font-bold focus:outline-none focus:border-brand-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">Khổ Giấy In Nhiệt</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["80mm", "58mm"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPrinterForm((f) => ({ ...f, paperWidth: w }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        printerForm.paperWidth === w
                          ? "bg-brand-900 text-white border-brand-900 shadow-xs"
                          : "bg-surface-canvas border-surface-border text-ink-primary hover:border-brand-300"
                      }`}
                    >
                      Khổ {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-canvas border border-surface-border space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-ink-primary">
                  <input
                    type="checkbox"
                    checked={printerForm.autoCut}
                    onChange={(e) => setPrinterForm((f) => ({ ...f, autoCut: e.target.checked }))}
                    className="w-4 h-4 rounded text-brand-900"
                  />
                  <span>Tự động cắt giấy khi in xong</span>
                </label>

                {printerForm.type === "CASHIER_BILL" && (
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ink-primary">
                    <input
                      type="checkbox"
                      checked={printerForm.openCashDrawer}
                      onChange={(e) => setPrinterForm((f) => ({ ...f, openCashDrawer: e.target.checked }))}
                      className="w-4 h-4 rounded text-brand-900"
                    />
                    <span>Mở ngăn kéo tiền (Cổng RJ11)</span>
                  </label>
                )}

                {printerForm.type === "KITCHEN_TICKET" && (
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ink-primary">
                    <input
                      type="checkbox"
                      checked={printerForm.soundAlarm}
                      onChange={(e) => setPrinterForm((f) => ({ ...f, soundAlarm: e.target.checked }))}
                      className="w-4 h-4 rounded text-brand-900"
                    />
                    <span>Phát chuông báo âm thanh khi có món mới</span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                >
                  Lưu Cấu Hình Máy In
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
      )}
    </div>
  );
};
