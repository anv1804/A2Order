import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { CmsSidebar } from "./CmsSidebar";
import { CmsTopNav } from "./CmsTopNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Icon } from "@/components/ui";
import { IconName } from "@/types";
import { usePersistentState } from "@/hooks/usePersistentState";

import { CmsLayoutProps } from "@/types/cms.types";

export const CmsLayout: React.FC<CmsLayoutProps> = ({
  children,
  onLogout,
  activeMenu,
  onSelectMenu,
  currentRole,
  onChangeRole,
  enabledModules = [],
  currentUser,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState("cms_sidebar_collapsed", false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSelection, setSearchSelection] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tự động trượt xuống và ẩn thanh điều hướng mobile sau 7s nếu không có tương tác, trượt lên lại khi có thao tác
  const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setIsBottomBarVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsBottomBarVisible(false);
    }, 7000); // 7 giây
  }, []);

  useEffect(() => {
    resetHideTimer();

    const handleActivity = () => {
      resetHideTimer();
    };

    // Lắng nghe sự kiện tương tác trên toàn màn hình (capture: true bắt được mọi hành động cuộn/chạm)
    window.addEventListener("scroll", handleActivity, { passive: true, capture: true });
    window.addEventListener("touchstart", handleActivity, { passive: true, capture: true });
    window.addEventListener("touchmove", handleActivity, { passive: true, capture: true });
    window.addEventListener("mousemove", handleActivity, { passive: true, capture: true });
    window.addEventListener("mousedown", handleActivity, { passive: true, capture: true });
    window.addEventListener("keydown", handleActivity, { passive: true, capture: true });

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      window.removeEventListener("scroll", handleActivity, { capture: true });
      window.removeEventListener("touchstart", handleActivity, { capture: true });
      window.removeEventListener("touchmove", handleActivity, { capture: true });
      window.removeEventListener("mousemove", handleActivity, { capture: true });
      window.removeEventListener("mousedown", handleActivity, { capture: true });
      window.removeEventListener("keydown", handleActivity, { capture: true });
    };
  }, [resetHideTimer]);

  const navigationItems = useMemo(() => currentRole === "SUPER_ADMIN" ? [
    { id: "telemetry", label: "Tổng quan nền tảng", hint: "Số liệu và hoạt động" },
    { id: "tenants", label: "Quản lý quán & chuỗi", hint: "Đối tác và thiết bị" },
    { id: "license_manager", label: "License key", hint: "Cấp và gia hạn" },
    { id: "software_invoices", label: "Hóa đơn & thu phí", hint: "Theo dõi thanh toán" },
    { id: "pricing_config", label: "Bảng giá & voucher", hint: "Cấu hình gói dịch vụ" },
    { id: "scenarios", label: "Kịch bản F&B", hint: "Thực đơn mẫu" },
    { id: "audit_logs", label: "Kiểm toán hệ thống", hint: "Nhật ký hoạt động" },
    { id: "profile", label: "Hồ sơ cá nhân", hint: "Tài khoản và quyền truy cập" },
  ] : [
    { id: "dashboard", label: "Tổng quan quán", hint: "Tình hình vận hành" },
    { id: "staff_order", label: "Gọi món", hint: "POS cầm tay" },
    { id: "tables", label: "Bàn ăn", hint: "Sơ đồ bàn" },
    { id: "kds", label: "Màn hình bếp", hint: "KDS và trạng thái món" },
    { id: "reservations", label: "Đặt bàn", hint: "Lịch hẹn khách" },
    { id: "menu", label: "Thực đơn", hint: "Món ăn và giá" },
    { id: "inventory", label: "Kho hàng", hint: "Tồn kho và nhập hàng" },
    { id: "customers", label: "Khách hàng", hint: "Hồ sơ và khách thân thiết" },
    { id: "promotions", label: "Khuyến mãi", hint: "Voucher và ưu đãi" },
    { id: "analytics", label: "Báo cáo", hint: "Doanh thu và hiệu quả" },
    { id: "team", label: "Nhân sự", hint: "Nhân viên và quyền" },
    { id: "hardware", label: "Thiết bị", hint: "Máy in và phần cứng" },
    { id: "settings", label: "Cài đặt", hint: "Cấu hình cửa hàng" },
    { id: "landing_page", label: "Website cửa hàng", hint: "Landing page và SEO" },
    { id: "profile", label: "Hồ sơ cá nhân", hint: "Tài khoản và quyền truy cập" },
  ], [currentRole]);
  const matchingNavigation = navigationItems.filter((item) => `${item.label} ${item.hint}`.toLocaleLowerCase("vi").includes(searchQuery.trim().toLocaleLowerCase("vi")));

  useEffect(() => setSearchSelection(0), [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const displayName = currentUser?.name || (currentRole === "SUPER_ADMIN" ? "Quản Trị Viên A2Order" : "Chủ cửa hàng");
  const displayEmail = currentUser?.email || "";
  const displayStore = currentRole === "SUPER_ADMIN" ? "Nền tảng A2Order" : (currentUser?.storeName || "Cửa hàng");
  const mobileNavItems: Array<{ id: string; label: string; icon: IconName; isHome?: boolean }> = currentRole === "SUPER_ADMIN"
    ? [
        { id: "tenants", label: "Quán & Chuỗi", icon: "building" },
        { id: "scenarios", label: "Kịch bản", icon: "clipboard" },
        { id: "telemetry", label: "Trang chủ", icon: "home", isHome: true },
        { id: "software_invoices", label: "Hóa đơn", icon: "fileText" },
      ]
    : [
        { id: "tables", label: "Bàn ăn", icon: "table" },
        { id: "staff_order", label: "Gọi món", icon: "cart" },
        { id: "dashboard", label: "Trang chủ", icon: "home", isHome: true },
        { id: "menu", label: "Thực đơn", icon: "grid" },
      ];

  return (
    <div className="cms-workspace flex h-[100dvh] w-full overflow-hidden bg-white sm:bg-[#f6f8f7] font-sans text-ink-primary">
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        matchingNavigation={matchingNavigation}
        onSelect={onSelectMenu}
        currentRole={currentRole}
      />
      {/* 1. Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block h-full shrink-0 z-30">
        <CmsSidebar
          activeMenu={activeMenu}
          onSelectMenu={onSelectMenu}
          onLogout={onLogout}
          currentRole={currentRole}
          onChangeRole={onChangeRole}
          enabledModules={enabledModules}
          currentUser={currentUser}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        />
      </div>

      {/* 2. Mobile Drawer Backdrop Overlay (Sidebar) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 3. Mobile Slide-Over Drawer Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[340px] max-w-[calc(100vw-1rem)] bg-[#102d25] z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out flex flex-col rounded-r-3xl overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="min-h-0 flex-1">
          <CmsSidebar
            activeMenu={activeMenu}
            onSelectMenu={(menu) => {
              onSelectMenu(menu);
              setIsMobileMenuOpen(false);
            }}
            onLogout={onLogout}
            currentRole={currentRole}
            onChangeRole={onChangeRole}
            enabledModules={enabledModules}
            currentUser={currentUser}
            onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </div>

      {/* 4. Main Work Area (Chứa Header cố định + Content cuộn độc lập) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Fixed Header: Căn lề px-3 khớp tuyệt đối với lề của Content px-3 */}
        <header className="sticky top-0 z-10 shrink-0 bg-white/95 backdrop-blur-xl px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2.5 border-b border-slate-200/80">
          <div className="w-full">
            <CmsTopNav
              userName={displayName}
              userEmail={displayEmail}
              onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
              onOpenProfile={() => onSelectMenu("profile")}
              onOpenSearch={() => { setSearchQuery(""); setIsSearchOpen(true); }}
              onSelectMenu={onSelectMenu}
              activeMenuTitle={
                currentRole === "SUPER_ADMIN"
                  ? ({
                      telemetry: "Tổng Quan",
                      tenants: "Chuỗi Quán",
                      store_users: "User Quán",
                      license_manager: "Giấy Phép",
                      software_invoices: "Hóa Đơn",
                      pricing_config: "Bảng Giá",
                      scenarios: "Kịch Bản",
                      audit_logs: "Giám Sát",
                      profile: "Hồ Sơ",
                    } as Record<string, string>)[activeMenu] || "Tổng Quan"
                  : ({
                      dashboard: "Tổng Quan",
                      staff_order: "Gọi Món",
                      tables: "Bàn Ăn",
                      menu: "Thực Đơn",
                      kds: "Màn Bếp",
                      analytics: "Báo Cáo",
                      inventory: "Kho Hàng",
                      team: "Nhân Sự",
                      customers: "Khách Hàng",
                      reservations: "Đặt Bàn",
                      promotions: "Khuyến Mãi",
                      settings: "Cài Đặt",
                      landing_page: "Trang Web",
                      hardware: "Thiết Bị",
                      profile: "Hồ Sơ",
                    } as Record<string, string>)[activeMenu] || "Tổng Quan"
              }
              roleBadgeText={currentRole === "SUPER_ADMIN" ? "Super Admin" : "Chủ Quán"}
              storeName={displayStore}
            />
          </div>
        </header>

        {/* Scrollable Main Content Container with responsive padding px-3 và pb-28 an toàn cho mobile bottom dock */}
        <main id="cms-main-scroll" className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pb-28 sm:pb-24 lg:pb-6 w-full max-w-full scroll-smooth">
          <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">{children}</div>
        </main>

        {/* Mobile navigation dock: Tinh gọn Icon-Only, sticky trong suốt trượt xuống ẩn sau 7s không thao tác */}
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] lg:hidden transition-all duration-500 ease-in-out ${
            isBottomBarVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-[150%] opacity-0 pointer-events-none"
          }`}
        >
          <nav
            aria-label="Điều hướng chính"
            className="pointer-events-auto mx-auto flex max-w-[330px] items-center justify-between rounded-full border border-white/15 bg-[#0e2720]/95 backdrop-blur-xl p-1.5 shadow-[0_8px_24px_rgba(10,30,24,0.18)] ring-1 ring-black/5"
          >
            {mobileNavItems.map((item) => {
              const isActive = activeMenu === item.id;
              if (item.isHome) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMenu(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                      isActive
                        ? "bg-white text-[#0e2720] shadow-md ring-2 ring-emerald-400/40"
                        : "bg-white/10 text-emerald-100/90 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} size={21} />
                    {isActive && (
                      <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-emerald-700" />
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMenu(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                    isActive
                      ? "bg-white text-[#0e2720] shadow-sm"
                      : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} size={19} />
                  {isActive && (
                    <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-emerald-700" />
                  )}
                </button>
              );
            })}
            {/* 5. Nút Hồ sơ / Tài khoản cá nhân (Avatar) */}
            {(() => {
              const isProfileActive = activeMenu === "profile";
              const avatarLetter = (displayName || "A").charAt(0).toUpperCase();
              return (
                <button
                  type="button"
                  onClick={() => onSelectMenu("profile")}
                  aria-current={isProfileActive ? "page" : undefined}
                  aria-label="Hồ sơ tài khoản"
                  title="Hồ sơ cá nhân"
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                    isProfileActive
                      ? "bg-white text-[#0e2720] shadow-sm"
                      : "hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                      isProfileActive
                        ? "bg-[#0e2720] text-white"
                        : "bg-emerald-800 text-emerald-100 ring-1 ring-white/20"
                    }`}
                  >
                    {avatarLetter}
                  </span>
                  {isProfileActive && (
                    <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-emerald-700" />
                  )}
                </button>
              );
            })()}
          </nav>
        </div>
      </div>


    </div>
  );
};
