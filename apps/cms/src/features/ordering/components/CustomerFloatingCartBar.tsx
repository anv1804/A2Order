import React from "react";
import { Icon } from "@/components/ui";

interface CustomerFloatingCartBarProps {
  totalCartCount: number;
  finalCartTotal: number;
  totalCartRawAmount: number;
  voucherDiscount: number;
  onOpenConfirmModal: () => void;
}

export const CustomerFloatingCartBar: React.FC<CustomerFloatingCartBarProps> = ({
  totalCartCount,
  finalCartTotal,
  totalCartRawAmount,
  voucherDiscount,
  onOpenConfirmModal,
}) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto animate-slideUp">
      <div className="bg-brand-950 text-white p-3 sm:p-3.5 rounded-3xl shadow-2xl border border-brand-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenConfirmModal}
          className="flex items-center gap-2.5 text-left"
        >
          <div className="relative w-10 h-10 rounded-2xl bg-brand-800 text-white flex items-center justify-center shrink-0 shadow-sm border border-brand-700">
            <Icon name="cart" size={18} />
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-brand-950">
              {totalCartCount}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-brand-200 font-bold uppercase tracking-wider">Giỏ Hàng</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-amber-400">
                {finalCartTotal.toLocaleString("vi-VN")} đ
              </span>
              {voucherDiscount > 0 && (
                <span className="text-[10px] text-brand-300 line-through">
                  {totalCartRawAmount.toLocaleString("vi-VN")} đ
                </span>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenConfirmModal}
          className="py-2.5 px-4 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 border border-brand-700"
        >
          <span>Xem Giỏ</span>
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </div>
  );
};
