import React from "react";
import { ChatChannelTabsProps } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { IconName } from "@/types/icon.types";

export const ChatChannelTabs: React.FC<ChatChannelTabsProps> = ({
  activeChannel,
  setActiveChannel,
  variant = "full",
}) => {
  const isFull = variant === "full";
  const CHANNELS: { id: "ALL" | "KITCHEN" | "CASHIER" | "WAITER"; label: string; icon: IconName }[] = [
    { id: "ALL", label: "Toàn Quán", icon: "bell" },
    { id: "KITCHEN", label: "Bếp KDS", icon: "kitchen" },
    { id: "CASHIER", label: "Thu Ngân", icon: "cashier" },
    { id: "WAITER", label: "Phục Vụ", icon: "users" },
  ];

  return (
    <div 
      className={`${
        isFull 
          ? "px-4 py-3 bg-white text-sm shrink-0 gap-2" 
          : "p-2 bg-surface-canvas text-[11px] gap-1"
      } border-b border-surface-border flex items-center overflow-x-auto no-scrollbar font-bold`}
    >
      {CHANNELS.map((ch) => (
        <button
          key={ch.id}
          onClick={() => setActiveChannel(ch.id)}
          className={`${
            isFull 
              ? "px-4 py-2 rounded-full text-sm font-black shrink-0 border-2 flex items-center gap-2" 
              : "px-3 py-1 rounded-xl flex items-center gap-1.5"
          } transition-all whitespace-nowrap ${
            activeChannel === ch.id
              ? "bg-brand-900 text-white border-brand-900 shadow-sm"
              : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name={ch.icon} size={isFull ? 15 : 12} />
          <span>{ch.label}</span>
        </button>
      ))}
    </div>
  );
};
