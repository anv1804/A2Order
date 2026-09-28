import React from "react";
import { OrderItemStatus } from "@a2order/shared";
import { Icon } from "@/components/ui";
import { KdsTicketCardProps } from "@/types";

export const KdsTicketCard: React.FC<KdsTicketCardProps> = ({
  ticket,
  onItemStatusToggle,
  onCompleteTicket,
}) => {
  const getSlaBg = (minutes: number) => {
    if (minutes > 12) return "bg-rose-900/60 border-rose-500 text-rose-200 animate-pulse";
    if (minutes > 7) return "bg-amber-900/60 border-amber-500 text-amber-200";
    return "bg-slate-800 border-slate-700 text-slate-200";
  };

  return (
    <div
      className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-xl transition-all ${getSlaBg(
        ticket.minutesAgo
      )}`}
    >
      <div className="p-3 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{ticket.tableName}</h3>
          <span className="text-[11px] text-slate-400 font-semibold">Đợt #{ticket.batchNumber}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-sm">
          <Icon name="clock" className="w-4 h-4 text-amber-400" size={16} />
          <span>{ticket.minutesAgo}'</span>
        </div>
      </div>

      <div className="p-3 space-y-2 flex-1">
        {ticket.items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemStatusToggle(item.id)}
            className={`p-2.5 rounded-xl border flex items-start justify-between cursor-pointer select-none transition-all ${
              item.status === OrderItemStatus.DONE
                ? "bg-emerald-950/40 border-emerald-600 line-through opacity-60 text-emerald-300"
                : "bg-slate-900/40 border-slate-700 text-white"
            }`}
          >
            <div>
              <span className="font-extrabold text-base mr-2 text-amber-400">
                x{item.quantity}
              </span>
              <span className="font-bold text-base">{item.name}</span>
              {item.notes && (
                <p className="text-xs text-rose-400 font-medium mt-0.5">⚠️ {item.notes}</p>
              )}
            </div>
            {item.status === OrderItemStatus.DONE && <Icon name="check" className="w-5 h-5 text-emerald-400" size={20} />}
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-900/80 border-t border-slate-700">
        <button
          onClick={() => onCompleteTicket(ticket.id)}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
        >
          <Icon name="check" className="w-5 h-5 text-white" size={20} />
          XONG VÉ NÀY
        </button>
      </div>
    </div>
  );
};
