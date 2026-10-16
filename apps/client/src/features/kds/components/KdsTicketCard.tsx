import React from "react";
import { OrderItemStatus } from "@a2order/shared";
import { Icon } from "@/components/ui";
import { KdsTicketCardProps } from "@/types";

export const KdsTicketCard: React.FC<KdsTicketCardProps> = ({
  ticket,
  onItemStatusToggle,
  onCompleteTicket,
}) => {
  const isLate = ticket.minutesAgo > 12;
  const isNearLimit = ticket.minutesAgo > 7;

  return (
    <article className={`min-w-0 rounded-3xl border-2 bg-surface-card flex flex-col overflow-hidden shadow-card ${isLate ? "border-rose-300" : isNearLimit ? "border-amber-300" : "border-surface-border"}`}>
      <div className="p-4 bg-brand-900 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-white truncate">{ticket.tableName}</h3>
          <span className="text-xs text-brand-200 font-semibold">Đợt #{ticket.batchNumber}</span>
        </div>
        <span className={`shrink-0 min-h-11 px-3 rounded-full flex items-center gap-1.5 font-black text-sm ${isLate ? "bg-rose-100 text-rose-800" : isNearLimit ? "bg-amber-100 text-amber-800" : "bg-brand-100 text-brand-900"}`}>
          <Icon name="clock" size={16} />
          {ticket.minutesAgo} phút
        </span>
      </div>

      <div className="p-3 space-y-2 flex-1">
        {ticket.items.map((item) => {
          const isDone = item.status === OrderItemStatus.DONE;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemStatusToggle(item.id)}
              disabled={isDone}
              className={`w-full min-h-[60px] p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-colors ${isDone ? "bg-brand-50 border-brand-200 text-brand-900" : "bg-surface-canvas border-surface-border text-ink-primary hover:border-brand-300 active:bg-brand-100"}`}
            >
              <span className="min-w-0">
                <span className="flex items-start gap-2">
                  <span className="font-black text-base text-brand-800 shrink-0">x{item.quantity}</span>
                  <span className="font-bold text-base leading-snug">{item.name}</span>
                </span>
                {item.notes && (
                  <span className="text-xs text-ink-muted font-semibold mt-1 ml-7 flex items-start gap-1">
                    <Icon name="alert" size={14} className="shrink-0" />
                    {item.notes}
                  </span>
                )}
              </span>
              {isDone && <Icon name="check" className="w-5 h-5 text-brand-800 shrink-0" size={20} />}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-surface-border">
        <button
          type="button"
          onClick={() => onCompleteTicket(ticket.id)}
          className="w-full min-h-[52px] rounded-2xl bg-brand-800 hover:bg-brand-900 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2"
        >
          <Icon name="check" className="w-5 h-5 text-white" size={20} />
          Hoàn tất vé
        </button>
      </div>
    </article>
  );
};
