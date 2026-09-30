import React from "react";
import { Icon, Button } from "@/components/ui";
import { FnbMajorCategory, FNB_MAJOR_CONFIG, FnbCategoryTemplate } from "@a2order/shared";

interface Props {
  activeMajor: FnbMajorCategory;
  handleSwitchMajor: (major: FnbMajorCategory) => void;
  countsByMajor: Record<FnbMajorCategory, number>;
  activeCategories: FnbCategoryTemplate[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  handleOpenAddCategory: (major: FnbMajorCategory) => void;
  handleDeleteCategory: (cat: FnbCategoryTemplate) => void;
}

export const ScenarioSidebar: React.FC<Props> = ({
  activeMajor,
  handleSwitchMajor,
  countsByMajor,
  activeCategories,
  selectedCategory,
  setSelectedCategory,
  handleOpenAddCategory,
  handleDeleteCategory,
}) => {
  return (
    <div className="w-full shrink-0 space-y-4 lg:w-80 xl:w-[340px]">
      <div className="bg-white rounded-3xl border border-surface-border shadow-card p-4 sm:p-5 space-y-4">
        {/* Khung Chuyển Đổi 3 Trụ Cột Chính */}
        <div>
          <label className="block text-[11px] font-black text-ink-primary uppercase tracking-wider mb-2">
            Trụ Cột Thực Đơn
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-canvas rounded-2xl border border-surface-border">
            {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
              ([key, cfg]) => {
                const isSelected = activeMajor === key;
                const count = countsByMajor[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSwitchMajor(key)}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-white text-ink-primary shadow-sm border border-surface-border"
                        : "text-ink-secondary hover:text-ink-primary hover:bg-white/60"
                    }`}
                    title={`${cfg.label} (${count} món)`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        isSelected ? "bg-brand-900 text-white" : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      <Icon name={cfg.icon as any} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight line-clamp-1">{cfg.label}</span>
                    <span className={`text-[10px] font-black ${isSelected ? "text-brand-900" : "text-ink-muted"}`}>
                      {count} món
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Danh Sách Menu / Danh Mục (Vertical Nav List) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <span className="text-[11px] font-black text-ink-primary uppercase tracking-wider flex items-center gap-1">
              <span>Menu / Danh Mục</span>
              <span className="text-ink-muted font-normal">({activeCategories.length})</span>
            </span>
            <button
              type="button"
              onClick={() => handleOpenAddCategory(activeMajor)}
              className="text-xs font-bold text-brand-900 hover:text-brand-950 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <Icon name="plus" className="w-3 h-3" />
              <span>Thêm</span>
            </button>
          </div>

          <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-0.5 scrollbar-thin">
            {/* Nút Tất Cả Món */}
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-left ${
                selectedCategory === "ALL"
                  ? "bg-brand-900 text-white shadow-sm font-black"
                  : "bg-surface-canvas/60 text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas border border-transparent hover:border-surface-border"
              }`}
            >
              <span className="truncate pr-2">Tất Cả Món</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"
                }`}
              >
                {countsByMajor[activeMajor]}
              </span>
            </button>

            {activeCategories.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <div
                  key={category.id}
                  className={`group flex items-center justify-between rounded-xl transition-all border ${
                    isSelected
                      ? "bg-brand-50 border-brand-200"
                      : "bg-transparent border-transparent hover:bg-surface-canvas/50 hover:border-surface-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex-1 px-3 py-2.5 text-left text-xs font-bold transition-colors min-w-0"
                  >
                    <span className={`truncate block ${isSelected ? "text-brand-900 font-black" : "text-ink-secondary group-hover:text-ink-primary"}`}>
                      {category.name}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className={`shrink-0 p-1.5 mr-1.5 rounded-lg transition-all ${
                      isSelected ? "text-brand-600 hover:bg-brand-100 hover:text-brand-900" : "text-ink-subtle opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                    title="Xóa danh mục"
                  >
                    <Icon name="trash" className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 rounded-xl border-dashed border-surface-border text-ink-secondary bg-surface-canvas/50 hover:bg-surface-canvas text-xs justify-center"
            onClick={() => handleOpenAddCategory(activeMajor)}
          >
            <Icon name="plus" size={14} className="mr-1" /> Thêm Danh Mục Mới
          </Button>
        </div>
      </div>
    </div>
  );
};
