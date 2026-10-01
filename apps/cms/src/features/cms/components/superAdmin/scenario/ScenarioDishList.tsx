import React from "react";
import { Icon, Button, SearchableSelect } from "@/components/ui";
import { FnbDishItem, FnbMajorCategory, FNB_MAJOR_CONFIG } from "@a2order/shared";
import {
  Search,
  X,
  Flame,
  Layers,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  TrendingUp,
  Edit3,
  Trash2,
  Plus,
  LayoutGrid,
  List,
  Utensils,
  Coffee,
  Cake,
} from "lucide-react";

export type QuickFilterType = "ALL" | "BEST_SELLER" | "HAS_VARIANTS" | "HAS_CUSTOMIZATIONS";
export type SortByType = "DEFAULT" | "PRICE_ASC" | "PRICE_DESC" | "MARGIN_DESC" | "NAME_ASC";

const sortOptions = [
  { value: "DEFAULT", label: "Mặc định" },
  { value: "PRICE_ASC", label: "Giá: Thấp → Cao" },
  { value: "PRICE_DESC", label: "Giá: Cao → Thấp" },
  { value: "MARGIN_DESC", label: "Lợi nhuận cao" },
  { value: "NAME_ASC", label: "Tên: A → Z" },
];

interface Props {
  activeMajor: FnbMajorCategory;
  selectedCategory: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: "GRID" | "LIST";
  setViewMode: (v: "GRID" | "LIST") => void;
  filteredDishes: FnbDishItem[];
  allPillarDishes?: FnbDishItem[];
  quickFilter: QuickFilterType;
  setQuickFilter: (f: QuickFilterType) => void;
  sortBy: SortByType;
  setSortBy: (s: SortByType) => void;
  currentPage: number;
  handleEditDish: (dish: FnbDishItem) => void;
  handleDeleteDish: (dish: FnbDishItem) => void;
  handleOpenAddDish: () => void;
}

// Hàm tính toán lợi nhuận gộp và tỷ suất lợi nhuận (Margin %)
const getProfitInfo = (price: number, costPrice?: number) => {
  if (!costPrice || costPrice <= 0 || costPrice >= price) return null;
  const profit = price - costPrice;
  const marginPercent = Math.round((profit / price) * 100);
  return { profit, marginPercent };
};

// Hàm lấy thông tin trạm chế biến
const getStationInfo = (station?: "KITCHEN" | "BAR" | "DESSERT") => {
  switch (station) {
    case "BAR":
      return { label: "Quầy Bar", dotColor: "bg-amber-400" };
    case "DESSERT":
      return { label: "Quầy Bánh & Tráng Miệng", dotColor: "bg-purple-400" };
    case "KITCHEN":
    default:
      return { label: "Bếp Nóng", dotColor: "bg-emerald-400" };
  }
};

