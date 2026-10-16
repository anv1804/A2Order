import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { staffApi } from "@/services/api/staffApi";
import { NotificationModal, INITIAL_NOTIFICATIONS } from "@/components/ui/NotificationModal";
import { NotificationItem, CmsTopNavProps } from "@/types";


export const CmsTopNav: React.FC<CmsTopNavProps> = ({
  userName,
  onToggleMobileMenu,
  activeMenuTitle,
  roleBadgeText,
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
      if (saved) return (JSON.parse(saved) as NotificationItem[]).filter(item => !String(item.id).startsWith("password-reset:"));
    } catch (e) {}
    return INITIAL_NOTIFICATIONS;
  });

  const handleNotificationsChange = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem("a2order_notifications", JSON.stringify(items.filter(item => !String(item.id).startsWith("password-reset:"))));
    } catch (e) {}
  };


  useEffect(() => {
    if (currentRole !== "STORE_OWNER" && currentRole !== "SUPER_ADMIN") return;
    let active = true;
    const refresh = async () => {
      try {
        const requests = await staffApi.getPasswordResetRequests();
        if (!active) return;
        setNotifications(previous => {
          const local = previous.filter(item => !String(item.id).startsWith("password-reset:"));
          const remote: NotificationItem[] = requests.map(item => ({
            id: `password-reset:${item.id}`, type: "security", tag: "Bảo mật",
            title: "Yêu cầu đặt lại mật khẩu", desc: `${item.name} (${item.email}) cần chủ quán hỗ trợ đặt lại mật khẩu.`,
            time: new Date(item.createdAt).toLocaleString("vi-VN"), icon: "key", color: "text-brand-900", bg: "bg-brand-100",
            isRead: previous.find(old => old.id === `password-reset:${item.id}`)?.isRead || false,
            actionText: "Mở nhân sự", actionType: "staff",
          }));
          return [...remote, ...local];
        });
      } catch { /* Inbox remains available on the next refresh. */ }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentRole]);

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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-border bg-white text-ink-primary transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900 active:scale-95 lg:hidden shadow-xs"
          >
            <Icon name="bars" size={18} />
          </button>
          
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-[10px] font-bold uppercase tracking-[.12em] text-brand-800">
              {storeName || "A2Order Workspace"}
            </p>
            <h1 className="truncate text-base font-black tracking-tight text-ink-primary">
              {activeMenuTitle || "Tổng quan"}
            </h1>
          </div>

          <div className="hidden min-w-0 items-center gap-2.5 text-sm lg:flex">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-border rounded-xl shadow-xs">
              <div className="w-5 h-5 rounded-md bg-brand-900 flex items-center justify-center">
                <Icon name="building" size={12} className="text-white" />
              </div>
              <span className="truncate font-black text-ink-primary text-xs tracking-wide">{storeName || "A2Order Platform"}</span>
            </div>
            <Icon name="arrowRight" size={14} className="shrink-0 text-ink-subtle" />
            <span className="truncate font-extrabold text-ink-primary">{activeMenuTitle || "Tổng quan"}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Tìm phân hệ và tác vụ"
            title="Tìm nhanh (Ctrl/Cmd + K)"
            className="flex h-10 w-10 sm:w-48 lg:w-60 items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface-canvas text-ink-muted transition hover:border-brand-200 hover:bg-white hover:text-ink-primary sm:justify-start sm:px-3.5 shadow-xs"
          >
            <Icon name="search" size={15} className="text-ink-subtle" />
            <span className="hidden min-w-0 flex-1 text-left text-xs font-semibold text-ink-subtle sm:block">Tìm nhanh món, bàn...</span>
            <kbd className="hidden rounded-md bg-white border border-surface-border px-1.5 py-0.5 text-[9px] font-black text-ink-muted sm:block">⌘K</kbd>
          </button>

          {/* Nhãn nhận diện phân hệ Super Admin HQ */}
          {currentRole === "SUPER_ADMIN" && (
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 text-[11px] font-bold text-indigo-900 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Quản Trị Nền Tảng (HQ)</span>
            </div>
          )}

          <div className="hidden sm:block h-6 w-px bg-surface-border"></div>

          <button
            onClick={() => setIsNotiOpen(true)}
            aria-label="Thông báo hệ thống"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-surface-border bg-white text-ink-muted transition hover:bg-surface-canvas hover:text-ink-primary shadow-xs active:scale-95"
          >
            <Icon name="bell" size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Desktop User Avatar (trên mobile đã chuyển xuống thanh điều hướng dưới) */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ tài khoản"
            title="Hồ sơ tài khoản"
            className="hidden md:flex h-10 items-center gap-2.5 rounded-2xl border border-surface-border bg-white p-1 pr-3 transition hover:border-brand-300 hover:shadow-xs active:scale-95"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-xs font-black text-white">
              {(userName || "A").charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col text-left">
              <span className="max-w-28 truncate text-xs font-bold text-ink-primary leading-tight">{userName || "Tài khoản"}</span>
              {roleBadgeText && (
                <span className="text-[10px] font-semibold text-brand-800 leading-tight">{roleBadgeText}</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  );
};
