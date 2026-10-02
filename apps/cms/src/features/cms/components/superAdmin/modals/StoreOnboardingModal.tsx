import React, { useEffect, useState } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { BusinessType, BUSINESS_TYPE_CONFIG, AppModule, TenantStoreRecord } from "@/types/cms.types";
import { IconName } from "@/types/icon.types";
import { StoreScale, PlanConfig, PLAN_CONFIGS } from "@a2order/shared";
import { configApi } from "@/services/api/configApi";
import { useUnsavedEditor } from "@/hooks/useUnsavedEditor";

export interface StoreOnboardSubmitData {
  name: string;
  owner: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPin: string;
  phone: string;
  address: string;
  businessType: BusinessType;
  scale: StoreScale;
  modules: AppModule[];
  tableCount: number;
  durationMonths: number;
  plan: "STARTER" | "GROWTH" | "PRO";
}

export interface StoreOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: StoreOnboardSubmitData) => Promise<TenantStoreRecord | null>;
}

export const BUSINESS_TYPE_ICONS: Record<BusinessType, IconName> = {
  RESTAURANT: "utensils",
  BEER_GARDEN: "beer",
  SNACK_SHOP: "cookie",
  BUBBLE_TEA: "cup",
  COFFEE_SHOP: "coffee",
  SPICY_NOODLE: "soup",
  JUICE_BAR: "cup",
  OTHER: "store",
};

const getDefaultTableCount = (type: BusinessType): number => {
  switch (type) {
    case "RESTAURANT":
      return 24;
    case "BEER_GARDEN":
      return 20;
    case "COFFEE_SHOP":
      return 14;
    case "BUBBLE_TEA":
      return 10;
    case "SPICY_NOODLE":
      return 12;
    case "SNACK_SHOP":
      return 8;
    case "JUICE_BAR":
      return 6;
    default:
      return 12;
  }
};

const createInitialForm = (): StoreOnboardSubmitData => ({
  name: "",
  owner: "",
  ownerEmail: "",
  ownerPassword: "",
  ownerPin: "1234",
  phone: "",
  address: "",
  businessType: "COFFEE_SHOP" as BusinessType,
  scale: "STANDARD" as StoreScale,
  modules: [...BUSINESS_TYPE_CONFIG.COFFEE_SHOP.suggestedModules],
  tableCount: 14,
  durationMonths: 12,
  plan: "GROWTH" as "STARTER" | "GROWTH" | "PRO",
});

const MODULE_NAMES_VI: Record<string, string> = {
  CORE_POS: "POS Bán Hàng",
  MODULE_QR_ORDER: "QR Order Tại Bàn",
  MODULE_KDS: "Màn Hình Bếp KDS",
  MODULE_LANDING_PAGE: "Website / Landing Page",
  MODULE_ADVANCED_ANALYTICS: "Báo Cáo Nâng Cao",
  MODULE_ACCOUNTING: "Kế Toán Doanh Thu",
  MODULE_ATTENDANCE_HRM: "Chấm Công & Xếp Ca",
  MODULE_STAFF_INTERCOM: "Bộ Đàm & Chat Nội Bộ",
};

