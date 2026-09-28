import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import {
  APP_MODULE_CATALOG,
  AppModule,
  ModulePricingInfo,
  PromoVoucher,
  DEFAULT_PERIOD_DISCOUNTS,
  PeriodDiscountRule,
} from "@a2order/shared";

export const CmsAdminPricingManager: React.FC = () => {
  const [catalog, setCatalog] = useState<ModulePricingInfo[]>(APP_MODULE_CATALOG);
  const [editingModuleId, setEditingModuleId] = useState<AppModule | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const [periodDiscounts, setPeriodDiscounts] = useState<PeriodDiscountRule[]>(DEFAULT_PERIOD_DISCOUNTS);

  const [vouchers, setVouchers] = useState<PromoVoucher[]>([
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

  const handleStartEdit = (mod: ModulePricingInfo) => {
    setEditingModuleId(mod.id);
    setEditPrice(mod.monthlyPrice);
  };

  const handleSavePrice = (modId: AppModule) => {
    setCatalog((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, monthlyPrice: editPrice } : m))
    );
    setEditingModuleId(null);
    toast.success("Đã cập nhật giá thuê module trên toàn nền tảng thành công!");
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
                          onClick={() => handleSavePrice(mod.id)}
                          className="w-8 h-8 rounded-xl bg-brand-900 text-white flex items-center justify-center hover:bg-brand-950 transition-all shadow-sm"
                        >
                          <Icon name="check" className="w-4 h-4" />
                        </button>
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-canvas text-xs font-bold"
                >
                  <span className="text-ink-primary">{rule.durationMonths} tháng</span>
                  <span
                    className={`px-2 py-0.5 rounded-md ${
                      rule.discountPercent > 0
                        ? "bg-emerald-100 text-emerald-800 font-black"
                        : "text-ink-muted font-normal"
                    }`}
                  >
                    {rule.discountPercent > 0 ? `Giảm ${rule.discountPercent}%` : "Nguyên giá"}
                  </span>
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
                onClick={() => setIsVoucherModalOpen(false)}
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
                  onClick={() => setIsVoucherModalOpen(false)}
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
