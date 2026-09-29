import React from "react";

export interface ChatChannelTabsProps {
  activeChannel: "ALL" | "KITCHEN" | "CASHIER" | "WAITER";
  setActiveChannel: (channel: "ALL" | "KITCHEN" | "CASHIER" | "WAITER") => void;
  variant?: "full" | "compact";
}

export const ChatChannelTabs: React.FC<ChatChannelTabsProps> = ({
  activeChannel,
  setActiveChannel,
  variant = "full",
}) => {
  const isFull = variant === "full";
  const CHANNELS = [
    { id: "ALL", label: isFull ? "📢 Toàn Quán" : "Toàn Quán" },
    { id: "KITCHEN", label: isFull ? "🍳 Bếp KDS" : "Bếp KDS" },
    { id: "CASHIER", label: isFull ? "💵 Thu Ngân" : "Thu Ngân" },
    { id: "WAITER", label: isFull ? "🏃 Phục Vụ" : "Phục Vụ" },
  ] as const;

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
              ? "px-4 py-2 rounded-full text-sm font-black shrink-0 border-2" 
              : "px-3 py-1 rounded-xl"
          } transition-all whitespace-nowrap ${
            activeChannel === ch.id
              ? "bg-brand-900 text-white border-brand-900 shadow-sm"
              : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
          }`}
        >
          {ch.label}
        </button>
      ))}
    </div>
  );
};
