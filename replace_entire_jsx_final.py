import re

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "r") as f:
    content = f.read()

jsx_start = content.find("  return (\n    <div className=\"flex-1")

new_jsx = """  return (
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
              <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-900 text-[9px] font-bold">
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
          <div className="flex items-center bg-surface-canvas p-0.5 rounded-xl border border-surface-border hidden sm:flex">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "GRID" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-ink-subtle hover:text-ink-primary"
              }`}
            >
              <Icon name="grid" size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "LIST" ? "bg-white text-brand-900 shadow-sm font-bold" : "text-ink-subtle hover:text-ink-primary"
              }`}
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
                    <h4 className="font-bold text-xs text-ink-primary line-clamp-2 leading-tight group-hover:text-brand-900 transition-colors mb-1">
                      {dish.name}
                    </h4>
                    <span className="inline-block px-1.5 py-0.5 bg-surface-canvas border border-surface-border rounded text-[9px] font-bold text-ink-secondary truncate max-w-full">
                      {dish.category}
                    </span>
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {dish.variants && dish.variants.length > 1 && (
                        <span className="text-[9px] font-bold text-ink-muted bg-surface-canvas px-1.5 py-0.5 rounded border border-surface-border">
                          {dish.variants.length} Size
                        </span>
                      )}
                      {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                        <span className="text-[9px] font-bold text-ink-muted bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 text-brand-800">
                          {dish.customizationGroups.length} Tùy chọn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-brand-900 leading-none">{dish.price.toLocaleString("vi-VN")} đ</span>
                    {dish.costPrice && <span className="text-[9px] text-ink-muted mt-0.5">Vốn: {dish.costPrice.toLocaleString("vi-VN")} đ</span>}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditDish(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                      <Icon name="edit" size={12} />
                    </button>
                    <button onClick={() => handleDeleteDish(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 hover:bg-rose-50 transition bg-white shadow-sm">
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="group p-3 rounded-2xl border border-surface-border bg-white hover:border-brand-300 transition-all shadow-sm flex items-stretch gap-3 sm:gap-4">
                
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-muted">
                      <Icon name="utensils" size={20} className="text-ink-subtle" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-ink-primary truncate group-hover:text-brand-900 transition-colors mb-0.5">
                        {dish.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-ink-secondary font-medium">
                          {dish.category}
                        </span>
                        {dish.variants && dish.variants.length > 1 && (
                          <>
                            <span className="text-ink-subtle text-[8px]">•</span>
                            <span className="text-[10px] text-ink-muted">{dish.variants.length} Size</span>
                          </>
                        )}
                        {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                          <>
                            <span className="text-ink-subtle text-[8px]">•</span>
                            <span className="text-[10px] text-brand-800">{dish.customizationGroups.length} Tùy chọn</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm sm:text-base text-brand-900 leading-none">{dish.price.toLocaleString("vi-VN")} đ</p>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between gap-3 mt-1 sm:mt-2">
                    <p className="text-[10px] sm:text-[11px] text-ink-muted line-clamp-1 flex-1">
                      {dish.description || "Không có mô tả chi tiết."}
                    </p>
                    <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditDish(dish)} className="p-1.5 text-ink-muted hover:text-brand-800 hover:bg-surface-canvas rounded-lg transition">
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => handleDeleteDish(dish)} className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
"""

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "w") as f:
    f.write(content[:jsx_start] + new_jsx)

