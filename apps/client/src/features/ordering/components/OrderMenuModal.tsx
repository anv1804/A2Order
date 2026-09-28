import React, { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Badge, Icon } from "@/components/ui";
import { TableItem, CartItem } from "@/types";

export interface MenuDishItem {
  id: string;
  name: string;
  category: "PHO_BUN" | "NUONG_LAU" | "KHAI_VI" | "DOUONG";
  categoryLabel: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isPopular?: boolean;
}

const MENU_DATABASE: MenuDishItem[] = [
  { id: "m1", name: "Phở Bò Tái Nạm", category: "PHO_BUN", categoryLabel: "Phở & Bún", price: 65000, isAvailable: true, isPopular: true },
  { id: "m2", name: "Phở Bò Tái Lăn", category: "PHO_BUN", categoryLabel: "Phở & Bún", price: 70000, isAvailable: true },
  { id: "m3", name: "Bún Chả Hà Nội Đặc Biệt", category: "PHO_BUN", categoryLabel: "Phở & Bún", price: 60000, isAvailable: true, isPopular: true },
  { id: "m4", name: "Bò Tái Thăn Thượng Hạng", category: "PHO_BUN", categoryLabel: "Phở & Bún", price: 85000, isAvailable: true },
  { id: "m5", name: "Lẩu Đuôi Bò Nồi Đất", category: "NUONG_LAU", categoryLabel: "Nướng & Lẩu", price: 350000, isAvailable: true, isPopular: true },
  { id: "m6", name: "Bò Nướng Tảng Sốt Phô Mai", category: "NUONG_LAU", categoryLabel: "Nướng & Lẩu", price: 185000, isAvailable: true },
  { id: "m7", name: "Nem Rán Hải Sản (4 chiếc)", category: "KHAI_VI", categoryLabel: "Khai Vị", price: 55000, isAvailable: true },
  { id: "m8", name: "Gỏi Cuốn Tôm Thịt (3 cuốn)", category: "KHAI_VI", categoryLabel: "Khai Vị", price: 45000, isAvailable: true },
  { id: "m9", name: "Quẩy Giòn Phở", category: "KHAI_VI", categoryLabel: "Khai Vị", price: 10000, isAvailable: true },
  { id: "m10", name: "Trứng Gà Trần", category: "KHAI_VI", categoryLabel: "Khai Vị", price: 12000, isAvailable: true },
  { id: "m11", name: "Trà Đào Cam Sả", category: "DOUONG", categoryLabel: "Đồ Uống", price: 35000, isAvailable: true, isPopular: true },
  { id: "m12", name: "Trà Chanh Mật Ong", category: "DOUONG", categoryLabel: "Đồ Uống", price: 25000, isAvailable: true },
  { id: "m13", name: "Bia Tiger Bạc (Lon)", category: "DOUONG", categoryLabel: "Đồ Uống", price: 28000, isAvailable: true },
  { id: "m14", name: "Coca Cola / Pepsi", category: "DOUONG", categoryLabel: "Đồ Uống", price: 18000, isAvailable: true },
];

const QUICK_NOTES = ["Không hành", "Nhiều nước béo", "Ít cay", "Cay nhiều", "Ít đá", "Để riêng nước dùng"];

interface OrderMenuModalProps {
  isOpen: boolean;
  table: TableItem | null;
  onClose: () => void;
  onSubmitOrder: (tableName: string, items: CartItem[]) => void;
}

