import React, { useMemo } from "react";
import { Icon } from "@/components/ui";
import { StaffOrderMenuSectionProps } from "@/types";

export const StaffOrderMenuSection: React.FC<StaffOrderMenuSectionProps> = ({
  activeTable,
  dishes,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  newOrderCart,
  onQuickAddDish,
  onOpenCustomize,
  mobileStep,
  setMobileStep,
}) => {
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchCategory =
        selectedCategory === "TẤT CẢ" || dish.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [dishes, selectedCategory, searchQuery]);

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      {/* Banner thông tin bàn hiện tại trên mobile */}
      <div className="lg:hidden flex items-center justify-between p-2.5 bg-brand-50 border border-brand-200/60 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileStep("TABLES")}
          className="flex items-center gap-1 text-xs font-black text-brand-900"
        >
          <Icon name="arrowRight" size={12} className="rotate-180" />
          <span>Đổi Bàn</span>
        </button>

        <div className="text-center">
          <span className="font-black text-sm text-brand-950 block leading-tight">
            {activeTable.tableName}
          </span>
          <span className="text-[10px] text-brand-700 font-semibold">
            {activeTable.zoneName} • {activeTable.status === "EMPTY" ? "Bàn Trống" : `Có ${activeTable.items.length} món`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileStep("CART")}
          className="text-xs font-black text-brand-900 bg-white px-2.5 py-1 rounded-xl border border-brand-200 shadow-2xs flex items-center gap-1"
        >
          <Icon name="cart" size={13} />
          <span>Phiếu ({activeTable.items.length + newOrderCart.length})</span>
        </button>
      </div>

      {/* Thanh tìm kiếm & lọc category */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh món ăn, nước uống..."
            className="w-full h-10 pl-9 pr-3 rounded-2xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 ${
                selectedCategory === c
                  ? "bg-brand-900 text-white"
                  : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách món ăn */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0 pr-1 ${
          mobileStep === "MENU" && (newOrderCart.length > 0 || activeTable.items.length > 0) ? "pb-16" : ""
        }`}
      >
        {filteredDishes.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-surface-canvas/50">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-2">
              <Icon name="coffee" className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-primary">Chưa có món ăn nào trong thực đơn</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Vui lòng thiết lập thực đơn tại mục Thực Đơn</p>
          </div>
        ) : (
          filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="p-3 rounded-2xl border border-surface-border bg-white hover:border-brand-300 hover:shadow-xs transition-all flex gap-3 group"
            >
              <img
                src={dish.image || "/logo-symbol.jpg"}
                alt={dish.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-ink-primary leading-snug">
                      {dish.name}
                    </h4>
                    {dish.isPopular && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black shrink-0">
                        HOT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-muted line-clamp-1 mt-0.5">
                    {dish.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-border/40">
                  <span className="text-xs font-black text-brand-950">
                    {dish.price.toLocaleString("vi-VN")} đ
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenCustomize(dish)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-ink-muted bg-surface-canvas hover:bg-surface-muted border border-surface-border"
                      title="Ghi chú khẩu vị"
                    >
                      Ghi chú
                    </button>

                    <button
                      type="button"
                      onClick={() => onQuickAddDish(dish)}
                      className="w-7 h-7 rounded-xl bg-brand-900 text-white flex items-center justify-center hover:bg-brand-950 shadow-xs active:scale-90 transition-transform"
                      title="Thêm nhanh"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
