import React, { useState } from "react";
import { Button, Icon, Portal } from "@/components/ui";

export interface CreateLicenseKeyModalProps {
  isOpen: boolean;
  stores: Array<{ id: string; name: string; owner: string; phone: string }>;
  onClose: () => void;
  onSubmit: (licenseData: {
    storeId?: string;
    storeName?: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    maxDevices: number;
  }) => void;
}

export const CreateLicenseKeyModal: React.FC<CreateLicenseKeyModalProps> = ({
  isOpen,
  stores,
  onClose,
  onSubmit,
}) => {
  const [storeId, setStoreId] = useState<string>("UNASSIGNED");
  const [plan, setPlan] = useState<"STARTER" | "GROWTH" | "PRO">("PRO");
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [maxDevices, setMaxDevices] = useState<number>(8);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStore = stores.find((s) => s.id === storeId);
    onSubmit({
      storeId: storeId === "UNASSIGNED" ? undefined : storeId,
      storeName: assignedStore ? assignedStore.name : undefined,
      plan,
      durationMonths,
      maxDevices,
    });
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-canvas shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900">
                <Icon name="key" className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink-primary">
                  Cấp License Key Bản Quyền
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Khởi tạo khóa bản quyền cho máy POS / KDS của đối tác
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
            {/* Chọn Quán Áp Dụng */}
            <div>
              <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                Quán Áp Dụng License Key:
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
              >
                <option value="UNASSIGNED">-- Chưa gán (Mã Key dự phòng, kích hoạt sau) --</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.owner} - {s.phone})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-ink-muted mt-1">
                Nếu chưa gán quán, mã key có thể cung cấp cho quán đối tác tự nhập kích hoạt trên máy POS.
              </p>
            </div>

            {/* Chọn Gói Bản Quyền */}
            <div>
              <label className="text-xs font-extrabold text-ink-muted mb-1.5 block">
                Gói Bản Quyền (License Tier):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: "STARTER",
                    name: "STARTER",
                    price: "199.000đ/tháng",
                    devices: "Max 2 máy",
                    desc: "POS Thu ngân + QR Menu",
                    border: "hover:border-emerald-400",
                    active: "border-emerald-600 bg-emerald-50 text-emerald-950",
                  },
                  {
                    id: "GROWTH",
                    name: "GROWTH",
                    price: "399.000đ/tháng",
                    devices: "Max 4 máy",
                    desc: "POS + QR + Màn hình Bếp KDS",
                    border: "hover:border-blue-400",
                    active: "border-blue-600 bg-blue-50 text-blue-950",
                  },
                  {
                    id: "PRO",
                    name: "PRO",
                    price: "599.000đ/tháng",
                    devices: "Max 10 máy",
                    desc: "Toàn bộ module + Kế toán & Web",
                    border: "hover:border-purple-400",
                    active: "border-purple-600 bg-purple-50 text-purple-950",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlan(p.id as any);
                      if (p.id === "STARTER") setMaxDevices(2);
                      else if (p.id === "GROWTH") setMaxDevices(4);
                      else setMaxDevices(8);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      plan === p.id
                        ? p.active
                        : `border-surface-border bg-white ${p.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{p.name}</span>
                      {plan === p.id && (
                        <span className="w-4 h-4 rounded-full bg-brand-900 text-white flex items-center justify-center">
                          <Icon name="check" className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-black text-brand-900 mt-0.5">{p.price}</div>
                    <div className="text-[10px] text-ink-muted mt-1 leading-tight">{p.desc}</div>
                    <div className="text-[9px] font-bold text-ink-secondary mt-1 bg-surface-muted/60 px-1.5 py-0.5 rounded inline-block">
                      {p.devices}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Thời hạn bản quyền & Số máy tối đa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                  Kỳ Hạn Thuê (Tháng):
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                >
                  <option value={1}>1 tháng (Dùng thử / Gia hạn ngắn)</option>
                  <option value={3}>3 tháng</option>
                  <option value={6}>6 tháng (Ưu đãi giảm 10%)</option>
                  <option value={12}>12 tháng (1 năm - Giảm 20%)</option>
                  <option value={24}>24 tháng (2 năm - Giảm 30%)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                  Giới Hạn Máy Kết Nối Cùng Lúc:
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={maxDevices}
                  onChange={(e) => setMaxDevices(Math.max(1, Number(e.target.value)))}
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                />
              </div>
            </div>

            {/* Tóm tắt License & Kiến trúc */}
            <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Mã Key dự kiến:</span>
                <span className="font-mono font-bold text-brand-950 bg-white px-2 py-0.5 rounded border border-surface-border">
                  A2-{plan}-XXXXXX
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Quyền truy cập Module:</span>
                <span className="font-bold text-ink-primary">
                  {plan === "PRO"
                    ? "Full Modules (POS + KDS + QR + Báo Cáo + Web)"
                    : plan === "GROWTH"
                    ? "Core POS + Bếp KDS + QR Order"
                    : "Core POS + QR Order"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <Icon name="shield" className="w-3.5 h-3.5 shrink-0" />
                <span>Mã Key mã hóa SHA-256 xác thực độc lập trên từng điểm bán (Edge-First).</span>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
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
                type="submit"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-6 shadow-sm font-bold gap-2"
              >
                <Icon name="key" className="w-3.5 h-3.5" />
                <span>Khởi Tạo & Kích Hoạt Key</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
