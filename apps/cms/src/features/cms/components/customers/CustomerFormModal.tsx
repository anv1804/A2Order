import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { CustomerRecord, CustomerMembershipTier } from "@/types/cms.types";

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  tier: CustomerMembershipTier;
  notes: string;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingCustomer: CustomerRecord | null;
  form: CustomerFormData;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingCustomer,
  form,
  setForm,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scaleUp">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-black text-ink-primary text-base">
              {editingCustomer ? `Chỉnh Sửa Hồ Sơ (${editingCustomer.code})` : "Thêm Khách Hàng Mới"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 mt-3 text-xs">
            <div>
              <label className="text-xs font-bold text-ink-muted mb-1 block">Họ và tên khách (*):</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1 block">Số điện thoại (*):</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="VD: 0912 345 678"
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1 block">Email (tùy chọn):</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="khachhang@gmail.com"
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1 block">Hạng thành viên:</label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value as CustomerMembershipTier })}
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
              >
                <option value="MEMBER">Thành Viên (Chi tiêu 0 đ)</option>
                <option value="BRONZE">Hạng Đồng (Chi tiêu &gt; 1.000.000 đ - Giảm 3%)</option>
                <option value="SILVER">Hạng Bạc (Chi tiêu &gt; 3.000.000 đ - Giảm 5%)</option>
                <option value="GOLD">Hạng Vàng (Chi tiêu &gt; 8.000.000 đ - Giảm 10%)</option>
                <option value="DIAMOND">Kim Cương (Chi tiêu &gt; 15.000.000 đ - Giảm 15%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1 block">Ghi chú khẩu vị / thói quen:</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ít đá, không hành, thích ngồi góc yên tĩnh..."
                className="w-full p-2.5 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
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
                className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
              >
                {editingCustomer ? "Lưu Thay Đổi" : "Tạo Mới"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
