import React from "react";
import { formatCurrency } from "@/lib/formatters";

interface OrderStepNavProps {
  orderStep: "TABLE_INFO" | "SELECT_MENU" | "REVIEW_CART";
  setOrderStep: (step: "TABLE_INFO" | "SELECT_MENU" | "REVIEW_CART") => void;
  totalQuantity: number;
  totalAmount: number;
}

export const OrderStepNav: React.FC<OrderStepNavProps> = ({
  orderStep,
  setOrderStep,
  totalQuantity,
  totalAmount,
}) => {
  return (
    <div className="bg-surface-canvas border-b border-surface-border px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 w-full max-w-lg">
        <button
          onClick={() => setOrderStep("TABLE_INFO")}
          className={`flex-1 py-1.5 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all ${
            orderStep === "TABLE_INFO"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-white text-ink-muted border border-surface-border hover:text-ink-primary"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] sm:text-[10px]">1</span>
          <span className="truncate">Bàn</span>
        </button>

        <button
          onClick={() => setOrderStep("SELECT_MENU")}
          className={`flex-1 py-1.5 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all ${
            orderStep === "SELECT_MENU"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-white text-ink-muted border border-surface-border hover:text-ink-primary"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] sm:text-[10px]">2</span>
          <span className="truncate">Chọn Món</span>
        </button>

        <button
          onClick={() => setOrderStep("REVIEW_CART")}
          className={`flex-1 py-1.5 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all relative ${
            orderStep === "REVIEW_CART"
              ? "bg-brand-900 text-white shadow-sm"
              : "bg-white text-ink-muted border border-surface-border hover:text-ink-primary"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] sm:text-[10px]">3</span>
          <span className="truncate">Giỏ & Gửi Bếp</span>
          {totalQuantity > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black shrink-0">
              {totalQuantity}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