export const StoreOnboardingModal: React.FC<StoreOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [form, setForm] = useState<StoreOnboardSubmitData>(createInitialForm);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [createdSuccess, setCreatedSuccess] = useState<{
    store: TenantStoreRecord;
    credentials: { email: string; password: string; pin: string };
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [plans, setPlans] = useState<PlanConfig[]>(Object.values(PLAN_CONFIGS));

  const { requestClose } = useUnsavedEditor(
    "store_onboarding",
    isOpen && !createdSuccess,
    JSON.stringify({ onboardStep, form }),
    onClose
  );

  useEffect(() => {
    if (isOpen) {
      setOnboardStep(1);
      setForm(createInitialForm());
      setShowPassword(false);
      setIsSubmitting(false);
      setErrorMessage("");
      setCreatedSuccess(null);
      setCopied(false);

      // Nạp cấu hình bảng giá mới nhất từ PostgreSQL
      configApi.getPricingConfig().then((cfg) => {
        if (cfg?.plans) {
          const list = (Array.isArray(cfg.plans) ? cfg.plans : Object.values(cfg.plans)) as PlanConfig[];
          if (list.length > 0) setPlans(list);
        }
      }).catch(() => {
        // Fallback to default constants
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBusinessTypeSelect = (key: BusinessType) => {
    const cfg = BUSINESS_TYPE_CONFIG[key];
    const defaultTables = getDefaultTableCount(key);
    const suggestedPlan =
      key === "RESTAURANT" ? "PRO" : key === "SNACK_SHOP" || key === "JUICE_BAR" ? "STARTER" : "GROWTH";

    setForm((f) => ({
      ...f,
      businessType: key,
      modules: [...cfg.suggestedModules],
      tableCount: defaultTables,
      plan: suggestedPlan,
    }));
  };

  const handleFinish = async () => {
    setErrorMessage("");

    // Validation
    if (!form.name.trim()) {
      setErrorMessage("Vui lòng nhập tên quán / thương hiệu.");
      return;
    }
    if (!form.phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại quán.");
      return;
    }
    if (!form.owner.trim()) {
      setErrorMessage("Vui lòng nhập họ tên chủ quán / người đại diện.");
      return;
    }
    if (!form.ownerEmail.trim() || !form.ownerEmail.includes("@")) {
      setErrorMessage("Vui lòng nhập email hợp lệ cho tài khoản chủ quán.");
      return;
    }
    if (!form.ownerPassword || form.ownerPassword.length < 6) {
      setErrorMessage("Mật khẩu tài khoản phải có ít nhất 6 ký tự.");
      return;
    }
    if (!form.ownerPin || form.ownerPin.trim().length !== 4) {
      setErrorMessage("Mã PIN POS phải bao gồm đúng 4 chữ số.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(form);
      if (result) {
        setCreatedSuccess({
          store: result,
          credentials: {
            email: form.ownerEmail.trim().toLowerCase(),
            password: form.ownerPassword,
            pin: form.ownerPin.trim(),
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể khởi tạo cửa hàng trên máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyHandover = () => {
    if (!createdSuccess) return;
    const { store, credentials } = createdSuccess;
    const handoverText = `THÔNG TIN BÀN GIAO CỬA HÀNG A2ORDER
--------------------------------------------
• Tên quán: ${store.name}
• Mã License: ${store.licenseKey}
• Gói cước: Gói ${store.plan} (${form.durationMonths} tháng)
• Trạng thái: Kích hoạt (ACTIVE)
• Số bàn khởi tạo: ${store.tableCount} bàn

TÀI KHOẢN CHỦ QUÁN (QUẢN TRỊ CMS & POS):
• Email đăng nhập: ${credentials.email}
• Mật khẩu: ${credentials.password}
• Mã PIN POS: ${credentials.pin}
• Đăng nhập tại: ${window.location.origin}/login-owner
--------------------------------------------
(Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên)`;

    navigator.clipboard.writeText(handoverText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Pricing calculations: Lấy trực tiếp từ PostgreSQL thông qua configApi
  const starterPlan = plans.find((p) => p.id === "STARTER");
  const growthPlan = plans.find((p) => p.id === "GROWTH");
  const proPlan = plans.find((p) => p.id === "PRO");

  const selectedPlanConfig = plans.find((p) => p.id === form.plan);
  const pricePerMonth = selectedPlanConfig?.monthlyPrice || (form.plan === "STARTER" ? 119000 : form.plan === "GROWTH" ? 199000 : 299000);
  const subTotal = pricePerMonth * form.durationMonths;
  const discountRate = form.durationMonths >= 12 ? 0.2 : form.durationMonths >= 6 ? 0.1 : 0;
  const discountAmount = Math.round(subTotal * discountRate);
  const finalAmount = subTotal - discountAmount;

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden max-h-[95dvh] sm:max-h-[90dvh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-900 text-white flex items-center justify-center">
                  <Icon name="store" className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-ink-primary">
                  {createdSuccess ? "Khởi Tạo Quán Thành Công!" : "Khởi Tạo Quán Mới & Cấp Bản Quyền"}
                </h3>
              </div>
              {!createdSuccess && (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`h-1.5 w-20 rounded-full transition-all duration-300 ${
                      onboardStep >= 1 ? "bg-brand-900" : "bg-slate-200"
                    }`}
                  />
                  <div
                    className={`h-1.5 w-20 rounded-full transition-all duration-300 ${
                      onboardStep >= 2 ? "bg-brand-900" : "bg-slate-200"
                    }`}
                  />
                  <span className="text-[11px] text-ink-muted font-bold ml-1">
                    Bước {onboardStep}/2:{" "}
                    {onboardStep === 1
                      ? "Mô hình & Gói cước"
                      : "Thông tin quán & Tài khoản Chủ Quán"}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={createdSuccess ? onClose : requestClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-slate-200 transition-colors"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* SUCCESS HANDOVER SCREEN */}
            {createdSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon name="checkCircle" className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      Cửa hàng &quot;{createdSuccess.store.name}&quot; đã được kích hoạt!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Bản quyền đã ở trạng thái <strong>ACTIVE (Dùng ngay)</strong>. Cơ sở dữ liệu đã nạp sẵn thực đơn mẫu và {createdSuccess.store.tableCount} bàn ăn.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="key" className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Thông Tin Bàn Giao Khách Hàng
                      </span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ACTIVE • {createdSuccess.store.daysLeft} ngày
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tên Quán:</span>
                      <strong className="text-slate-100">{createdSuccess.store.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">License Key:</span>
                      <strong className="text-amber-400 font-mono tracking-wider">
                        {createdSuccess.store.licenseKey}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email Đăng Nhập CMS:</span>
                      <strong className="text-blue-300 select-all font-mono">
                        {createdSuccess.credentials.email}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Mật Khẩu Đăng Nhập:</span>
                      <strong className="text-emerald-300 select-all font-mono">
                        {createdSuccess.credentials.password}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Mã PIN POS:</span>
                      <strong className="text-emerald-300 select-all font-mono tracking-widest">
                        {createdSuccess.credentials.pin}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gói cước:</span>
                      <span className="font-extrabold text-slate-200">
                        Gói {createdSuccess.store.plan} ({form.durationMonths} tháng)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <Button
                    type="button"
                    onClick={handleCopyHandover}
                    className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Icon name={copied ? "check" : "copy"} className="w-4 h-4" />
                    {copied ? "Đã Sao Chép Vào Clipboard!" : "Sao Chép Thông Tin Gửi Khách (Zalo)"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="rounded-xl text-xs py-2.5 border-slate-300 hover:bg-slate-100"
                  >
                    Đóng & Về Danh Sách
                  </Button>
                </div>
              </div>
            ) : null}

            {/* STEP 1: Loại hình & Gói cước */}
            {!createdSuccess && onboardStep === 1 && (
              <div className="space-y-5">
                {/* 1. Chọn loại hình F&B */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-ink-primary flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-4 h-4 rounded-full bg-brand-900 text-white text-[10px] flex items-center justify-center font-bold">
                        1
                      </span>
                      Chọn Mô Hình Kinh Doanh F&B
                    </label>
                    <span className="text-[11px] text-ink-muted">Tự động nạp menu & cấu hình chuẩn</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      Object.entries(BUSINESS_TYPE_CONFIG) as [
                        BusinessType,
                        (typeof BUSINESS_TYPE_CONFIG)[BusinessType]
                      ][]
                    ).map(([key, cfg]) => {
                      const isSelected = form.businessType === key;
                      const iconName = BUSINESS_TYPE_ICONS[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleBusinessTypeSelect(key)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between group ${
                            isSelected
                              ? "border-brand-900 bg-brand-50/80 shadow-xs"
                              : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div>
                            {iconName ? (
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                                  isSelected
                                    ? "bg-brand-900 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-900"
                                }`}
                              >
                                <Icon name={iconName} className="w-4 h-4" />
                              </div>
                            ) : null}
                            <div className="text-xs font-black text-ink-primary leading-tight">
                              {cfg.label}
                            </div>
                            <div className="text-[10px] text-ink-muted leading-tight mt-1 line-clamp-1">
                              {cfg.description}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-900 flex items-center justify-center">
                              <Icon name="check" className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Chọn Gói Cước Phần Mềm */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-ink-primary flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-4 h-4 rounded-full bg-brand-900 text-white text-[10px] flex items-center justify-center font-bold">
                        2
                      </span>
                      Chọn Gói Cước Phần Mềm
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Gói STARTER */}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, plan: "STARTER" }))}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        form.plan === "STARTER"
                          ? "border-emerald-600 bg-emerald-50/80 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-700 text-white uppercase tracking-wider">
                        {starterPlan?.badge || "Rẻ hơn KiotViet 40%"}
                      </span>
                      <div>
                        <div className="text-xs font-black text-emerald-800">{starterPlan?.name || "STARTER (Quán Nhỏ)"}</div>
                        <div className="text-base font-black text-emerald-950 mt-0.5">
                          {((starterPlan?.monthlyPrice || 119000)).toLocaleString("vi-VN")} đ<span className="text-[10px] font-normal text-slate-500">/tháng</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          {starterPlan?.description || "Xe đẩy, cafe mang đi. Tối đa 15 bàn, 5 nhân viên."}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-bold">
                        Tối đa {starterPlan?.maxTables || 15} bàn · POS + QR Menu
                      </div>
                    </button>

                    {/* Gói GROWTH */}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, plan: "GROWTH" }))}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        form.plan === "GROWTH"
                          ? "border-blue-600 bg-blue-50/80 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase tracking-wider">
                        {growthPlan?.badge || "Không Phụ Thu Máy"}
                      </span>
                      <div>
                        <div className="text-xs font-black text-blue-800">{growthPlan?.name || "GROWTH (Tiêu Chuẩn)"}</div>
                        <div className="text-base font-black text-blue-950 mt-0.5">
                          {((growthPlan?.monthlyPrice || 199000)).toLocaleString("vi-VN")} đ<span className="text-[10px] font-normal text-slate-500">/tháng</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          {growthPlan?.description || "Quán cà phê, nhà hàng vừa. Tối đa 50 bàn, 15 nhân viên."}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-blue-200/60 text-[10px] text-blue-800 font-bold">
                        Tối đa {growthPlan?.maxTables || 50} bàn · Bếp KDS + Sổ Quỹ
                      </div>
                    </button>

                    {/* Gói PRO */}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, plan: "PRO" }))}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        form.plan === "PRO"
                          ? "border-purple-600 bg-purple-50/80 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-600 text-white uppercase tracking-wider">
                        {proPlan?.badge || "Full All-In-One"}
                      </span>
                      <div>
                        <div className="text-xs font-black text-purple-800">{proPlan?.name || "PRO (Chuyên Nghiệp)"}</div>
                        <div className="text-base font-black text-purple-950 mt-0.5">
                          {((proPlan?.monthlyPrice || 299000)).toLocaleString("vi-VN")} đ<span className="text-[10px] font-normal text-slate-500">/tháng</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          {proPlan?.description || "Chuỗi quán, nhà hàng lớn. Tối đa 150 bàn, mở rộng tối đa."}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-purple-200/60 text-[10px] text-purple-800 font-bold">
                        Tối đa {proPlan?.maxTables || 150} bàn · Full 6 Modules + Web
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Chọn Thời Hạn Thuê */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-black text-ink-primary flex items-center gap-1.5 uppercase tracking-wide mb-2">
                    <span className="w-4 h-4 rounded-full bg-brand-900 text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    Thời Hạn Bản Quyền & Chiết Khấu
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { months: 1, label: "1 tháng", discount: null },
                      { months: 3, label: "3 tháng", discount: null },
                      { months: 6, label: "6 tháng", discount: "-10%" },
                      { months: 12, label: "12 tháng", discount: "-20%" },
                    ].map((item) => {
                      const isSelected = form.durationMonths === item.months;
                      return (
                        <button
                          key={item.months}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, durationMonths: item.months }))}
                          className={`py-2 px-2 rounded-xl border text-center transition-all ${
                            isSelected
                              ? "border-brand-900 bg-brand-900 text-white font-black shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-bold"
                          }`}
                        >
                          <div className="text-xs">{item.label}</div>
                          {item.discount && (
                            <span
                              className={`text-[9px] block mt-0.5 font-extrabold ${
                                isSelected ? "text-amber-300" : "text-emerald-700"
                              }`}
                            >
                              {item.discount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Tóm tắt Module đi kèm */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-2">
                    <Icon name="check" className="w-3.5 h-3.5 text-brand-900" />
                    Tính Năng Tự Động Kích Hoạt Sẵn:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.modules.map((mod) => (
                      <span
                        key={mod}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                      >
                        ✓ {MODULE_NAMES_VI[mod] || mod}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <Icon name="sparkles" className="w-3.5 h-3.5 text-brand-900 shrink-0" />
                    <span>Hệ thống sẽ tự động đồng bộ CSDL PostgreSQL, nạp thực đơn mẫu và sơ đồ bàn ăn vào máy chủ ngay khi hoàn tất.</span>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Thông tin quán & Tài khoản Chủ Quán */}
            {!createdSuccess && onboardStep === 2 && (
              <div className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <Icon name="alertCircle" className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section A: Thông tin cơ sở kinh doanh */}
                <div className="space-y-2.5">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="building" className="w-3.5 h-3.5 text-brand-900" />
                    Thông Tin Cơ Sở Kinh Doanh
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Tên Quán / Thương Hiệu *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="VD: Cà Phê Trứng Bát Đàn"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Số Điện Thoại Quán *
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="0912 345 678"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Số Bàn Ăn Khởi Tạo
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={form.tableCount}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, tableCount: Number(e.target.value) || 1 }))
                        }
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Địa Chỉ Cửa Hàng
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="VD: 128 Phố Huế, Hai Bà Trưng, Hà Nội"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Tài khoản Chủ Quán */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="userCheck" className="w-3.5 h-3.5 text-brand-900" />
                      Tài Khoản Đăng Nhập Quản Trị (Chủ Quán)
                    </div>
                    <span className="text-[10px] text-brand-900 font-bold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      Vai trò: STORE_OWNER
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Tài khoản này dùng để đăng nhập CMS quản lý cửa hàng, toàn quyền thêm sửa thực đơn, nhân viên và bàn ăn.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Họ & Tên Chủ Quán *
                      </label>
                      <input
                        type="text"
                        value={form.owner}
                        onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Email Đăng Nhập CMS *
                      </label>
                      <input
                        type="email"
                        value={form.ownerEmail}
                        onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                        placeholder="chuquan@gmail.com"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Mật Khẩu Đăng Nhập *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.ownerPassword}
                          onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full h-9 pl-3 pr-9 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-900 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <Icon name={showPassword ? "eyeOff" : "eye"} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Mã PIN Đăng Nhập POS (4 số)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={form.ownerPin}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ownerPin: e.target.value.replace(/\D/g, "") }))
                        }
                        placeholder="1234"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold tracking-widest text-center focus:outline-none focus:border-brand-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Tóm tắt chi phí & Kích hoạt */}
                <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Gói {form.plan} ({form.durationMonths} tháng x {pricePerMonth.toLocaleString("vi-VN")} đ)
                    </span>
                    <span className="font-bold text-slate-800">{subTotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Ưu đãi thời hạn ({discountRate * 100}%)</span>
                      <span className="font-bold">-{discountAmount.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-brand-900 border-t border-brand-200 pt-1.5 text-sm">
                    <span>Tổng Phí Kích Hoạt Bản Quyền:</span>
                    <span>{finalAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Bản quyền sẽ được kích hoạt ngay lập tức (Trạng thái ACTIVE)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {!createdSuccess && (
            <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
              {onboardStep === 2 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setOnboardStep(1)}
                  disabled={isSubmitting}
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
                  className="rounded-xl bg-brand-900 text-white text-xs px-6 shadow-sm hover:bg-brand-800"
                  onClick={() => setOnboardStep(2)}
                >
                  Tiếp Tục: Điền Thông Tin Quán →
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-6 shadow-sm hover:bg-brand-800 disabled:opacity-50"
                  disabled={
                    isSubmitting ||
                    !form.name.trim() ||
                    !form.owner.trim() ||
                    !form.phone.trim() ||
                    !form.ownerEmail.trim()
                  }
                  onClick={handleFinish}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
                      Đang Khởi Tạo...
                    </span>
                  ) : (
                    "Xác Nhận & Khởi Tạo Quán"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};
