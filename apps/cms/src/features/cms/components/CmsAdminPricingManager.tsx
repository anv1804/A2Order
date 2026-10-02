import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Panel, Button, Icon, Checkbox, SearchableSelect, SearchableSelectOption } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { useUnsavedChanges } from "@/stores/unsavedChangesStore";
import { useUnsavedEditor } from "@/hooks/useUnsavedEditor";
import { formatCurrency } from "@/lib/formatters";
import { configApi } from "@/services/api/configApi";
import {
  APP_MODULE_CATALOG,
  AppModule,
  ModulePricingInfo,
  PromoVoucher,
  DEFAULT_PERIOD_DISCOUNTS,
  PeriodDiscountRule,
  PlanConfig,
  PLAN_CONFIGS,
} from "@a2order/shared";

export interface CmsAdminPricingManagerProps {
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const CmsAdminPricingManager: React.FC<CmsAdminPricingManagerProps> = ({
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
}) => {
  // Tab con trong Bảng giá
  const [activeSubTab, setActiveSubTab] = useState<"plans" | "modules" | "discounts" | "vouchers" | "simulator">("plans");

  // Chế độ phóng to toàn màn hình
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = propIsMaximized !== undefined ? propIsMaximized : internalMaximized;
  const setIsMaximized = propSetIsMaximized || setInternalMaximized;

  // Trạng thái tải dữ liệu từ PostgreSQL
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Dữ liệu cấu hình thực tế từ DB
  const [plans, setPlans] = useState<PlanConfig[]>(Object.values(PLAN_CONFIGS));
  const [catalog, setCatalog] = useState<ModulePricingInfo[]>(APP_MODULE_CATALOG);
  const [periodDiscounts, setPeriodDiscounts] = useState<PeriodDiscountRule[]>(DEFAULT_PERIOD_DISCOUNTS);
  const [vouchers, setVouchers] = useState<PromoVoucher[]>([]);

  // State chỉnh sửa Plan
  const [editingPlanId, setEditingPlanId] = useState<"STARTER" | "GROWTH" | "PRO" | null>(null);
  const [planEditPrice, setPlanEditPrice] = useState<number>(0);
  const [planEditTables, setPlanEditTables] = useState<number>(0);
  const [planEditStaff, setPlanEditStaff] = useState<number>(0);
  const [planEditName, setPlanEditName] = useState<string>("");
  const [planEditDesc, setPlanEditDesc] = useState<string>("");
  const [planEditBadge, setPlanEditBadge] = useState<string>("");

  // State chỉnh sửa Module pricing
  const [editingModuleId, setEditingModuleId] = useState<AppModule | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  // State chỉnh sửa Period discounts
  const [editingDiscountMonths, setEditingDiscountMonths] = useState<number | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState(0);

  // State quản lý Vouchers
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherStatusFilter, setVoucherStatusFilter] = useState("ALL");
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState("");
  const [newVoucherType, setNewVoucherType] = useState<"PERCENT" | "FIXED_AMOUNT">("PERCENT");
  const [newVoucherValue, setNewVoucherValue] = useState<number>(10);
  const [newVoucherMonths, setNewVoucherMonths] = useState<number>(3);
  const [newVoucherLimit, setNewVoucherLimit] = useState<number>(50);

