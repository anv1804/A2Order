import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { NotificationModal } from "@/components/ui/NotificationModal";
import { CmsTopNavProps } from "@/types/cms.types";

export const CmsTopNav: React.FC<CmsTopNavProps> = ({
  userName,
  onToggleMobileMenu,
  activeMenuTitle,
  storeName,
  onOpenProfile,
  onOpenSearch,
}) => {
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  return (
    <>
      <NotificationModal isOpen={isNotiOpen} onClose={() => setIsNotiOpen(false)} />
      <div className="flex h-14 min-w-0 items-center justify-between gap-3 sm:h-16 px-2 sm:px-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Mở danh mục quản trị"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 active:scale-95 lg:hidden shadow-2xs"
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="w-5 h-5 rounded-md bg-emerald-900 flex items-center justify-center">
                <Icon name="building" size={12} className="text-white" />
              </div>
              <span className="truncate font-black text-slate-700 text-xs tracking-wide">{storeName || "A2Order Platform"}</span>
            </div>
            <Icon name="arrowRight" size={14} className="shrink-0 text-slate-300" />
            <span className="truncate font-extrabold text-slate-900">{activeMenuTitle || "Tổng quan"}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Tìm phân hệ và tác vụ"
            title="Tìm nhanh (Ctrl/Cmd + K)"
            className="flex h-10 w-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 sm:w-44 sm:justify-start sm:px-3 shadow-2xs lg:w-56"
          >
            <Icon name="search" size={17} />
            <span className="hidden min-w-0 flex-1 text-left text-xs font-bold text-slate-400 sm:block">Tìm nhanh</span>
            <kbd className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500 sm:block">⌘K</kbd>
          </button>

          <div className="hidden sm:block h-6 w-px bg-slate-200"></div>

          <button
            onClick={() => setIsNotiOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 shadow-2xs active:scale-95"
          >
            <Icon name="bell" size={18} />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ tài khoản"
            title="Hồ sơ tài khoản"
            className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 pr-1 transition hover:border-emerald-300 hover:shadow-sm md:pr-3 active:scale-95"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-xs font-black text-white">
              {(userName || "A").charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-28 truncate text-xs font-bold text-slate-800 md:block">{userName || "Tài khoản"}</span>
          </button>
        </div>
      </div>
    </>
  );
};
