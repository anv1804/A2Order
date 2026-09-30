import React from "react";
import { Icon } from "@/components/ui";
import { CmsTopNavProps } from "@/types/cms.types";

export const CmsTopNav: React.FC<CmsTopNavProps> = ({
  userName,
  onToggleMobileMenu,
  activeMenuTitle,
  storeName,
  onOpenProfile,
  onOpenSearch,
}) => (
  <div className="flex h-14 min-w-0 items-center justify-between gap-3 sm:h-16">
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        onClick={onToggleMobileMenu}
        aria-label="Mở danh mục quản trị"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 active:scale-95 lg:hidden"
      >
        <Icon name="bars" size={19} />
      </button>
      <div className="min-w-0 lg:hidden">
        <p className="truncate text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700/70">
          {storeName || "A2Order Workspace"}
        </p>
        <h1 className="truncate text-base font-black tracking-tight text-slate-950 sm:text-xl">
          {activeMenuTitle || "Tổng quan"}
        </h1>
      </div>
      <div className="hidden min-w-0 items-center gap-2.5 text-sm lg:flex">
        <span className="truncate font-semibold text-slate-500">{storeName || "A2Order"}</span>
        <Icon name="arrowRight" size={14} className="shrink-0 text-slate-300" />
        <span className="truncate font-extrabold text-slate-900">{activeMenuTitle || "Tổng quan"}</span>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Tìm phân hệ và tác vụ"
        title="Tìm nhanh (Ctrl/Cmd + K)"
        className="flex h-10 w-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 sm:w-44 sm:justify-start sm:px-3 lg:w-56"
      >
        <Icon name="search" size={17} />
        <span className="hidden min-w-0 flex-1 text-left text-xs font-medium text-slate-400 sm:block">Tìm nhanh</span>
        <kbd className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 sm:block">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label="Mở hồ sơ tài khoản"
        title="Hồ sơ tài khoản"
        className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-1 transition hover:border-emerald-300 hover:shadow-sm md:pr-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12372a] text-xs font-black text-white">
          {(userName || "A").charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate text-xs font-bold text-slate-800 md:block">{userName || "Tài khoản"}</span>
      </button>
    </div>
  </div>
);
