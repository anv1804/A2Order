import React from "react";
import { Icon, Portal } from "@/components/ui";
import { CustomerCartItem, CustomerVoucher } from "@/types";

interface CustomerOrderConfirmModalProps {
  isOpen: boolean;
  tableName?: string;
  totalCartCount: number;
  cart: CustomerCartItem[];
  orderNotes: string;
  onChangeOrderNotes: (notes: string) => void;
  totalCartRawAmount: number;
  voucherDiscount: number;
  appliedVoucher: CustomerVoucher | null;
  customerPhone: string;
  finalCartTotal: number;
  isSubmittingOrder: boolean;
  onClose: () => void;
  onConfirmAndSubmit: () => void;
}

export const CustomerOrderConfirmModal: React.FC<CustomerOrderConfirmModalProps> = ({
  isOpen,
  tableName,
  totalCartCount,
  cart,
  orderNotes,
  onChangeOrderNotes,
  totalCartRawAmount,
  voucherDiscount,
  appliedVoucher,
  customerPhone,
  finalCartTotal,
  isSubmittingOrder,
  onClose,
  onConfirmAndSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/70 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-elevated border border-surface-border space-y-4 max-h-[90vh] flex flex-col animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-900 border border-brand-200 flex items-center justify-center">
                <Icon name="clipboard" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink-primary">Xác Nhận Đặt Món</h3>
                <p className="text-[10.5px] text-ink-muted">{tableName || "Bàn"} • {totalCartCount} món</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          {/* Danh sách món trong giỏ */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {cart.map((c) => (
              <div
                key={c.menuItem.id}
                className="p-2.5 bg-surface-canvas rounded-xl border border-surface-border flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-ink-primary truncate block">
                    {c.quantity}x {c.menuItem.name}
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    {c.menuItem.price.toLocaleString("vi-VN")} đ / phần
                  </span>
                </div>
                <span className="font-black text-brand-900 shrink-0">
                  {(c.menuItem.price * c.quantity).toLocaleString("vi-VN")} đ
                </span>
              </div>
            ))}

            {/* Ghi chú đơn hàng */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-ink-secondary block mb-1">
                Ghi chú cho bếp / pha chế (tùy chọn):
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => onChangeOrderNotes(e.target.value)}
                placeholder="VD: Ít đường, không đá, mang cùng lúc..."
                className="w-full h-9 px-3 rounded-xl border border-surface-border bg-white text-xs font-medium text-ink-primary focus:outline-none focus:border-brand-800"
              />
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="bg-surface-canvas p-3 rounded-xl border border-surface-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Tạm tính ({totalCartCount} món):</span>
                <span>{totalCartRawAmount.toLocaleString("vi-VN")} đ</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex items-center justify-between text-rose-600 font-bold">
                  <span>Voucher ({appliedVoucher?.code}):</span>
                  <span>-{voucherDiscount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}

              {customerPhone && (
                <div className="flex items-center justify-between text-cyan-700 font-bold text-[11px]">
                  <span>Tích điểm SĐT {customerPhone}:</span>
                  <span>+{Math.floor(finalCartTotal / 10000)} điểm</span>
                </div>
              )}

              <div className="border-t border-surface-border pt-1.5 flex items-center justify-between font-black text-sm text-ink-primary">
                <span>Tổng thanh toán:</span>
                <span className="text-brand-900">{finalCartTotal.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[10.5px] leading-relaxed flex items-start gap-1.5">
              <Icon name="clock" size={14} className="shrink-0 mt-0.5 text-amber-700" />
              <p>
                <strong>Lưu ý:</strong> Khi bạn bấm gửi, đơn hàng sẽ chuyển tới quầy quán để nhân viên xác nhận duyệt trước khi bếp chế biến.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-surface-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-surface-border text-ink-muted font-bold text-xs hover:bg-surface-canvas transition"
            >
              Chọn Thêm
            </button>
            <button
              type="button"
              disabled={isSubmittingOrder}
              onClick={onConfirmAndSubmit}
              className="flex-1 py-3 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
            >
              {isSubmittingOrder ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Icon name="check" size={14} />
                  <span>Xác Nhận Đặt Món</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
