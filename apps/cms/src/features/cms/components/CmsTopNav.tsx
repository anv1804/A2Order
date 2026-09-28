import React from "react";
import { Icon } from "@/components/ui";

import { CmsTopNavProps } from "@/types/cms.types";

export const CmsTopNav: React.FC<CmsTopNavProps> = ({
  userName,
  userEmail,
  avatarUrl,
  onToggleMobileMenu,
  canGoBack = false,
  onBack,
  activeMenuTitle,
}) => {
  return (
    <div className="h-14 flex items-center justify-between gap-2.5 sm:gap-4 select-none">
      {/* Left side: Back button on mobile (when in sub-views) or Logo, plus Store / Feature Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
        {/* Nút Back trên Mobile khi vào các mục chức năng */}
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden w-9 h-9 rounded-xl bg-white border border-surface-border flex items-center justify-center text-ink-primary hover:bg-surface-canvas shadow-xs shrink-0 transition-all active:scale-95"
            aria-label="Quay lại"
          >
            <Icon name="chevronLeft" size={20} />
          </button>
        ) : (
          <div className="lg:hidden w-8 h-8 rounded-xl overflow-hidden shadow-xs ring-1 ring-black/5 shrink-0">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Brand logo & store title (shown only on mobile/tablet to avoid desktop sidebar duplication) */}
        <div className="flex items-center gap-2 min-w-0 lg:hidden">
          <div className="min-w-0">
            <span className="font-bold text-sm text-ink-primary block leading-tight truncate">
              {activeMenuTitle || "Phở Nam Định"}
            </span>
            <span className="text-[10px] font-semibold text-brand-700 block leading-none truncate">
              {canGoBack ? "Phở Nam Định • CN 1" : "Chi Nhánh 1"}
            </span>
          </div>
        </div>

        {/* Pill Search input with ⌘F on Desktop & Tablet */}
        <div className="relative flex-1 min-w-0 hidden sm:block max-w-sm ml-2">
          <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            placeholder="Tìm kiếm tính năng, đơn hàng..."
            className="w-full h-9 pl-9 pr-12 rounded-full bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700 shadow-card placeholder:text-ink-subtle truncate"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-surface-muted border border-surface-border text-[9px] font-bold text-ink-subtle">
            ⌘F
          </span>
        </div>
      </div>

      {/* Right controls: Mail, Bell, Profile Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-surface-border items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-canvas shadow-card transition-all">
          <Icon name="mail" className="w-4 h-4" />
        </button>

        <button className="w-9 h-9 rounded-full bg-white border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-canvas shadow-card relative transition-all" aria-label="Thông báo mới">
          <Icon name="bell" className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User profile avatar info */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-surface-border">
          <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-amber-900 font-extrabold text-xs shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0)
            )}
          </div>
          <div className="hidden md:block text-left">
            <h4 className="font-extrabold text-xs text-ink-primary leading-tight truncate max-w-[130px]">{userName}</h4>
            <p className="text-[10px] text-ink-muted font-medium truncate max-w-[130px]">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
