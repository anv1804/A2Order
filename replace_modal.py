import re

with open("apps/cms/src/features/cms/components/superAdmin/modals/ScenarioDishModal.tsx", "r") as f:
    content = f.read()

jsx_start = content.find("  return (\n    <Portal>")

new_jsx = """  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-ink-primary/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
          onClick={requestClose}
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface-canvas rounded-3xl shadow-elevated flex flex-col z-10 animate-in zoom-in-95 duration-150 overflow-hidden border border-surface-border">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-900 shrink-0">
                <Icon name={FNB_MAJOR_CONFIG[selectedMajor].icon as any} size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-ink-primary">
                  {initialDish ? `Chỉnh sửa: ${initialDish.name}` : "Thêm Món Mẫu Mới"}
                </h3>
                <p className="text-[11px] font-bold text-ink-muted">
                  <span className="text-brand-900">{FNB_MAJOR_CONFIG[selectedMajor].label}</span>
                  <span className="mx-1.5">•</span>
                  {station === "KITCHEN" ? "Bếp Nấu" : station === "BAR" ? "Quầy Pha Chế" : "Bếp Tráng Miệng"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestClose}
              className="p-2 text-ink-muted hover:text-ink-primary hover:bg-surface-muted rounded-xl transition-all"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN: Basic Info */}
              <div className="space-y-5">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-sm space-y-4">
                  <h4 className="font-extrabold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-1.5 mb-1 border-b border-surface-border pb-2">
                    <Icon name="tag" size={14} className="text-brand-800" /> Phân Loại & Tên Món
                  </h4>

                  {/* Trụ Cột */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
                      Trụ Cột Thực Đơn
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-surface-canvas p-1 rounded-xl border border-surface-border">
                      {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
                        ([key, cfg]) => {
                          const isSelected = selectedMajor === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleSelectMajor(key)}
                              className={`py-1.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? "bg-white shadow-sm border border-surface-border text-brand-900"
                                  : "text-ink-muted hover:text-ink-primary hover:bg-white/50 border border-transparent"
                              }`}
                            >
                              <Icon name={cfg.icon as any} size={14} />
                              <span className={`text-[10px] leading-tight ${isSelected ? "font-bold" : "font-medium"}`}>{cfg.label}</span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Danh Mục */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-ink-secondary">
                        Danh Mục Chi Tiết
                      </label>
                      {onOpenAddCategory && (
                        <button
                          type="button"
                          onClick={() => onOpenAddCategory(selectedMajor)}
                          className="text-[10px] font-bold text-brand-800 hover:text-brand-900 hover:underline"
                        >
                          + Thêm Mới
                        </button>
                      )}
                    </div>
                    {filteredCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {filteredCategories.map((cat) => {
                          const isSelected = category === cat.name;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.name)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border ${
                                isSelected
                                  ? "bg-brand-50 border-brand-200 text-brand-900 font-black shadow-sm"
                                  : "bg-surface-canvas text-ink-secondary border-transparent hover:bg-white hover:border-surface-border font-medium"
                              }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-surface-canvas text-[11px] text-ink-muted text-center border border-dashed border-surface-border">
                        Chưa có danh mục nào.
                      </div>
                    )}
                  </div>

                  {/* Tên Món */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
                      Tên Món Mẫu
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Cà Phê Sữa Đá Sài Gòn..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 transition"
                    />
                  </div>
                  
                  {/* Ảnh */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
                      Đường Dẫn Ảnh (Tùy chọn)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 transition"
                      />
                      {image && (
                        <div className="w-9 h-9 rounded-xl border border-surface-border overflow-hidden shrink-0 bg-surface-muted">
                          <img src={image} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Giá Bán & Mô Tả */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
                        Giá Bán Đề Xuất
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={0}
                          step={1000}
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="w-full h-9 pl-3 pr-8 rounded-xl border border-surface-border text-xs font-black text-brand-900 bg-white focus:outline-none focus:border-brand-800 transition"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-muted">đ</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
                        Giá Vốn Ước Tính
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={costPrice || ""}
                          onChange={(e) => setCostPrice(Number(e.target.value))}
                          className="w-full h-9 pl-3 pr-8 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 transition"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-muted">đ</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
                      Mô Tả Thành Phần
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả hấp dẫn về món ăn..."
                      className="w-full p-3 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 resize-none transition scrollbar-thin"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Sizes & Customizations */}
              <div className="space-y-5">
                {/* Size */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-surface-border pb-2">
                    <h4 className="font-extrabold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="layers" size={14} className="text-brand-800" /> Biến Thể Size Đề Xuất
                    </h4>
                    <span className="text-[10px] bg-brand-50 text-brand-900 px-2 py-0.5 rounded-full font-bold">{variants.length} size</span>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                    {variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas border border-surface-border group">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-ink-primary truncate">{v.name}</p>
                          <p className="text-[10px] text-ink-muted font-bold">{v.price.toLocaleString("vi-VN")} đ</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1.5 text-ink-subtle hover:text-rose-600 rounded-lg hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center bg-surface-canvas p-1.5 rounded-xl border border-surface-border border-dashed">
                    <input
                      type="text"
                      placeholder="Tên Size (M, L...)"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-surface-border text-[11px] font-medium bg-white focus:outline-none focus:border-brand-800"
                    />
                    <input
                      type="number"
                      placeholder="Giá (đ)"
                      value={newVarPrice || ""}
                      onChange={(e) => setNewVarPrice(Number(e.target.value))}
                      className="w-20 sm:w-24 shrink-0 h-8 px-2 rounded-lg border border-surface-border text-[11px] font-bold bg-white focus:outline-none focus:border-brand-800"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 rounded-lg text-[10px] shrink-0"
                      onClick={handleAddVariant}
                    >
                      Thêm
                    </Button>
                  </div>
                </div>

                {/* Toppings / Options */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-surface-border pb-2">
                    <h4 className="font-extrabold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="sparkles" size={14} className="text-brand-800" /> Nhóm Tùy Chọn / Topping
                    </h4>
                    <span className="text-[10px] bg-brand-50 text-brand-900 px-2 py-0.5 rounded-full font-bold">{customizationGroups.length} nhóm</span>
                  </div>

                  {/* Preset Quick Add */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-ink-muted">Gợi ý mẫu nhanh 1-chạm:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SMART_CUSTOMIZATION_PRESETS[selectedMajor].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddPresetCustomization(preset)}
                          className="px-2 py-1 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-800 text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <Icon name="plus" size={10} />
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List Customizations */}
                  {customizationGroups.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1 mt-3">
                      {customizationGroups.map((group) => (
                        <div key={group.id} className="p-2.5 rounded-xl border border-surface-border bg-surface-canvas relative group/item">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomization(group.id)}
                            className="absolute top-2 right-2 p-1 text-ink-subtle hover:text-rose-600 rounded-md hover:bg-rose-50 transition opacity-0 group-hover/item:opacity-100"
                          >
                            <Icon name="trash" size={12} />
                          </button>
                          <h5 className="text-[11px] font-bold text-ink-primary mb-1 pr-6">{group.name}</h5>
                          <p className="text-[9px] text-ink-muted font-bold mb-2">
                            {group.type === "SINGLE" ? "Chọn 1" : "Chọn nhiều"} • {group.required ? "Bắt buộc" : "Không bắt buộc"}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {group.options.map((opt) => (
                              <span key={opt.id} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white border border-surface-border text-ink-secondary">
                                {opt.name} {opt.priceModifier ? `(+${opt.priceModifier.toLocaleString("vi-VN")}đ)` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-[11px] h-8 rounded-xl border-dashed bg-surface-canvas/50"
                    onClick={() => {
                      toast.info("Chức năng tạo mới nhóm tùy chọn tùy chỉnh đang được hoàn thiện.");
                    }}
                  >
                    + Tự tạo nhóm tùy chọn mới
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-surface-border bg-white flex items-center justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold px-4" onClick={requestClose}>
              Hủy Bỏ
            </Button>
            <Button type="button" size="sm" className="rounded-xl font-bold px-6 bg-brand-900 text-white" onClick={handleSubmit}>
              {initialDish ? "Lưu Thay Đổi" : "Tạo Món Mẫu"}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
"""

with open("apps/cms/src/features/cms/components/superAdmin/modals/ScenarioDishModal.tsx", "w") as f:
    f.write(content[:jsx_start] + new_jsx)

