import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { NotificationModal, INITIAL_NOTIFICATIONS, NotificationItem } from "@/components/ui/NotificationModal";
import { CmsTopNavProps } from "@/types/cms.types";

export const CmsTopNav: React.FC<CmsTopNavProps> = ({
  userName,
  onToggleMobileMenu,
  activeMenuTitle,
  storeName,
  onOpenProfile,
  onOpenSearch,
  onSelectMenu,
  currentRole,
  onChangeRole,
}) => {
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("a2order_notifications");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTIFICATIONS;
  });

  const handleNotificationsChange = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem("a2order_notifications", JSON.stringify(items));
    } catch (e) {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <NotificationModal
        isOpen={isNotiOpen}
        onClose={() => setIsNotiOpen(false)}
        notifications={notifications}
        onNotificationsChange={handleNotificationsChange}
        onNavigateTab={onSelectMenu}
      />
      <div className="flex h-12 sm:h-16 min-w-0 items-center justify-between gap-1.5 sm:gap-3 px-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Mở danh mục quản trị"
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 active:scale-95 lg:hidden shadow-2xs"
          >
            <Icon name="bars" size={18} />
          </button>
          
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[.08em] sm:tracking-[.12em] text-emerald-700/80">
              {storeName || "A2Order Workspace"}
            </p>
            <h1 className="truncate text-sm sm:text-base font-black tracking-tight text-slate-950">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {onChangeRole && currentRole && (
            <div className="relative flex items-center">
              <label htmlFor="cms-role-switcher" className="sr-only">Chuyển vai trò quản trị</label>
              <select
                id="cms-role-switcher"
                value={currentRole}
                onChange={(e) => onChangeRole(e.target.value as any)}
                aria-label="Chuyển chế độ xem vai trò"
                className="text-[11px] sm:text-xs font-black text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 rounded-xl px-2 sm:px-2.5 py-1.5 cursor-pointer outline-none transition focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                <option value="STORE_OWNER">👑 Chủ Quán</option>
                <option value="ACCOUNTANT">📊 Kế Toán</option>
                <option value="CASHIER">💵 Thu Ngân</option>
                <option value="CHEF">🍳 Bếp / KDS</option>
                <option value="WAITER">🍽️ Phục Vụ</option>
                <option value="SUPER_ADMIN">🛡️ Super Admin</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Tìm phân hệ và tác vụ"
            title="Tìm nhanh (Ctrl/Cmd + K)"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 sm:w-44 sm:justify-start sm:px-3 shadow-2xs lg:w-56"
          >
            <Icon name="search" size={16} />
            <span className="hidden min-w-0 flex-1 text-left text-xs font-bold text-slate-400 sm:block">Tìm nhanh</span>
            <kbd className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500 sm:block">⌘K</kbd>
          </button>

          <div className="hidden sm:block h-6 w-px bg-slate-200"></div>

          <button
            onClick={() => setIsNotiOpen(true)}
            aria-label="Thông báo hệ thống"
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 shadow-2xs active:scale-95"
          >
            <Icon name="bell" size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Desktop User Avatar (trên mobile đã chuyển xuống thanh điều hướng dưới) */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ tài khoản"
            title="Hồ sơ tài khoản"
            className="hidden md:flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 pr-3 transition hover:border-emerald-300 hover:shadow-sm active:scale-95"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-xs font-black text-white">
              {(userName || "A").charAt(0).toUpperCase()}
            </span>
            <span className="max-w-28 truncate text-xs font-bold text-slate-800">{userName || "Tài khoản"}</span>
          </button>
        </div>
      </div>
    </>
  );
};