export const ScenarioDishList: React.FC<Props> = ({
  activeMajor,
  selectedCategory,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  filteredDishes,
  allPillarDishes = [],
  quickFilter,
  setQuickFilter,
  sortBy,
  setSortBy,
  currentPage,
  handleEditDish,
  handleDeleteDish,
  handleOpenAddDish,
}) => {
  const PAGE_SIZE = 9;
  const majorConfig = FNB_MAJOR_CONFIG[activeMajor];

  // Cắt trang cho dữ liệu hiển thị
  const paginatedDishes = filteredDishes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Đếm số lượng cho các Quick Filters dựa trên danh sách món của trụ cột/danh mục đang chọn
  const baseDishesForFilterCounts = React.useMemo(() => {
    if (allPillarDishes.length === 0) return filteredDishes;
    if (selectedCategory === "ALL") return allPillarDishes;
    return allPillarDishes.filter((d) => d.category === selectedCategory);
  }, [allPillarDishes, filteredDishes, selectedCategory]);

  const filterCounts = React.useMemo(() => {
    const total = baseDishesForFilterCounts.length;
    const bestSeller = baseDishesForFilterCounts.filter((d) => d.isBestSeller).length;
    const hasVariants = baseDishesForFilterCounts.filter(
      (d) => d.variants && d.variants.length > 1
    ).length;
    const hasCustomizations = baseDishesForFilterCounts.filter(
      (d) => d.customizationGroups && d.customizationGroups.length > 0
    ).length;
    return { total, bestSeller, hasVariants, hasCustomizations };
  }, [baseDishesForFilterCounts]);

  const majorIconNode =
    activeMajor === "FOOD" ? (
      <Utensils className="w-4 h-4 text-brand-800" />
    ) : activeMajor === "DRINK" ? (
      <Coffee className="w-4 h-4 text-brand-800" />
    ) : (
      <Cake className="w-4 h-4 text-brand-800" />
    );

  return (
    <div className="flex-1 bg-white rounded-3xl border border-surface-border shadow-sm flex flex-col min-h-[600px] overflow-hidden">
      {/* 1. HEADER CHÍNH: ĐỒNG BỘ CHIỀU CAO H-9 TUYỆT ĐỐI, Ô SEARCH RỘNG RÃI */}
      <div className="p-3 sm:p-4 border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 bg-gradient-to-r from-surface-canvas/40 via-white to-surface-canvas/20">
        {/* Tầng 1: Tiêu đề danh mục + Nút Thêm Món tinh gọn trên mobile */}
        <div className="flex items-center justify-between gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-200/80">
              {majorIconNode}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-ink-primary tracking-tight whitespace-nowrap">
                  {selectedCategory === "ALL" ? "Tất Cả Món" : selectedCategory}
                </h3>
                <span className="px-2 py-0.2 rounded-full bg-brand-100 text-brand-900 text-[10px] font-bold border border-brand-200/60 whitespace-nowrap shrink-0">
                  {filteredDishes.length} món
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1.5 truncate">
                <span>Trụ cột: <strong className="text-ink-secondary">{majorConfig.label}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{selectedCategory === "ALL" ? "Toàn bộ nhóm món" : "Đang lọc danh mục"}</span>
              </p>
            </div>
          </div>

          {/* Nút Thêm Món trên Mobile: Icon-only + button tròn/bo góc gọn gàng theo yêu cầu người dùng */}
          <button
            type="button"
            onClick={handleOpenAddDish}
            className="md:hidden w-8 h-8 rounded-xl bg-brand-800 hover:bg-brand-900 text-white flex items-center justify-center shadow-2xs transition active:scale-98 shrink-0"
            title="Thêm món mới"
            aria-label="Thêm món mới"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tầng 2 trên Mobile / Cụm công cụ bên phải trên Desktop: Đồng bộ chuẩn h-9 (36px) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Ô tìm kiếm: w-full trên mobile để rộng rãi, w-52 md:w-60 trên desktop */}
          <div className="relative w-full md:w-56 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên món..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-7 rounded-xl border border-surface-border bg-white text-xs font-semibold text-ink-primary placeholder:text-ink-subtle focus:border-brand-800 focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary p-0.5"
                title="Xóa tìm kiếm"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Cụm Sắp xếp & Chuyển Chế Độ Xem: Chiều cao h-9 tuyệt đối bằng nhau */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Bộ chọn Sắp xếp bằng SearchableSelect (h-9) */}
            <div className="flex-1 sm:w-44 shrink-0">
              <SearchableSelect
                options={sortOptions}
                value={sortBy}
                onChange={(val) => setSortBy(val as SortByType)}
                labelPrefix="Sắp xếp:"
                showSearch={false}
                align="right"
              />
            </div>

            {/* Toggle Grid / List: Chiều cao chuẩn h-9 (36px), khớp tuyệt đối với input và select */}
            <div className="h-9 px-1 rounded-xl border border-surface-border bg-surface-canvas shadow-2xs flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`h-7 w-7 rounded-lg transition-all flex items-center justify-center ${
                  viewMode === "GRID"
                    ? "bg-white text-brand-900 shadow-2xs font-bold"
                    : "text-ink-subtle hover:text-ink-primary"
                }`}
                title="Chế độ Thẻ Lưới"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`h-7 w-7 rounded-lg transition-all flex items-center justify-center ${
                  viewMode === "LIST"
                    ? "bg-white text-brand-900 shadow-2xs font-bold"
                    : "text-ink-subtle hover:text-ink-primary"
                }`}
                title="Chế độ Danh Sách Chi Tiết"
              >
                <List size={14} />
              </button>
            </div>

            {/* Nút Thêm Món Mới trên Desktop: h-9 bg-brand-800 chuẩn mực */}
            <button
              type="button"
              onClick={handleOpenAddDish}
              className="hidden md:inline-flex h-9 px-3.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold items-center gap-1.5 shadow-sm shadow-brand-950/10 transition active:scale-98 shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Thêm Món Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THANH QUICK-FILTERS: RESPONSIVE HAI CHẾ ĐỘ (KHÔNG BỊ TRÀN NGANG) */}
      {/* Trên Mobile (< sm): Dùng SearchableSelect gọn gàng, loại bỏ hoàn toàn thanh trượt bị cắt chữ */}
      <div className="sm:hidden px-3 py-2 bg-surface-canvas/40 border-b border-surface-border">
        <SearchableSelect
          options={[
            {
              value: "ALL",
              label: "Tất cả món",
              badge: filterCounts.total,
            },
            {
              value: "BEST_SELLER",
              label: "Món bán chạy",
              icon: Flame,
              badge: filterCounts.bestSeller,
            },
            {
              value: "HAS_VARIANTS",
              label: "Có nhiều Size",
              icon: Layers,
              badge: filterCounts.hasVariants,
            },
            {
              value: "HAS_CUSTOMIZATIONS",
              label: "Có tùy chọn Topping",
              icon: SlidersHorizontal,
              badge: filterCounts.hasCustomizations,
            },
          ]}
          value={quickFilter}
          onChange={(val) => setQuickFilter(val as QuickFilterType)}
          labelPrefix="Bộ lọc:"
          showSearch={false}
          placeholder="Chọn bộ lọc..."
        />
      </div>

      {/* Trên Máy Tính (sm:): Dàn hàng ngang các chip lọc trực quan */}
      <div className="hidden sm:flex px-4 py-2 bg-surface-canvas/40 border-b border-surface-border items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[10px] font-black text-ink-muted uppercase tracking-wider shrink-0 mr-1">
          Lọc nhanh:
        </span>

        <button
          type="button"
          onClick={() => setQuickFilter("ALL")}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1 ${
            quickFilter === "ALL"
              ? "bg-brand-900 text-white shadow-2xs"
              : "bg-white text-ink-secondary hover:bg-surface-canvas border border-surface-border/80"
          }`}
        >
          <span>Tất cả</span>
          <span className="text-[10px] opacity-80">({filterCounts.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter("BEST_SELLER")}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            quickFilter === "BEST_SELLER"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-white text-ink-secondary hover:bg-amber-50/50 hover:text-amber-700 border border-surface-border/80"
          }`}
        >
          <Flame size={12} className={quickFilter === "BEST_SELLER" ? "fill-white" : "text-amber-500 fill-amber-500"} />
          <span>Bán chạy</span>
          <span className="text-[10px] opacity-80">({filterCounts.bestSeller})</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter("HAS_VARIANTS")}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            quickFilter === "HAS_VARIANTS"
              ? "bg-brand-900 text-white shadow-2xs"
              : "bg-white text-ink-secondary hover:bg-surface-canvas border border-surface-border/80"
          }`}
        >
          <Layers size={12} />
          <span>Có nhiều Size</span>
          <span className="text-[10px] opacity-80">({filterCounts.hasVariants})</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter("HAS_CUSTOMIZATIONS")}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            quickFilter === "HAS_CUSTOMIZATIONS"
              ? "bg-emerald-700 text-white shadow-2xs"
              : "bg-white text-ink-secondary hover:bg-emerald-50/50 hover:text-emerald-700 border border-surface-border/80"
          }`}
        >
          <SlidersHorizontal size={12} />
          <span>Có Tùy chọn Topping</span>
          <span className="text-[10px] opacity-80">({filterCounts.hasCustomizations})</span>
        </button>
      </div>

      {/* 3. NỘI DUNG MÓN ĂN (GRID HOẶC LIST) */}
      <div className="flex-1 p-3.5 sm:p-4 bg-surface-canvas/20">
        {filteredDishes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-muted py-14 px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center mb-3 shadow-2xs">
              <Search className="w-6 h-6 text-ink-subtle" />
            </div>
            <h4 className="text-sm font-bold text-ink-primary mb-1">
              Không tìm thấy món mẫu phù hợp
            </h4>
            <p className="text-xs text-ink-muted text-center max-w-sm mb-4 leading-relaxed">
              Hãy thử đổi từ khóa tìm kiếm, đặt lại bộ lọc hoặc thêm món mới vào thực đơn mẫu.
            </p>
            <div className="flex items-center gap-2">
              {(searchQuery || quickFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setQuickFilter("ALL");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-surface-border text-ink-secondary text-xs font-bold hover:bg-surface-canvas transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
              <Button
                size="sm"
                className="rounded-xl gap-1.5 bg-brand-900 text-white font-bold px-3 h-8 text-xs"
                onClick={handleOpenAddDish}
              >
                <Plus size={14} />
                <span>Thêm Món Ngay</span>
              </Button>
            </div>
          </div>
        ) : viewMode === "GRID" ? (
          /* ==================================================== */
          /* CHẾ ĐỘ THẺ LƯỚI ẨM THỰC (GRID HERO CARDS)             */
          /* ==================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedDishes.map((dish) => {
              const profitInfo = getProfitInfo(dish.price, dish.costPrice);
              const station = getStationInfo(dish.station);

              return (
                <div
                  key={dish.id}
                  className="group relative bg-white rounded-2xl border border-surface-border hover:border-brand-400 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Hero Media Container */}
                  <div className="relative w-full h-40 sm:h-44 overflow-hidden bg-surface-canvas">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-muted to-brand-50 text-brand-800">
                        {activeMajor === "FOOD" ? (
                          <Utensils size={32} className="opacity-40" />
                        ) : activeMajor === "DRINK" ? (
                          <Coffee size={32} className="opacity-40" />
                        ) : (
                          <Cake size={32} className="opacity-40" />
                        )}
                        <span className="text-[10px] font-bold text-ink-muted mt-1.5">Chưa có ảnh</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Badges nổi trên ảnh */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      {dish.isBestSeller ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] tracking-wide shadow-md flex items-center gap-1">
                          <Flame size={11} className="fill-current animate-pulse" />
                          <span>BÁN CHẠY</span>
                        </span>
                      ) : (
                        <div />
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold border border-white/20 shadow-md">
                        {dish.category}
                      </span>
                    </div>

                    {/* Station Tag ở chân ảnh */}
                    <div className="absolute bottom-2 left-2.5 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-white/95 text-[9px] font-semibold border border-white/10">
                        <span className={`w-1.5 h-1.5 rounded-full ${station.dotColor}`}></span>
                        <span>{station.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Thân thẻ */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-sm text-ink-primary group-hover:text-brand-900 transition-colors line-clamp-1 sm:line-clamp-2 leading-snug mb-1">
                      {dish.name}
                    </h4>
                    <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2 mb-2.5 min-h-[32px]">
                      {dish.description || "Chưa có mô tả chi tiết cho món mẫu này."}
                    </p>

                    {/* Tags biến thể & tùy chọn gọn gàng */}
                    <div className="flex items-center gap-1.5 mb-3 text-[10px]">
                      {dish.variants && dish.variants.length > 1 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-canvas border border-surface-border font-bold text-ink-secondary whitespace-nowrap">
                          <Layers size={10} className="text-ink-subtle" />
                          <span>{dish.variants.length} Size</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-ink-muted whitespace-nowrap">
                          <span>1 cỡ chuẩn</span>
                        </span>
                      )}

                      {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 font-bold text-emerald-800 whitespace-nowrap">
                          <SlidersHorizontal size={10} className="text-emerald-600" />
                          <span>{dish.customizationGroups.length} Tùy chọn</span>
                        </span>
                      )}
                    </div>

                    {/* Chân thẻ: Giá & Nút hành động */}
                    <div className="pt-2.5 border-t border-surface-border flex items-center justify-between gap-2 mt-auto">
                      <div>
                        <div className="text-sm sm:text-base font-black text-brand-950 tracking-tight leading-none whitespace-nowrap">
                          {dish.price.toLocaleString("vi-VN")} ₫
                        </div>
                        {profitInfo ? (
                          <div className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded mt-1 inline-flex items-center gap-0.5 whitespace-nowrap">
                            <TrendingUp size={9} className="text-emerald-600" />
                            <span>+{profitInfo.marginPercent}% lãi ({profitInfo.profit.toLocaleString("vi-VN")}₫)</span>
                          </div>
                        ) : dish.costPrice && dish.costPrice > 0 ? (
                          <div className="text-[9px] text-ink-muted mt-1 whitespace-nowrap">
                            Vốn: {dish.costPrice.toLocaleString("vi-VN")} ₫
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditDish(dish)}
                          className="p-1.5 rounded-lg bg-surface-canvas hover:bg-brand-50 text-ink-secondary hover:text-brand-900 border border-surface-border hover:border-brand-300 transition-all shadow-2xs"
                          title="Chỉnh sửa món"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish)}
                          className="p-1.5 rounded-lg bg-surface-canvas hover:bg-rose-50 text-ink-muted hover:text-rose-600 border border-surface-border hover:border-rose-200 transition-all shadow-2xs"
                          title="Xóa món"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================================================== */
          /* CHẾ ĐỘ DANH SÁCH CHI TIẾT (CHUẨN GỌN GÀNG, KHÔNG TRÀN) */
          /* ==================================================== */
          <div className="space-y-2.5">
            {paginatedDishes.map((dish) => {
              const profitInfo = getProfitInfo(dish.price, dish.costPrice);
              const station = getStationInfo(dish.station);

              return (
                <div
                  key={dish.id}
                  className="group relative bg-white rounded-2xl border border-surface-border hover:border-brand-400 hover:shadow-md transition-all duration-200 p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center gap-2.5 sm:gap-4"
                >
                  {/* Cụm thông tin chính: Đặt ảnh và nội dung cạnh nhau (flex-row), không bị rớt dòng đơn độc */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Ảnh đại diện với huy hiệu Hot */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-surface-canvas border border-surface-border/80 shadow-2xs">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-muted to-brand-50 text-brand-800">
                          {activeMajor === "FOOD" ? (
                            <Utensils size={20} className="opacity-40" />
                          ) : activeMajor === "DRINK" ? (
                            <Coffee size={20} className="opacity-40" />
                          ) : (
                            <Cake size={20} className="opacity-40" />
                          )}
                        </div>
                      )}

                      {dish.isBestSeller && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-500 text-white text-[8.5px] font-black flex items-center gap-0.5 shadow-xs">
                          <Flame size={9} className="fill-current" />
                          <span>Hot</span>
                        </span>
                      )}
                    </div>

                    {/* Thông tin mô tả & chi tiết */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      {/* Tag danh mục tách riêng lên trên giúp Tên Món hưởng trọn 100% bề ngang */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-brand-50 text-brand-900 border border-brand-200/60 text-[10px] font-bold whitespace-nowrap">
                          <Tag size={9} className="text-brand-700" />
                          <span>{dish.category}</span>
                        </span>
                      </div>

                      {/* Tên món: Tối đa 2 dòng mượt mà, không bao giờ bị cắt xén cụt chữ */}
                      <h4 className="font-bold text-sm sm:text-base text-ink-primary group-hover:text-brand-900 transition-colors line-clamp-2 leading-snug mb-1">
                        {dish.name}
                      </h4>

                      {/* Dòng 2: Mô tả món ăn (ẩn trên mobile rất nhỏ để giữ độ cao cân đối) */}
                      {dish.description && (
                        <p className="hidden sm:block text-xs text-ink-muted truncate mb-1.5">
                          {dish.description}
                        </p>
                      )}

                      {/* Dòng 3: Chip thông số ngắn gọn */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px]">
                        {dish.variants && dish.variants.length > 1 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-canvas border border-surface-border font-bold text-ink-secondary whitespace-nowrap">
                            <Layers size={10} className="text-ink-subtle" />
                            <span>{dish.variants.length} Size</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-ink-muted whitespace-nowrap">
                            <Layers size={10} className="text-ink-subtle" />
                            <span>1 cỡ</span>
                          </span>
                        )}

                        {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 font-bold text-emerald-800 whitespace-nowrap">
                            <SlidersHorizontal size={10} className="text-emerald-600" />
                            <span>{dish.customizationGroups.length} nhóm tùy chọn</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-muted/60 text-ink-muted whitespace-nowrap">
                          <span className={`w-1.5 h-1.5 rounded-full ${station.dotColor}`}></span>
                          <span>{station.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột giá bán, biên lợi nhuận & Thao tác */}
                  <div className="shrink-0 flex items-center justify-between md:justify-end gap-3 sm:gap-4 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-surface-border/70 md:pl-4">
                    <div className="text-left md:text-right">
                      <div className="text-sm sm:text-base font-black text-brand-950 tracking-tight leading-none whitespace-nowrap">
                        {dish.price.toLocaleString("vi-VN")} ₫
                      </div>
                      <div className="flex items-center md:justify-end gap-1.5 mt-1 text-[10px] text-ink-muted whitespace-nowrap">
                        {dish.costPrice && dish.costPrice > 0 ? (
                          <>
                            <span>Vốn: {dish.costPrice.toLocaleString("vi-VN")} ₫</span>
                            {profitInfo && (
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded">
                                +{profitInfo.marginPercent}% lãi
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-ink-subtle italic">Chưa nhập vốn</span>
                        )}
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditDish(dish)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-canvas hover:bg-brand-50 text-ink-secondary hover:text-brand-900 border border-surface-border hover:border-brand-300 font-bold text-xs transition-all shadow-2xs whitespace-nowrap"
                        title="Chỉnh sửa món"
                      >
                        <Edit3 size={13} />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDish(dish)}
                        className="p-1.5 rounded-lg bg-surface-canvas hover:bg-rose-50 text-ink-subtle hover:text-rose-600 border border-surface-border hover:border-rose-200 transition-all shadow-2xs"
                        title="Xóa món"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
