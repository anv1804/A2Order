import React from "react";
import { Icon } from "@/components/ui";

export interface QuickAlertBarProps {
  activeChannel: "ALL" | "KITCHEN" | "CASHIER" | "WAITER";
  onSendAlert: (alertText: string, target: "ALL" | "KITCHEN" | "WAITER" | "CASHIER") => void;
  variant?: "full" | "compact";
}

const CHANNEL_ALERTS = {
  ALL: [
    { text: "Cần hỗ trợ gấp!", icon: "alert", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { text: "Hết đá & khăn", icon: "alertCircle", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { text: "Xin dọn bàn", icon: "table", color: "text-purple-700 bg-purple-50 border-purple-200" },
  ],
  KITCHEN: [
    { text: "Bàn giục món!", icon: "flame", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { text: "Xin hủy món", icon: "x", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { text: "Món nào sắp ra?", icon: "help", color: "text-blue-700 bg-blue-50 border-blue-200" },
  ],
  CASHIER: [
    { text: "In phiếu tạm tính", icon: "banknote", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { text: "Xuất VAT", icon: "fileText", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { text: "Khách giục TT", icon: "clock", color: "text-amber-700 bg-amber-50 border-amber-200" },
  ],
  WAITER: [
    { text: "Có khách mới", icon: "users", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { text: "Dọn chỗ đổ bể", icon: "alert", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { text: "Tiếp đá bia", icon: "alertCircle", color: "text-blue-700 bg-blue-50 border-blue-200" },
  ],
};

export const QuickAlertBar: React.FC<QuickAlertBarProps> = ({
  activeChannel,
  onSendAlert,
  variant = "full",
}) => {
  const isFull = variant === "full";
  const alerts = CHANNEL_ALERTS[activeChannel];

  if (isFull) {
    return (
      <div className="px-3 py-2 bg-white border-t border-surface-border flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          Nhanh:
        </span>
        {alerts.map((qa, idx) => (
          <button
            key={idx}
            onClick={() => onSendAlert(qa.text, activeChannel)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 transition-transform active:scale-95 flex items-center gap-1 whitespace-nowrap ${qa.color}`}
          >
            <Icon name={qa.icon as any} className="w-3 h-3" />
            <span>{qa.text}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 bg-surface-canvas border-t border-surface-border flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
      {alerts.map((qa, idx) => (
        <button
          key={idx}
          onClick={() => onSendAlert(qa.text, activeChannel)}
          className={`px-2 py-1 rounded-md border text-[10px] font-bold shrink-0 flex items-center gap-1 whitespace-nowrap ${qa.color}`}
        >
          <Icon name={qa.icon as any} className="w-3 h-3" />
          <span>{qa.text}</span>
        </button>
      ))}
    </div>
  );
};
