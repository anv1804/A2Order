import re

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "r") as f:
    content = f.read()

# Replace the Grid item
grid_start = content.find("        ) : viewMode === \"GRID\" ? (\n          <div className=\"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4\">\n            {paginatedDishes.map((dish) => (")
grid_end = content.find("            ))}\n          </div>")

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
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditDish(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                      <Icon name="edit" size={12} />
                    </button>
                    <button onClick={() => handleDeleteDish(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 hover:bg-rose-50 transition bg-white shadow-sm">
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>"""

# Replace the List item
list_start = content.find("        ) : (\n          <div className=\"space-y-3\">\n            {paginatedDishes.map((dish) => (")
list_end = content.find("            ))}\n          </div>")

new_list = """        ) : (
          <div className="space-y-3">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="group p-3 sm:p-4 rounded-2xl border border-surface-border bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                
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
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-xs sm:text-sm text-ink-primary truncate group-hover:text-brand-900 transition-colors">{dish.name}</p>
                      <span className="px-1.5 py-0.5 bg-surface-canvas border border-surface-border rounded text-[9px] font-bold text-ink-secondary shrink-0">
                        {dish.category}
                      </span>
                    </div>
                    
                    <p className="text-[10px] sm:text-[11px] text-ink-muted line-clamp-1 mb-1">
                      {dish.description || "Không có mô tả"}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
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
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-transparent border-surface-border shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="font-black text-sm text-brand-900 leading-none">{dish.price.toLocaleString("vi-VN")} đ</p>
                    {dish.costPrice && <p className="text-[9px] text-ink-muted mt-1">Vốn: {dish.costPrice.toLocaleString("vi-VN")} đ</p>}
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleEditDish(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-brand-800 hover:border-brand-800 transition bg-white shadow-sm">
                      <Icon name="edit" size={12} />
                    </button>
                    <button onClick={() => handleDeleteDish(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-ink-secondary hover:text-rose-600 hover:border-rose-600 transition bg-white shadow-sm hover:bg-rose-50">
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>

              </div>"""

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "w") as f:
    f.write(content[:grid_start] + new_grid + content[grid_end:list_start] + new_list + content[list_end:])

