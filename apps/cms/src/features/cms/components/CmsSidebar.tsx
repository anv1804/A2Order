import React from "react";
import { Icon } from "@/components/ui";
import { IconName } from "@/types";
import { CmsSidebarProps, CmsSidebarMenuItem as MenuItem, CmsSidebarMenuGroup as MenuGroup } from "@/types/cms.types";

export const CmsSidebar: React.FC<CmsSidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onLogout,
  currentRole,
  onChangeRole,
  enabledModules = [],
  onCloseMobileDrawer,
}) => {
  // Nhóm Menu chuẩn nghiệp vụ F&B dành cho Chủ Quán
  const storeOwnerGroups: MenuGroup[] = [
    {
      title: "VẬN HÀNH & BÁN HÀNG",
      items: [
        { id: "dashboard", label: "Tổng Quan Quán", icon: "activity" },
        { id: "staff_order", label: "Order Cầm Tay (POS)", icon: "cart", badge: "Cầm tay" },
        { id: "tables", label: "Sơ Đồ Bàn & QR", icon: "table", badge: "12+" },
        { id: "kds", label: "Bếp Nấu (KDS)", icon: "kitchen", badge: "Live", requiredModule: "MODULE_KDS" as any },
        { id: "reservations", label: "Lịch Đặt Bàn", icon: "calendarCheck", badge: "Hotline" },
      ],
    },
    {
      title: "THỰC ĐƠN & KHO HÀNG",
      items: [
        { id: "menu", label: "Thực Đơn & Món Ăn", icon: "menu" },
        { id: "inventory", label: "Kho & Nhập Hàng", icon: "cart", badge: "Mới" },
      ],
    },
    {
      title: "KHÁCH HÀNG & MARKETING",
      items: [
        { id: "customers", label: "Khách Hàng & VIP", icon: "userCheck" },
        { id: "promotions", label: "Khuyến Mãi & Voucher", icon: "tag" },
      ],
    },
    {
      title: "TÀI CHÍNH & BÁO CÁO",
      items: [
        { id: "analytics", label: "Báo Cáo Doanh Thu", icon: "trending" },
      ],
    },
    {
      title: "HỆ THỐNG & CÀI ĐẶT",
      items: [
        { id: "team", label: "Nhân Sự & Quyền", icon: "users" },
        { id: "hardware", label: "Máy In & Thiết Bị", icon: "print" },
        {
          id: "landing_page",
          label: "Landing Page & Web",
          icon: "globe",
          badge: enabledModules.includes("MODULE_LANDING_PAGE" as any) ? "SEO" : "PRO",
        },
        { id: "settings", label: "Cài Đặt & Gói Cước", icon: "settings" },
      ],
    },
  ];

  // Lọc chỉ hiện các chức năng quán đã đăng ký mua
  const filteredStoreOwnerGroups: MenuGroup[] = storeOwnerGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.requiredModule) return true;
        return enabledModules.includes(item.requiredModule);
      }),
    }))
    .filter((group) => group.items.length > 0);

  // Nhóm Menu dành cho Super Admin Nền Tảng (Chuẩn SaaS F&B)
  const superAdminGroups: MenuGroup[] = [
    {
      title: "TỔNG QUAN NỀN TẢNG",
      items: [
        { id: "telemetry", label: "Tổng Quan & Doanh Số SaaS", icon: "chart" },
        { id: "scenarios", label: "Kịch Bản & Món Mẫu F&B", icon: "clipboard" },
      ],
    },
    {
      title: "ĐỐI TÁC & THUÊ BAO",
      items: [
        { id: "tenants", label: "Quản Lý Quán & Chuỗi", icon: "building", badge: "4" },
        { id: "software_invoices", label: "Hóa Đơn & Thu Phí", icon: "fileText", badge: "3" },
        { id: "pricing_config", label: "Bảng Giá Gói & Voucher", icon: "tag" },
      ],
    },
    {
      title: "HỆ THỐNG & KỸ THUẬT",
      items: [
        { id: "audit_logs", label: "Kiểm Toán & Giám Sát", icon: "shield" },
      ],
    },
  ];

  const currentGroups = currentRole === "SUPER_ADMIN" ? superAdminGroups : filteredStoreOwnerGroups;

  return (
    <aside className="w-full lg:w-72 h-full bg-white border-r border-surface-border flex flex-col justify-between p-5 select-none overflow-y-auto">
      <div>
        {/* Logo & Close Button (on mobile) */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
            />
            <div>
              <span className="font-black text-xl tracking-tight text-ink-primary">A2Order</span>
              <span className="block text-[10px] font-extrabold text-brand-700 tracking-wider">
                {currentRole === "SUPER_ADMIN" ? "SUPER ADMIN" : "STORE CMS"}
              </span>
            </div>
          </div>

          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="w-8 h-8 rounded-full bg-surface-muted hover:bg-slate-200 flex items-center justify-center text-ink-subtle hover:text-ink-primary transition-all lg:hidden"
              title="Đóng menu"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        {/* Role Switcher Pill */}
        <div className="mb-5 p-1 bg-surface-canvas rounded-2xl border border-surface-border flex text-[11px] font-bold">
          <button
            onClick={() => {
              onChangeRole("STORE_OWNER");
              onSelectMenu("dashboard");
            }}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              currentRole === "STORE_OWNER"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Icon name="store" className="w-3.5 h-3.5" />
            <span>Chủ Quán</span>
          </button>

          <button
            onClick={() => {
              onChangeRole("SUPER_ADMIN");
              onSelectMenu("telemetry");
            }}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              currentRole === "SUPER_ADMIN"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Icon name="shield" className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Structured Menu Groups */}
        <div className="space-y-4">
          {currentGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-subtle px-2 mb-1 block">
                {group.title}
              </span>
              {group.items.map((item) => {
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-98 ${
                      isActive
                        ? "bg-brand-50 text-brand-950 font-black shadow-xs border border-brand-200/60"
                        : "text-ink-muted hover:bg-surface-canvas hover:text-ink-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2 text-left">
                      <Icon
                        name={item.icon}
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-900" : "text-ink-subtle"}`}
                        size={17}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-brand-900 text-white whitespace-nowrap shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Logout Action */}
          <div className="pt-2 border-t border-surface-border">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-ink-muted hover:bg-rose-50 hover:text-rose-600 transition-all"
            >
              <Icon name="logout" className="w-4 h-4 text-ink-subtle" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Card: Bản quyền & Hỗ trợ kỹ thuật */}
      <div className="p-4 rounded-3xl bg-brand-950 text-white relative overflow-hidden shadow-elevated mt-6 shrink-0">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-brand-800/30 blur-xl" />
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-2.5">
          <Icon name="shield" className="w-4 h-4 text-emerald-400" />
        </div>
        <h4 className="text-xs font-extrabold leading-snug">
          {currentRole === "SUPER_ADMIN" ? "A2Order Platform Cloud" : "Bản Quyền PRO 2026"}
        </h4>
        <p className="text-[10px] text-brand-200/80 mt-1 mb-2">
          {currentRole === "SUPER_ADMIN"
            ? "Phiên bản v2.4.0 • Uptime 99.98% • Hotline Kỹ Thuật: 1900 8866"
            : "Còn 28 ngày thuê • Tự động gia hạn qua VietQR."}
        </p>
      </div>
    </aside>
  );
};
