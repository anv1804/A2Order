import React, { useState, useEffect } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { FnbDishItem, ModifierOption, DishVariantOption, DishCustomizationGroup } from "@/types/cms.types";
import { SAMPLE_FOOD_IMAGES } from "../menuConstants";

export interface EditDishModalProps {
  dish: FnbDishItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (updatedDish: FnbDishItem) => void;
}

export const EditDishModal: React.FC<EditDishModalProps> = ({
  dish,
  categories,
  onClose,
  onSave,
}) => {
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: 0,
    costPrice: 0,
    station: "KITCHEN" as "KITCHEN" | "BAR" | "DESSERT",
    image: "",
    description: "",
    isBestSeller: false,
    stockCount: 50,
    modifiers: [] as ModifierOption[],
    variants: [] as DishVariantOption[],
    customizationGroups: [] as DishCustomizationGroup[],
  });

  useEffect(() => {
    if (dish) {
      setEditForm({
        name: dish.name,
        category: dish.category,
        price: dish.price,
        costPrice: dish.costPrice || Math.round(dish.price * 0.35),
        station: (dish.station as any) || "KITCHEN",
        image: dish.image || "",
        description: dish.description || "",
        isBestSeller: !!dish.isBestSeller,
        stockCount: dish.stockCount ?? 50,
        modifiers: dish.modifiers ? [...dish.modifiers] : [],
        variants: dish.variants ? [...dish.variants] : [],
        customizationGroups: dish.customizationGroups ? [...dish.customizationGroups] : [],
      });
    }
  }, [dish]);

  if (!dish) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...dish,
      ...editForm,
      isAvailable: editForm.stockCount > 0,
    });
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 border border-surface-border animate-scaleUp max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                <Icon name="edit" className="w-4 h-4 text-brand-900" />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">Chỉnh Sửa Món Ăn</h3>
                <p className="text-xs text-ink-muted">Cập nhật giá bán, công thức và hình ảnh hiển thị</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto flex-1 pr-1">
            {/* Image Picker */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                Hình Ảnh Món Ăn
              </label>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                  <img
                    src={editForm.image || SAMPLE_FOOD_IMAGES[0]?.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={editForm.image}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    placeholder="Dán đường dẫn ảnh món (URL)..."
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">
                    Hoặc bấm chọn nhanh ảnh mẫu chất lượng cao bên dưới:
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {SAMPLE_FOOD_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, image: img.url })}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-canvas border border-surface-border hover:border-brand-800 shrink-0 text-ink-secondary hover:text-ink-primary"
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tên & Nhóm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Tên Món Ăn *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Danh Mục Thực Đơn</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                >
                  {categories.filter((c) => c !== "ALL").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Giá bán, COGS, Trạm */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Bán (VND) *</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  step={1000}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-brand-900 focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Vốn COGS *</label>
                <input
                  type="number"
                  value={editForm.costPrice}
                  onChange={(e) => setEditForm({ ...editForm, costPrice: Number(e.target.value) })}
                  step={1000}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Trạm Chế Biến</label>
                <select
                  value={editForm.station}
                  onChange={(e) =>
                    setEditForm({ ...editForm, station: e.target.value as "KITCHEN" | "BAR" | "DESSERT" })
                  }
                  className="w-full h-9 px-2 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                >
                  <option value="KITCHEN">Bếp Nấu</option>
                  <option value="BAR">Quầy Bar</option>
                  <option value="DESSERT">Tráng Miệng</option>
                </select>
              </div>
            </div>

            {/* Suất phục vụ & Bán chạy */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Số Suất Dự Kiến Còn Lại</label>
                <input
                  type="number"
                  value={editForm.stockCount}
                  onChange={(e) => setEditForm({ ...editForm, stockCount: Number(e.target.value) })}
                  min={0}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink-primary">
                  <input
                    type="checkbox"
                    checked={editForm.isBestSeller}
                    onChange={(e) => setEditForm({ ...editForm, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-900 focus:ring-brand-800"
                  />
                  <span>Gắn nhãn Bán Chạy (Best Seller)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">Mô Tả Chi Tiết Món</label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Gợi ý: Thơm ngon, đậm đà theo công thức gia truyền..."
                className="w-full p-2.5 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
              />
            </div>

            {/* Biến Thể Size / Khẩu Phần */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink-secondary">
                  Biến Thể Size / Khẩu Phần ({editForm.variants.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      variants: [
                        ...editForm.variants,
                        { id: `var-${Date.now()}`, name: "Size Lớn", price: editForm.price + 10000 },
                      ],
                    })
                  }
                  className="text-[11px] font-bold text-brand-900 hover:underline"
                >
                  + Thêm Size/Biến thể
                </button>
              </div>

              <div className="space-y-1.5">
                {editForm.variants.map((v, idx) => (
                  <div key={v.id || idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...editForm.variants];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setEditForm({ ...editForm, variants: updated });
                      }}
                      className="flex-1 h-8 px-2.5 rounded-xl border border-surface-border text-xs font-bold"
                      placeholder="VD: Size L, Bát đặc biệt..."
                    />
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const updated = [...editForm.variants];
                        updated[idx] = { ...updated[idx], price: Number(e.target.value) };
                        setEditForm({ ...editForm, variants: updated });
                      }}
                      className="w-28 h-8 px-2 rounded-xl border border-surface-border text-xs font-bold text-brand-900"
                      step={1000}
                      placeholder="Giá bán..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          variants: editForm.variants.filter((_, i) => i !== idx),
                        });
                      }}
                      className="w-7 h-7 rounded-lg text-ink-subtle hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center"
                    >
                      <Icon name="x" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tùy chọn đi kèm (Toppings/Modifiers) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink-secondary">
                  Tùy Chọn Kèm / Topping ({editForm.modifiers.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      modifiers: [...editForm.modifiers, { name: "Tùy chọn mới", price: 10000 }],
                    })
                  }
                  className="text-[11px] font-bold text-brand-900 hover:underline"
                >
                  + Thêm tùy chọn
                </button>
              </div>

              <div className="space-y-1.5">
                {editForm.modifiers.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mod.name}
                      onChange={(e) => {
                        const updated = [...editForm.modifiers];
                        updated[idx].name = e.target.value;
                        setEditForm({ ...editForm, modifiers: updated });
                      }}
                      className="flex-1 h-8 px-2.5 rounded-xl border border-surface-border text-xs font-medium"
                      placeholder="Tên topping..."
                    />
                    <input
                      type="number"
                      value={mod.price}
                      onChange={(e) => {
                        const updated = [...editForm.modifiers];
                        updated[idx].price = Number(e.target.value);
                        setEditForm({ ...editForm, modifiers: updated });
                      }}
                      className="w-24 h-8 px-2 rounded-xl border border-surface-border text-xs font-bold"
                      step={1000}
                      placeholder="Giá..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          modifiers: editForm.modifiers.filter((_, i) => i !== idx),
                        });
                      }}
                      className="w-7 h-7 rounded-lg text-ink-subtle hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center"
                    >
                      <Icon name="x" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full bg-brand-900 text-white text-xs px-5 shadow-sm"
              >
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
