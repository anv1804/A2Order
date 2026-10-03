import React from "react";
import { Icon } from "@/components/ui";
import { CustomerOrderedItem, CustomerVoucher } from "@/types";

interface CustomerBottomNavProps {
  activeTab: "MENU" | "ORDERED" | "OFFERS";
  onSelectTab: (tab: "MENU" | "ORDERED" | "OFFERS") => void;
  totalCartCount: number;
  orderedItems: CustomerOrderedItem[];
  appliedVoucher: CustomerVoucher | null;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  activeTab,
  onSelectTab,
  totalCartCount,
  orderedItems,
  appliedVoucher,
}) => {
  const hasPendingApproval = orderedItems.some((i) => i.status === "PENDING_APPROVAL");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-surface-border shadow-lg py-2 px-4">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onSelectTab("MENU")}
          className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === "MENU"
              ? "bg-brand-50 text-brand-900 font-black shadow-2xs border border-brand-200"
              : "text-ink-muted hover:text-ink-primary font-bold"
          }`}
        >
          <div className="relative">
            <Icon name="menu" size={20} />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Thực Đơn</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("ORDERED")}
          className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === "ORDERED"
              ? "bg-brand-50 text-brand-900 font-black shadow-2xs border border-brand-200"
              : "text-ink-muted hover:text-ink-primary font-bold"
          }`}
        >
          <div className="relative">
            <Icon name="clipboard" size={20} />
            {hasPendingApproval && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px]">Đã Đặt</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("OFFERS")}
          className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === "OFFERS"
              ? "bg-brand-50 text-brand-900 font-black shadow-2xs border border-brand-200"
              : "text-ink-muted hover:text-ink-primary font-bold"
          }`}
        >
          <div className="relative">
            <Icon name="tag" size={20} />
            {appliedVoucher && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-brand-600" />
            )}
          </div>
          <span className="text-[11px]">Ưu Đãi & Điểm</span>
        </button>
      </div>
    </nav>
  );
};
