import React, { useState, useMemo, useEffect } from "react";
import { Panel, Button, Icon, Checkbox, SearchableSelect, SearchableSelectOption } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useUnsavedChanges } from "@/stores/unsavedChangesStore";
import { useUnsavedEditor } from "@/hooks/useUnsavedEditor";
import { formatCurrency } from "@/lib/formatters";
import {
  APP_MODULE_CATALOG,
  AppModule,
  ModulePricingInfo,
  PromoVoucher,
  DEFAULT_PERIOD_DISCOUNTS,
  PeriodDiscountRule,
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
  const [activeSubTab, setActiveSubTab] = useState<"modules" | "discounts" | "vouchers" | "simulator">("modules");

  // Chế độ phóng to toàn màn hình
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = propIsMaximized !== undefined ? propIsMaximized : internalMaximized;
  const setIsMaximized = propSetIsMaximized || setInternalMaximized;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, setIsMaximized]);

  // Catalog module pricing
  const [catalog, setCatalog] = usePersistentState<ModulePricingInfo[]>("admin_module_catalog", APP_MODULE_CATALOG);
  const [editingModuleId, setEditingModuleId] = useState<AppModule | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  // Period discounts
  const [periodDiscounts, setPeriodDiscounts] = usePersistentState<PeriodDiscountRule[]>("admin_period_discounts", DEFAULT_PERIOD_DISCOUNTS);
  const [editingDiscountMonths, setEditingDiscountMonths] = useState<number | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState(0);

  // Promo Vouchers
  const [vouchers, setVouchers] = usePersistentState<PromoVoucher[]>("admin_vouchers", [
    {
      id: "v1",
      code: "A2CHAOBAN",
      discountType: "PERCENT",
      discountValue: 15,
      minContractMonths: 6,
      validUntil: "2026-12-31",
      usageCount: 18,
      maxUsage: 50,
      isActive: true,
    },
    {
      id: "v2",
      code: "QUANMOI100K",
      discountType: "FIXED_AMOUNT",
      discountValue: 100000,
      minContractMonths: 3,
      validUntil: "2026-10-31",
      usageCount: 8,
      maxUsage: 30,
      isActive: true,
    },
    {
      id: "v3",
      code: "PROMO2026",
      discountType: "PERCENT",
      discountValue: 20,
      minContractMonths: 12,
      validUntil: "2026-12-31",
      usageCount: 5,
      maxUsage: 100,
      isActive: true,
    },
  ]);

  // Bộ lọc cho voucher
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherStatusFilter, setVoucherStatusFilter] = useState("ALL");

  // Modal voucher state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState("");
  const [newVoucherType, setNewVoucherType] = useState<"PERCENT" | "FIXED_AMOUNT">("PERCENT");
  const [newVoucherValue, setNewVoucherValue] = useState<number>(10);
  const [newVoucherMonths, setNewVoucherMonths] = useState<number>(3);
  const [newVoucherLimit, setNewVoucherLimit] = useState<number>(50);
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
  useUnsavedChanges("admin_pricing_inline", priceChanged || discountChanged);

  // Handlers for Modules
  const handleEditPrice = (mod: ModulePricingInfo) => {
    setEditingModuleId(mod.id);
    setEditPrice(mod.monthlyPrice);
  };
  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setEditPrice(0);
  };
  const handleSavePrice = (modId: AppModule) => {
    setCatalog((prev) => prev.map((m) => (m.id === modId ? { ...m, monthlyPrice: editPrice } : m)));
    setEditingModuleId(null);
    toast.success("Đã cập nhật giá gốc module!");
  };

  // Handlers for Discounts
  const handleEditDiscount = (rule: PeriodDiscountRule) => {
    setEditingDiscountMonths(rule.durationMonths);
    setDiscountPercentInput(rule.discountPercent);
  };
  const handleSaveDiscount = (months: number) => {
    setPeriodDiscounts((prev) =>
      prev.map((r) => (r.durationMonths === months ? { ...r, discountPercent: discountPercentInput } : r))
    );
    setEditingDiscountMonths(null);
    toast.success("Đã cập nhật chiết khấu kỳ hạn!");
  };

  // Handlers for Vouchers
  const handleCreateVoucherSubmit = (e: React.FormEvent) => {
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
    setVouchers((prev) => [created, ...prev]);
    setIsVoucherModalOpen(false);
    setNewVoucherCode("");
    toast.success(`Đã phát hành mã khuyến mại ${created.code}!`);
  };

  const handleToggleVoucher = (id: string, code: string, current: boolean) => {
    setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: !current } : v)));
    toast.info(`Đã ${current ? "tạm dừng" : "kích hoạt lại"} mã ${code}`);
  };

  const handleDeleteVoucher = (id: string, code: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    toast.success(`Đã xóa voucher ${code}`);
  };

  // SIMULATOR STATE
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
    const pDiscAmount = (subtotal * pDiscPercent) / 100;
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
          vDiscAmount = (afterPeriod * appliedV.discountValue) / 100;
        } else {
          vDiscAmount = appliedV.discountValue;
        }
      }
    }

    return {
      baseMo,
      subtotal,
      pDiscPercent,
      pDiscAmount,
      vDiscAmount,
      vError,
      appliedVoucher: !vError ? appliedV : null,
      total: Math.max(0, afterPeriod - vDiscAmount),
    };
  }, [catalog, periodDiscounts, vouchers, simSelectedModules, simMonths, simVoucherCode]);

  // Lọc danh sách voucher
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (voucherStatusFilter === "ACTIVE" && !v.isActive) return false;
      if (voucherStatusFilter === "INACTIVE" && v.isActive) return false;
      if (voucherSearch.trim()) {
        const q = voucherSearch.toLowerCase();
        return v.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [vouchers, voucherStatusFilter, voucherSearch]);

  const activeVoucherCount = vouchers.filter((v) => v.isActive).length;
  const totalUsages = vouchers.reduce((sum, v) => sum + v.usageCount, 0);

  const kpiCards = [
    {
      label: "Module Tính Năng SaaS",
      val: catalog.length,
      sub: `${catalog.filter((m) => m.isCore).length} module bắt buộc lõi POS`,
      icon: "grid" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
    {
      label: "Khung Chiết Khấu Kỳ Hạn",
      val: `${periodDiscounts.length} Mốc`,
      sub: "Ưu đãi theo gói 3, 6, 12, 24 tháng",
      icon: "percent" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Mã Voucher Khuyến Mại",
      val: `${activeVoucherCount} / ${vouchers.length}`,
      sub: "Mã ưu đãi đang kích hoạt",
      icon: "tag" as const,
      wrapBg: "bg-amber-50/50 border-amber-100/80",
      iconBg: "bg-amber-600 text-white shadow-amber-500/20",
      textColor: "text-amber-950",
    },
    {
      label: "Lượt Áp Dụng Thành Công",
      val: `${totalUsages} Lượt`,
      sub: "Tổng số lượt quán kích hoạt mã",
      icon: "checkCircle" as const,
      wrapBg: "bg-sky-50/50 border-sky-100/80",
      iconBg: "bg-sky-600 text-white shadow-sky-500/20",
      textColor: "text-sky-950",
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-3.5">
      {/* KHỐI THỐNG KÊ (MINI DASHBOARD) - ẨN KHI PHÓNG TO */}
      {!isMaximized && (
        <section className="shrink-0 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
          {kpiCards.map((m, i) => (
            <article
              key={i}
              className={`rounded-2xl border p-2.5 sm:p-4 shadow-[0_4px_20px_rgba(15,23,42,.03)] flex items-center justify-between transition-all hover:shadow-md ${m.wrapBg}`}
            >
              <div>
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
                  {m.label}
                </h4>
                <p className={`text-base sm:text-2xl font-black tracking-tight ${m.textColor}`}>
                  {m.val}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 hidden sm:block">
                  {m.sub}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.iconBg}`}>
                <Icon name={m.icon} size={16} className="sm:w-5 sm:h-5" />
              </div>
            </article>
          ))}
        </section>
      )}

      {/* PANEL CẤU HÌNH BẢNG GIÁ & VOUCHER */}
      <Panel
        variant="default"
        padding="none"
        className={`transition-all duration-200 flex flex-col p-2.5 sm:p-5 lg:p-6 ${
          isMaximized
            ? "flex-1 min-h-[520px] lg:h-[calc(100vh-125px)] shadow-sm border border-slate-200"
            : "flex-1 min-h-0 lg:min-h-[480px] lg:h-[calc(100vh-230px)] sticky top-2 z-10 shadow-sm"
        }`}
      >
        {/* Header Toolbar */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Cấu Hình Bảng Giá Tính Năng & Mã Khuyến Mại</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Quản lý đơn giá thuê module SaaS, chính sách chiết khấu theo kỳ hạn và phát hành voucher
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-900 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-brand-800 active:scale-95 cursor-pointer"
            >
              <Icon name="plus" size={13} className="text-white" />
              <span>Tạo Voucher</span>
            </button>

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
            { id: "modules" as const, label: "Đơn Giá Module", icon: "grid" as const, badge: catalog.length },
            { id: "discounts" as const, label: "Chiết Khấu Kỳ Hạn", icon: "percent" as const, badge: periodDiscounts.length },
            { id: "vouchers" as const, label: "Mã Khuyến Mại (Vouchers)", icon: "tag" as const, badge: vouchers.length },
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
          {/* TAB 1: ĐƠN GIÁ MODULE */}
          {activeSubTab === "modules" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Danh sách module tính năng và mức phí thuê hàng tháng
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
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 shrink-0">
                              Tùy Chọn
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
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                            title="Hủy"
                          >
                            <Icon name="x" size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePrice(mod.id)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            title="Lưu"
                          >
                            <Icon name="check" size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {formatCurrency(mod.monthlyPrice)} <span className="text-[11px] text-slate-400 font-medium">/tháng</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditPrice(mod)}
                            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent flex items-center justify-center transition cursor-pointer"
                            title="Chỉnh sửa đơn giá"
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

          {/* TAB 2: CHIẾT KHẤU KỲ HẠN */}
          {activeSubTab === "discounts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Tỷ lệ giảm giá (%) khi khách hàng thanh toán trước theo từng kỳ hạn hợp đồng
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Tự động áp dụng vào hóa đơn
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {periodDiscounts.map((rule) => (
                  <div
                    key={rule.durationMonths}
                    className="p-4 rounded-2xl border border-slate-200 bg-white text-center flex flex-col items-center justify-between group hover:border-emerald-300 hover:shadow-xs transition"
                  >
                    <span className="text-xs font-extrabold uppercase text-slate-500 mb-1">
                      Kỳ {rule.durationMonths} Tháng
                    </span>

                    <div className="my-2">
                      {editingDiscountMonths === rule.durationMonths ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={discountPercentInput}
                            onChange={(e) => setDiscountPercentInput(Number(e.target.value))}
                            className="w-14 h-8 text-center rounded-lg border border-emerald-500 font-black text-sm outline-none bg-white"
                            autoFocus
                          />
                          <span className="text-xs font-bold text-slate-600">%</span>
                          <button
                            type="button"
                            onClick={() => setEditingDiscountMonths(null)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <Icon name="x" size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDiscount(rule.durationMonths)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                          >
                            <Icon name="check" size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={() => handleEditDiscount(rule)}
                          title="Bấm để sửa chiết khấu"
                        >
                          <span
                            className={`text-2xl font-black ${
                              rule.discountPercent > 0 ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            {rule.discountPercent === 0 ? "0%" : `-${rule.discountPercent}%`}
                          </span>
                          <Icon name="edit" size={13} className="text-slate-300 group-hover:text-emerald-600 transition" />
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {rule.discountPercent > 0 ? `Tiết kiệm ${rule.discountPercent}% tổng cước` : "Không có ưu đãi"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ VOUCHER */}
          {activeSubTab === "vouchers" && (
            <div className="space-y-3">
              {/* Toolbar Voucher */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                <div className="relative w-full sm:w-64">
                  <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    placeholder="Tìm theo mã voucher..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setVoucherStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        voucherStatusFilter === st
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {st === "ALL" ? "Tất Cả" : st === "ACTIVE" ? "Đang Mở" : "Tạm Dừng"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Thẻ Voucher */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVouchers.map((v) => (
                  <div
                    key={v.id}
                    className={`relative rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                      v.isActive
                        ? "bg-white border-slate-200 shadow-2xs hover:shadow-xs"
                        : "bg-slate-50 border-slate-200 opacity-60 grayscale"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded-lg shadow-2xs tracking-widest">
                        {v.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleVoucher(v.id, v.code, v.isActive)}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                          title={v.isActive ? "Tạm dừng mã" : "Kích hoạt lại"}
                        >
                          <Icon name={v.isActive ? "ban" : "check"} size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition cursor-pointer"
                          title="Xóa mã này"
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
                        <span>{Math.round((v.usageCount / v.maxUsage) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (v.usageCount / v.maxUsage) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BỘ GIẢ LẬP BÁO GIÁ */}
          {activeSubTab === "simulator" && (
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
                      <span className="font-bold text-slate-900">{formatCurrency(simulation.subtotal)}</span>
                    </div>
                    {simulation.pDiscAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Chiết khấu kỳ hạn ({simulation.pDiscPercent}%):</span>
                        <span className="font-bold">-{formatCurrency(simulation.pDiscAmount)}</span>
                      </div>
                    )}
                    {simulation.vDiscAmount > 0 && (
                      <div className="flex justify-between text-indigo-700">
                        <span>Voucher [{simulation.appliedVoucher?.code}]:</span>
                        <span className="font-bold">-{formatCurrency(simulation.vDiscAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-end justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Tổng tiền thanh toán:</span>
                    <span className="text-2xl font-black text-emerald-800">
                      {formatCurrency(simulation.total)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">
                    Giá dự kiến
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* MODAL TẠO VOUCHER MỚI */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-5 sm:p-6 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Icon name="tag" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Phát Hành Voucher Mới</h3>
                  <p className="text-xs text-slate-500">Tạo mã ưu đãi dành riêng cho khách hàng thuê bao</p>
                </div>
              </div>
              <button
                type="button"
                onClick={requestCloseVoucher}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Voucher (Ví dụ: TET2026, QUANMOI)
                </label>
                <input
                  type="text"
                  value={newVoucherCode}
                  onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                  placeholder="MÃ VIẾT HOA..."
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-mono font-black uppercase focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hình Thức Giảm</label>
                  <select
                    value={newVoucherType}
                    onChange={(e) => setNewVoucherType(e.target.value as "PERCENT" | "FIXED_AMOUNT")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức Giảm</label>
                  <input
                    type="number"
                    value={newVoucherValue}
                    onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kỳ Hạn Tối Thiểu</label>
                  <select
                    value={newVoucherMonths}
                    onChange={(e) => setNewVoucherMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Lượng Phát Hành</label>
                  <input
                    type="number"
                    value={newVoucherLimit}
                    onChange={(e) => setNewVoucherLimit(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={requestCloseVoucher}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="rounded-xl bg-brand-900 text-white text-xs px-5 hover:bg-brand-950 font-bold">
                  Phát Hành
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
