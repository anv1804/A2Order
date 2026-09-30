import re

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioSidebar.tsx", "r") as f:
    content = f.read()

jsx_start = content.find("  return (\n    <div className=\"w-full shrink-0 space-y-4 lg:w-80 xl:w-[340px]\">")

new_jsx = """  return (
    <div className="w-full shrink-0 space-y-4 lg:w-72 xl:w-80">
      <div className="bg-white rounded-3xl border border-surface-border shadow-sm p-4 sm:p-5 space-y-5">
        
        {/* Khung Chuyển Đổi 3 Trụ Cột Chính */}
        <div>
          <label className="block text-[10px] font-black text-ink-primary uppercase tracking-wider mb-2">
            Trụ Cột Thực Đơn
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface-muted/50 rounded-2xl border border-surface-border/50">
            {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
              ([key, cfg]) => {
                const isSelected = activeMajor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSwitchMajor(key)}
                    className={`py-1.5 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-white text-brand-900 shadow-sm border border-surface-border/50 font-bold"
                        : "text-ink-muted hover:text-ink-primary hover:bg-white/40 font-medium"
                    }`}
                  >
                    <Icon name={cfg.icon as any} size={16} />
                    <span className="text-[10px] leading-tight">{cfg.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Danh Sách Menu / Danh Mục (Vertical Nav List) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-surface-border pb-2 mb-2">
            <span className="text-[10px] font-black text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>Danh Mục ({activeCategories.length})</span>
            </span>
            <button
              type="button"
              onClick={() => handleOpenAddCategory(activeMajor)}
              className="text-[10px] font-bold text-brand-800 hover:text-brand-950 flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-brand-50 transition-colors"
            >
              <Icon name="plus" size={12} />
              <span>Thêm</span>
            </button>
          </div>

          <div className="space-y-0.5 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 scrollbar-thin">
            {/* Nút Tất Cả Món */}
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`w-full px-3 py-2 rounded-xl text-[11px] transition-all flex items-center justify-between text-left group ${
                selectedCategory === "ALL"
                  ? "bg-brand-50 text-brand-900 font-extrabold"
                  : "bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas/50 font-medium"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon name="grid" size={14} className={selectedCategory === "ALL" ? "text-brand-800" : "text-ink-subtle group-hover:text-ink-muted"} />
                Tất Cả Món
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  selectedCategory === "ALL" ? "bg-white text-brand-900 border border-brand-100 shadow-xs" : "bg-surface-muted text-ink-muted"
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
                  className={`group flex items-center justify-between rounded-xl transition-all ${
                    isSelected
                      ? "bg-brand-50"
                      : "bg-transparent hover:bg-surface-canvas/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex-1 px-3 py-2 text-left text-[11px] transition-colors min-w-0 flex items-center gap-2"
                  >
                    <Icon name="folder" size={14} className={isSelected ? "text-brand-800" : "text-ink-subtle group-hover:text-ink-muted"} />
                    <span className={`truncate block ${isSelected ? "text-brand-900 font-extrabold" : "text-ink-secondary group-hover:text-ink-primary font-medium"}`}>
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
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
"""

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioSidebar.tsx", "w") as f:
    f.write(content[:jsx_start] + new_jsx)

