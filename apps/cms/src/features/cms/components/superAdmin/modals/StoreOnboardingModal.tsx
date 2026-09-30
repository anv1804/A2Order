import React, { useEffect, useState } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { BusinessType, BUSINESS_TYPE_CONFIG, AppModule } from "@/types/cms.types";
import { BUSINESS_SCENARIOS } from "@/data/businessScenarios";
import { StoreScale, STORE_SCALE_CONFIGS } from "@a2order/shared";
import { useUnsavedEditor } from "@/hooks/useUnsavedEditor";

const createInitialForm = () => ({
  name: "", owner: "", phone: "", address: "",
  businessType: "COFFEE_SHOP" as BusinessType,
  scale: "STANDARD" as StoreScale,
  modules: [...BUSINESS_TYPE_CONFIG.COFFEE_SHOP.suggestedModules],
  tableCount: 12,
  durationMonths: 12,
  plan: "GROWTH" as "STARTER" | "GROWTH" | "PRO",
});

export interface StoreOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: {
    name: string;
    owner: string;
    phone: string;
    address: string;
    businessType: BusinessType;
    scale: StoreScale;
    modules: AppModule[];
    tableCount: number;
    durationMonths: number;
    plan: "STARTER" | "GROWTH" | "PRO";
  }) => void;
}

