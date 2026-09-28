import React from "react";
import {
  LayoutGrid,
  ClipboardList,
  Calendar,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui";

interface CmsSidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onLogout: () => void;
}

export const CmsSidebar: React.FC<CmsSidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onLogout,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "tables", label: "Sơ Đồ Bàn", icon: ClipboardList, badge: "12+" },
    { id: "calendar", label: "Lịch Đặt Bàn", icon: Calendar },
    { id: "analytics", label: "Báo Cáo", icon: BarChart3 },
    { id: "team", label: "Nhân Sự", icon: Users },
  ];

  const generalItems = [
    { id: "settings", label: "Cài Đặt Quán", icon: Settings },
    { id: "help", label: "Trợ Giúp", icon: HelpCircle },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-surface-border flex flex-col justify-between p-5 select-none overflow-y-auto">
      <div>
        {/* Logo Donezo style */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <img
            src="/logo-symbol.jpg"
            alt="A2Order Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
          />
          <span className="font-black text-xl tracking-tight text-ink-primary">A2Order</span>
        </div>

        {/* Menu Section */}
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-subtle px-3 mb-2 block">
              MENU
            </span>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-brand-50 text-brand-900 shadow-sm"
                        : "text-ink-muted hover:bg-surface-canvas hover:text-ink-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp
                        className={`w-4 h-4 ${isActive ? "text-brand-900" : "text-ink-subtle"}`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-brand-900 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* General Section */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-subtle px-3 mb-2 block">
              GENERAL
            </span>
            <div className="space-y-1">
              {generalItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-brand-50 text-brand-900"
                        : "text-ink-muted hover:bg-surface-canvas hover:text-ink-primary"
                    }`}
                  >
                    <IconComp className="w-4 h-4 text-ink-subtle" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-ink-muted hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <LogOut className="w-4 h-4 text-ink-subtle" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: "Download our Mobile App" phong cách Donezo */}
      <div className="p-4 rounded-3xl bg-brand-950 text-white relative overflow-hidden shadow-elevated mt-6 shrink-0">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-brand-800/30 blur-xl" />
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3">
          <Smartphone className="w-4 h-4 text-brand-400" />
        </div>
        <h4 className="text-xs font-extrabold leading-snug">Cài đặt App Phục Vụ</h4>
        <p className="text-[10px] text-brand-200/80 mt-1 mb-3">
          Quét QR cài app PWA cho nhân viên trong 5 giây.
        </p>
        <Button size="sm" className="w-full rounded-full text-xs bg-brand-800 hover:bg-brand-700 text-white h-8">
          Tải Mã Cài Đặt
        </Button>
      </div>
    </aside>
  );
};
