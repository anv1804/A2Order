import React, { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Badge, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";
import { TableItem, CashierBillItem } from "@/types";
import { SAMPLE_BILLS } from "@/data";

interface CashierWorkstationProps {
  tables: TableItem[];
  onFinishPayment: (tableId: string) => void;
}

export const CashierWorkstation: React.FC<CashierWorkstationProps> = ({
  tables,
  onFinishPayment,
}) => {
  const activeTables = tables.filter((t) => t.status !== "EMPTY");
  const [selectedTableId, setSelectedTableId] = useState<string>(activeTables[0]?.id || "5");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAYMENT_PENDING" | "OCCUPIED">("ALL");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [includeVat, setIncludeVat] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "CASH">("VIETQR");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || activeTables[0];
  const items: CashierBillItem[] = selectedTable
    ? SAMPLE_BILLS[selectedTable.id] || [
        { id: "fallback-1", name: "Phở Bò Tái Nạm", quantity: 2, price: 65000 },
        { id: "fallback-2", name: "Nước Suối Lavie", quantity: 2, price: 15000 },
      ]
    : [];

  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subTotal * discountPercent) / 100);
  const vatAmount = includeVat ? Math.round((subTotal - discountAmount) * 0.08) : 0;
  const finalTotal = subTotal - discountAmount + vatAmount;
  const changeDue = Math.max(0, cashTendered - finalTotal);

  const billCode = `HD-${selectedTable?.name.replace(/\s+/g, "")}-${new Date().getHours()}${new Date().getMinutes()}`;
  const vietQrUrl = `https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=${finalTotal}&addInfo=${encodeURIComponent(
    billCode
  )}&accountName=A2ORDER%20FNB`;

  const filteredTables = activeTables.filter((t) => {
    if (statusFilter === "PAYMENT_PENDING") return t.status === "PAYMENT_PENDING";
    if (statusFilter === "OCCUPIED") return t.status !== "PAYMENT_PENDING";
    return true;
  });

  const handleConfirmPaid = async () => {
    if (!selectedTable) return;
    const ok = await confirmDialog({
      title: `Xác Nhận Thu ${formatCurrency(finalTotal)}?`,
      message: `Bàn ${selectedTable.name} sẽ được chuyển về trạng thái Trống và giải phóng chỗ ngồi.`,
      confirmText: "Xác Nhận & Đóng Bàn",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    sound.playPaymentChime();
    toast.success(`Đã thu tiền bàn ${selectedTable.name} thành công (${paymentMethod === "VIETQR" ? "VietQR" : "Tiền Mặt"})!`);
    onFinishPayment(selectedTable.id);
  };

  const handlePrintPreCheck = () => {
    sound.playKitchenChime();
    toast.info(`Đang in phiếu tạm tính cho ${selectedTable?.name || "bàn"}...`);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">Quầy Thu Ngân (Cashier POS)</h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Tự Động Sinh VietQR
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Quản lý thanh toán hóa đơn theo bàn, kiểm soát tiền mặt, chiết khấu và in bill nhiệt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs gap-1.5 bg-white"
            onClick={() => setIsReceiptModalOpen(true)}
            disabled={!selectedTable}
          >
            <Icon name="eye" className="w-3.5 h-3.5" />
            <span>Xem Mẫu Hóa Đơn In</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs gap-1.5 bg-white"
            onClick={handlePrintPreCheck}
            disabled={!selectedTable}
          >
            <Icon name="print" className="w-3.5 h-3.5" />
            <span>In Tạm Tính</span>
          </Button>
        </div>
      </div>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col (4/12): List of Active Tables needing checkout */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-ink-primary uppercase tracking-wider">
              Bàn Đang Dùng Bữa ({activeTables.length})
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-surface-canvas p-1 rounded-2xl border border-surface-border text-xs">
            {[
              { id: "ALL", label: "Tất Cả", count: activeTables.length },
              { id: "PAYMENT_PENDING", label: "Chờ Tính Tiền", count: activeTables.filter((t) => t.status === "PAYMENT_PENDING").length },
              { id: "OCCUPIED", label: "Đang Dùng", count: activeTables.filter((t) => t.status !== "PAYMENT_PENDING").length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`flex-1 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  statusFilter === f.id
                    ? "bg-white text-brand-900 shadow-sm"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Table Cards List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredTables.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-surface-border text-xs text-ink-muted font-bold">
                Không có bàn nào phù hợp bộ lọc
              </div>
            ) : (
              filteredTables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                const isPending = t.status === "PAYMENT_PENDING";
                const tItems = SAMPLE_BILLS[t.id] || [];
                const tSum = tItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTableId(t.id);
                      setCashTendered(0);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                      isSelected
                        ? "bg-brand-50/80 border-brand-900 shadow-sm ring-1 ring-brand-900"
                        : "bg-white border-surface-border hover:border-brand-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-ink-primary">{t.name}</span>
                        {isPending && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 animate-pulse">
                            GỌI TÍNH TIỀN
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted">
                        Ngồi: {t.occupiedMinutes || 15} phút • {tItems.length} món
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-sm text-brand-900">
                        {formatCurrency(tSum || t.totalAmount || 185000)}
                      </div>
                      <span className="text-[10px] text-ink-subtle">Chạm để chọn</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col (8/12): Checkout Console */}
        <div className="lg:col-span-8">
          {selectedTable ? (
            <div className="bg-white rounded-3xl border border-surface-border shadow-card p-5 space-y-5">
              {/* Header Bill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-ink-primary">{selectedTable.name}</span>
                    <Badge variant={selectedTable.status === "PAYMENT_PENDING" ? "danger" : "brand"}>
                      {selectedTable.status === "PAYMENT_PENDING" ? "Khách Đang Chờ Bill" : "Đang Phục Vụ"}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5 font-mono">
                    Mã Hóa Đơn: <strong className="text-brand-900">{billCode}</strong> • Giờ vào: {new Date(Date.now() - (selectedTable.occupiedMinutes || 20) * 60000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-surface-canvas p-1 rounded-2xl border border-surface-border text-xs font-bold">
                    <button
                      onClick={() => setPaymentMethod("VIETQR")}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        paymentMethod === "VIETQR" ? "bg-brand-900 text-white shadow-sm" : "text-ink-muted hover:text-ink-primary"
                      }`}
                    >
                      <Icon name="vietqr" className="w-3.5 h-3.5" />
                      <span>VietQR Động</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("CASH")}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        paymentMethod === "CASH" ? "bg-brand-900 text-white shadow-sm" : "text-ink-muted hover:text-ink-primary"
                      }`}
                    >
                      <Icon name="banknote" className="w-3.5 h-3.5" />
                      <span>Tiền Mặt</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table & Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Items Breakdown */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-ink-primary uppercase tracking-wider block">
                    Danh Sách Món Ăn ({items.length})
                  </span>
                  <div className="border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border max-h-56 overflow-y-auto">
                    {items.map((i) => (
                      <div key={i.id} className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-surface-canvas/50">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-extrabold text-ink-primary truncate">{i.name}</div>
                          <div className="text-[10px] text-ink-muted">{formatCurrency(i.price)} x {i.quantity}</div>
                        </div>
                        <span className="font-black text-brand-900 shrink-0">
                          {formatCurrency(i.price * i.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Discount & Tax Options */}
                  <div className="p-3 bg-surface-canvas rounded-2xl border border-surface-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-secondary">Chiết Khấu (Giảm Giá):</span>
                      <div className="flex items-center gap-1">
                        {[0, 5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setDiscountPercent(pct)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                              discountPercent === pct
                                ? "bg-brand-900 text-white shadow-sm"
                                : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
                            }`}
                          >
                            {pct === 0 ? "K/M 0%" : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-secondary">VAT (Thuế 8%):</span>
                      <button
                        onClick={() => setIncludeVat((v) => !v)}
                        className={`px-3 py-0.5 rounded-lg text-xs font-bold border transition-all ${
                          includeVat
                            ? "bg-brand-900 text-white border-brand-900"
                            : "bg-white text-ink-muted border-surface-border"
                        }`}
                      >
                        {includeVat ? "Đã Bật VAT 8%" : "Không VAT"}
                      </button>
                    </div>
                  </div>

                  {/* Calculations summary */}
                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex justify-between text-ink-muted">
                      <span>Tạm tính tiền món:</span>
                      <span className="font-bold">{formatCurrency(subTotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Chiết khấu ({discountPercent}%):</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {vatAmount > 0 && (
                      <div className="flex justify-between text-ink-secondary font-bold">
                        <span>Thuế VAT (8%):</span>
                        <span>+{formatCurrency(vatAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-brand-950 border-t border-surface-border pt-2">
                      <span>TỔNG THANH TOÁN:</span>
                      <span className="text-lg text-brand-900">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Payment Method Interactive Workspace */}
                <div className="space-y-3 flex flex-col justify-between">
                  {paymentMethod === "VIETQR" ? (
                    <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border flex flex-col items-center justify-center text-center space-y-2.5 h-full min-h-[300px]">
                      <span className="text-[11px] font-black uppercase text-brand-900 tracking-wider">
                        Quét Mã VietQR Chuyển Khoản Nhanh
                      </span>

                      <div className="w-48 h-48 bg-white p-2 rounded-2xl border border-surface-border shadow-sm flex items-center justify-center">
                        <img
                          src={vietQrUrl}
                          alt="VietQR F&B"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="text-xs space-y-0.5">
                        <div className="font-black text-ink-primary">{formatCurrency(finalTotal)}</div>
                        <div className="font-mono text-[11px] text-ink-muted">
                          Nội dung: <strong className="text-brand-900">{billCode}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border space-y-3 h-full flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-black text-ink-primary uppercase tracking-wider block mb-2">
                          Máy Tính Tiền Mặt (Fast Cash)
                        </span>

                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-ink-muted block">Tiền khách đưa (VNĐ):</label>
                          <input
                            type="number"
                            value={cashTendered || ""}
                            onChange={(e) => setCashTendered(Number(e.target.value))}
                            placeholder="Nhập số tiền..."
                            className="w-full h-10 px-3 rounded-xl border border-surface-border font-black text-lg text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                          />

                          {/* Fast Cash Buttons */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            {[finalTotal, 100000, 200000, 300000, 500000, 1000000].map((amt, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCashTendered(amt)}
                                className="py-1.5 px-2 rounded-xl bg-white border border-surface-border text-xs font-extrabold text-ink-primary hover:border-brand-800 hover:text-brand-900 transition-all shadow-sm"
                              >
                                {idx === 0 ? "Vừa Đủ" : formatCurrency(amt)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Change Due Display */}
                      <div className="p-3 rounded-xl bg-white border border-surface-border space-y-1">
                        <div className="text-xs text-ink-muted font-bold">Tiền thối lại cho khách:</div>
                        <div className={`text-xl font-black ${cashTendered >= finalTotal ? "text-emerald-700" : "text-rose-600"}`}>
                          {cashTendered >= finalTotal ? formatCurrency(changeDue) : "Chưa đủ tiền"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Big Checkout Button */}
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-black text-sm py-3.5 shadow-md flex items-center justify-center gap-2"
                    onClick={handleConfirmPaid}
                  >
                    <Icon name="check" className="w-5 h-5 text-white" />
                    <span>XÁC NHẬN ĐÃ THU {formatCurrency(finalTotal)} & TRẢ BÀN</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] bg-white rounded-3xl border border-surface-border flex flex-col items-center justify-center text-center p-8 text-ink-muted">
              <Icon name="cashier" className="w-12 h-12 text-ink-subtle mb-3" />
              <h3 className="text-base font-black text-ink-primary">Chưa Chọn Bàn Cần Thanh Toán</h3>
              <p className="text-xs text-ink-subtle mt-1 max-w-sm">
                Vui lòng chạm vào một bàn trong danh sách bên trái để kiểm tra chi tiết hóa đơn và thu tiền.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem Trước Mẫu Bill Hóa Đơn In Nhiệt */}
      {isReceiptModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 border border-surface-border space-y-4 animate-scaleUp font-mono text-xs">
            <div className="flex items-center justify-between border-b border-dashed border-ink-subtle pb-3 text-center">
              <div className="w-full">
                <h3 className="text-base font-black text-ink-primary">PHỞ BÒ NAM ĐỊNH</h3>
                <p className="text-[10px] text-ink-muted">128 Phố Huế, Q. Hai Bà Trưng, Hà Nội</p>
                <p className="text-[10px] text-ink-muted">Hotline: 0912 345 678</p>
                <div className="mt-2 text-xs font-black uppercase text-ink-primary tracking-wider">
                  PHIẾU THANH TOÁN
                </div>
                <div className="text-[10px] text-ink-muted">Bàn: {selectedTable.name} • {billCode}</div>
              </div>
            </div>

            <div className="space-y-1.5 divide-y divide-dashed divide-surface-border">
              {items.map((i) => (
                <div key={i.id} className="pt-1.5 flex justify-between text-[11px]">
                  <span>{i.name} x{i.quantity}</span>
                  <span className="font-bold">{formatCurrency(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-ink-subtle pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatCurrency(subTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Giảm giá ({discountPercent}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT (8%):</span>
                  <span>+{formatCurrency(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-surface-border">
                <span>TỔNG TIỀN:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-ink-subtle text-[10px] text-ink-muted space-y-0.5">
              <p>Xin Cảm Ơn Quý Khách & Hẹn Gặp Lại!</p>
              <p className="font-sans font-bold text-brand-900">Powered by A2Order POS</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-1/2 rounded-xl text-xs"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                size="sm"
                className="w-1/2 rounded-xl bg-brand-900 text-white text-xs font-black"
                onClick={() => {
                  toast.success("Đã gửi lệnh in thành công!");
                  setIsReceiptModalOpen(false);
                }}
              >
                In Ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
