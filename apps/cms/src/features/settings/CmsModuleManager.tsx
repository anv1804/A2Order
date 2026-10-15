import React, { useState } from "react";
import { AppModule, APP_MODULE_CATALOG, ModulePricingInfo } from "@a2order/shared";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

import { CmsModuleManagerProps } from "@/types/cms.types";

export const CmsModuleManager: React.FC<CmsModuleManagerProps> = ({
  currentModules,
  onSaveModules,
}) => {
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(currentModules);
  const [durationMonths, setDurationMonths] = useState<number>(6); // 1, 6, 12

  const toggleModule = (modId: AppModule) => {
    if (modId === AppModule.CORE_POS) {
      toast.info("Vận hành Bàn & Đơn (Core POS) là module cốt lõi bắt buộc.");
      return;
    }

    if (selectedModules.includes(modId)) {
      setSelectedModules((prev) => prev.filter((m) => m !== modId));
    } else {
      setSelectedModules((prev) => [...prev, modId]);
    }
  };

  // Tính tiền
  const monthlySum = selectedModules.reduce((sum, modId) => {
    const item = APP_MODULE_CATALOG.find((m) => m.id === modId);
    return sum + (item ? item.monthlyPrice : 0);
  }, 0);

  let discountPercent = 0;
  if (durationMonths >= 24) discountPercent = 30;
  else if (durationMonths >= 12) discountPercent = 20;
  else if (durationMonths >= 6) discountPercent = 10;
  else if (durationMonths >= 3) discountPercent = 5;

  const rawTotal = monthlySum * durationMonths;
  const discountAmount = Math.round((rawTotal * discountPercent) / 100);
  const finalTotal = rawTotal - discountAmount;

  const handleApply = () => {
    onSaveModules(selectedModules);
    toast.success("Đã cập nhật các module tính năng cho quán thành công!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ink-primary tracking-tight">
            Gói Module Tính Năng & Hợp Đồng Thuê
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Tùy biến chức năng theo đúng quy mô quán để tối ưu chi phí thuê phần mềm hàng tháng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 font-bold text-xs">
            Hợp Đồng Đang Kích Hoạt
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Danh sách các Module tính năng */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-ink-muted">
              CHỌN TÍNH NĂNG CẦN THIẾT CHO QUÁN:
            </span>
            <span className="text-xs text-brand-800 font-bold">
              Đã chọn: {selectedModules.length} / {APP_MODULE_CATALOG.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {APP_MODULE_CATALOG.map((item) => {
              const isSelected = selectedModules.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleModule(item.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? "bg-white border-brand-800 ring-2 ring-brand-800/10 shadow-elevated"
                      : "bg-surface-canvas border-surface-border hover:bg-white/80"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-extrabold text-sm text-ink-primary leading-tight">
                        {item.name}
                      </h4>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? "bg-brand-900 text-white" : "border border-surface-border bg-white"
                        }`}
                      >
                        {isSelected && <Icon name="check" className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/60">
                    <span className="text-[11px] font-bold text-ink-subtle">
                      {item.isCore ? "Cốt lõi (Bắt buộc)" : "Tùy chọn thêm"}
                    </span>
                    <span className="font-extrabold text-sm text-brand-900">
                      {item.monthlyPrice.toLocaleString("vi-VN")} đ<span className="text-[10px] font-normal text-ink-muted">/tháng</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bảng dự toán hợp đồng thuê & Xuất hóa đơn */}
        <div className="space-y-4">
          <Panel variant="featured" padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="sparkles" className="w-4 h-4 text-emerald-300" />
              <h3 className="font-black text-sm uppercase tracking-wide text-brand-100">
                Dự Toán Hợp Đồng Thuê
              </h3>
            </div>

            {/* Chọn thời hạn */}
            <div>
              <label className="block text-xs font-bold text-brand-200 mb-2">
                Kỳ hạn thanh toán:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { m: 1, label: "1T", badge: "" },
                  { m: 3, label: "3T", badge: "-5%" },
                  { m: 6, label: "6T", badge: "-10%" },
                  { m: 12, label: "12T", badge: "-20%" },
                ].map((p) => (
                  <button
                    key={p.m}
                    type="button"
                    onClick={() => setDurationMonths(p.m)}
                    className={`py-2 px-1 rounded-2xl text-xs font-bold flex flex-col items-center transition-all ${
                      durationMonths === p.m
                        ? "bg-white text-brand-950 shadow-md ring-2 ring-white/20"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    <span>{p.label}</span>
                    {p.badge && (
                      <span className="text-[9px] font-extrabold text-emerald-300 mt-0.5">
                        {p.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chi tiết thanh toán */}
            <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex justify-between text-brand-200">
                <span>Phí module ({selectedModules.length} module):</span>
                <span className="font-bold text-white">
                  {monthlySum.toLocaleString("vi-VN")} đ/tháng
                </span>
              </div>
              <div className="flex justify-between text-brand-200">
                <span>Thời gian thuê:</span>
                <span className="font-bold text-white">{durationMonths} tháng</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-300 font-bold">
                  <span>Ưu đãi kỳ hạn ({discountPercent}%):</span>
                  <span>- {discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-white/20">
                <span className="font-bold text-white">Tổng hợp đồng:</span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {finalTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <Button
              size="md"
              className="w-full rounded-2xl bg-white text-brand-950 hover:bg-brand-50 font-black text-xs gap-2 shadow-md"
              onClick={handleApply}
            >
              <span>Lưu Cấu Hình & Kích Hoạt</span>
              <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </Button>
          </Panel>

          <Panel variant="default" padding="md" className="space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-ink-primary">
              <Icon name="shield" className="w-4 h-4 text-brand-800" />
              <span>Chính sách minh bạch A2Order</span>
            </div>
            <p className="text-ink-muted leading-relaxed text-[11px]">
              Quán có thể bật thêm module bất cứ lúc nào khi mở rộng quy mô. Hệ thống sẽ tính bù trừ chênh lệch thời gian còn lại tự động.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
};
