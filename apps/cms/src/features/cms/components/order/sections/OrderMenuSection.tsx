import React from "react";
import { Icon } from "@/components/ui";
import { DishItem, WaiterTableOrder } from "@/types";

const DEFAULT_DISH_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80";

interface OrderMenuSectionProps {
  activeTable: WaiterTableOrder;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoriesWithCount: Array<{ name: string; count: number }>;
  filteredDishes: DishItem[];
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  dishSortOption: "ALL" | "POPULAR" | "PRICE_ASC" | "PRICE_DESC";
  onChangeDishSortOption: (sort: "ALL" | "POPULAR" | "PRICE_ASC" | "PRICE_DESC") => void;
  dishViewMode: "LIST" | "GRID";
  onChangeDishViewMode: (mode: "LIST" | "GRID") => void;
  mobileStep: string;
  onSetMobileStep: (step: "TABLES" | "MENU" | "CART") => void;
  newOrderCartCount: number;
  onQuickAddDish: (dish: DishItem) => void;
  onOpenCustomize: (dish: DishItem) => void;
}

export const OrderMenuSection: React.FC<OrderMenuSectionProps> = ({
  activeTable,
  selectedCategory,
  onSelectCategory,
  categoriesWithCount,
  filteredDishes,
  searchQuery,
  onChangeSearchQuery,
  dishSortOption,
  onChangeDishSortOption,
  dishViewMode,
  onChangeDishViewMode,
  mobileStep,
  onSetMobileStep,
  newOrderCartCount,
  onQuickAddDish,
  onOpenCustomize,
}) => {
  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs space-y-2.5 flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      {/* Banner thông tin bàn hiện tại trên mobile */}
      <div className="lg:hidden flex items-center justify-between p-2.5 bg-brand-50 border border-brand-200/60 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => onSetMobileStep("TABLES")}
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
          onClick={() => onSetMobileStep("CART")}
          className="text-xs font-black text-brand-900 bg-white px-2.5 py-1 rounded-xl border border-brand-200 shadow-2xs flex items-center gap-1"
        >
          <Icon name="cart" size={13} />
          <span>Phiếu ({activeTable.items.length + newOrderCartCount})</span>
        </button>
      </div>

      {/* HEADER CỘT 2: TIÊU ĐỀ THỰC ĐƠN & TOGGLE XEM DANH SÁCH / LƯỚI */}
      <div className="flex items-center justify-between gap-2 shrink-0 pb-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm sm:text-base font-black text-ink-primary truncate">
            {selectedCategory === "TẤT CẢ" ? "Thực Đơn Gọi Món" : selectedCategory}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-canvas text-ink-muted border border-surface-border shrink-0">
            {filteredDishes.length} món
          </span>
        </div>

        {/* Chuyển đổi hiển thị Danh sách / Lưới */}
        <div className="flex items-center p-0.5 bg-surface-canvas rounded-xl border border-surface-border shrink-0">
          <button
            type="button"
            onClick={() => onChangeDishViewMode("LIST")}
            className={`p-1.5 rounded-lg transition-all ${
              dishViewMode === "LIST"
                ? "bg-white text-brand-900 shadow-2xs font-black"
                : "text-ink-muted hover:text-ink-primary"
            }`}
            title="Dạng danh sách (Xem tên đầy đủ, gọi món nhanh)"
          >
            <Icon name="list" size={14} />
          </button>
          <button
            type="button"
            onClick={() => onChangeDishViewMode("GRID")}
            className={`p-1.5 rounded-lg transition-all ${
              dishViewMode === "GRID"
                ? "bg-white text-brand-900 shadow-2xs font-black"
                : "text-ink-muted hover:text-ink-primary"
            }`}
            title="Dạng lưới thẻ ảnh"
          >
            <Icon name="grid" size={14} />
          </button>
        </div>
      </div>

      {/* THANH TÌM KIẾM TO RÕ & BỘ LỌC ĐƯỢC THIẾT KẾ GỌN GÀNG THEO CHUẨN DONEZO */}
      <div className="space-y-2 shrink-0">
        {/* DÒNG 1: Ô TÌM KIẾM TO RÕ KẾT HỢP SẮP XẾP MÓN TRÊN CÙNG HÀNG */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Tìm món ăn, đồ uống..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-surface-border text-xs sm:text-sm font-medium focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 bg-surface-canvas transition placeholder:text-ink-muted shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearchQuery("")}
                className="w-5 h-5 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-muted hover:text-ink-primary transition absolute right-2.5 top-2.5"
                title="Xóa tìm kiếm"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          <div className="w-32 sm:w-36 shrink-0">
            <select
              value={dishSortOption}
              onChange={(e) => onChangeDishSortOption(e.target.value as any)}
              className="w-full h-10 px-2.5 rounded-xl border border-surface-border text-xs font-bold bg-surface-canvas text-ink-primary hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-800/10 cursor-pointer shadow-2xs transition"
            >
              <option value="ALL">Tất cả món</option>
              <option value="POPULAR">Bán chạy nhất</option>
              <option value="PRICE_ASC">Giá tăng dần</option>
              <option value="PRICE_DESC">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* DÒNG 2: THANH CUỘN DANH MỤC DẠNG PILL (CHUẨN DONEZO FOREST GREEN) */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar py-0.5">
          {categoriesWithCount.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onSelectCategory(c.name)}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 text-xs font-bold ${
                selectedCategory === c.name
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary hover:bg-surface-muted"
              }`}
            >
              {c.name === "TẤT CẢ" ? `Tất cả (${c.count})` : `${c.name} (${c.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH MÓN ĂN - CHỐNG TRÀN NGANG, HIỂN THỊ TRỌN VẸN TÊN MÓN VÀ GIÁ */}
      <div className={`overflow-y-auto overflow-x-hidden flex-1 min-h-0 pr-1 ${
        mobileStep === "MENU" && (newOrderCartCount > 0 || activeTable.items.length > 0) ? "pb-16" : ""
      }`}>
        {filteredDishes.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-surface-canvas/50">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-2">
              <Icon name="coffee" className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-primary">
              {searchQuery ? `Không tìm thấy món khớp với "${searchQuery}"` : "Chưa có món ăn nào trong thực đơn"}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearchQuery("")}
                className="mt-2 text-xs font-bold text-brand-900 underline"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : dishViewMode === "LIST" ? (
          /* DẠNG DANH SÁCH: 1 CỘT RỘNG RÃI - TÊN MÓN HIỂN THỊ ĐẦY ĐỦ 100%, BẤM NHANH */
          <div className="space-y-2">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => onQuickAddDish(dish)}
                className="p-2.5 sm:p-3 rounded-2xl border border-surface-border bg-white hover:border-brand-600/50 hover:shadow-xs transition-all flex items-center gap-3 group relative cursor-pointer select-none"
              >
                {/* Ảnh món với fallback */}
                <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-surface-canvas shrink-0 border border-surface-border/80">
                  <img
                    src={dish.image || DEFAULT_DISH_IMAGE}
                    alt={dish.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = DEFAULT_DISH_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {dish.isPopular && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[8.5px] font-black shadow-xs tracking-wider">
                      HOT
                    </span>
                  )}
                </div>

                {/* Thông tin món & Giá */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-xs sm:text-sm font-bold text-ink-primary leading-snug line-clamp-2" title={dish.name}>
                    {dish.name}
                  </h4>
                  <p className="text-[10.5px] text-ink-muted line-clamp-1 mt-0.5" title={dish.description || dish.category}>
                    {dish.description || dish.category}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-brand-900">
                      {dish.price.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                {/* Nút thao tác: Ghi chú & Thêm nhanh */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onOpenCustomize(dish)}
                    className="px-2 py-1.5 rounded-xl text-[11px] font-bold text-ink-muted bg-surface-canvas hover:bg-surface-muted hover:text-ink-primary border border-surface-border transition flex items-center gap-1"
                    title="Ghi chú khẩu vị"
                  >
                    <Icon name="edit" size={11} />
                    <span className="hidden sm:inline">Ghi chú</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onQuickAddDish(dish)}
                    className="h-8 px-2.5 sm:px-3 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-black flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
                    title="Thêm món vào bàn"
                  >
                    <Icon name="plus" size={13} />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* DẠNG LƯỚI THẺ ẢNH: THẺ DỌC CHUẨN POS - ẢNH TRÊN, TÊN & GIÁ DƯỚI, KHÔNG TRÀN CHỮ */
          <div className="grid grid-cols-2 gap-2.5">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => onQuickAddDish(dish)}
                className="p-2.5 rounded-2xl border border-surface-border bg-white hover:border-brand-600/50 hover:shadow-xs transition-all flex flex-col justify-between group relative cursor-pointer select-none"
              >
                {/* Ảnh món ở trên full width của thẻ */}
                <div className="relative w-full h-24 rounded-xl overflow-hidden bg-surface-canvas shrink-0 border border-surface-border/80 mb-2">
                  <img
                    src={dish.image || DEFAULT_DISH_IMAGE}
                    alt={dish.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = DEFAULT_DISH_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {dish.isPopular && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[8.5px] font-black shadow-xs tracking-wider">
                      HOT
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAddDish(dish);
                    }}
                    className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-xl bg-brand-900 hover:bg-brand-800 text-white flex items-center justify-center shadow-xs active:scale-90 transition"
                    title="Thêm nhanh"
                  >
                    <Icon name="plus" size={13} />
                  </button>
                </div>

                {/* Tên món: 2 dòng hiển thị trọn vẹn */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-ink-primary leading-snug line-clamp-2" title={dish.name}>
                    {dish.name}
                  </h4>
                  <p className="text-[10px] text-ink-muted line-clamp-1 mt-0.5" title={dish.description || dish.category}>
                    {dish.description || dish.category}
                  </p>
                </div>

                {/* Hàng giá tiền & nút ghi chú ở dưới */}
                <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-surface-border/50" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-black text-brand-900 whitespace-nowrap">
                    {dish.price.toLocaleString("vi-VN")} đ
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenCustomize(dish)}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-ink-muted bg-surface-canvas hover:bg-surface-muted hover:text-ink-primary border border-surface-border transition flex items-center gap-0.5"
                    title="Ghi chú khẩu vị"
                  >
                    <Icon name="edit" size={10} />
                    <span>Ghi chú</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
