import React from "react";
import { Icon, Portal } from "@/components/ui";
import { CustomerCartItem as CartItem, VoucherItem as Voucher } from "@/types";

export interface CustomerOrderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  cart: CartItem[];
  totalCartCount: number;
  totalCartRawAmount: number;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  appliedVoucher: Voucher | null;
  voucherDiscount: number;
  customerPhone: string;
  finalCartTotal: number;
  isSubmittingOrder: boolean;
  onConfirmAndSubmit: () => Promise<void> | void;
}

export const CustomerOrderConfirmModal: React.FC<CustomerOrderConfirmModalProps> = ({
  isOpen,
  onClose,
  tableName,
  cart,
  totalCartCount,
  totalCartRawAmount,
  orderNotes,
  setOrderNotes,
  appliedVoucher,
  voucherDiscount,
  customerPhone,
  finalCartTotal,
  isSubmittingOrder,
  onConfirmAndSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Icon name="clipboard" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Xác Nhận Đặt Món</h3>
                <p className="text-[10.5px] text-slate-400">{tableName || "Bàn"} • {totalCartCount} món</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          {/* Danh sách món trong giỏ */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {cart.map((c) => (
              <div
                key={c.menuItem.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-slate-900 truncate block">
                    {c.quantity}x {c.menuItem.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {c.menuItem.price.toLocaleString("vi-VN")} đ / phần
                  </span>
                </div>
                <span className="font-black text-emerald-800 shrink-0">
                  {(c.menuItem.price * c.quantity).toLocaleString("vi-VN")} đ
                </span>
              </div>
            ))}

            {/* Ghi chú đơn hàng */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Ghi chú cho bếp / pha chế (tùy chọn):
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="VD: Ít đường, không đá, mang cùng lúc..."
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
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

              <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between font-black text-sm text-slate-900">
                <span>Tổng thanh toán:</span>
                <span className="text-emerald-800">{finalCartTotal.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[10.5px] leading-relaxed">
              ⏳ <strong>Lưu ý:</strong> Khi bạn bấm gửi, đơn hàng sẽ chuyển tới quầy quán để nhân viên xác nhận duyệt trước khi bếp chế biến.
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
            >
              Chọn Thêm
            </button>
            <button
              type="button"
              disabled={isSubmittingOrder}
              onClick={onConfirmAndSubmit}
              className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95 transition disabled:opacity-50"
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
