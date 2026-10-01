import React from "react";
import { FnbMajorCategory, FNB_MAJOR_CONFIG, FnbCategoryTemplate } from "@a2order/shared";
import {
  Plus,
  Trash2,
  Utensils,
  UtensilsCrossed,
  Soup,
  Flame,
  Salad,
  Sandwich,
  Coffee,
  CupSoda,
  Beer,
  Cake,
  IceCream,
  Cookie,
  LayoutGrid,
  Citrus,
  Milk,
  Pizza,
  GlassWater,
  LucideIcon,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface Props {
  activeMajor: FnbMajorCategory;
  handleSwitchMajor: (major: FnbMajorCategory) => void;
  countsByMajor: Record<FnbMajorCategory, number>;
  activeCategories: FnbCategoryTemplate[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  handleOpenAddCategory: (major: FnbMajorCategory) => void;
  handleDeleteCategory: (cat: FnbCategoryTemplate) => void;
  categoryDishCount?: Record<string, number>;
}

// Bảng map icon Lucide đồng bộ cho từng loại danh mục ẩm thực (100% SVG đồng bộ, không dùng emoji)
const getCategoryIcon = (category: FnbCategoryTemplate): LucideIcon => {
  const name = category.name.toLowerCase();

  // Đồ Ăn (Food)
  if (name.includes("cơm") || name.includes("kho") || name.includes("mặn") || name.includes("thịt")) return UtensilsCrossed;
  if (name.includes("bún") || name.includes("phở") || name.includes("mì") || name.includes("nước") || name.includes("hủ tiếu") || name.includes("canh")) return Soup;
  if (name.includes("lẩu") || name.includes("nướng") || name.includes("bbq")) return Flame;
  if (name.includes("ăn vặt") || name.includes("chiên") || name.includes("rán") || name.includes("gà")) return Pizza;
  if (name.includes("khai vị") || name.includes("salad") || name.includes("gỏi")) return Salad;
  if (name.includes("bánh mì") || name.includes("fast") || name.includes("burger") || name.includes("sandwich")) return Sandwich;

  // Đồ Uống (Drink)
  if (name.includes("cà phê") || name.includes("cafe") || name.includes("cacao")) return Coffee;
  if (name.includes("trà sữa") || name.includes("macchiato")) return Milk;
  if (name.includes("trái cây") || name.includes("thanh nhiệt") || name.includes("trà")) return Citrus;
  if (name.includes("sinh tố") || name.includes("nước ép") || name.includes("ép")) return CupSoda;
  if (name.includes("bia") || name.includes("rượu") || name.includes("lon") || name.includes("ngọt")) return Beer;

  // Đồ Tráng Miệng (Dessert)
  if (name.includes("chè") || name.includes("tàu hũ") || name.includes("tofu")) return GlassWater;
  if (name.includes("bánh ngọt") || name.includes("pastry") || name.includes("bánh")) return Cake;
  if (name.includes("kem")) return IceCream;
  if (name.includes("sữa chua") || name.includes("pudding") || name.includes("flan")) return Cookie;

  // Fallback theo Trụ cột
  if (category.majorType === "FOOD") return Utensils;
  if (category.majorType === "DRINK") return CupSoda;
  return Cake;
};

export const ScenarioSidebar: React.FC<Props> = ({
  activeMajor,
  handleSwitchMajor,
  countsByMajor,
  activeCategories,
  selectedCategory,
  setSelectedCategory,
  handleOpenAddCategory,
  handleDeleteCategory,
  categoryDishCount = {},
}) => {
  const majorTabs: { key: FnbMajorCategory; label: string; icon: LucideIcon }[] = [
    { key: "FOOD", label: "Đồ Ăn", icon: Utensils },
    { key: "DRINK", label: "Đồ Uống", icon: Coffee },
    { key: "DESSERT", label: "Tráng Miệng", icon: Cake },
  ];

  return (
    <div className="w-full shrink-0 space-y-3 lg:space-y-4 lg:w-72 xl:w-80">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-surface-border shadow-sm p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
        
        {/* 1. KHUNG 3 TRỤ CỘT THỰC ĐƠN */}
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <label className="text-[10.5px] sm:text-[11px] font-black text-ink-primary uppercase tracking-wider">
              Trụ Cột Thực Đơn
            </label>
            <span className="text-[10px] font-bold text-ink-muted">
              {countsByMajor[activeMajor]} món
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 bg-surface-canvas rounded-xl sm:rounded-2xl border border-surface-border/70">
            {majorTabs.map(({ key, label, icon: TabIcon }) => {
              const isSelected = activeMajor === key;
              const count = countsByMajor[key] || 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSwitchMajor(key)}
                  className={`py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-lg sm:rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-brand-900 text-white shadow-md shadow-brand-950/20 font-bold"
                      : "text-ink-secondary hover:text-ink-primary hover:bg-white/80 font-medium"
                  }`}
                >
                  <div className={isSelected ? "text-white" : "text-ink-subtle"}>
                    <TabIcon size={14} />
                  </div>
                  <div className="flex items-center justify-center gap-1 leading-tight">
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold whitespace-nowrap">
                      {label}
                    </span>
                    <span
                      className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold leading-none ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. DANH MỤC THỰC ĐƠN: RESPONSIVE HAI CHẾ ĐỘ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <span className="text-[10.5px] sm:text-[11px] font-black text-ink-primary uppercase tracking-wider">
              Danh Mục ({activeCategories.length})
            </span>
            <button
              type="button"
              onClick={() => handleOpenAddCategory(activeMajor)}
              className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold text-brand-800 hover:text-brand-950 bg-brand-50 hover:bg-brand-100/80 px-2 py-0.5 rounded-lg border border-brand-200/60 transition-all shadow-2xs whitespace-nowrap"
            >
              <Plus size={12} strokeWidth={2.5} />
              <span>Thêm mới</span>
            </button>
          </div>

          {/* GIAO DIỆN MOBILE & TABLET (< lg): SELECT OPTION CÓ TÌM KIẾM, KHÔNG TRÀN NGANG */}
          <div className="lg:hidden">
            <SearchableSelect
              options={[
                {
                  value: "ALL",
                  label: "Tất Cả Món",
                  icon: LayoutGrid,
                  badge: `${countsByMajor[activeMajor]} món`,
                },
                ...activeCategories.map((category) => ({
                  value: category.name,
                  label: category.name,
                  icon: getCategoryIcon(category),
                  badge: `${categoryDishCount[category.name] || 0} món`,
                })),
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              labelPrefix="Danh mục:"
              searchPlaceholder="Tìm kiếm danh mục..."
              placeholder="Chọn danh mục..."
            />
          </div>

          {/* GIAO DIỆN DESKTOP (lg:): DANH SÁCH DỌC ĐẦY ĐỦ TIỆN ÍCH */}
          <div className="hidden lg:block space-y-1 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 scrollbar-thin">
            {/* Nút Tất Cả Món */}
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`w-full px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between text-left group border ${
                selectedCategory === "ALL"
                  ? "bg-brand-50 border-brand-300 text-brand-950 font-black shadow-2xs"
                  : "bg-transparent border-transparent text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas/70 font-semibold"
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "ALL"
                      ? "bg-brand-900 text-white"
                      : "bg-surface-muted text-ink-muted group-hover:text-brand-900 group-hover:bg-brand-50"
                  }`}
                >
                  <LayoutGrid size={13} />
                </div>
                <span className="truncate">Tất Cả Món</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  selectedCategory === "ALL"
                    ? "bg-brand-800 text-white"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {countsByMajor[activeMajor]}
              </span>
            </button>

            {/* Các danh mục con với icon Lucide đồng bộ */}
            {activeCategories.map((category) => {
              const isSelected = selectedCategory === category.name;
              const count = categoryDishCount[category.name] || 0;
              const CatIcon = getCategoryIcon(category);

              return (
                <div
                  key={category.id}
                  className={`group flex items-center justify-between rounded-xl transition-all border ${
                    isSelected
                      ? "bg-brand-50 border-brand-300 shadow-2xs"
                      : "bg-transparent border-transparent hover:bg-surface-canvas/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex-1 px-3 py-1.5 text-left text-xs transition-colors min-w-0 flex items-center gap-2.5"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-brand-900 text-white"
                          : "bg-surface-muted/80 text-ink-muted group-hover:text-brand-900 group-hover:bg-brand-50"
                      }`}
                    >
                      <CatIcon size={13} />
                    </div>
                    <span
                      className={`truncate block ${
                        isSelected
                          ? "text-brand-950 font-black"
                          : "text-ink-secondary group-hover:text-ink-primary font-semibold"
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                        isSelected
                          ? "bg-brand-800 text-white"
                          : "bg-surface-muted text-ink-muted group-hover:bg-surface-muted/80"
                      }`}
                    >
                      {count}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 rounded-lg text-ink-subtle opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all"
                      title={`Xóa danh mục ${category.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
