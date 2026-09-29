import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Panel, Button, Icon } from "@/components/ui";
import { MenuItemCardProps } from "@/types";

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  onToggleStock,
  showAdminControls = false,
}) => {
  return (
    <Panel
      padding="sm"
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-card bg-white ${
        !item.isAvailable ? "border-surface-border/80 bg-surface-canvas/40" : "border-surface-border"
      }`}
    >
      {/* Food Image */}
      <div className="w-20 h-20 min-w-[80px] max-w-[80px] h-[80px] min-h-[80px] max-h-[80px] rounded-xl bg-surface-muted flex-shrink-0 overflow-hidden relative shadow-sm">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
              !item.isAvailable ? "grayscale contrast-75" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-subtle font-black text-xs">
            A2
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-ink-primary/65 backdrop-blur-[1px] text-white text-[10px] font-black flex items-center justify-center tracking-wider">
            HẾT MÓN
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <h4 className={`font-extrabold text-xs sm:text-sm truncate ${!item.isAvailable ? "text-ink-muted line-through" : "text-ink-primary"}`}>
            {item.name}
          </h4>
          <p className="text-brand-900 font-black text-xs sm:text-sm mt-0.5 whitespace-nowrap">{formatCurrency(item.price)}</p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-border/50">
          {showAdminControls ? (
            <div className="flex flex-wrap items-center justify-between w-full gap-1.5">
              <span className={`text-[11px] font-bold ${item.isAvailable ? "text-emerald-700" : "text-rose-600"}`}>
                {item.isAvailable ? "● Đang bán" : "○ Đã hết"}
              </span>

              <button
                onClick={() => onToggleStock?.(item.id, !item.isAvailable)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all shadow-sm flex items-center gap-1 shrink-0 ${
                  item.isAvailable
                    ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    : "bg-brand-900 text-white hover:bg-brand-950"
                }`}
              >
                {item.isAvailable ? "Hết Món" : "Mở Lại"}
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onAddToCart?.(item)}
              disabled={!item.isAvailable}
              className="gap-1 text-xs rounded-full h-7 px-3 bg-brand-900 text-white font-bold"
            >
              <Icon name="plus" className="w-3.5 h-3.5" size={13} />
              Thêm
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
};
