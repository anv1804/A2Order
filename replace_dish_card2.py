import re

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "r") as f:
    content = f.read()

# Replace the List item
list_start = content.find("        ) : (\n          <div className=\"space-y-3\">\n            {paginatedDishes.map((dish) => (")
list_end = content.find("            ))}\n          </div>")

new_list = """        ) : (
          <div className="space-y-2.5">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="group p-3 rounded-2xl border border-surface-border bg-white hover:border-brand-300 transition-all shadow-sm flex items-stretch gap-3">
                
                {/* Left: Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-surface-canvas rounded-xl overflow-hidden border border-surface-border">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="utensils" className="w-5 h-5 text-ink-subtle" />
                    </div>
                  )}
                </div>
                
                {/* Right: Info & Actions */}
                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-ink-primary truncate group-hover:text-brand-900 transition-colors">
                        {dish.name}
                      </h4>
                      <p className="text-[10px] text-ink-secondary truncate mt-0.5">
                        {dish.category}
                        {dish.variants && dish.variants.length > 1 && (
                          <span className="text-ink-muted"> • {dish.variants.length} size</span>
                        )}
                        {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                          <span className="text-ink-muted"> • {dish.customizationGroups.length} tùy chọn</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-xs sm:text-sm text-brand-900">{dish.price.toLocaleString("vi-VN")} đ</p>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4 mt-2">
                    <p className="text-[10px] text-ink-muted line-clamp-1 flex-1">
                      {dish.description || "Không có mô tả chi tiết."}
                    </p>
                    
                    <div className="flex items-center gap-1.5 shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditDish(dish)} className="p-1.5 text-ink-muted hover:text-brand-800 hover:bg-surface-canvas rounded-lg transition">
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => handleDeleteDish(dish)} className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>"""

with open("apps/cms/src/features/cms/components/superAdmin/scenario/ScenarioDishList.tsx", "w") as f:
    f.write(content[:list_start] + new_list + content[list_end:])