  // Modal xác nhận reset mặc định
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // --- NẠP DỮ LIỆU TỪ DATABASE POSTGRESQL ---
  const loadPricingConfig = useCallback(async (showToast = false) => {
    try {
      setIsLoading(true);
      const res = await configApi.getPricingConfig();
      if (res) {
        const planList = (Array.isArray(res.plans) ? res.plans : Object.values(res.plans || {})) as PlanConfig[];
        setPlans(planList.length > 0 ? planList : Object.values(PLAN_CONFIGS));
        setCatalog(res.modules && res.modules.length > 0 ? res.modules : APP_MODULE_CATALOG);
        setPeriodDiscounts(res.periodDiscounts && res.periodDiscounts.length > 0 ? res.periodDiscounts : DEFAULT_PERIOD_DISCOUNTS);
        setVouchers(res.vouchers || []);
        setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
        if (showToast) {
          toast.success("Đã đồng bộ cấu hình mới nhất từ PostgreSQL!");
        }
      }
    } catch (err: any) {
      toast.error("Lỗi kết nối cơ sở dữ liệu: " + (err.message || "Không thể tải cấu hình"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPricingConfig(false);
  }, [loadPricingConfig]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, setIsMaximized]);

  const { requestClose: requestCloseVoucher } = useUnsavedEditor(
    "voucher_modal",
    isVoucherModalOpen,
    JSON.stringify({ newVoucherCode, newVoucherType, newVoucherValue, newVoucherMonths, newVoucherLimit }),
    () => setIsVoucherModalOpen(false)
  );

  const priceChanged = editingModuleId !== null && editPrice !== catalog.find((module) => module.id === editingModuleId)?.monthlyPrice;
  const discountChanged =
    editingDiscountMonths !== null &&
    discountPercentInput !== periodDiscounts.find((rule) => rule.durationMonths === editingDiscountMonths)?.discountPercent;
  const planChanged = editingPlanId !== null;
  useUnsavedChanges("admin_pricing_inline", priceChanged || discountChanged || planChanged);

  // --- HANDLERS CHO GÓI CƯỚC SAAS (PLANS) ---
  const handleEditPlan = (plan: PlanConfig) => {
    setEditingPlanId(plan.id);
    setPlanEditPrice(plan.monthlyPrice);
    setPlanEditTables(plan.maxTables);
    setPlanEditStaff(plan.maxStaff);
    setPlanEditName(plan.name);
    setPlanEditDesc(plan.description);
    setPlanEditBadge(plan.badge || "");
  };

  const handleCancelEditPlan = () => {
    setEditingPlanId(null);
  };

  const handleSavePlan = async (planId: "STARTER" | "GROWTH" | "PRO") => {
    try {
      setIsSaving(true);
      const updatedPlans = plans.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            name: planEditName.trim() || p.name,
            monthlyPrice: Number(planEditPrice) || p.monthlyPrice,
            maxTables: Number(planEditTables) || p.maxTables,
            maxStaff: Number(planEditStaff) || p.maxStaff,
            description: planEditDesc.trim() || p.description,
            badge: planEditBadge.trim() || undefined,
          };
        }
        return p;
      });