export const StoreOnboardingModal: React.FC<StoreOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [form, setForm] = useState(createInitialForm);
  const { requestClose } = useUnsavedEditor("store_onboarding", isOpen, JSON.stringify({ onboardStep, form }), onClose);

  useEffect(() => {
    if (isOpen) { setOnboardStep(1); setForm(createInitialForm()); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBusinessTypeSelect = (key: BusinessType) => {
    const cfg = BUSINESS_TYPE_CONFIG[key];
    setForm((f) => ({
      ...f,
      businessType: key,
      modules: [...cfg.suggestedModules],
    }));
  };

  const handleScaleSelect = (scaleKey: StoreScale) => {
    const scaleCfg = STORE_SCALE_CONFIGS[scaleKey];
    setForm((f) => ({
      ...f,
      scale: scaleKey,
      tableCount: scaleCfg.defaultTables,
      plan: scaleCfg.recommendedPlan,
    }));
  };

  const handleFinish = () => {
    onSubmit(form);
  };

  const scenario = form.businessType ? BUSINESS_SCENARIOS[form.businessType] : null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden max-h-[95dvh] sm:max-h-[92dvh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <div>
              <h3 className="text-sm font-black text-ink-primary">
                Đăng Ký Quán Thuê Mới
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-1 w-16 rounded-full ${onboardStep >= 1 ? "bg-brand-900" : "bg-surface-muted"}`} />
                <div className={`h-1 w-16 rounded-full ${onboardStep >= 2 ? "bg-brand-900" : "bg-surface-muted"}`} />
                <span className="text-[10px] text-ink-muted font-bold">Bước {onboardStep}/2: {onboardStep === 1 ? "Loại hình & Quy mô" : "Thông tin & Hợp đồng"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* STEP 1: Chọn loại hình & Quy mô */}
            {onboardStep === 1 && (
              <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                {/* 1. Loại hình kinh doanh */}
                <div>
                  <h4 className="text-sm font-black text-ink-primary mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Quán kinh doanh loại hình nào?
                  </h4>
                  <p className="text-xs text-ink-muted ml-6.5">
                    Chọn loại hình để hệ thống tự động tải kịch bản thực đơn mẫu, biến thể size, topping và gợi ý module phù hợp.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.entries(BUSINESS_TYPE_CONFIG) as [BusinessType, typeof BUSINESS_TYPE_CONFIG[BusinessType]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleBusinessTypeSelect(key)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                        form.businessType === key
                          ? "border-brand-800 bg-brand-50 shadow-sm"
                          : "border-surface-border bg-white hover:border-brand-300 hover:bg-surface-canvas"
                      }`}
                    >
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span className="text-[11px] font-extrabold text-ink-primary leading-tight">{cfg.label}</span>
                      <span className="text-[10px] text-ink-muted leading-tight">{cfg.description}</span>
                      {form.businessType === key && (
                        <span className="w-5 h-5 rounded-full bg-brand-900 flex items-center justify-center">
                          <Icon name="check" className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 2. Quy mô kinh doanh */}
                <div className="pt-2 border-t border-surface-border">
                  <h4 className="text-sm font-black text-ink-primary mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Quy mô hoạt động dự kiến của quán?
                  </h4>
                  <p className="text-xs text-ink-muted ml-6.5">
                    Hệ thống sẽ ước lượng số lượng bàn ăn khởi tạo và gợi ý gói license phù hợp với năng lực phục vụ.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(Object.entries(STORE_SCALE_CONFIGS) as [StoreScale, typeof STORE_SCALE_CONFIGS[StoreScale]][]).map(([sKey, sCfg]) => {
                    const isSelected = form.scale === sKey;
                    return (
                      <button
                        key={sKey}
                        type="button"
                        onClick={() => handleScaleSelect(sKey)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "border-brand-900 bg-brand-50/80 shadow-xs"
                            : "border-surface-border bg-white hover:border-brand-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-ink-primary">{sCfg.label}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isSelected ? "bg-brand-900 text-white" : "bg-surface-muted text-ink-secondary"
                            }`}>
                              {sCfg.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-ink-muted line-clamp-2 leading-relaxed">
                            {sCfg.description}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-surface-border/60 flex items-center justify-between text-[10px]">
                          <span className="text-ink-secondary font-bold">Ước tính: {sCfg.deviceEstimate}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Xem trước kịch bản & gợi ý */}
                {form.businessType && (
                  <div className="space-y-3.5 pt-2 border-t border-surface-border">
                    {/* Modules gợi ý */}
                    <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200">
                      <p className="text-xs font-black text-brand-900 mb-2 flex items-center gap-1.5">
                        <Icon name="check" className="w-3.5 h-3.5 text-brand-900" />
                        Gói Module đề xuất cho {BUSINESS_TYPE_CONFIG[form.businessType].label} ({STORE_SCALE_CONFIGS[form.scale].label}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.modules.map((m) => (
                          <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-900 text-white">
                            {m.replace("MODULE_", "").replace("CORE_", "").replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Kịch bản mẫu F&B */}
                    {scenario && (
                      <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-black text-ink-primary flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Kịch Bản Thực Đơn Mẫu Đề Xuất: {scenario.label}
                            </div>
                            <p className="text-[11px] text-ink-muted mt-0.5">{scenario.description}</p>
                          </div>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {scenario.dishes.length} món mẫu • Khởi tạo {form.tableCount} bàn
                          </span>
                        </div>

                        {/* Món ăn mẫu */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {scenario.dishes.slice(0, 4).map((dish) => (
                            <div key={dish.id} className="p-2 rounded-xl bg-white border border-surface-border flex gap-2 items-center shadow-xs">
                              {dish.image && (
                                <img
                                  src={dish.image}
                                  alt={dish.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-surface-border shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-ink-primary truncate">{dish.name}</div>
                                <div className="text-[10px] font-extrabold text-brand-900">
                                  {dish.price.toLocaleString("vi-VN")} đ
                                  {dish.variants && dish.variants.length > 0 && ` (${dish.variants.length} size)`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Thông tin cơ bản tối thiểu & Kích hoạt */}
            {onboardStep === 2 && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-ink-primary flex items-center gap-2">
                    <span className="text-xl">{form.businessType ? BUSINESS_TYPE_CONFIG[form.businessType].emoji : "🏪"}</span>
                    Thông Tin Quán & Hợp Đồng Kích Hoạt
                  </h4>
                  <span className="text-[11px] font-bold text-brand-900 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-200">
                    Quy mô: {STORE_SCALE_CONFIGS[form.scale].label}
                  </span>
                </div>

                {/* Banner thông báo cấu hình riêng sau này */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Icon name="info" className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-black">Khởi tạo nhanh & Tinh gọn:</span>
                    <p className="text-[11px] text-amber-800">
                      Chỉ cần điền các thông tin đại diện bên dưới để tạo quán. Các thiết lập chi tiết khác như: <strong>Sơ đồ bàn chia tầng, Thực đơn riêng biệt, Tài khoản ngân hàng VietQR, Cấu hình máy in và Phân quyền nhân viên</strong> sẽ được tùy chỉnh riêng bất cứ lúc nào trong mục <strong>Cài Đặt Quán</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Tên Quán / Thương Hiệu *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="VD: Quán Cà Phê Trứng Bát Đàn"
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Tên Chủ Quán / Đại Diện *</label>
                    <input
                      type="text"
                      value={form.owner}
                      onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Số Điện Thoại Kích Hoạt *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="0912 345 678"
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Địa Chỉ Cửa Hàng</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="128 Phố Huế, Hai Bà Trưng, Hà Nội"
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Số Bàn Ăn Khởi Tạo</label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={form.tableCount}
                      onChange={(e) => setForm((f) => ({ ...f, tableCount: Number(e.target.value) }))}
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-ink-muted mb-1 block">Thời Hạn Thuê (tháng)</label>
                    <select
                      value={form.durationMonths}
                      onChange={(e) => setForm((f) => ({ ...f, durationMonths: Number(e.target.value) }))}
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                    >
                      {[1, 3, 6, 12].map((m) => (
                        <option key={m} value={m}>
                          {m} tháng {m >= 12 ? "(-20%)" : m >= 6 ? "(-10%)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gói plan */}
                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-2 block">Gói Tính Năng Phần Mềm</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["STARTER", "GROWTH", "PRO"] as const).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, plan }))}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                          form.plan === plan
                            ? plan === "PRO" ? "border-purple-600 bg-purple-50" : plan === "GROWTH" ? "border-blue-500 bg-blue-50" : "border-emerald-500 bg-emerald-50"
                            : "border-surface-border bg-white hover:border-surface-muted"
                        }`}
                      >
                        <div className="text-xs font-black text-ink-primary">{plan}</div>
                        <div className="text-[10px] text-ink-muted">
                          {plan === "STARTER" ? "199k/tháng" : plan === "GROWTH" ? "399k/tháng" : "599k/tháng"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tóm tắt chi phí */}
                {(() => {
                  const price = form.plan === "STARTER" ? 199000 : form.plan === "GROWTH" ? 399000 : 599000;
                  const sub = price * form.durationMonths;
                  const disc = form.durationMonths >= 12 ? Math.round(sub * 0.2) : form.durationMonths >= 6 ? Math.round(sub * 0.1) : 0;
                  return (
                    <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-1">
                      <div className="flex justify-between text-ink-muted">
                        <span>Tạm tính ({form.durationMonths} tháng)</span>
                        <span className="font-bold">{sub.toLocaleString("vi-VN")} đ</span>
                      </div>
                      {disc > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Chiết khấu thời hạn</span>
                          <span className="font-bold">-{disc.toLocaleString("vi-VN")} đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-brand-900 border-t border-brand-200 pt-1">
                        <span>Tổng chi phí phần mềm</span>
                        <span>{(sub - disc).toLocaleString("vi-VN")} đ</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-surface-border bg-surface-canvas shrink-0">
            {onboardStep === 2 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setOnboardStep(1)}
              >
                ← Quay Lại
              </Button>
            ) : (
              <div />
            )}

            {onboardStep === 1 ? (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-6"
                disabled={!form.businessType}
                onClick={() => setOnboardStep(2)}
              >
                Tiếp Tục →
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-6 shadow-sm"
                disabled={!form.name.trim() || !form.owner.trim() || !form.phone.trim()}
                onClick={handleFinish}
              >
                Xác Nhận Đăng Ký & Kích Hoạt
              </Button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
