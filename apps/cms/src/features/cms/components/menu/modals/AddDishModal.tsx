import React, { useState } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { ModifierOption, DishVariantOption } from "@/types/cms.types";
import { SAMPLE_FOOD_IMAGES } from "../menuConstants";

export interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSubmit: (dishData: {
    name: string;
    category: string;
    price: number;
    costPrice: number;
    station: "KITCHEN" | "BAR" | "DESSERT";
    image: string;
    description: string;
    isBestSeller: boolean;
    stockCount: number;
    modifiers: ModifierOption[];
    variants: DishVariantOption[];
  }) => void;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    name: "",
    category: categories.find((c) => c !== "ALL") || "Món Chính",
    price: 60000,
    costPrice: 22000,
    station: "KITCHEN" as "KITCHEN" | "BAR" | "DESSERT",
    image: SAMPLE_FOOD_IMAGES[0]?.url || "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop",
    description: "",
    isBestSeller: false,
    stockCount: 50,
    modifiers: [] as ModifierOption[],
    variants: [] as DishVariantOption[],
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
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
                <Icon name="menu" className="w-4 h-4 text-brand-900" />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">Thêm Món Mới Vào Menu</h3>
                <p className="text-xs text-ink-muted">Thiết lập ảnh món, giá bán, giá vốn và trạm chế biến</p>
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
                Hình Ảnh Món Ăn *
              </label>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                  <img
                    src={form.image || SAMPLE_FOOD_IMAGES[0]?.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="Dán link ảnh món ăn (URL)..."
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none mb-1"
                  />
                  <span className="text-[10px] text-ink-subtle">
                    Chọn ảnh gợi ý nhanh bên dưới hoặc dán link ảnh tùy chỉnh
                  </span>
                </div>
              </div>

              {/* Sample Images Pills */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-ink-muted uppercase">Gợi ý ảnh ẩm thực Việt Nam sắc nét:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_FOOD_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm({ ...form, image: sample.url })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                        form.image === sample.url
                          ? "bg-brand-900 text-white border-brand-900"
                          : "bg-surface-canvas border-surface-border text-ink-primary hover:bg-brand-50"
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Tên Món Ăn *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Phở Gà Ta Đồi"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Nhóm Thực Đơn</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Bán (VND) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  step={1000}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-brand-900 focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Vốn COGS *</label>
                <input
                  type="number"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                  step={1000}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Trạm Chế Biến</label>
                <select
                  value={form.station}
                  onChange={(e) =>
                    setForm({ ...form, station: e.target.value as "KITCHEN" | "BAR" | "DESSERT" })
                  }
                  className="w-full h-9 px-2 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                >
                  <option value="KITCHEN">Bếp Nấu</option>
                  <option value="BAR">Quầy Bar</option>
                  <option value="DESSERT">Tráng Miệng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Số Suất Dự Kiến</label>
                <input
                  type="number"
                  value={form.stockCount}
                  onChange={(e) => setForm({ ...form, stockCount: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink-primary">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-900 focus:ring-brand-800"
                  />
                  <span>Gắn nhãn Bán Chạy</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">Mô Tả Hương Vị</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Gợi ý: Thơm ngon, đậm đà theo công thức gia truyền..."
                className="w-full p-2.5 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
              />
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
                className="rounded-full bg-brand-900 text-white text-xs px-5"
              >
                Lưu Món Vào Thực Đơn
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
