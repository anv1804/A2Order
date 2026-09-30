import React, { useState, useMemo } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
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
    toast.success("Đã cập nhật giá gốc");
  };

  // Handlers for Discounts
  const handleEditDiscount = (rule: PeriodDiscountRule) => {
    setEditingDiscountMonths(rule.durationMonths);
    setDiscountPercentInput(rule.discountPercent);
  };
  const handleSaveDiscount = (months: number) => {
    setPeriodDiscounts((prev) => prev.map((r) => (r.durationMonths === months ? { ...r, discountPercent: discountPercentInput } : r)));
    setEditingDiscountMonths(null);
    toast.success("Đã cập nhật chiết khấu");
  };

  // Handlers for Vouchers
  const handleCreateVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode.trim()) { toast.error("Vui lòng nhập mã"); return; }
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

  // ==========================================
  // SIMULATOR STATE
  // ==========================================
  const [simSelectedModules, setSimSelectedModules] = useState<AppModule[]>([AppModule.CORE_POS]);
  const [simMonths, setSimMonths] = useState<number>(6);
  const [simVoucherCode, setSimVoucherCode] = useState("");

  const simulation = useMemo(() => {
    let baseMo = 0;
    simSelectedModules.forEach(id => {
      baseMo += catalog.find(c => c.id === id)?.monthlyPrice || 0;
    });
    const subtotal = baseMo * simMonths;
    const pDiscRule = periodDiscounts.find(p => p.durationMonths === simMonths);
    const pDiscPercent = pDiscRule ? pDiscRule.discountPercent : 0;
    const pDiscAmount = (subtotal * pDiscPercent) / 100;
    const afterPeriod = subtotal - pDiscAmount;

    let vDiscAmount = 0;
    let vError = "";
    const appliedV = vouchers.find(v => v.code === simVoucherCode.toUpperCase() && v.isActive);
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
      total: Math.max(0, afterPeriod - vDiscAmount)
    };
  }, [catalog, periodDiscounts, vouchers, simSelectedModules, simMonths, simVoucherCode]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* HEADER PRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Icon name="tag" size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-2xl font-black tracking-tight">Trung Tâm Định Giá (Pricing Engine)</h2>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-sm text-indigo-200">Cấu hình linh hoạt bảng giá Core, Add-on, chiết khấu đa tầng và phát hành Voucher siêu tốc.</p>
        </div>
        <Button size="sm" className="rounded-full bg-white text-indigo-900 hover:bg-indigo-50 font-black shadow-lg relative z-10" onClick={() => setIsVoucherModalOpen(true)}>
          <Icon name="plus" size={16} /> Tạo Voucher Mới
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: MODULES & DISCOUNTS */}
        {/* ========================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CATALOG */}
          <Panel variant="default" padding="lg">
            <h3 className="font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Icon name="grid" className="w-5 h-5 text-indigo-600" /> Cấu Hình Giá Module (VND/Tháng)
            </h3>
            <div className="space-y-3">
              {catalog.map((mod) => (
                <div key={mod.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 hover:shadow-md transition group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon name={mod.isCore ? "checkCircle" : "grid"} size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-extrabold text-sm text-slate-900">{mod.name}</h4>
                        {mod.isCore && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800">Bắt buộc</span>}
                      </div>
                      <p className="text-[11px] text-slate-500">{mod.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {editingModuleId === mod.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} className="w-28 h-9 pl-3 pr-8 rounded-lg border-2 border-indigo-500 font-black text-sm text-slate-900 outline-none" autoFocus />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
                        </div>
                        <button onClick={handleCancelEdit} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"><Icon name="x" size={14} /></button>
                        <button onClick={() => handleSavePrice(mod.id)} className="w-8 h-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center"><Icon name="check" size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition">{formatCurrency(mod.monthlyPrice)}</span>
                        <button onClick={() => handleEditPrice(mod)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition"><Icon name="edit" size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* PERIOD DISCOUNTS */}
          <Panel variant="default" padding="lg">
            <h3 className="font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Icon name="percent" className="w-5 h-5 text-emerald-600" /> Khung Chiết Khấu Theo Kỳ Hạn
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {periodDiscounts.map((rule) => (
                <div key={rule.durationMonths} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center group hover:border-emerald-300 hover:bg-emerald-50 transition">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 mb-1">{rule.durationMonths} Tháng</span>
                  {editingDiscountMonths === rule.durationMonths ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input type="number" value={discountPercentInput} onChange={(e) => setDiscountPercentInput(Number(e.target.value))} className="w-12 h-7 text-center rounded border border-emerald-500 font-black text-sm outline-none" autoFocus />
                      <button onClick={() => setEditingDiscountMonths(null)} className="text-slate-400 hover:text-slate-600"><Icon name="x" size={12} /></button>
                      <button onClick={() => handleSaveDiscount(rule.durationMonths)} className="text-emerald-600 hover:text-emerald-800"><Icon name="check" size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1 cursor-pointer" onClick={() => handleEditDiscount(rule)}>
                      <span className={`text-xl font-black ${rule.discountPercent > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                        {rule.discountPercent === 0 ? "0%" : `-${rule.discountPercent}%`}
                      </span>
                      <Icon name="edit" size={12} className="text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* VOUCHERS (Ticket Style) */}
          <Panel variant="default" padding="lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <Icon name="tag" className="w-5 h-5 text-rose-500" /> Quản Lý Mã Khuyến Mại
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{vouchers.length} mã đang lưu</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((v) => (
                <div key={v.id} className={`relative rounded-xl border-2 border-dashed p-4 flex flex-col justify-between transition-all ${v.isActive ? "border-rose-200 bg-rose-50/30" : "border-slate-200 bg-slate-50 grayscale opacity-60"}`}>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r-2 border-dashed border-slate-200"></div>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-l-2 border-dashed border-slate-200"></div>
                  
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 bg-rose-600 text-white font-mono font-black text-sm rounded shadow-sm tracking-widest">{v.code}</span>
                    <button onClick={() => handleToggleVoucher(v.id, v.code, v.isActive)} className="text-slate-400 hover:text-slate-700"><Icon name={v.isActive ? "ban" : "check"} size={16} /></button>
                  </div>
                  <div>
                    <p className="text-lg font-black text-rose-700 leading-none mb-2">
                      {v.discountType === "PERCENT" ? `Giảm ${v.discountValue}%` : `Giảm ${formatCurrency(v.discountValue)}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">Kỳ hạn tối thiểu: {v.minContractMonths} tháng</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-rose-100/50">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>Đã dùng: {v.usageCount} / {v.maxUsage}</span>
                      <span>{(v.usageCount/v.maxUsage * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400" style={{ width: `${(v.usageCount/v.maxUsage)*100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: SIMULATOR */}
        {/* ========================================== */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 rounded-3xl bg-slate-900 text-white shadow-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
              <Icon name="monitor" className="text-emerald-400" />
              Công Cụ Giả Lập Tính Giá
            </h3>
            
            <div className="space-y-5">
              {/* Chọn Module */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-2">1. Chọn tính năng (Khách hàng)</label>
                <div className="space-y-1.5">
                  {catalog.map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition">
                      <input 
                        type="checkbox" 
                        checked={simSelectedModules.includes(mod.id)}
                        disabled={mod.isCore}
                        onChange={(e) => {
                          if (e.target.checked) setSimSelectedModules(prev => [...prev, mod.id]);
                          else setSimSelectedModules(prev => prev.filter(id => id !== mod.id));
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-200 flex-1">{mod.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Chọn Kỳ Hạn */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-2">2. Chọn kỳ hạn thanh toán</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 6, 12, 24].map(m => (
                    <button key={m} onClick={() => setSimMonths(m)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${simMonths === m ? "bg-emerald-500 border-emerald-500 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"}`}>
                      {m}T
                    </button>
                  ))}
                </div>
              </div>

              {/* Mã Voucher */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-2">3. Áp dụng Voucher (Tùy chọn)</label>
                <input type="text" value={simVoucherCode} onChange={(e) => setSimVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500 uppercase" />
                {simulation.vError && <p className="text-[10px] text-rose-400 mt-1 font-bold">{simulation.vError}</p>}
                {simulation.appliedVoucher && <p className="text-[10px] text-emerald-400 mt-1 font-bold">Mã hợp lệ! Đã áp dụng ưu đãi.</p>}
              </div>
            </div>

            {/* KẾT QUẢ TÍNH TOÁN */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-3">Phiếu Tính Tiền (Mô phỏng)</label>
              <div className="space-y-2 text-xs font-medium text-slate-300">
                <div className="flex justify-between">
                  <span>Giá gốc ({simMonths} tháng x {formatCurrency(simulation.baseMo)})</span>
                  <span>{formatCurrency(simulation.subtotal)}</span>
                </div>
                {simulation.pDiscAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Chiết khấu kỳ hạn ({simulation.pDiscPercent}%)</span>
                    <span>-{formatCurrency(simulation.pDiscAmount)}</span>
                  </div>
                )}
                {simulation.vDiscAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Voucher [{simulation.appliedVoucher?.code}]</span>
                    <span>-{formatCurrency(simulation.vDiscAmount)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-end justify-between">
                <span className="text-sm font-bold text-slate-400">Tổng thanh toán</span>
                <span className="text-2xl font-black text-emerald-400">{formatCurrency(simulation.total)}</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MODAL TẠO VOUCHER */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Icon name="tag" className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Phát Hành Voucher</h3>
                  <p className="text-xs text-slate-500">Tạo mã ưu đãi cho quán mới</p>
                </div>
              </div>
              <button onClick={requestCloseVoucher} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Icon name="x" size={16} /></button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã Voucher (Ví dụ: TET2026)</label>
                <input type="text" value={newVoucherCode} onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())} placeholder="MÃ VIẾT HOA..." required className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-mono font-black uppercase focus:border-indigo-600 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hình Thức Giảm</label>
                  <select value={newVoucherType} onChange={(e) => setNewVoucherType(e.target.value as "PERCENT" | "FIXED_AMOUNT")} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none">
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Giá Trị Giảm</label>
                  <input type="number" value={newVoucherValue} onChange={(e) => setNewVoucherValue(Number(e.target.value))} min={1} required className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kỳ Hạn Tối Thiểu</label>
                  <select value={newVoucherMonths} onChange={(e) => setNewVoucherMonths(Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none">
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Số Lượng Mã</label>
                  <input type="number" value={newVoucherLimit} onChange={(e) => setNewVoucherLimit(Number(e.target.value))} min={1} required className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="md" className="rounded-xl text-xs" onClick={requestCloseVoucher}>Hủy</Button>
                <Button type="submit" size="md" className="rounded-xl bg-indigo-600 text-white text-xs px-6 hover:bg-indigo-700">Tạo Ngay</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
