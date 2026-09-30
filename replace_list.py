import re

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "r") as f:
    content = f.read()

jsx_start = content.find("        ) : (\n          <div className=\"overflow-x-auto\">")
jsx_end = content.find("          </div>\n        )}\n      </div>") + 16

new_jsx = """        ) : (
          <div className="space-y-3">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="group p-3 sm:p-4 rounded-2xl border border-surface-border bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border">
                    {dish.image ? (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="utensils" className="w-5 h-5 text-ink-subtle" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-ink-primary truncate group-hover:text-brand-900 transition-colors">{dish.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] sm:text-[11px]">
                      <span className="font-bold text-ink-secondary">{dish.category}</span>
                      <span className="text-ink-subtle hidden sm:inline">•</span>
                      <span className="text-ink-muted line-clamp-1">{dish.description || "Không có mô tả"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                  <div className="text-left sm:text-right">
                    <p className="font-black text-sm text-brand-900">{dish.price.toLocaleString("vi-VN")} đ</p>
                    <p className="text-[10px] text-ink-muted">
                      Vốn: {dish.costPrice ? `${dish.costPrice.toLocaleString("vi-VN")} đ` : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {dish.variants && dish.variants.length > 1 && (
                      <span className="hidden sm:inline-flex text-[10px] font-bold text-ink-muted bg-surface-canvas px-2 py-1 rounded-full border border-surface-border">
                        {dish.variants.length} size
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => handleDeleteDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 transition bg-white shadow-sm hover:bg-rose-50">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}"""

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "w") as f:
    f.write(content[:jsx_start] + new_jsx + content[jsx_end:])

