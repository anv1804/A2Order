import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import type { CreateReservationModalProps } from "@/types";

export const CreateReservationModal: React.FC<CreateReservationModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  availableTables,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated border border-surface-border animate-scaleUp overflow-hidden">
          {/* Header modal */}
          <div className="p-6 border-b border-surface-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-ink-primary">
                {formData.source === "PHONE_CALL" ? "Tiếp Nhận Đặt Bàn Hotline" : "Đặt Bàn Khách Đến Ngay"}
              </h3>
              <p className="text-xs text-ink-muted">Ghi nhận thông tin khách và giữ chỗ</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-canvas hover:text-ink-primary"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Tên Khách Hàng *
                </label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guestName: e.target.value }))}
                  placeholder="Ví dụ: Anh Nam"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Số Điện Thoại *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="09xx xxx xxx"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Số Lượng Khách
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.guestCount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guestCount: Number(e.target.value) }))}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Thời Gian Hẹn
                </label>
                <input
                  type="text"
                  value={formData.reservationTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reservationTime: e.target.value }))}
                  placeholder="19:00 - Tối nay"
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Xếp Bàn Sẵn
                </label>
                <select
                  value={formData.tableAssigned}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tableAssigned: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                >
                  {availableTables.length === 0 ? (
                    <option value="Chưa gán bàn">Chưa gán bàn</option>
                  ) : (
                    availableTables.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Tiền Cọc (VNĐ)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={formData.depositAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, depositAmount: Number(e.target.value) }))}
                  placeholder="0 đ"
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                Ghi Chú Khách Dặn
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú món ăn trước, trang trí, ghế trẻ em..."
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas/50 focus:bg-white focus:outline-none focus:border-brand-800 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={onClose}
              >
                Hủy Bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs font-bold px-4 shadow-xs"
              >
                Xác Nhận Giữ Chỗ
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
