import React, { useState } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { BusinessType, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";
import { BUSINESS_TYPE_ICONS } from "../../superAdmin/modals/StoreOnboardingModal";
import { BUSINESS_SCENARIOS } from "@/data/businessScenarios";

export interface ScenarioPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (type: BusinessType, mode: "REPLACE" | "APPEND") => void;
}

export const ScenarioPickerModal: React.FC<ScenarioPickerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [selectedScenarioType, setSelectedScenarioType] = useState<BusinessType>("COFFEE_SHOP");

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-4xl rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-canvas shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-xl shadow-xs">
                ✨
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">
                  Kho Kịch Bản Thực Đơn F&B Mẫu
                </h3>
                <p className="text-xs text-ink-muted">
                  Chọn mô hình kinh doanh để nạp trọn bộ món ăn, biến thể size, topping và sơ đồ vận hành
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

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* 8 Business Scenarios Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.entries(BUSINESS_TYPE_CONFIG) as [BusinessType, typeof BUSINESS_TYPE_CONFIG[BusinessType]][]).map(([key, cfg]) => {
                const scenario = BUSINESS_SCENARIOS[key];
                const isSelected = selectedScenarioType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedScenarioType(key)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-brand-900 bg-brand-50 shadow-sm"
                        : "border-surface-border bg-white hover:border-brand-200 hover:bg-surface-canvas"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Icon name={BUSINESS_TYPE_ICONS[key] || "store"} className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-brand-900 flex items-center justify-center text-white">
                          <Icon name="check" className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className={`text-xs font-black ${isSelected ? "text-brand-950" : "text-ink-primary"}`}>
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-ink-muted mt-0.5 line-clamp-1">
                        {scenario ? `${scenario.dishes.length} món • ${scenario.categories.length} nhóm` : cfg.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scenario Detail Preview */}
            {selectedScenarioType && (() => {
              const scenario = BUSINESS_SCENARIOS[selectedScenarioType];
              if (!scenario) return null;
              return (
                <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-4">
                  {/* Summary Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-900 text-white flex items-center justify-center">
                          <Icon name={BUSINESS_TYPE_ICONS[selectedScenarioType] || "store"} className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-black text-ink-primary">{scenario.label}</h4>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {scenario.dishes.length} món có sẵn
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1">{scenario.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-brand-900 bg-white px-2.5 py-1 rounded-xl border border-surface-border shadow-xs">
                        Sơ đồ gợi ý: {scenario.defaultTables.length} bàn
                      </span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-1.5">
                      Các Nhóm Thực Đơn Trong Kịch Bản:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scenario.categories.map((c) => (
                        <span key={c.id} className="text-xs font-bold bg-white text-ink-primary border border-surface-border px-3 py-1 rounded-xl shadow-xs">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dishes List */}
                  <div>
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">
                      Món Ăn, Biến Thể Size & Topping Kèm Theo ({scenario.dishes.length} món):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {scenario.dishes.map((dish) => (
                        <div key={dish.id} className="p-3 rounded-2xl bg-white border border-surface-border flex gap-3 shadow-xs">
                          {dish.image && (
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-16 h-16 rounded-xl object-cover border border-surface-border shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <div className="text-xs font-black text-ink-primary truncate">{dish.name}</div>
                              <div className="text-xs font-black text-brand-900 shrink-0">
                                {dish.price.toLocaleString("vi-VN")} đ
                              </div>
                            </div>
                            <span className="text-[10px] text-ink-muted block mt-0.5">{dish.category}</span>

                            {/* Variants */}
                            {dish.variants && dish.variants.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {dish.variants.map((v) => (
                                  <span key={v.id} className="text-[9px] font-bold bg-brand-50 text-brand-900 px-1.5 py-0.5 rounded border border-brand-200">
                                    {v.name}: {v.price.toLocaleString("vi-VN")}đ
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Customizations / Toppings */}
                            {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dish.customizationGroups.map((g) => (
                                  <span key={g.id} className="text-[9px] text-ink-muted bg-surface-muted px-1.5 py-0.5 rounded">
                                    {g.name} ({g.options.length})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-surface-border bg-surface-canvas shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs w-full sm:w-auto"
              onClick={onClose}
            >
              Đóng
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-brand-300 text-brand-900 bg-white hover:bg-brand-50 shadow-xs flex-1 sm:flex-initial"
                onClick={() => onApply(selectedScenarioType, "APPEND")}
              >
                + Nối Thêm Vào Menu Hiện Tại
              </Button>

              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-5 font-bold shadow-sm flex-1 sm:flex-initial"
                onClick={() => onApply(selectedScenarioType, "REPLACE")}
              >
                ✓ Nạp Mới (Ghi Đè Thực Đơn)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
