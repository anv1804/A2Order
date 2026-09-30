import React from "react";
import { Icon, Button } from "@/components/ui";
import { FnbDishItem, FnbMajorCategory, FNB_MAJOR_CONFIG } from "@a2order/shared";

interface Props {
  activeMajor: FnbMajorCategory;
  selectedCategory: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: "GRID" | "LIST";
  setViewMode: (v: "GRID" | "LIST") => void;
  filteredDishes: FnbDishItem[];
  currentPage: number;
  handleEditDish: (dish: FnbDishItem) => void;
  handleDeleteDish: (dish: FnbDishItem) => void;
  handleOpenAddDish: () => void;
}

export const ScenarioDishList: React.FC<Props> = ({
  activeMajor,
  selectedCategory,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  filteredDishes,
  currentPage,
  handleEditDish,
  handleDeleteDish,
  handleOpenAddDish,
}) => {
  const PAGE_SIZE = 9;
  const majorConfig = FNB_MAJOR_CONFIG[activeMajor];
  
  // Lấy dữ liệu trang hiện tại
  const paginatedDishes = filteredDishes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex-1 bg-white rounded-3xl border border-surface-border shadow-card flex flex-col min-h-[600px] overflow-hidden">
      {/* 2.1 Header của Danh sách món */}
      <div className="p-4 sm:p-5 border-b border-surface-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-canvas/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
            <Icon name={majorConfig.icon as any} className="w-5 h-5 text-brand-800" />
          </div>
          <div>
            <h3 className="text-sm font-black text-ink-primary flex items-center gap-2">
              {selectedCategory === "ALL" ? "Tất Cả Món" : selectedCategory}
              <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 text-[10px] font-bold">
                {filteredDishes.length} món
              </span>
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Trụ cột: {majorConfig.label} • {selectedCategory === "ALL" ? "Toàn bộ nhóm món" : "Lọc theo danh mục"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Tìm món, giá bán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full sm:w-48 pl-9 pr-3 rounded-xl border border-surface-border bg-white text-xs text-ink-primary focus:border-brand-800 focus:outline-none transition-all placeholder:text-ink-subtle"
            />
          </div>
          <div className="flex items-center bg-surface-canvas p-0.5 rounded-xl border border-surface-border">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "GRID" ? "bg-white text-brand-900 shadow-sm" : "text-ink-subtle hover:text-ink-primary"
              }`}
            >
              <Icon name="grid" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "LIST" ? "bg-white text-brand-900 shadow-sm" : "text-ink-subtle hover:text-ink-primary"
              }`}
            >
              <Icon name="list" className="w-4 h-4" />
            </button>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1.5 bg-brand-900 text-white font-bold px-3 h-9"
            onClick={handleOpenAddDish}
          >
            <Icon name="plus" size={14} />
            <span>Thêm Món Mới</span>
          </Button>
        </div>
      </div>

      {/* 2.2 Nội dung danh sách */}
      <div className="flex-1 p-4 sm:p-5">
        {filteredDishes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-muted py-12">
            <div className="w-16 h-16 rounded-3xl bg-surface-muted flex items-center justify-center mb-3">
              <Icon name="search" className="w-6 h-6 text-ink-subtle" />
            </div>
            <p className="text-sm font-bold text-ink-primary mb-1">Không tìm thấy món nào</p>
            <p className="text-xs">Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
          </div>
        ) : viewMode === "GRID" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="group p-3 rounded-2xl border border-surface-border hover:border-brand-300 bg-white shadow-sm transition-all flex flex-col">
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border">
                    {dish.image ? (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-muted">
                        <Icon name="utensils" className="w-6 h-6 text-ink-subtle" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-ink-primary line-clamp-2 leading-tight group-hover:text-brand-900 transition-colors">
                      {dish.name}
                    </h4>
                    <p className="text-[10px] text-ink-muted truncate mt-1">
                      {dish.category}
                    </p>
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-black text-sm text-brand-900">{dish.price.toLocaleString("vi-VN")} đ</span>
                      {dish.variants && dish.variants.length > 1 && (
                        <span className="text-[9px] font-bold text-ink-muted bg-surface-canvas px-1.5 py-0.5 rounded border border-surface-border">
                          {dish.variants.length} size
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={() => handleDeleteDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 hover:bg-rose-50 transition bg-white shadow-sm">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-surface-border">
                  <th className="pb-3 px-2 text-[10px] font-black text-ink-muted uppercase tracking-wider">Món Mẫu</th>
                  <th className="pb-3 px-2 text-[10px] font-black text-ink-muted uppercase tracking-wider">Danh Mục</th>
                  <th className="pb-3 px-2 text-[10px] font-black text-ink-muted uppercase tracking-wider text-right">Giá Bán Đề Xuất</th>
                  <th className="pb-3 px-2 text-[10px] font-black text-ink-muted uppercase tracking-wider text-right">Giá Vốn</th>
                  <th className="pb-3 px-2 text-[10px] font-black text-ink-muted uppercase tracking-wider text-center">Quy cách & Size</th>
                  <th className="pb-3 px-2 text-[10px] font-black text-ink-muted uppercase tracking-wider text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {paginatedDishes.map((dish) => (
                  <tr key={dish.id} className="group hover:bg-surface-canvas/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border">
                          {dish.image ? (
                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="utensils" className="w-4 h-4 text-ink-subtle" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                          <p className="font-bold text-xs text-ink-primary truncate group-hover:text-brand-900 transition-colors">{dish.name}</p>
                          <p className="text-[10px] text-ink-muted truncate mt-0.5">{dish.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[11px] font-bold text-ink-secondary">{dish.category}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-black text-sm text-ink-primary">{dish.price.toLocaleString("vi-VN")} đ</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-[11px] font-medium text-ink-muted">
                        {dish.costPrice ? `${dish.costPrice.toLocaleString("vi-VN")} đ` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-[10px] font-bold text-ink-muted bg-surface-canvas px-2 py-1 rounded-full border border-surface-border">
                        {dish.variants && dish.variants.length > 1 ? `${dish.variants.length} size` : "1 size chuẩn"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditDish(dish)} className="p-1.5 text-ink-muted hover:text-brand-800 rounded-lg hover:bg-surface-border transition">
                          <Icon name="edit" size={14} />
                        </button>
                        <button onClick={() => handleDeleteDish(dish)} className="p-1.5 text-ink-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition">
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
