import React from "react";
import { Icon, Button, Portal } from "@/components/ui";
import { WaiterTableOrder, IconName } from "@/types";

interface SurchargeDiscountModalProps {
  isOpen: boolean;
  activeTable: WaiterTableOrder;
  foodTotalAmount: number;
  finalPayableAmount: number;
  surchargeTab: "SURCHARGE" | "DISCOUNT";
  onSelectTab: (tab: "SURCHARGE" | "DISCOUNT") => void;
  customSurchargeName: string;
  onChangeCustomSurchargeName: (name: string) => void;
  customSurchargeAmount: number;
  onChangeCustomSurchargeAmount: (amount: number) => void;
  onAddSurcharge: (name: string, amount: number) => void;
  onRemoveSurcharge: (id: string) => void;
  discountType: "PERCENT" | "AMOUNT";
  onSelectDiscountType: (type: "PERCENT" | "AMOUNT") => void;
  discountValue: number;
  onSelectDiscountValue: (value: number) => void;
  discountReason: string;
  onChangeDiscountReason: (reason: string) => void;
  onApplyDiscount: () => void;
  onRemoveDiscount: () => void;
  onClose: () => void;
}

export const SurchargeDiscountModal: React.FC<SurchargeDiscountModalProps> = ({
  isOpen,
  activeTable,
  foodTotalAmount,
  finalPayableAmount,
  surchargeTab,
  onSelectTab,
  customSurchargeName,
  onChangeCustomSurchargeName,
  customSurchargeAmount,
  onChangeCustomSurchargeAmount,
  onAddSurcharge,
  onRemoveSurcharge,
  discountType,
  onSelectDiscountType,
  discountValue,
  onSelectDiscountValue,
  discountReason,
  onChangeDiscountReason,
  onApplyDiscount,
  onRemoveDiscount,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-5 sm:p-6 space-y-4 border border-surface-border animate-scaleUp max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
                <Icon name="tag" size={16} />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">
                  Phụ Thu & Giảm Giá • {activeTable.tableName}
                </h3>
                <p className="text-xs text-ink-muted">
                  Tiền món: <strong className="text-ink-primary">{foodTotalAmount.toLocaleString("vi-VN")} đ</strong> • Sau điều chỉnh: <strong className="text-brand-950">{finalPayableAmount.toLocaleString("vi-VN")} đ</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-canvas rounded-2xl border border-surface-border text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab("SURCHARGE")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                surchargeTab === "SURCHARGE"
                  ? "bg-white text-brand-900 shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon name="plus" size={13} />
              <span>Phụ Thu Dịch Vụ (+ đ)</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("DISCOUNT")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                surchargeTab === "DISCOUNT"
                  ? "bg-white text-brand-900 shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon name="percent" size={13} />
              <span>Giảm Giá / Đền Bù (- đ)</span>
            </button>
          </div>

          {/* Tab 1: Phụ Thu */}
          {surchargeTab === "SURCHARGE" && (
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* Chips phụ thu mẫu */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-secondary block">
                  Khoản phụ thu chuẩn F&B (1-chạm áp dụng):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { name: "Phí mở rượu ngoài (Corkage)", amount: 150000, icon: "coffee" as IconName },
                    { name: "Phí mang bánh sinh nhật ngoài", amount: 50000, icon: "cake" as IconName },
                    { name: "Phụ phí phòng VIP riêng", amount: 100000, icon: "building" as IconName },
                    { name: "Phí phục vụ mang đồ ngoài", amount: 50000, icon: "utensils" as IconName },
                  ].map((sc) => (
                    <button
                      key={sc.name}
                      type="button"
                      onClick={() => onAddSurcharge(sc.name, sc.amount)}
                      className="p-2.5 rounded-xl border border-surface-border bg-surface-canvas hover:bg-brand-50 hover:border-brand-300 text-left transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center text-brand-800 shrink-0">
                          <Icon name={sc.icon} size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-ink-primary truncate">
                            {sc.name}
                          </div>
                          <div className="text-[11px] font-bold text-brand-900">
                            +{sc.amount.toLocaleString("vi-VN")} đ
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-brand-800 bg-white px-2 py-0.5 rounded-lg border border-surface-border">
                        + Thêm
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhập phụ thu tùy biến */}
              <div className="p-3 bg-surface-canvas rounded-2xl border border-surface-border space-y-2">
                <span className="text-xs font-bold text-ink-secondary block">
                  Hoặc thêm phụ thu khác:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customSurchargeName}
                    onChange={(e) => onChangeCustomSurchargeName(e.target.value)}
                    placeholder="Tên phụ thu (VD: Phí phục vụ đêm)"
                    className="h-9 px-3 rounded-xl border border-surface-border text-xs font-medium bg-white focus:outline-none focus:border-brand-800"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step={10000}
                      value={customSurchargeAmount || ""}
                      onChange={(e) => onChangeCustomSurchargeAmount(Number(e.target.value))}
                      placeholder="Số tiền (đ)"
                      className="h-9 px-3 rounded-xl border border-surface-border text-xs font-bold bg-white focus:outline-none focus:border-brand-800 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => onAddSurcharge(customSurchargeName, customSurchargeAmount)}
                      className="px-3 h-9 rounded-xl bg-brand-950 text-white text-xs font-bold hover:bg-black transition-colors shrink-0"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* Danh sách phụ thu hiện có của bàn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-secondary block">
                  Các khoản phụ thu đang áp dụng cho bàn này ({activeTable.surcharges?.length || 0}):
                </label>
                {(!activeTable.surcharges || activeTable.surcharges.length === 0) ? (
                  <div className="p-3 rounded-xl bg-surface-canvas border border-dashed border-surface-border text-xs text-ink-muted text-center">
                    Chưa có khoản phụ thu nào được áp dụng
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeTable.surcharges.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-white border border-surface-border flex items-center justify-between text-xs"
                      >
                        <span className="font-extrabold text-ink-primary">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-brand-900">
                            +{s.amount.toLocaleString("vi-VN")} đ
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveSurcharge(s.id)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-ink-muted hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Icon name="x" size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Giảm Giá & Đền Bù */}
          {surchargeTab === "DISCOUNT" && (
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* Loại giảm giá: % vs Số tiền */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-secondary block">
                  Hình thức giảm giá:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDiscountType("PERCENT");
                      onSelectDiscountValue(10);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      discountType === "PERCENT"
                        ? "bg-brand-900 text-white border-brand-900 shadow-xs font-black"
                        : "bg-surface-canvas border-surface-border text-ink-primary"
                    }`}
                  >
                    % Theo Phần Trăm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDiscountType("AMOUNT");
                      onSelectDiscountValue(50000);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      discountType === "AMOUNT"
                        ? "bg-brand-900 text-white border-brand-900 shadow-xs font-black"
                        : "bg-surface-canvas border-surface-border text-ink-primary"
                    }`}
                  >
                    Số Tiền Cố Định (VNĐ)
                  </button>
                </div>
              </div>

              {/* Giá trị giảm giá */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-secondary block">
                  Chọn nhanh mức giảm:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {discountType === "PERCENT" ? (
                    [5, 10, 15, 20, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => onSelectDiscountValue(pct)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          discountValue === pct
                            ? "bg-rose-700 text-white shadow-xs font-black"
                            : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-rose-300"
                        }`}
                      >
                        Giảm {pct}%
                      </button>
                    ))
                  ) : (
                    [20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onSelectDiscountValue(amt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          discountValue === amt
                            ? "bg-rose-700 text-white shadow-xs font-black"
                            : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-rose-300"
                        }`}
                      >
                        -{(amt / 1000).toFixed(0)}k đ
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Lý do giảm giá bắt buộc (Loss Prevention Audit) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-ink-secondary flex items-center gap-1">
                  <span>Lý do giảm giá (Bắt buộc kiểm toán):</span>
                  <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Khách quen VIP / Thân thiết",
                    "Đền bù bếp ra món chậm (>20p)",
                    "Đền bù món có sự cố / sai vị",
                    "Quà tặng sinh nhật / Sự kiện",
                    "Voucher khuyến mại quán",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChangeDiscountReason(r)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        discountReason === r
                          ? "bg-brand-900 text-white shadow-xs"
                          : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => onChangeDiscountReason(e.target.value)}
                  placeholder="Hoặc nhập lý do chi tiết..."
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium bg-white focus:outline-none focus:border-brand-800 mt-1"
                />
              </div>

              {/* Đang áp dụng */}
              {activeTable.discount && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold text-rose-950">
                      Đang giảm: {activeTable.discount.type === "PERCENT" ? `${activeTable.discount.value}%` : `${activeTable.discount.value.toLocaleString("vi-VN")} đ`}
                    </div>
                    <div className="text-[11px] text-rose-800">
                      Lý do: {activeTable.discount.reason}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveDiscount}
                    className="px-2.5 py-1 rounded-xl bg-white border border-rose-300 text-rose-700 font-bold hover:bg-rose-100 transition-colors"
                  >
                    Gỡ Bỏ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Modal */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Đóng
            </Button>
            {surchargeTab === "DISCOUNT" && (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs px-5 shadow-sm font-bold"
                onClick={onApplyDiscount}
              >
                Áp Dụng Giảm Giá
              </Button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
