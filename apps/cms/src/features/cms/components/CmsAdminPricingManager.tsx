import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useUnsavedChanges } from "@/stores/unsavedChangesStore";
import { useUnsavedEditor } from "@/hooks/useUnsavedEditor";
import {
  APP_MODULE_CATALOG,
  AppModule,
  ModulePricingInfo,
  PromoVoucher,
  DEFAULT_PERIOD_DISCOUNTS,
  PeriodDiscountRule,
} from "@a2order/shared";

export const CmsAdminPricingManager: React.FC = () => {
  const [catalog, setCatalog] = usePersistentState<ModulePricingInfo[]>("admin_module_catalog", APP_MODULE_CATALOG);
  const [editingModuleId, setEditingModuleId] = useState<AppModule | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const [periodDiscounts, setPeriodDiscounts] = usePersistentState<PeriodDiscountRule[]>("admin_period_discounts", DEFAULT_PERIOD_DISCOUNTS);
  const [editingDiscountMonths, setEditingDiscountMonths] = useState<number | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState(0);

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
  ]);

  // Modal voucher state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState("");
  const [newVoucherType, setNewVoucherType] = useState<"PERCENT" | "FIXED_AMOUNT">("PERCENT");
  const [newVoucherValue, setNewVoucherValue] = useState<number>(10);
  const [newVoucherMonths, setNewVoucherMonths] = useState<number>(3);
  const [newVoucherLimit, setNewVoucherLimit] = useState<number>(50);
  const { requestClose: requestCloseVoucher } = useUnsavedEditor("voucher_modal", isVoucherModalOpen, JSON.stringify({ newVoucherCode, newVoucherType, newVoucherValue, newVoucherMonths, newVoucherLimit }), () => setIsVoucherModalOpen(false));
  const priceChanged = editingModuleId !== null && editPrice !== catalog.find((module) => module.id === editingModuleId)?.monthlyPrice;
  const discountChanged = editingDiscountMonths !== null && discountPercentInput !== periodDiscounts.find((rule) => rule.durationMonths === editingDiscountMonths)?.discountPercent;
  useUnsavedChanges("admin_pricing_inline", priceChanged);
  useUnsavedChanges("admin_discount_inline", discountChanged);

  const handleSaveDiscount = () => {
    if (!Number.isFinite(discountPercentInput) || discountPercentInput < 0 || discountPercentInput > 100) {
      toast.error("Chiết khấu phải từ 0% đến 100%.");
      return;
    }
    setPeriodDiscounts((rules) => rules.map((rule) => rule.durationMonths === editingDiscountMonths ? { ...rule, discountPercent: discountPercentInput } : rule));
    setEditingDiscountMonths(null);
    toast.success("Đã cập nhật chiết khấu kỳ hạn.");
  };

  const handleCancelDiscount = async () => {
    if (discountChanged) {
      const discard = await confirmDialog({ title: "Bỏ chiết khấu đang sửa?", message: "Tỷ lệ mới chưa được lưu.", confirmText: "Bỏ thay đổi", cancelText: "Tiếp tục sửa", variant: "warning" });
      if (!discard) return;
    }
    setEditingDiscountMonths(null);
  };

  const handleCancelPrice = async () => {
    if (priceChanged) {
      const discard = await confirmDialog({ title: "Bỏ giá đang chỉnh sửa?", message: "Mức giá mới chưa được lưu.", confirmText: "Bỏ thay đổi", cancelText: "Tiếp tục sửa", variant: "warning" });
      if (!discard) return;
    }
    setEditingModuleId(null);
  };

  const handleStartEdit = (mod: ModulePricingInfo) => {
    setEditingModuleId(mod.id);
    setEditPrice(mod.monthlyPrice);
  };

  const handleSavePrice = (modId: AppModule) => {
    setCatalog((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, monthlyPrice: editPrice } : m))
    );
    setEditingModuleId(null);
    toast.success("Đã lưu giá thuê module trong cấu hình quản trị.");
  };

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
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isActive: !current } : v))
    );
    toast.info(`Đã ${current ? "tạm dừng" : "kích hoạt lại"} mã ${code}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Cấu Hình Giá Tính Năng & Khuyến Mại (Super Admin)
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Platform Pricing Engine
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Cài đặt mức giá thuê hàng tháng cho từng module, chiết khấu kỳ hạn và tạo mã voucher khuyến mại cho các quán.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-brand-900 text-white"
            onClick={() => setIsVoucherModalOpen(true)}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>+ Tạo Mã Voucher Mới</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bảng giá từng Module */}
        <div className="lg:col-span-7 space-y-4">
          <Panel variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-ink-primary flex items-center gap-2">
                  <Icon name="dollar" className="w-4 h-4 text-emerald-600" />
                  <span>Bảng Giá Cơ Sở Từng Module (VND/Tháng)</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Giá này áp dụng tự động vào máy tính hợp đồng thuê cho mọi khách hàng mới
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {catalog.map((mod) => (
                <div
                  key={mod.id}
                  className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-3 hover:border-brand-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-ink-primary">{mod.name}</h4>
                      {mod.isCore && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-brand-100 text-brand-900">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted truncate mt-0.5">{mod.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {editingModuleId === mod.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          step={1000}
                          className="w-24 h-8 px-2 rounded-xl bg-white border border-brand-800 text-xs font-bold text-ink-primary text-right"
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePrice(mod.id)}
                          className="w-8 h-8 rounded-xl bg-brand-900 text-white flex items-center justify-center hover:bg-brand-950 transition-all shadow-sm"
                        >
                          <Icon name="check" className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={handleCancelPrice} aria-label="Hủy sửa giá" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200"><Icon name="x" size={15} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-brand-900 font-mono">
                          {mod.monthlyPrice.toLocaleString("vi-VN")} đ
                        </span>
                        <button
                          onClick={() => handleStartEdit(mod)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-subtle hover:text-ink-primary hover:bg-surface-muted transition-all"
                          title="Chỉnh sửa giá"
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right: Chiết khấu kỳ hạn & Danh sách Voucher */}
        <div className="lg:col-span-5 space-y-4">
          {/* Chiết khấu kỳ hạn */}
          <Panel variant="default" padding="md" className="space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-ink-primary flex items-center gap-2 border-b border-surface-border pb-2.5">
              <Icon name="percent" className="w-3.5 h-3.5 text-brand-800" />
              <span>Chính Sách Chiết Khấu Kỳ Hạn Thuê</span>
            </h3>

            <div className="space-y-2">
              {periodDiscounts.map((rule) => (
                <div
                  key={rule.durationMonths}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-canvas text-xs font-bold"
                >
                  <span className="text-ink-primary">{rule.durationMonths} tháng</span>
                  {editingDiscountMonths === rule.durationMonths ? (
                    <span className="flex items-center gap-1.5">
                      <input type="number" min={0} max={100} value={discountPercentInput} onChange={(event) => setDiscountPercentInput(Number(event.target.value))} aria-label={`Chiết khấu ${rule.durationMonths} tháng`} className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs font-bold" />
                      <span className="text-slate-500">%</span>
                      <button type="button" onClick={handleSaveDiscount} aria-label="Lưu chiết khấu" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-white"><Icon name="check" size={14} /></button>
                      <button type="button" onClick={handleCancelDiscount} aria-label="Hủy sửa chiết khấu" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200"><Icon name="x" size={14} /></button>
                    </span>
                  ) : <span className="flex items-center gap-2"><span
                    className={`px-2 py-0.5 rounded-md ${
                      rule.discountPercent > 0
                        ? "bg-emerald-100 text-emerald-800 font-black"
                        : "text-ink-muted font-normal"
                    }`}
                  >
                    {rule.discountPercent > 0 ? `Giảm ${rule.discountPercent}%` : "Nguyên giá"}
                  </span><button type="button" onClick={() => { setEditingDiscountMonths(rule.durationMonths); setDiscountPercentInput(rule.discountPercent); }} aria-label={`Sửa chiết khấu ${rule.durationMonths} tháng`} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800"><Icon name="edit" size={13} /></button></span>}
                </div>
              ))}
            </div>
          </Panel>

          {/* Quản lý Voucher */}
          <Panel variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-ink-primary flex items-center gap-2">
                <Icon name="tag" className="w-3.5 h-3.5 text-brand-800" />
                <span>Mã Khuyến Mại (Vouchers)</span>
              </h3>
              <span className="text-[10px] text-ink-muted">{vouchers.length} mã</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    v.isActive
                      ? "bg-surface-canvas border-surface-border"
                      : "bg-surface-muted/50 border-surface-border/50 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-brand-900 text-white">
                        {v.code}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        {v.discountType === "PERCENT"
                          ? `Giảm ${v.discountValue}%`
                          : `Giảm ${v.discountValue.toLocaleString("vi-VN")} đ`}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted mt-1">
                      Kỳ hạn tối thiểu: {v.minContractMonths} tháng • Đã dùng: {v.usageCount}/{v.maxUsage}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleVoucher(v.id, v.code, v.isActive)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                      v.isActive
                        ? "bg-surface-muted text-ink-muted hover:bg-rose-50 hover:text-rose-600"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    }`}
                  >
                    {v.isActive ? "Tạm dừng" : "Kích hoạt"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Modal Tạo Voucher Mới */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="tag" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Phát Hành Mã Voucher</h3>
                  <p className="text-xs text-ink-muted">Tạo khuyến mại cho quán mới hoặc tri ân</p>
                </div>
              </div>
              <button
                onClick={requestCloseVoucher}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Mã Voucher (Ví dụ: TET2026, QUANMOI)
                </label>
                <input
                  type="text"
                  value={newVoucherCode}
                  onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã chữ hoa..."
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-surface-border text-xs font-mono font-bold uppercase focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Hình Thức Giảm
                  </label>
                  <select
                    value={newVoucherType}
                    onChange={(e) => setNewVoucherType(e.target.value as "PERCENT" | "FIXED_AMOUNT")}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Giá Trị Giảm
                  </label>
                  <input
                    type="number"
                    value={newVoucherValue}
                    onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Kỳ Hạn Thuê Tối Thiểu
                  </label>
                  <select
                    value={newVoucherMonths}
                    onChange={(e) => setNewVoucherMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Số Lượng Mã Tối Đa
                  </label>
                  <input
                    type="number"
                    value={newVoucherLimit}
                    onChange={(e) => setNewVoucherLimit(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={requestCloseVoucher}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-5"
                >
                  Tạo Voucher Ngay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
