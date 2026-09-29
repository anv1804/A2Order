import React, { useState } from "react";
import { Button, Icon, Portal } from "@/components/ui";

export interface LicenseModalProps {
  store: {
    id: string;
    name: string;
    licenseKey?: string;
    plan?: string;
  } | null;
  onClose: () => void;
  onSave: (payload: {
    storeId: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    finalAmount: number;
  }) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  store,
  onClose,
  onSave,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "GROWTH" | "PRO">("PRO");
  const [selectedDuration, setSelectedDuration] = useState<number>(12);

  if (!store) return null;

  const planPrices = {
    STARTER: 199000,
    GROWTH: 399000,
    PRO: 599000,
  };

  const basePrice = planPrices[selectedPlan] * selectedDuration;
  const discountRate = selectedDuration >= 12 ? 0.2 : selectedDuration >= 6 ? 0.1 : 0;
  const discountAmount = Math.round(basePrice * discountRate);
  const finalAmount = basePrice - discountAmount;

  const handleConfirm = () => {
    onSave({
      storeId: store.id,
      plan: selectedPlan,
      durationMonths: selectedDuration,
      finalAmount,
    });
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                <Icon name="key" className="w-4 h-4 text-brand-900" />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">Cấp & Gia Hạn License Key</h3>
                <p className="text-xs text-ink-muted">
                  Quán: <span className="font-bold text-ink-primary">{store.name}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Chọn Gói theo quy mô quán */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-ink-secondary">
                Chọn Quy Mô Quán & Gói Tính Năng:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "STARTER", name: "Quán Nhỏ", price: "199k/tháng", desc: "1-2 người, POS cơ bản" },
                  { id: "GROWTH", name: "Quán Vừa", price: "399k/tháng", desc: "POS + Bếp KDS + QR" },
                  { id: "PRO", name: "Chuỗi Pro", price: "599k/tháng", desc: "Đầy đủ Landing + Báo cáo" },
                ].map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id as any)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? "border-brand-900 bg-brand-50/60 shadow-sm"
                          : "border-surface-border bg-surface-canvas hover:border-brand-200"
                      }`}
                    >
                      <div className={`text-xs font-black ${isSelected ? "text-brand-950" : "text-ink-primary"}`}>
                        {p.name}
                      </div>
                      <div className="text-xs font-extrabold text-brand-900 mt-0.5">{p.price}</div>
                      <div className="text-[10px] text-ink-muted mt-1 leading-tight">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chọn Kỳ Hạn Thuê */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-ink-secondary">
                Chọn Kỳ Hạn Thuê Phần Mềm:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { months: 1, label: "1 tháng", discount: "" },
                  { months: 3, label: "3 tháng", discount: "" },
                  { months: 6, label: "6 tháng", discount: "Giảm 10%" },
                  { months: 12, label: "12 tháng", discount: "Giảm 20%" },
                ].map((d) => {
                  const isSelected = selectedDuration === d.months;
                  return (
                    <button
                      key={d.months}
                      type="button"
                      onClick={() => setSelectedDuration(d.months)}
                      className={`p-2.5 rounded-xl text-center border transition-all ${
                        isSelected
                          ? "border-brand-900 bg-brand-900 text-white font-black"
                          : "border-surface-border bg-surface-canvas text-ink-secondary hover:text-ink-primary"
                      }`}
                    >
                      <div className="text-xs">{d.label}</div>
                      {d.discount && (
                        <div className={`text-[9px] mt-0.5 ${isSelected ? "text-brand-200" : "text-emerald-700 font-bold"}`}>
                          {d.discount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tóm tắt cước và License sinh ra */}
            <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Cước thuê:</span>
                <span className="font-bold text-ink-primary">
                  {basePrice.toLocaleString("vi-VN")} đ
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Ưu đãi thời hạn:</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-brand-950 pt-2 border-t border-surface-border">
                <span>TỔNG TIỀN HỢP ĐỒNG:</span>
                <span>{finalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm"
              onClick={handleConfirm}
            >
              Tạo Hóa Đơn & Gia Hạn Key
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
