import re

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "r") as f:
    content = f.read()

# Fix the header buttons (remove hidden sm:flex)
header_start = content.find("<div className=\"flex items-center bg-surface-canvas p-0.5 rounded-xl border border-surface-border hidden sm:flex\">")
if header_start != -1:
    content = content[:header_start] + "<div className=\"flex items-center bg-surface-canvas p-0.5 rounded-xl border border-surface-border\">" + content[header_start+len("<div className=\"flex items-center bg-surface-canvas p-0.5 rounded-xl border border-surface-border hidden sm:flex\">"):]

# Replace the Grid item
grid_start = content.find("        ) : viewMode === \"GRID\" ? (\n          <div className=\"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4\">\n            {paginatedDishes.map((dish) => (")
grid_end = content.find("            ))}\n          </div>\n        ) : (")

new_grid = """        ) : viewMode === "GRID" ? (
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
                    <h4 className="font-bold text-sm text-ink-primary line-clamp-2 leading-tight group-hover:text-brand-900 transition-colors mb-1">
                      {dish.name}
                    </h4>
                    <span className="inline-block px-1.5 py-0.5 bg-surface-canvas border border-surface-border rounded text-[10px] font-bold text-ink-secondary truncate max-w-full">
                      {dish.category}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {dish.variants && dish.variants.length > 1 && (
                        <span className="text-[10px] font-bold text-ink-muted bg-surface-canvas px-1.5 py-0.5 rounded border border-surface-border">
                          {dish.variants.length} Size
                        </span>
                      )}
                      {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                        <span className="text-[10px] font-bold text-ink-muted bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 text-brand-800">
                          {dish.customizationGroups.length} Tùy chọn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-brand-900 leading-none">{dish.price.toLocaleString("vi-VN")} đ</span>
                    {dish.costPrice && <span className="text-[10px] text-ink-muted mt-1">Vốn: {dish.costPrice.toLocaleString("vi-VN")} đ</span>}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                      <Icon name="edit" size={14} />
                    </button>
                    <button onClick={() => handleDeleteDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 hover:bg-rose-50 transition bg-white shadow-sm">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>"""

list_start = grid_end
list_end = content.find("            ))}\n          </div>\n        )}\n      </div>")

new_list = """        ) : (
          <div className="space-y-3">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="group p-3 sm:p-4 rounded-2xl border border-surface-border bg-white hover:border-brand-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-14 sm:h-14 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border">
                    {dish.image ? (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-muted">
                        <Icon name="utensils" size={20} className="text-ink-subtle" />
                      </div>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h4 className="font-bold text-sm text-ink-primary truncate group-hover:text-brand-900 transition-colors">
                        {dish.name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-surface-canvas border border-surface-border rounded text-[10px] font-bold text-ink-secondary shrink-0">
                          {dish.category}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-ink-muted line-clamp-1 mb-1.5 hidden sm:block">
                      {dish.description || "Không có mô tả chi tiết."}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      {dish.variants && dish.variants.length > 1 && (
                        <span className="text-[10px] font-bold text-ink-muted bg-surface-canvas px-1.5 py-0.5 rounded border border-surface-border">
                          {dish.variants.length} Size
                        </span>
                      )}
                      {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                        <span className="text-[10px] font-bold text-ink-muted bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 text-brand-800">
                          {dish.customizationGroups.length} Tùy chọn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-transparent border-surface-border shrink-0">
                  <div className="text-left sm:text-right flex flex-col">
                    <span className="font-black text-sm text-brand-900 leading-none">{dish.price.toLocaleString("vi-VN")} đ</span>
                    {dish.costPrice && <span className="text-[10px] text-ink-muted mt-1">Vốn: {dish.costPrice.toLocaleString("vi-VN")} đ</span>}
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                      <Icon name="edit" size={14} />
                    </button>
                    <button onClick={() => handleDeleteDish(dish)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 transition bg-white shadow-sm hover:bg-rose-50">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

              </div>"""

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "w") as f:
    f.write(content[:grid_start] + new_grid + new_list + content[list_end:])

