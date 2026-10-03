import React from "react";
import { Icon } from "@/components/ui";
import { CustomerMenuItem, CustomerCategory, CustomerCartItem } from "@/types";

interface CustomerMenuTabProps {
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  categories: CustomerCategory[];
  allDishesCount: number;
  filteredDishes: Array<CustomerMenuItem & { categoryName?: string }>;
  cart: CustomerCartItem[];
  onAddToCart: (dish: CustomerMenuItem) => void;
  onUpdateCartQty: (dishId: string, delta: number) => void;
}

export const CustomerMenuTab: React.FC<CustomerMenuTabProps> = ({
  searchQuery,
  onChangeSearchQuery,
  selectedCategory,
  onSelectCategory,
  categories,
  allDishesCount,
  filteredDishes,
  cart,
  onAddToCart,
  onUpdateCartQty,
}) => {
  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Tìm kiếm món */}
      <div className="relative">
        <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onChangeSearchQuery(e.target.value)}
          placeholder="Tìm món đồ uống, đồ ăn vặt..."
          className="w-full h-11 pl-11 pr-10 rounded-2xl border border-surface-border bg-white text-xs font-semibold text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 shadow-2xs transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onChangeSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-canvas"
          >
            <Icon name="x" size={13} />
          </button>
        )}
      </div>

      {/* Bộ lọc danh mục */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => onSelectCategory("ALL")}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === "ALL"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "bg-white text-ink-muted border border-surface-border hover:bg-surface-canvas"
          }`}
        >
          Tất Cả ({allDishesCount})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-brand-900 text-white shadow-xs font-black"
                : "bg-white text-ink-muted border border-surface-border hover:bg-surface-canvas"
            }`}
          >
            {cat.name} ({cat.menuItems.length})
          </button>
        ))}
      </div>

      {/* Danh sách món ăn */}
      <div className="space-y-3">
        {filteredDishes.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted font-bold bg-white rounded-3xl border border-surface-border shadow-2xs">
            Không tìm thấy món phù hợp
          </div>
        ) : (
          filteredDishes.map((dish) => {
            const cartItem = cart.find((c) => c.menuItem.id === dish.id);
            return (
              <div
                key={dish.id}
                className="p-3.5 bg-white rounded-3xl border border-surface-border shadow-2xs flex items-center justify-between gap-3 hover:border-brand-200 hover:shadow-xs transition"
              >
                <div className="w-20 h-20 rounded-2xl bg-surface-canvas overflow-hidden shrink-0 border border-surface-border shadow-2xs relative">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-brand-900/40 bg-brand-50/50">
                      <Icon name="coffee" size={24} />
                      <span className="text-[9px] font-black mt-1">A2Order</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-ink-primary truncate leading-snug">{dish.name}</h3>
                  <p className="text-[11px] text-ink-muted mt-0.5 truncate">{dish.categoryName}</p>
                  <p className="text-sm font-black text-brand-900 mt-1.5">
                    {dish.price.toLocaleString("vi-VN")} đ
                  </p>
                </div>

                {/* Nút Thêm / Tăng giảm số lượng */}
                <div className="shrink-0">
                  {cartItem ? (
                    <div className="flex items-center gap-2 bg-brand-50 p-1.5 rounded-2xl border border-brand-200">
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(dish.id, -1)}
                        className="w-7 h-7 rounded-xl bg-white text-brand-900 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-90 transition border border-brand-200"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-xs text-brand-950">
                        {cartItem.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(dish.id, 1)}
                        className="w-7 h-7 rounded-xl bg-brand-900 text-white flex items-center justify-center font-bold text-xs shadow-xs active:scale-90 transition"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddToCart(dish)}
                      className="px-3.5 py-2 rounded-2xl bg-brand-50 hover:bg-brand-900 text-brand-900 hover:text-white font-extrabold text-xs border border-brand-200 hover:border-brand-900 transition active:scale-95 shadow-2xs flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Thêm</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
