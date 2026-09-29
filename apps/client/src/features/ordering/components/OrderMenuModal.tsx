import React, { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Badge, Icon } from "@/components/ui";
import { TableItem, CartItem } from "@/types";
import { MenuDishItem, MENU_DATABASE } from "@/data/mockMenu";
import { OrderStepNav } from "./OrderStepNav";
import { DishCard } from "./DishCard";
import { CartSidebar, SelectedDishItem } from "./CartSidebar";
import { OrderReviewStep } from "./OrderReviewStep";
import { DishDetailModal } from "./DishDetailModal";

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
  const [orderStep, setOrderStep] = useState<"TABLE_INFO" | "SELECT_MENU" | "REVIEW_CART">("SELECT_MENU");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  // Quản lý giỏ hàng theo unique ID (hỗ trợ 1 món nhiều biến thể khác nhau)
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedDishItem>>({});
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  
  // State mở modal chi tiết món
  const [detailContext, setDetailContext] = useState<{
    dish: MenuDishItem;
    editingItemId?: string;
  } | null>(null);

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

  // Tăng số lượng của item cụ thể trong giỏ
  const handleIncreaseQuantity = (itemId: string) => {
    setSelectedItems((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  // Giảm số lượng của item cụ thể trong giỏ
  const handleDecreaseQuantity = (itemId: string) => {
    setSelectedItems((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  // Quick add từ nút + trên DishCard
  const handleQuickAdd = (dish: MenuDishItem) => {
    const existingEntry = Object.values(selectedItems).find((i) => i.dish.id === dish.id);
    if (existingEntry) {
      handleIncreaseQuantity(existingEntry.id);
    } else {
      const defaultVariant = dish.variants?.[0]?.name;
      const defaultPrice = dish.variants?.[0]?.price || dish.price;
      const newId = `${dish.id}_${Date.now()}`;
      setSelectedItems((prev) => ({
        ...prev,
        [newId]: {
          id: newId,
          dish,
          quantity: 1,
          notes: "",
          selectedVariant: defaultVariant,
          unitPrice: defaultPrice,
        },
      }));
    }
  };

  // Quick decrease từ nút - trên DishCard
  const handleQuickDecrease = (dish: MenuDishItem) => {
    const itemsOfDish = Object.values(selectedItems).filter((i) => i.dish.id === dish.id);
    if (itemsOfDish.length === 0) return;
    // Giảm item cuối cùng
    const lastItem = itemsOfDish[itemsOfDish.length - 1];
    handleDecreaseQuantity(lastItem.id);
  };

  const handleSetNote = (itemId: string, note: string) => {
    setSelectedItems((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, notes: note },
      };
    });
  };

  // Xử lý xác nhận từ DishDetailModal (chọn biến thể, options, ghi chú bếp)
  const handleConfirmDishDetail = (payload: {
    dish: MenuDishItem;
    quantity: number;
    notes: string;
    selectedVariant?: string;
    selectedOptions?: string[];
    priceWithExtras: number;
  }) => {
    if (detailContext?.editingItemId && selectedItems[detailContext.editingItemId]) {
      // Đang chỉnh sửa một item có sẵn trong giỏ
      setSelectedItems((prev) => ({
        ...prev,
        [detailContext.editingItemId!]: {
          ...prev[detailContext.editingItemId!],
          quantity: payload.quantity,
          notes: payload.notes,
          selectedVariant: payload.selectedVariant,
          selectedOptions: payload.selectedOptions,
          unitPrice: payload.priceWithExtras,
        },
      }));
    } else {
      // Thêm mới một phần ăn (cho phép khách đặt cùng 1 món nhưng nhiều biến thể / ghi chú khác nhau)
      const optionsKey = (payload.selectedOptions || []).sort().join(",");
      const matchExisting = Object.values(selectedItems).find(
        (i) =>
          i.dish.id === payload.dish.id &&
          i.selectedVariant === payload.selectedVariant &&
          (i.selectedOptions || []).sort().join(",") === optionsKey &&
          i.notes.trim() === payload.notes.trim()
      );

      if (matchExisting) {
        // Trùng 100% biến thể và ghi chú => cộng dồn số lượng
        setSelectedItems((prev) => ({
          ...prev,
          [matchExisting.id]: {
            ...matchExisting,
            quantity: matchExisting.quantity + payload.quantity,
          },
        }));
      } else {
        // Khác biến thể hoặc khác ghi chú => tạo dòng món riêng trong giỏ
        const newId = `${payload.dish.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setSelectedItems((prev) => ({
          ...prev,
          [newId]: {
            id: newId,
            dish: payload.dish,
            quantity: payload.quantity,
            notes: payload.notes,
            selectedVariant: payload.selectedVariant,
            selectedOptions: payload.selectedOptions,
            unitPrice: payload.priceWithExtras,
          },
        }));
      }
    }
    setDetailContext(null);
  };

  const orderList = Object.values(selectedItems);
  const totalAmount = orderList.reduce((sum, item) => sum + (item.unitPrice || item.dish.price) * item.quantity, 0);
  const totalQuantity = orderList.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirmSubmit = () => {
    if (orderList.length === 0) return;
    const cartItems: CartItem[] = orderList.map((item) => ({
      id: item.id,
      name: item.dish.name,
      price: item.unitPrice || item.dish.price,
      quantity: item.quantity,
      notes: item.notes || undefined,
      selectedVariant: item.selectedVariant,
      selectedOptions: item.selectedOptions,
    }));
    onSubmitOrder(table.name, cartItems);
    setSelectedItems({});
    onClose();
  };

  const handleHeaderBack = () => {
    if (orderStep === "REVIEW_CART") {
      setOrderStep("SELECT_MENU");
    } else if (orderStep === "SELECT_MENU") {
      setOrderStep("TABLE_INFO");
    } else {
      onClose();
    }
  };

  // Tính số lượng và trạng thái đã chọn cho từng card món
  const getDishCartMeta = (dishId: string) => {
    const items = orderList.filter((i) => i.dish.id === dishId);
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const distinctCount = items.length;
    const latestItem = items[items.length - 1];
    return {
      totalQuantityInCart: totalQty,
      distinctCount,
      latestNote: latestItem?.notes,
      latestVariant: latestItem?.selectedVariant,
    };
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-5 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[95vh] sm:h-[92vh] max-h-[820px] rounded-2xl sm:rounded-3xl shadow-2xl border border-surface-border flex flex-col overflow-hidden animate-scaleUp">
        {/* Top Header */}
        <div className="px-3 sm:px-5 py-3 sm:py-3.5 bg-surface-canvas border-b border-surface-border flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              onClick={handleHeaderBack}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white hover:bg-brand-50 border border-surface-border text-ink-primary hover:text-brand-900 transition-all text-xs font-black shrink-0 active:scale-95 shadow-2xs"
              title="Quay lại bước trước hoặc về sơ đồ bàn"
            >
              <Icon name="arrowLeft" className="w-4 h-4 text-brand-900" size={15} />
              <span className="hidden xs:inline">
                {orderStep === "REVIEW_CART"
                  ? "Chọn món"
                  : orderStep === "SELECT_MENU"
                  ? "Bàn"
                  : "Sơ đồ bàn"}
              </span>
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-900 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Icon name="table" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-ink-primary truncate">{table.name}</h3>
                <span className="text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 shrink-0">
                  {table.status === "EMPTY" ? "Bàn Mới" : "Đang Phục Vụ"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-ink-muted truncate hidden sm:block">Chọn món & gửi lệnh vào màn hình bếp (KDS)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-ink-muted block">Tạm tính giỏ món:</span>
              <strong className="text-sm font-black text-brand-900">{formatCurrency(totalAmount)}</strong>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary shrink-0 transition-colors"
              title="Đóng (Esc)"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-STEP ORDER NAVIGATION BAR */}
        <OrderStepNav
          orderStep={orderStep}
          setOrderStep={setOrderStep}
          totalQuantity={totalQuantity}
          totalAmount={totalAmount}
        />

        {/* Thanh Tìm Kiếm & Lọc Danh Mục Trong Chọn Món */}
        {orderStep === "SELECT_MENU" && (
          <div className="p-2.5 sm:px-5 sm:py-2.5 border-b border-surface-border bg-white flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    selectedCategory === c.id
                      ? "bg-brand-900 text-white shadow-sm"
                      : "bg-surface-canvas text-ink-muted hover:text-ink-primary border border-surface-border/60"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full">
              <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món trong thực đơn..."
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-surface-canvas focus:bg-white focus:outline-none focus:border-brand-800 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-muted text-ink-subtle flex items-center justify-center text-xs hover:text-ink-primary"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: TABLE INFO */}
        {orderStep === "TABLE_INFO" && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-surface-canvas/40 flex flex-col justify-between">
            <div className="max-w-xl mx-auto w-full space-y-4 sm:space-y-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-surface-border shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0">
                    <Icon name="table" className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-ink-primary">{table.name}</h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Khu vực: <span className="font-bold text-ink-primary">{table.zone === "T2" ? "Tầng 2 (Sân Vườn)" : table.zone === "VIP" ? "Phòng VIP" : table.zone === "SAN_VUON" ? "Khu Ngoài Trời" : "Tầng 1 (Máy Lạnh)"}</span>
                    </p>
                    <div className="mt-1">
                      <Badge variant={table.status === "EMPTY" ? "default" : "brand"}>
                        {table.status === "EMPTY" ? "Bàn trống sẵn sàng đón khách" : "Bàn đang có khách phục vụ"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-border grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface-canvas rounded-2xl">
                    <span className="text-ink-muted text-[11px] block">Sức chứa tối đa:</span>
                    <strong className="text-sm font-black text-ink-primary">4 - 6 Chỗ Ngồi</strong>
                  </div>
                  <div className="p-3 bg-surface-canvas rounded-2xl">
                    <span className="text-ink-muted text-[11px] block">Món đã chọn:</span>
                    <strong className="text-sm font-black text-brand-900">{totalQuantity} món ({formatCurrency(totalAmount)})</strong>
                  </div>
                </div>
              </div>

              <div className="bg-brand-50/70 border border-brand-200/80 p-3.5 sm:p-4 rounded-2xl text-xs text-brand-950 flex items-start gap-2.5 sm:gap-3">
                <Icon name="info" className="w-5 h-5 text-brand-800 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Quy trình phục vụ bàn chuyên nghiệp:</h5>
                  <p className="text-brand-900/80 text-[11px] mt-0.5">
                    1. Xác nhận số lượng khách → 2. Chuyển sang Tab <strong>"Chọn Món"</strong> để gọi món cho khách → 3. Kiểm tra giỏ hàng và bấm <strong>"Gửi Bếp"</strong> để KDS nhận đơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-xl mx-auto w-full pt-4 flex items-center justify-between border-t border-surface-border">
              <Button size="md" variant="outline" className="rounded-2xl text-xs" onClick={onClose}>
                Hủy Bỏ
              </Button>
              <Button
                size="md"
                className="rounded-2xl bg-brand-900 text-white font-black text-xs gap-1.5 shadow-sm hover:bg-black"
                onClick={() => setOrderStep("SELECT_MENU")}
              >
                <span>Tiếp Tục Chọn Món Cho Bàn</span>
                <Icon name="arrowRight" className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MENU DISHES SELECTOR */}
        {orderStep === "SELECT_MENU" && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-surface-canvas/50 pb-20 md:pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {filteredDishes.map((dish) => {
                  const meta = getDishCartMeta(dish.id);
                  return (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      totalQuantityInCart={meta.totalQuantityInCart}
                      distinctCount={meta.distinctCount}
                      latestNote={meta.latestNote}
                      latestVariant={meta.latestVariant}
                      onQuickAdd={handleQuickAdd}
                      onQuickDecrease={handleQuickDecrease}
                      onOpenDetail={(d) => setDetailContext({ dish: d })}
                    />
                  );
                })}
              </div>
            </div>

            <CartSidebar
              orderList={orderList}
              totalQuantity={totalQuantity}
              totalAmount={totalAmount}
              onIncreaseQuantity={handleIncreaseQuantity}
              onDecreaseQuantity={handleDecreaseQuantity}
              onSetNote={handleSetNote}
              onClearAll={() => setSelectedItems({})}
              activeNoteItemId={activeNoteItemId}
              setActiveNoteItemId={setActiveNoteItemId}
              onOpenDishDetail={(d, item) => setDetailContext({ dish: d, editingItemId: item?.id })}
              onGoToReview={() => setOrderStep("REVIEW_CART")}
              onGoToTableInfo={() => setOrderStep("TABLE_INFO")}
            />
          </div>
        )}

        {/* STEP 3: REVIEW CART & SEND TO KITCHEN */}
        {orderStep === "REVIEW_CART" && (
          <OrderReviewStep
            table={table}
            orderList={orderList}
            totalQuantity={totalQuantity}
            totalAmount={totalAmount}
            onGoBackToMenu={() => setOrderStep("SELECT_MENU")}
            onConfirmSubmit={handleConfirmSubmit}
          />
        )}
      </div>

      {/* Modal chi tiết biến thể / option / ghi chú bếp (Render cùng cấp root overlay z-50 che phủ hoàn toàn, không bị khuất) */}
      {detailContext && (
        <DishDetailModal
          isOpen={Boolean(detailContext)}
          dish={detailContext.dish}
          initialQuantity={detailContext.editingItemId ? selectedItems[detailContext.editingItemId]?.quantity : 1}
          initialNotes={detailContext.editingItemId ? selectedItems[detailContext.editingItemId]?.notes : ""}
          initialVariant={detailContext.editingItemId ? selectedItems[detailContext.editingItemId]?.selectedVariant : undefined}
          initialOptions={detailContext.editingItemId ? selectedItems[detailContext.editingItemId]?.selectedOptions : undefined}
          onClose={() => setDetailContext(null)}
          onConfirm={handleConfirmDishDetail}
        />
      )}
    </div>
  );
};
