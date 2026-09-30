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

const getStationInfo = (station?: "KITCHEN" | "BAR" | "DESSERT") => {
  switch (station) {
    case "BAR":
      return { label: "Quầy Bar", icon: "coffee" as const };
    case "DESSERT":
      return { label: "Bếp Tráng Miệng", icon: "cake" as const };
    case "KITCHEN":
    default:
      return { label: "Bếp Nấu", icon: "kitchen" as const };
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
    <div className="flex-1 bg-white rounded-3xl border border-surface-border shadow-sm flex flex-col min-h-[600px] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-surface-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-canvas/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
            <Icon name={majorConfig.icon as any} className="w-5 h-5 text-brand-800" />
          </div>
          <div>
            <h3 className="text-sm font-black text-ink-primary flex items-center gap-2">
              {selectedCategory === "ALL" ? "Tất Cả Món" : selectedCategory}
              <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-900 text-[10px] font-bold">
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
              className="h-9 w-full sm:w-48 pl-9 pr-3 rounded-xl border border-surface-border bg-white text-xs font-medium text-ink-primary focus:border-brand-800 focus:outline-none transition-all placeholder:text-ink-subtle"
            />
          </div>
          
          <div className="flex items-center bg-surface-canvas p-0.5 rounded-xl border border-surface-border">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "GRID" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-ink-subtle hover:text-ink-primary"
              }`}
              title="Chế độ Lưới (Card Grid)"
            >
              <Icon name="grid" size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "LIST" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-ink-subtle hover:text-ink-primary"
              }`}
              title="Chế độ Danh Sách / Bảng (Table List)"
            >
              <Icon name="list" size={14} />
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

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 bg-surface-canvas/10">
        {filteredDishes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-muted py-12">
            <div className="w-16 h-16 rounded-3xl bg-surface-muted flex items-center justify-center mb-3">
              <Icon name="search" className="w-6 h-6 text-ink-subtle" />
            </div>
            <p className="text-sm font-bold text-ink-primary mb-1">Không tìm thấy món nào</p>
            <p className="text-xs">Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
          </div>
        ) : viewMode === "GRID" ? (
          /* ======================================================== */
          /* 1. CHẾ ĐỘ XEM GRID: THẺ MÓN BỐ CỤC 3 CỘT ĐỀU ĐẸP        */
          /* ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedDishes.map((dish) => {
              const margin = dish.costPrice && dish.price > 0 
                ? Math.round(((dish.price - dish.costPrice) / dish.price) * 100) 
                : null;
              const stationInfo = getStationInfo(dish.station);

              return (
                <div 
                  key={dish.id} 
                  className="group p-4 rounded-2xl border border-surface-border hover:border-brand-300 hover:shadow-md bg-white shadow-2xs transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Thẻ: Ảnh + Tên + Phân Loại + Giá */}
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border shadow-2xs">
                        {dish.image ? (
                          <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-muted text-brand-900">
                            <Icon name={majorConfig.icon as any} className="w-6 h-6 text-ink-subtle" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-[10px] font-bold text-ink-secondary truncate max-w-[130px]">
                            {dish.category}
                          </span>
                          {dish.isBestSeller && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                              ★ Bán chạy
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-sm text-ink-primary line-clamp-1 leading-snug group-hover:text-brand-900 transition-colors mt-1" title={dish.name}>
                          {dish.name}
                        </h4>

                        <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                          <span className="font-black text-sm text-brand-900">
                            {dish.price.toLocaleString("vi-VN")} đ
                          </span>
                          {dish.costPrice ? (
                            <span className="text-[10px] text-ink-muted">
                              (Vốn {dish.costPrice.toLocaleString("vi-VN")}đ {margin !== null ? `• Lãi ${margin}%` : ""})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Mô Tả Món */}
                    {dish.description ? (
                      <p className="text-xs text-ink-muted line-clamp-2 mt-2.5 leading-relaxed bg-surface-canvas/40 px-2.5 py-1.5 rounded-xl border border-surface-border/40">
                        {dish.description}
                      </p>
                    ) : (
                      <div className="mt-2.5" />
                    )}

                    {/* Tags: Quy cách Size & Tùy chọn */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-surface-border/60 text-[10px]">
                      {dish.variants && dish.variants.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-surface-canvas border border-surface-border text-ink-primary font-bold">
                          {dish.variants.length} size
                        </span>
                      ) : (
                        <span className="text-ink-muted italic">1 size chuẩn</span>
                      )}

                      {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 font-bold">
                          {dish.customizationGroups.length} nhóm tùy chọn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chân Thẻ: Trạm Phục Vụ & Nút Sửa / Xóa */}
                  <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
                      <Icon name={stationInfo.icon} size={13} className="text-brand-800" />
                      <span>{stationInfo.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2.5 rounded-xl text-xs font-bold"
                        onClick={() => handleEditDish(dish)}
                      >
                        <Icon name="edit" size={12} className="mr-1" />
                        <span>Sửa</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2 rounded-xl text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleDeleteDish(dish)}
                      >
                        <Icon name="trash" size={12} className="mr-1 text-rose-600" />
                        <span>Xóa</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ======================================================== */
          /* 2. CHẾ ĐỘ XEM LIST: BẢNG CHUẨN TRÊN DESKTOP, THẺ TRÊN MOB */
          /* ======================================================== */
          <>
            {/* 2.1 BẢNG TRÊN DESKTOP (lg:block) */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-surface-border bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-canvas/90 border-b border-surface-border">
                  <tr className="text-[11px] font-black text-ink-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Món Mẫu</th>
                    <th className="py-3 px-4">Danh Mục</th>
                    <th className="py-3 px-4">Giá Bán Đề Xuất</th>
                    <th className="py-3 px-4">Giá Vốn & Lãi</th>
                    <th className="py-3 px-4">Quy Cách & Tùy Chọn</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {paginatedDishes.map((dish) => {
                    const margin = dish.costPrice && dish.price > 0 
                      ? Math.round(((dish.price - dish.costPrice) / dish.price) * 100) 
                      : null;

                    return (
                      <tr key={dish.id} className="hover:bg-brand-50/30 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-surface-border bg-surface-canvas shrink-0 shadow-2xs">
                              {dish.image ? (
                                <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-brand-900">
                                  <Icon name={majorConfig.icon as any} size={16} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-ink-primary group-hover:text-brand-900 transition-colors truncate block leading-tight">
                                  {dish.name}
                                </span>
                                {dish.isBestSeller && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                                    ★ Bán chạy
                                  </span>
                                )}
                              </div>
                              {dish.description && (
                                <p className="text-[10px] text-ink-muted truncate mt-0.5">{dish.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border font-bold text-ink-secondary text-xs">
                            {dish.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-black text-brand-900 text-sm whitespace-nowrap">
                          {dish.price.toLocaleString("vi-VN")} đ
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {dish.costPrice ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-ink-primary text-xs">{dish.costPrice.toLocaleString("vi-VN")} đ</span>
                              {margin !== null && (
                                <span className="text-[10px] font-semibold text-emerald-700">Lãi ~{margin}%</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg bg-surface-canvas border border-surface-border text-ink-primary font-bold text-[10px]">
                              {dish.variants && dish.variants.length > 0 ? `${dish.variants.length} size` : "1 size chuẩn"}
                            </span>
                            {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 font-bold text-[10px]">
                                {dish.customizationGroups.length} tùy chọn
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 rounded-xl font-bold text-xs"
                              onClick={() => handleEditDish(dish)}
                            >
                              <Icon name="edit" size={13} className="mr-1" />
                              <span>Sửa</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 rounded-xl font-bold text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                              onClick={() => handleDeleteDish(dish)}
                            >
                              <Icon name="trash" size={13} className="mr-1 text-rose-600" />
                              <span>Xóa</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2.2 THẺ DANH SÁCH COMPACT TRÊN MOBILE (lg:hidden - KHÔNG SCROLL NGANG) */}
            <div className="lg:hidden space-y-3">
              {paginatedDishes.map((dish) => {
                const margin = dish.costPrice && dish.price > 0 
                  ? Math.round(((dish.price - dish.costPrice) / dish.price) * 100) 
                  : null;

                return (
                  <article key={dish.id} className="w-full rounded-2xl border border-surface-border bg-white p-3.5 shadow-2xs hover:border-brand-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-surface-border bg-surface-canvas shrink-0 shadow-2xs">
                        {dish.image ? (
                          <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-900">
                            <Icon name={majorConfig.icon as any} size={20} />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-extrabold text-sm text-ink-primary leading-tight line-clamp-1">{dish.name}</h4>
                          {dish.isBestSeller && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-black">
                              ★ Bán chạy
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-ink-secondary bg-surface-canvas px-1.5 py-0.2 rounded border border-surface-border/60">
                            {dish.category}
                          </span>
                          {dish.description && (
                            <span className="text-[10px] text-ink-muted truncate">· {dish.description}</span>
                          )}
                        </div>
                        
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="font-black text-brand-900">{dish.price.toLocaleString("vi-VN")} đ</span>
                          {dish.costPrice ? (
                            <span className="text-[10px] text-ink-muted font-medium">Vốn: {dish.costPrice.toLocaleString("vi-VN")} đ</span>
                          ) : null}
                          <span className="text-[10px] font-bold text-ink-muted bg-surface-canvas px-1.5 py-0.5 rounded border border-surface-border/60">
                            {dish.variants?.length ? `${dish.variants.length} size` : "1 size"}
                          </span>
                          {dish.customizationGroups?.length ? (
                            <span className="text-[10px] font-bold text-brand-900 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                              {dish.customizationGroups.length} tùy chọn
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 rounded-xl px-3 text-xs font-bold"
                        onClick={() => handleEditDish(dish)}
                      >
                        <Icon name="edit" size={12} className="mr-1" />
                        <span>Sửa</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 rounded-xl border-rose-200 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteDish(dish)}
                      >
                        <Icon name="trash" size={12} className="mr-1 text-rose-600" />
                        <span>Xóa</span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
