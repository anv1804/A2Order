import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/components/ui";
import { MenuDishItem } from "@/data/mockMenu";

interface DishCardProps {
  dish: MenuDishItem;
  totalQuantityInCart: number;
  distinctCount: number;
  latestNote?: string;
  latestVariant?: string;
  onQuickAdd: (dish: MenuDishItem) => void;
  onQuickDecrease: (dish: MenuDishItem) => void;
  onOpenDetail: (dish: MenuDishItem) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  totalQuantityInCart,
  distinctCount,
  latestNote,
  latestVariant,
  onQuickAdd,
  onQuickDecrease,
  onOpenDetail,
}) => {
  const hasCustomizations = (dish.variants && dish.variants.length > 0) || (dish.optionGroups && dish.optionGroups.length > 0);
  const isInCart = totalQuantityInCart > 0;

  const handleCardClick = () => {
    // Nếu món có option/variant thì luôn mở bảng cấu hình option để nhân viên chọn rõ ràng
    if (hasCustomizations) {
      onOpenDetail(dish);
    } else {
      onQuickAdd(dish);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-2.5 ${
        isInCart
          ? "bg-brand-50/60 border-brand-800 shadow-md ring-1 ring-brand-800"
          : "bg-white border-surface-border hover:border-brand-300 hover:shadow-card"
      }`}
    >
      <div className="flex gap-3">
        {/* Hình món */}
        <div className="w-20 h-20 min-w-[80px] max-w-[80px] h-[80px] rounded-2xl overflow-hidden bg-surface-muted shrink-0 relative shadow-sm">
          {dish.image ? (
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover aspect-square"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-xs text-ink-muted">
              A2
            </div>
          )}
          {dish.isPopular && (
            <span className="absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-500 text-white shadow-sm">
              ★ HOT
            </span>
          )}
        </div>

        {/* Thông tin món */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h4 className="font-extrabold text-sm text-ink-primary line-clamp-1">{dish.name}</h4>
            </div>
            <span className="text-[11px] text-ink-subtle">{dish.categoryLabel}</span>

            {/* Chi tiết biến thể/ghi chú đang chọn */}
            {isInCart && (
              <div className="mt-1 flex flex-wrap gap-1">
                {distinctCount > 1 ? (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {distinctCount} loại tùy biến khác nhau
                  </span>
                ) : (
                  <>
                    {latestVariant && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-900">
                        {latestVariant}
                      </span>
                    )}
                    {latestNote && (
                      <span className="text-[10px] font-semibold text-amber-800 truncate max-w-[130px]">
                        📝 {latestNote}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="font-black text-sm text-brand-900">{formatCurrency(dish.price)}</span>
            {hasCustomizations && (
              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                Tuỳ chọn món
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Thanh Thao Tác Tăng Giảm & Tùy Chọn Rộng Rãi Dễ Bấm */}
      <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        {isInCart ? (
          <>
            {/* Nút chỉnh ghi chú / thêm biến thể mới */}
            <button
              type="button"
              onClick={() => onOpenDetail(dish)}
              className="flex-1 h-9 px-2 rounded-xl border border-surface-border bg-surface-canvas hover:bg-brand-50 text-ink-primary hover:text-brand-900 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95"
            >
              <Icon name="plus" className="w-3.5 h-3.5 text-brand-800" />
              <span>Thêm loại/ghi chú</span>
            </button>
            
            {/* Bộ tăng giảm to bản, nút bấm lớn */}
            <div className="flex items-center bg-brand-900 text-white rounded-xl shadow-sm overflow-hidden h-9 px-1">
              <button
                type="button"
                onClick={() => onQuickDecrease(dish)}
                className="w-8 h-8 flex items-center justify-center text-base font-black hover:bg-black/20 active:scale-90 transition-all rounded-lg"
                title="Giảm bớt"
              >
                -
              </button>
              <span className="px-3 text-sm font-black tracking-tight">{totalQuantityInCart}</span>
              <button
                type="button"
                onClick={() => onQuickAdd(dish)}
                className="w-8 h-8 flex items-center justify-center text-base font-black hover:bg-black/20 active:scale-90 transition-all rounded-lg"
                title="Tăng thêm"
              >
                +
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={handleCardClick}
            className="w-full h-9 rounded-xl bg-brand-50 hover:bg-brand-900 text-brand-900 hover:text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 border border-brand-200 hover:border-brand-900 shadow-2xs"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span>Thêm Món {hasCustomizations ? "• Chọn Option" : ""}</span>
          </button>
        )}
      </div>
    </div>
  );
};
