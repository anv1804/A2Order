import React from "react";
import { Search, Mail, Bell } from "lucide-react";

interface CmsTopNavProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  onSearch?: (query: string) => void;
}

export const CmsTopNav: React.FC<CmsTopNavProps> = ({
  userName,
  userEmail,
  avatarUrl,
}) => {
  return (
    <header className="h-14 flex items-center justify-between gap-4 select-none">
      {/* Pill Search input with ⌘F */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle" />
        <input
          placeholder="Tìm kiếm bàn, món ăn, hóa đơn..."
          className="w-full h-10 pl-10 pr-12 rounded-full bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700 shadow-card placeholder:text-ink-subtle"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-surface-muted border border-surface-border text-[10px] font-bold text-ink-subtle">
          ⌘F
        </span>
      </div>

      {/* Right controls: Mail, Bell, Profile Avatar */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-white border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-canvas shadow-card transition-all">
          <Mail className="w-4 h-4" />
        </button>

        <button className="w-9 h-9 rounded-full bg-white border border-surface-border flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-canvas shadow-card relative transition-all">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User profile avatar info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-surface-border">
          <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-amber-900 font-extrabold text-xs">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0)
            )}
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="font-extrabold text-xs text-ink-primary leading-tight">{userName}</h4>
            <p className="text-[10px] text-ink-muted font-medium">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