      await configApi.updatePricingConfig({ plans: updatedPlans });
      setPlans(updatedPlans);
      setEditingPlanId(null);
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      toast.success(`Đã lưu cấu hình gói ${planId} lên Database PostgreSQL!`);
    } catch (err: any) {
      toast.error("Không thể lưu cấu hình gói: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLERS CHO MODULES ---
  const handleEditPrice = (mod: ModulePricingInfo) => {
    setEditingModuleId(mod.id);
    setEditPrice(mod.monthlyPrice);
  };

  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setEditPrice(0);
  };

  const handleSavePrice = async (modId: AppModule) => {
    try {
      setIsSaving(true);
      const updatedCatalog = catalog.map((m) => (m.id === modId ? { ...m, monthlyPrice: Number(editPrice) || m.monthlyPrice } : m));
      await configApi.updatePricingConfig({ modules: updatedCatalog });
      setCatalog(updatedCatalog);
      setEditingModuleId(null);
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      toast.success("Đã cập nhật đơn giá module lên Database PostgreSQL!");
    } catch (err: any) {
      toast.error("Lỗi cập nhật module: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLERS CHO CHIẾT KHẤU KỲ HẠN ---
  const handleEditDiscount = (rule: PeriodDiscountRule) => {
    setEditingDiscountMonths(rule.durationMonths);
    setDiscountPercentInput(rule.discountPercent);
  };

  const handleCancelDiscountEdit = () => {
    setEditingDiscountMonths(null);
  };

  const handleSaveDiscount = async (months: number) => {
    try {
      setIsSaving(true);
      const updatedDiscounts = periodDiscounts.map((r) =>
        r.durationMonths === months ? { ...r, discountPercent: Number(discountPercentInput) || 0 } : r
      );
      await configApi.updatePricingConfig({ periodDiscounts: updatedDiscounts });
      setPeriodDiscounts(updatedDiscounts);
      setEditingDiscountMonths(null);
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      toast.success("Đã lưu chiết khấu kỳ hạn lên Database PostgreSQL!");
    } catch (err: any) {
      toast.error("Lỗi cập nhật chiết khấu: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLERS CHO VOUCHERS ---
  const handleCreateVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode.trim()) {
      toast.error("Vui lòng nhập mã khuyến mại");
      return;
    }
    const created: PromoVoucher = {
      id: `v-${Date.now()}`,
      code: newVoucherCode.trim().toUpperCase(),
      discountType: newVoucherType,
      discountValue: Number(newVoucherValue) || 10,
      minContractMonths: Number(newVoucherMonths) || 1,
      validUntil: "2026-12-31",
      usageCount: 0,
      maxUsage: Number(newVoucherLimit) || 100,
      isActive: true,
    };

    try {
      setIsSaving(true);
      const updatedVouchers = [created, ...vouchers];
      await configApi.updatePricingConfig({ vouchers: updatedVouchers });
      setVouchers(updatedVouchers);
      setIsVoucherModalOpen(false);
      setNewVoucherCode("");
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      toast.success(`Đã phát hành và lưu mã voucher ${created.code} lên Database!`);
    } catch (err: any) {
      toast.error("Lỗi phát hành voucher: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVoucher = async (id: string, code: string, current: boolean) => {
    try {
      setIsSaving(true);
      const updatedVouchers = vouchers.map((v) => (v.id === id ? { ...v, isActive: !current } : v));
      await configApi.updatePricingConfig({ vouchers: updatedVouchers });
      setVouchers(updatedVouchers);
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      toast.info(`Đã ${current ? "tạm dừng" : "kích hoạt lại"} mã ${code} trên Database`);
    } catch (err: any) {
      toast.error("Lỗi cập nhật voucher: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVoucher = async (id: string, code: string) => {
    try {
      setIsSaving(true);
      const updatedVouchers = vouchers.filter((v) => v.id !== id);
      await configApi.updatePricingConfig({ vouchers: updatedVouchers });
      setVouchers(updatedVouchers);
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
      toast.success(`Đã xóa voucher ${code} khỏi Database`);
    } catch (err: any) {
      toast.error("Lỗi xóa voucher: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- RESET DEFAULT CONFIG ---
  const handleResetDefaults = async () => {
    try {
      setIsSaving(true);
      const res = await configApi.resetPricingConfig();
      if (res) {
        const planList = (Array.isArray(res.plans) ? res.plans : Object.values(res.plans || {})) as PlanConfig[];
        setPlans(planList);
        setCatalog(res.modules || APP_MODULE_CATALOG);
        setPeriodDiscounts(res.periodDiscounts || DEFAULT_PERIOD_DISCOUNTS);
        setVouchers(res.vouchers || []);
        setLastSyncedAt(new Date().toLocaleTimeString("vi-VN"));
        setIsResetConfirmOpen(false);
        toast.success("Đã khôi phục toàn bộ bảng giá và gói cước mặc định chuẩn!");
      }
    } catch (err: any) {
      toast.error("Lỗi khôi phục cấu hình: " + (err.message || "Lỗi máy chủ"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- SIMULATOR STATE ---
  const [simSelectedModules, setSimSelectedModules] = useState<AppModule[]>([AppModule.CORE_POS]);
  const [simMonths, setSimMonths] = useState<number>(6);
  const [simVoucherCode, setSimVoucherCode] = useState("");

  const simulation = useMemo(() => {
    let baseMo = 0;
    simSelectedModules.forEach((id) => {
      baseMo += catalog.find((c) => c.id === id)?.monthlyPrice || 0;
    });
    const subtotal = baseMo * simMonths;
    const pDiscRule = periodDiscounts.find((p) => p.durationMonths === simMonths);
    const pDiscPercent = pDiscRule ? pDiscRule.discountPercent : 0;
    const pDiscAmount = Math.round((subtotal * pDiscPercent) / 100);
    const afterPeriod = subtotal - pDiscAmount;

    let vDiscAmount = 0;
    let vError = "";
    const appliedV = vouchers.find((v) => v.code === simVoucherCode.toUpperCase() && v.isActive);
    if (simVoucherCode) {
      if (!appliedV) {
        vError = "Mã không hợp lệ hoặc đã hết hạn";
      } else if (simMonths < appliedV.minContractMonths) {
        vError = `Yêu cầu thuê tối thiểu ${appliedV.minContractMonths} tháng`;
      } else {
        if (appliedV.discountType === "PERCENT") {
          vDiscAmount = Math.round((afterPeriod * appliedV.discountValue) / 100);
        } else {
          vDiscAmount = Math.min(appliedV.discountValue, afterPeriod);
        }
      }
    }
    const finalAmount = Math.max(0, afterPeriod - vDiscAmount);

    return {
      baseMo,
      subtotal,
      pDiscPercent,
      pDiscAmount,
      vDiscAmount,
      appliedVoucher: appliedV && !vError ? appliedV : null,
      vError,
      finalAmount,
    };
  }, [simSelectedModules, simMonths, simVoucherCode, catalog, periodDiscounts, vouchers]);

  // Bộ lọc voucher
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (voucherSearch.trim()) {
        const q = voucherSearch.trim().toUpperCase();
        if (!v.code.includes(q)) return false;
      }
      if (voucherStatusFilter === "ACTIVE" && !v.isActive) return false;
      if (voucherStatusFilter === "INACTIVE" && v.isActive) return false;
      return true;
    });
  }, [vouchers, voucherSearch, voucherStatusFilter]);

  const voucherStatusOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất cả trạng thái", badge: vouchers.length },
      { value: "ACTIVE", label: "Đang hiệu lực", badge: vouchers.filter((v) => v.isActive).length },
      { value: "INACTIVE", label: "Tạm dừng", badge: vouchers.filter((v) => !v.isActive).length },
    ],
    [vouchers]
  );

  return (
    <Panel className="border-surface-border bg-surface-card p-3 sm:p-5">
      <div
        className={`flex flex-col ${
          isMaximized
            ? "fixed inset-0 z-[120] bg-white p-4 sm:p-6 overflow-hidden rounded-none"
            : "min-h-[580px] max-h-[820px] rounded-2xl"
        }`}
      >
        {/* Header Toolbar */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Cấu Hình Bảng Giá Hệ Thống & Gói Cước
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Icon name="server" size={10} className="text-emerald-600" />
                <span>PostgreSQL DB</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Toàn bộ dữ liệu được lưu trực tiếp vào cơ sở dữ liệu. Mọi thay đổi áp dụng tức thì cho đăng ký mới & gia hạn.
              {lastSyncedAt && <span className="ml-2 text-slate-400 font-mono text-[10px]">Đồng bộ lúc: {lastSyncedAt}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Nút Đồng bộ lại */}
            <button
              type="button"
              disabled={isLoading || isSaving}
              onClick={() => loadPricingConfig(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Tải lại dữ liệu mới nhất từ database"
            >
              <Icon name="refresh" size={13} className={isLoading ? "animate-spin text-emerald-600" : "text-slate-500"} />
              <span className="hidden md:inline">Làm Mới</span>
            </button>

            {/* Nút Khôi phục mặc định */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-100/70 active:scale-95 cursor-pointer"
              title="Khôi phục bảng giá chuẩn cạnh tranh"
            >
              <Icon name="history" size={13} className="text-rose-600" />
              <span className="hidden md:inline">Khôi Phục Chuẩn</span>
            </button>

            {/* Nút Tạo Voucher */}
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-900 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-brand-800 active:scale-95 cursor-pointer"
            >
              <Icon name="plus" size={13} className="text-white" />
              <span>Tạo Voucher</span>
            </button>

            {/* Nút Phóng to / Thu nhỏ */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border text-xs font-bold shadow-xs transition cursor-pointer px-3 ${
                isMaximized
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
              title={isMaximized ? "Thu nhỏ lại (Phím Esc)" : "Phóng to toàn khung làm việc"}
            >
              <Icon name={isMaximized ? "minimize" : "maximize"} size={13} />
              <span className="hidden sm:inline">{isMaximized ? "Thu nhỏ" : "Phóng to"}</span>
            </button>
          </div>
        </div>

        {/* Thanh chuyển đổi phân hệ (Sub-tabs) */}
        <div className="shrink-0 flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 overflow-x-auto no-scrollbar">
          {[
            { id: "plans" as const, label: "Gói Cước SaaS", icon: "store" as const, badge: plans.length },
            { id: "modules" as const, label: "Đơn Giá Module", icon: "grid" as const, badge: catalog.length },
            { id: "discounts" as const, label: "Chiết Khấu Kỳ Hạn", icon: "percent" as const, badge: periodDiscounts.length },
            { id: "vouchers" as const, label: "Mã Khuyến Mại", icon: "tag" as const, badge: vouchers.length },
            { id: "simulator" as const, label: "Bộ Giả Lập Báo Giá", icon: "monitor" as const },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Icon name={tab.icon} size={14} className={activeSubTab === tab.id ? "text-emerald-700" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeSubTab === tab.id ? "bg-emerald-50 text-emerald-800 font-black" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* NỘI DUNG CHÍNH THEO SUB-TAB */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-100 p-3 sm:p-4 bg-slate-50/40">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Icon name="refresh" size={24} className="animate-spin text-emerald-600" />
              <p className="text-xs font-bold">Đang tải cấu hình bảng giá từ PostgreSQL...</p>
            </div>
          ) : null}

          {/* TAB 1: GÓI CƯỚC SAAS (PLANS) */}
          {!isLoading && activeSubTab === "plans" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Cấu hình 3 gói bản quyền phần mềm SaaS chính thức lưu tại PostgreSQL
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Đánh bật KiotViet & CukCuk
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isEditing = editingPlanId === p.id;
                  const borderCol =
                    p.id === "STARTER"
                      ? "border-emerald-300 hover:border-emerald-400"
                      : p.id === "GROWTH"
                      ? "border-blue-300 hover:border-blue-400"
                      : "border-purple-300 hover:border-purple-400";
                  const headerBg =
                    p.id === "STARTER"
                      ? "bg-emerald-50/80 text-emerald-950"
                      : p.id === "GROWTH"
                      ? "bg-blue-50/80 text-blue-950"
                      : "bg-purple-50/80 text-purple-950";

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl bg-white border-2 shadow-xs transition-all flex flex-col justify-between ${borderCol}`}
                    >
                      {/* Tiêu đề & Giá */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wide ${headerBg}`}>
                            {p.id}
                          </span>
                          {p.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-900 text-white shadow-2xs">
                              {p.badge}
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 my-2">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                Tên hiển thị gói
                              </label>
                              <input
                                type="text"
                                value={planEditName}
                                onChange={(e) => setPlanEditName(e.target.value)}
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                  Giá tháng (đ)
                                </label>
                                <input
                                  type="number"
                                  value={planEditPrice}
                                  onChange={(e) => setPlanEditPrice(Number(e.target.value))}
                                  className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-bold font-mono outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                  Max Bàn
                                </label>
                                <input
                                  type="number"
                                  value={planEditTables}
                                  onChange={(e) => setPlanEditTables(Number(e.target.value))}
                                  className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-bold font-mono outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                  Max Nhân Viên
                                </label>
                                <input
                                  type="number"
                                  value={planEditStaff}
                                  onChange={(e) => setPlanEditStaff(Number(e.target.value))}
                                  className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-bold font-mono outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                Huy hiệu nổi bật (Badge)
                              </label>
                              <input
                                type="text"
                                value={planEditBadge}
                                onChange={(e) => setPlanEditBadge(e.target.value)}
                                placeholder="VD: Rẻ hơn KiotViet 40%"
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                                Mô tả quy mô quán
                              </label>
                              <textarea
                                value={planEditDesc}
                                onChange={(e) => setPlanEditDesc(e.target.value)}
                                rows={2}
                                className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-sm font-black text-slate-900 mb-1">{p.name}</h4>
                            <div className="flex items-baseline gap-1 my-2">
                              <span className="text-xl font-black text-slate-950 font-mono">
                                {formatCurrency(p.monthlyPrice)}
                              </span>
                              <span className="text-xs text-slate-500">/tháng</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">{p.description}</p>

                            {/* Giới hạn thông số */}
                            <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Số bàn tối đa</span>
                                <span className="font-extrabold text-slate-800">{p.maxTables} bàn</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nhân sự tối đa</span>
                                <span className="font-extrabold text-slate-800">{p.maxStaff} tài khoản</span>
                              </div>
                            </div>

                            {/* Điểm mạnh đối chiếu */}
                            {p.comparisonHighlights && p.comparisonHighlights.length > 0 && (
                              <div className="space-y-1.5 mb-3 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-black uppercase text-slate-400 block">
                                  Vũ khí cạnh tranh:
                                </span>
                                {p.comparisonHighlights.map((hl, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                                    <Icon name="check" size={12} className="text-emerald-600 shrink-0" />
                                    <span>{hl}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Modules đi kèm */}
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                                Modules tích hợp sẵn:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {p.includedModules.map((m) => {
                                  const modInfo = catalog.find((c) => c.id === m);
                                  return (
                                    <span
                                      key={m}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200"
                                    >
                                      {modInfo?.name.split("(")[0].trim() || m}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleCancelEditPlan}
                              disabled={isSaving}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePlan(p.id)}
                              disabled={isSaving}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Icon name="save" size={12} className="text-white" />
                              <span>{isSaving ? "Đang lưu..." : "Lưu Lên DB"}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditPlan(p)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Icon name="edit" size={12} className="text-slate-500" />
                            <span>Chỉnh Sửa Gói</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ĐƠN GIÁ MODULE */}
          {!isLoading && activeSubTab === "modules" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Danh sách module tính năng và mức phí thuê hàng tháng (Lưu trực tiếp tại PostgreSQL)
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Cập nhật giá theo thời gian thực
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalog.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Icon name={mod.isCore ? "checkCircle" : "grid"} size={18} className={mod.isCore ? "text-emerald-600" : "text-indigo-600"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-black text-xs text-slate-900 truncate">{mod.name}</h4>
                          {mod.isCore ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                              Lõi Bắt Buộc
                            </span>
                          ) : mod.category === "ADDON" ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200 shrink-0">
                              Add-on Bán Thêm
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                              Vận Hành
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{mod.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Đơn giá niêm yết:
                      </span>

                      {editingModuleId === mod.id ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-28 h-8 pl-2.5 pr-6 rounded-lg border border-emerald-500 font-black text-xs text-slate-900 outline-none bg-white"
                              autoFocus
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              đ
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                            title="Hủy"
                          >
                            <Icon name="x" size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePrice(mod.id)}
                            disabled={isSaving}
                            className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                            title="Lưu lên PostgreSQL"
                          >
                            <Icon name="check" size={13} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {formatCurrency(mod.monthlyPrice)}
                            <span className="text-[10px] font-normal text-slate-500">/tháng</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditPrice(mod)}
                            className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition cursor-pointer"
                            title="Sửa đơn giá module"
                          >
                            <Icon name="edit" size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CHIẾT KHẤU KỲ HẠN */}
          {!isLoading && activeSubTab === "discounts" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Chính sách khuyến mại chiết khấu khi khách hàng thuê dài hạn (Lưu tại DB)
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Đang áp dụng {periodDiscounts.length} mốc kỳ hạn
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {periodDiscounts.map((rule) => {
                  const isEditing = editingDiscountMonths === rule.durationMonths;
                  return (
                    <div
                      key={rule.durationMonths}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-800">
                            {rule.durationMonths} Tháng
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800">
                            Giảm {rule.discountPercent}%
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{rule.label}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Mức chiết khấu:</span>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={discountPercentInput}
                                onChange={(e) => setDiscountPercentInput(Number(e.target.value))}
                                className="w-20 h-8 pl-2.5 pr-6 rounded-lg border border-emerald-500 font-black text-xs text-slate-900 outline-none bg-white"
                                autoFocus
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                %
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCancelDiscountEdit}
                              disabled={isSaving}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                              title="Hủy"
                            >
                              <Icon name="x" size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveDiscount(rule.durationMonths)}
                              disabled={isSaving}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                              title="Lưu lên PostgreSQL"
                            >
                              <Icon name="check" size={13} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-emerald-700">
                              {rule.discountPercent}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEditDiscount(rule)}
                              className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition cursor-pointer"
                              title="Sửa tỷ lệ chiết khấu"
                            >
                              <Icon name="edit" size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MÃ KHUYẾN MẠI (VOUCHERS) */}
          {!isLoading && activeSubTab === "vouchers" && (
            <div className="space-y-3">
              {/* Thanh lọc voucher */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={voucherSearch}
                      onChange={(e) => setVoucherSearch(e.target.value)}
                      placeholder="Tìm theo mã voucher..."
                      className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-500 outline-none bg-white"
                    />
                    <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="w-full sm:w-48">
                  <SearchableSelect
                    options={voucherStatusOptions}
                    value={voucherStatusFilter}
                    onChange={(val) => setVoucherStatusFilter(val)}
                    placeholder="Lọc trạng thái"
                  />
                </div>
              </div>

              {filteredVouchers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Icon name="tag" size={24} className="mx-auto mb-1.5 opacity-40 text-slate-400" />
                  <span>Không tìm thấy mã khuyến mại nào</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredVouchers.map((v) => (
                    <div
                      key={v.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                        v.isActive
                          ? "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                          : "bg-slate-50/60 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 tracking-wider">
                            {v.code}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              v.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {v.isActive ? "Hiệu lực" : "Tạm dừng"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleVoucher(v.id, v.code, v.isActive)}
                            disabled={isSaving}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              v.isActive
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={v.isActive ? "Tạm dừng mã" : "Kích hoạt lại mã"}
                          >
                            <Icon name={v.isActive ? "ban" : "check"} size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVoucher(v.id, v.code)}
                            disabled={isSaving}
                            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition cursor-pointer"
                            title="Xóa mã này khỏi DB"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-base font-black text-emerald-800 mb-0.5">
                          {v.discountType === "PERCENT"
                            ? `Giảm ${v.discountValue}%`
                            : `Giảm ${formatCurrency(v.discountValue)}`}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Kỳ hạn tối thiểu: <strong>{v.minContractMonths} tháng</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>Đã dùng: {v.usageCount} / {v.maxUsage}</span>
                          <span>{Math.round((v.usageCount / Math.max(1, v.maxUsage)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (v.usageCount / Math.max(1, v.maxUsage)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BỘ GIẢ LẬP BÁO GIÁ */}
          {!isLoading && activeSubTab === "simulator" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Form chọn thông số */}
              <div className="lg:col-span-7 space-y-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-2">
                    1. Chọn Module Tính Năng
                  </label>
                  <div className="space-y-1.5">
                    {catalog.map((mod) => (
                      <label
                        key={mod.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
                      >
                        <Checkbox
                          checked={simSelectedModules.includes(mod.id)}
                          disabled={mod.isCore}
                          onChange={(checked) => {
                            if (checked) setSimSelectedModules((prev) => [...prev, mod.id]);
                            else setSimSelectedModules((prev) => prev.filter((id) => id !== mod.id));
                          }}
                          size="sm"
                        />
                        <span className="text-xs font-bold text-slate-900 flex-1">{mod.name}</span>
                        <span className="text-xs font-bold text-slate-500">{formatCurrency(mod.monthlyPrice)}/th</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-2">
                    2. Chọn Kỳ Hạn Thuê
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSimMonths(m)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          simMonths === m
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {m} Tháng
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-2">
                    3. Nhập Mã Voucher Khuyến Mại
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={simVoucherCode}
                      onChange={(e) => setSimVoucherCode(e.target.value.toUpperCase())}
                      placeholder="VD: A2CHAOBAN, QUANMOI100K..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase focus:border-emerald-500 outline-none"
                    />
                  </div>
                  {simulation.vError && (
                    <p className="text-[11px] text-rose-600 mt-1 font-bold">{simulation.vError}</p>
                  )}
                  {simulation.appliedVoucher && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-bold">
                      Đã áp dụng mã {simulation.appliedVoucher.code}!
                    </p>
                  )}
                </div>
              </div>

              {/* Phiếu tính tiền mô phỏng */}
              <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Icon name="fileText" size={14} className="text-emerald-600" />
                    <span>Phiếu Báo Giá Mô Phỏng</span>
                  </h4>

                  <div className="space-y-2.5 text-xs font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>Cước hàng tháng ({simSelectedModules.length} module):</span>
                      <span className="font-bold text-slate-900">{formatCurrency(simulation.baseMo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng tiền gốc ({simMonths} tháng):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(simulation.subtotal)}</span>
                    </div>

                    {simulation.pDiscPercent > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Chiết khấu kỳ hạn ({simulation.pDiscPercent}%):</span>
                        <span className="font-mono font-bold">-{formatCurrency(simulation.pDiscAmount)}</span>
                      </div>
                    )}

                    {simulation.vDiscAmount > 0 && (
                      <div className="flex justify-between text-indigo-700">
                        <span>Voucher ({simulation.appliedVoucher?.code}):</span>
                        <span className="font-mono font-bold">-{formatCurrency(simulation.vDiscAmount)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-slate-900">
                      <span className="font-bold text-xs uppercase">Thực thu dự kiến:</span>
                      <span className="font-black text-lg text-emerald-700 font-mono">
                        {formatCurrency(simulation.finalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                  <p>
                    * Báo giá mô phỏng được tính tự động từ bảng giá module và khung chiết khấu thực tế đang lưu tại PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TẠO VOUCHER MỚI (LƯU THẲNG POSTGRESQL) */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Icon name="tag" size={15} className="text-emerald-600" />
                <span>Phát Hành Mã Khuyến Mại Mới</span>
              </h3>
              <button
                type="button"
                onClick={requestCloseVoucher}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Mã Voucher (Code) *
                </label>
                <input
                  type="text"
                  value={newVoucherCode}
                  onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                  placeholder="VD: KHAIXUAN2026, FNBVIP..."
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 font-mono font-black text-sm uppercase outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Hình thức giảm
                  </label>
                  <select
                    value={newVoucherType}
                    onChange={(e) => setNewVoucherType(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="PERCENT">Theo Phần Trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số Tiền Cố Định (đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Giá trị giảm *
                  </label>
                  <input
                    type="number"
                    value={newVoucherValue}
                    onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                    min={1}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Kỳ hạn thuê tối thiểu
                  </label>
                  <select
                    value={newVoucherMonths}
                    onChange={(e) => setNewVoucherMonths(Number(e.target.value))}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value={1}>1 Tháng (Bất kỳ)</option>
                    <option value={3}>Từ 3 Tháng</option>
                    <option value={6}>Từ 6 Tháng</option>
                    <option value={12}>Từ 12 Tháng (1 Năm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Số lượt dùng tối đa
                  </label>
                  <input
                    type="number"
                    value={newVoucherLimit}
                    onChange={(e) => setNewVoucherLimit(Number(e.target.value))}
                    min={1}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={requestCloseVoucher}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Icon name="check" size={13} className="text-white" />
                  <span>{isSaving ? "Đang lưu..." : "Phát Hành & Lưu DB"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN KHÔI PHỤC MẶC ĐỊNH */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                <Icon name="alert" size={20} />
              </span>
              <div>
                <h4 className="font-black text-sm text-slate-900">Khôi Phục Bảng Giá Chuẩn?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thao tác này sẽ ghi đè toàn bộ gói STARTER (119k), GROWTH (199k), PRO (299k) và đơn giá 6 module về chuẩn cạnh tranh trên PostgreSQL.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                {isSaving ? "Đang khôi phục..." : "Xác Nhận Khôi Phục"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};
