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
      className={`flex gap-3.5 transition-all hover:shadow-elevated ${!item.isAvailable ? "opacity-60 grayscale" : ""}`}
    >
      <div className="w-20 h-20 rounded-2xl bg-surface-muted flex-shrink-0 overflow-hidden relative">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-subtle font-black text-xs">
            A2
          </div>
        )}
        {!item.isAvailable && (
          <span className="absolute inset-0 bg-ink-primary/70 text-white text-[10px] font-bold flex items-center justify-center">
            HẾT MÓN
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <h4 className="font-extrabold text-sm text-ink-primary truncate">{item.name}</h4>
          <p className="text-brand-900 font-black text-sm mt-0.5">{formatCurrency(item.price)}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          {showAdminControls ? (
            <button
              onClick={() => onToggleStock?.(item.id, !item.isAvailable)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                item.isAvailable ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-brand-100 text-brand-900 hover:bg-brand-200"
              }`}
            >
              {item.isAvailable ? "Báo hết hàng" : "Mở bán lại"}
            </button>
          ) : (
            <Button
              size="sm"
              onClick={() => onAddToCart?.(item)}
              disabled={!item.isAvailable}
              className="gap-1 text-xs rounded-full h-8 px-3.5"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Thêm
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
};
