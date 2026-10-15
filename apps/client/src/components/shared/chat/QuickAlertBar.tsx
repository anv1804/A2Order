import React from "react";
import { Icon } from "@/components/ui";
import { QuickAlertBarProps } from "@/types";
import { CHANNEL_ALERTS } from "@/data/chatConstants";

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