export const OrderMenuModal: React.FC<OrderMenuModalProps> = ({
  isOpen,
  table,
  onClose,
  onSubmitOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, { dish: MenuDishItem; quantity: number; notes: string }>>({});
  const [activeNoteDishId, setActiveNoteDishId] = useState<string | null>(null);

  if (!isOpen || !table) return null;

  const categories = [
    { id: "ALL", label: "Tất Cả Món" },
    { id: "PHO_BUN", label: "🍜 Phở & Bún" },
    { id: "NUONG_LAU", label: "🍲 Lẩu & Nướng" },
    { id: "KHAI_VI", label: "🥟 Khai Vị" },
    { id: "DOUONG", label: "🍹 Đồ Uống" },
  ];

  const filteredDishes = MENU_DATABASE.filter((d) => {
    if (selectedCategory !== "ALL" && d.category !== selectedCategory) return false;
    if (searchQuery.trim() && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddDish = (dish: MenuDishItem) => {
    setSelectedItems((prev) => {
      const existing = prev[dish.id];
      if (existing) {
        return {
          ...prev,
          [dish.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [dish.id]: { dish, quantity: 1, notes: "" },
      };
    });
  };

  const handleRemoveOrDecrease = (dishId: string) => {
    setSelectedItems((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[dishId];
        return next;
      }
      return {
        ...prev,
        [dishId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const handleSetNote = (dishId: string, note: string) => {
    setSelectedItems((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;
      return {
        ...prev,
        [dishId]: { ...existing, notes: note },
      };
    });
  };

  const orderList = Object.values(selectedItems);
  const totalAmount = orderList.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const totalQuantity = orderList.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirmSubmit = () => {
    if (orderList.length === 0) return;
    const cartItems: CartItem[] = orderList.map((item) => ({
      id: item.dish.id,
      name: item.dish.name,
      price: item.dish.price,
      quantity: item.quantity,
      notes: item.notes || undefined,
    }));
    onSubmitOrder(table.name, cartItems);
    setSelectedItems({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[820px] rounded-3xl shadow-2xl border border-surface-border flex flex-col overflow-hidden animate-scaleUp">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-surface-canvas border-b border-surface-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-black shadow-sm">
              <Icon name="table" className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-ink-primary">{table.name}</h3>
                <Badge variant={table.status === "EMPTY" ? "default" : "brand"}>
                  {table.status === "EMPTY" ? "Bàn Mới" : "Đang Phục Vụ"}
                </Badge>
              </div>
              <p className="text-xs text-ink-muted">Chọn món nhanh & gửi lệnh vào màn hình bếp (KDS)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món nhanh..."
                className="w-full h-9 pl-8 pr-3 rounded-full border border-surface-border text-xs font-semibold text-ink-primary bg-white focus:outline-none focus:border-brand-800"
              />
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="px-5 py-2.5 border-b border-surface-border bg-white flex items-center gap-2 overflow-x-auto shrink-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === c.id
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-surface-canvas text-ink-muted hover:text-ink-primary border border-surface-border/60"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Body 2 columns: Left = Menu Grid, Right = Current Order Basket */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Menu Dishes Grid */}
          <div className="flex-1 p-4 overflow-y-auto bg-surface-canvas/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDishes.map((dish) => {
                const inCart = selectedItems[dish.id];
                return (
                  <div
                    key={dish.id}
                    onClick={() => handleAddDish(dish)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      inCart
                        ? "bg-brand-50/70 border-brand-800 shadow-sm"
                        : "bg-white border-surface-border hover:border-brand-300 hover:shadow-card"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-xs text-ink-primary line-clamp-1">{dish.name}</h4>
                        {dish.isPopular && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                            ★ HOT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-subtle">{dish.categoryLabel}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-xs text-brand-900">{formatCurrency(dish.price)}</span>
                      {inCart ? (
                        <div
                          className="flex items-center gap-1.5 bg-brand-900 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleRemoveOrDecrease(dish.id)}
                            className="w-4 h-4 flex items-center justify-center hover:opacity-80"
                          >
                            -
                          </button>
                          <span>{inCart.quantity}</span>
                          <button
                            onClick={() => handleAddDish(dish)}
                            className="w-4 h-4 flex items-center justify-center hover:opacity-80"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-7 h-7 rounded-xl bg-surface-muted hover:bg-brand-900 hover:text-white text-ink-primary flex items-center justify-center transition-colors"
                        >
                          <Icon name="plus" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Order Basket */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-surface-border flex flex-col justify-between shrink-0">
            <div className="p-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-ink-primary">Giỏ Gọi Món</h4>
                <p className="text-[11px] text-ink-muted">{totalQuantity} phần ăn đang chọn</p>
              </div>
              {orderList.length > 0 && (
                <button
                  onClick={() => setSelectedItems({})}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* List of items in basket */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {orderList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-muted">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mb-2">
                    <Icon name="cart" className="w-6 h-6 text-ink-subtle" />
                  </div>
                  <p className="text-xs font-bold text-ink-primary">Chưa có món nào được chọn</p>
                  <p className="text-[11px] text-ink-subtle mt-0.5">Chạm vào món ăn ở bảng thực đơn bên trái để thêm</p>
                </div>
              ) : (
                orderList.map((item) => (
                  <div key={item.dish.id} className="p-3 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-xs text-ink-primary truncate">{item.dish.name}</div>
                        <div className="text-[11px] font-bold text-brand-900">{formatCurrency(item.dish.price * item.quantity)}</div>
                      </div>

                      <div className="flex items-center gap-1 bg-white border border-surface-border rounded-xl px-1.5 py-0.5 shadow-sm">
                        <button
                          onClick={() => handleRemoveOrDecrease(item.dish.id)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-black text-ink-muted hover:text-rose-600"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black text-ink-primary">{item.quantity}</span>
                        <button
                          onClick={() => handleAddDish(item.dish)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-black text-ink-muted hover:text-brand-900"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Note Editor */}
                    <div className="pt-1.5 border-t border-surface-border/50">
                      {activeNoteDishId === item.dish.id ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleSetNote(item.dish.id, e.target.value)}
                            placeholder="Gõ ghi chú bếp..."
                            className="w-full h-7 px-2 text-[11px] rounded-lg border border-brand-800 bg-white focus:outline-none font-medium"
                            autoFocus
                          />
                          <div className="flex flex-wrap gap-1">
                            {QUICK_NOTES.map((n) => (
                              <button
                                key={n}
                                onClick={() => handleSetNote(item.dish.id, n)}
                                className="px-1.5 py-0.5 rounded-md bg-white border border-surface-border text-[9px] font-bold text-ink-muted hover:text-brand-900"
                              >
                                {n}
                              </button>
                            ))}
                            <button
                              onClick={() => setActiveNoteDishId(null)}
                              className="text-[9px] font-bold text-brand-800 ml-auto hover:underline"
                            >
                              Xong
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setActiveNoteDishId(item.dish.id)}
                          className="text-[10px] text-ink-muted hover:text-brand-900 cursor-pointer flex items-center justify-between"
                        >
                          <span className={item.notes ? "font-bold text-amber-700" : "italic"}>
                            {item.notes ? `📝 ${item.notes}` : "+ Thêm ghi chú bếp..."}
                          </span>
                          <Icon name="edit" className="w-3 h-3 text-ink-subtle" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Total & Gửi Bếp Button */}
            <div className="p-4 border-t border-surface-border bg-surface-canvas space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted font-bold">Tổng cộng:</span>
                <span className="text-lg font-black text-brand-950">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="md"
                  variant="outline"
                  className="rounded-2xl text-xs w-1/3"
                  onClick={onClose}
                >
                  Đóng
                </Button>

                <Button
                  size="md"
                  disabled={orderList.length === 0}
                  className="flex-1 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-black text-xs gap-2 shadow-sm"
                  onClick={handleConfirmSubmit}
                >
                  <Icon name="send" className="w-4 h-4 text-white" />
                  <span>GỬI BẾP ({totalQuantity})</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
