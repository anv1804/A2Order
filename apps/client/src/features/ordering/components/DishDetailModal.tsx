import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Icon } from "@/components/ui";
import { MenuDishItem, QUICK_NOTES } from "@/data/mockMenu";

interface DishDetailModalProps {
  isOpen: boolean;
  dish: MenuDishItem | null;
  initialQuantity?: number;
  initialNotes?: string;
  initialVariant?: string;
  initialOptions?: string[];
  onClose: () => void;
  onConfirm: (payload: {
    dish: MenuDishItem;
    quantity: number;
    notes: string;
    selectedVariant?: string;
    selectedOptions?: string[];
    priceWithExtras: number;
  }) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  isOpen,
  dish,
  initialQuantity = 1,
  initialNotes = "",
  initialVariant,
  initialOptions = [],
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [notes, setNotes] = useState(initialNotes);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (dish && isOpen) {
      setQuantity(initialQuantity > 0 ? initialQuantity : 1);
      setNotes(initialNotes || "");
      if (initialVariant) {
        setSelectedVariant(initialVariant);
      } else if (dish.variants && dish.variants.length > 0) {
        setSelectedVariant(dish.variants[0].name);
      } else {
        setSelectedVariant("");
      }
      setSelectedOptions(initialOptions || []);
    }
  }, [dish?.id, isOpen]);

  if (!isOpen || !dish) return null;

  // Tính giá variant (nếu có variant thì lấy giá variant thay thế dish.price)
  const currentVariantObj = dish.variants?.find((v) => v.name === selectedVariant);
  const basePrice = currentVariantObj ? currentVariantObj.price : dish.price;

  // Tính phụ phí option đã chọn
  let optionsExtra = 0;
  dish.optionGroups?.forEach((group) => {
    group.options.forEach((opt) => {
      if (selectedOptions.includes(opt.name)) {
        optionsExtra += opt.priceModifier || 0;
      }
    });
  });

  const unitPrice = basePrice + optionsExtra;
  const totalPrice = unitPrice * quantity;

  const handleToggleOption = (optName: string, isRadio: boolean, groupOptionNames: string[]) => {
    if (isRadio) {
      setSelectedOptions((prev) => [
        ...prev.filter((item) => !groupOptionNames.includes(item)),
        optName,
      ]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optName)
          ? prev.filter((item) => item !== optName)
          : [...prev, optName]
      );
    }
  };

  const handleApplyQuickNote = (noteText: string) => {
    setNotes((prev) => {
      if (!prev || !prev.trim()) {
        return noteText;
      }
      if (prev.includes(noteText)) {
        return prev;
      }
      return `${prev}, ${noteText}`;
    });
  };

  const handleConfirm = () => {
    onConfirm({
      dish,
      quantity,
      notes: notes.trim(),
      selectedVariant: selectedVariant || undefined,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
      priceWithExtras: unitPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-ink-primary/75 backdrop-blur-xs animate-fadeIn">
      {/* Container Dialog */}
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-surface-border flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-scaleUp">
        {/* Header chi tiết món */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-surface-border flex items-center justify-between gap-3 bg-surface-canvas shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-surface-muted shrink-0 shadow-sm">
              {dish.image ? (
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-xs text-ink-muted">
                  A2
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 inline-block">
                {dish.categoryLabel}
              </span>
              <h3 className="text-sm sm:text-base font-black text-ink-primary mt-0.5 truncate">{dish.name}</h3>
              <p className="text-xs font-black text-brand-900">
                Giá gốc: {formatCurrency(dish.price)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary transition-colors shrink-0"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung scroll chọn biến thể, option, ghi chú */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* 1. Chọn biến thể (Size/Loại) */}
          {dish.variants && dish.variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-ink-primary flex items-center gap-1.5">
                  <span>Chọn Phân Loại / Kích Cỡ:</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  Đang chọn: {selectedVariant || "Chưa chọn"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dish.variants.map((variant) => {
                  const isSelected = selectedVariant === variant.name;
                  return (
                    <button
                      key={variant.id || variant.name}
                      type="button"
                      onClick={() => setSelectedVariant(variant.name)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                        isSelected
                          ? "border-brand-900 bg-brand-50 text-brand-900 font-black ring-2 ring-brand-900 shadow-xs"
                          : "border-surface-border bg-white text-ink-primary hover:border-brand-300 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-brand-900 bg-brand-900" : "border-surface-border bg-white"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs truncate">{variant.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-ink-muted shrink-0 ml-1">
                        {formatCurrency(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Chọn Tuỳ chọn thêm (Option Groups) */}
          {dish.optionGroups && dish.optionGroups.map((group) => {
            const groupOptionNames = group.options.map((o) => o.name);
            return (
              <div key={group.id || group.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-ink-primary">
                    {group.name}
                  </label>
                  <span className="text-[10px] text-ink-muted font-bold">
                    {group.required ? "(Bắt buộc chọn 1)" : "(Tuỳ chọn thêm)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.options.map((opt) => {
                    const isChecked = selectedOptions.includes(opt.name);
                    const isRadio = !!group.required;
                    return (
                      <button
                        key={opt.id || opt.name}
                        type="button"
                        onClick={() => handleToggleOption(opt.name, isRadio, groupOptionNames)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-1 transition-all active:scale-98 ${
                          isChecked
                            ? "border-brand-900 bg-brand-50 text-brand-900 font-black ring-1.5 ring-brand-900 shadow-2xs"
                            : "border-surface-border bg-white text-ink-primary hover:border-brand-300 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                            isChecked ? "bg-brand-900 text-white font-bold" : "border border-surface-border bg-white"
                          }`}>
                            {isChecked ? "✓" : ""}
                          </div>
                          <span className="text-xs truncate">{opt.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-ink-muted shrink-0 whitespace-nowrap">
                          {opt.priceModifier && opt.priceModifier > 0
                            ? `+${formatCurrency(opt.priceModifier)}`
                            : "Miễn phí"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Ghi chú chi tiết cho đầu bếp */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-ink-primary">
                Ghi Chú Chi Tiết Cho Đầu Bếp (KDS):
              </label>
              <span className="text-[10px] text-brand-900 font-bold bg-brand-50 px-2 py-0.5 rounded-full">
                Hiển thị nổi bật tại bếp
              </span>
            </div>
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Không hành lá, nhiều ớt tươi, chia 2 bát nhỏ..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-surface-canvas focus:bg-white focus:outline-none focus:border-brand-900 transition-colors resize-none"
              />
            </div>

            {/* Gợi ý nhanh */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_NOTES.map((qn) => {
                const isActive = notes.includes(qn);
                return (
                  <button
                    key={qn}
                    type="button"
                    onClick={() => handleApplyQuickNote(qn)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border active:scale-95 ${
                      isActive
                        ? "bg-brand-900 text-white border-brand-900 shadow-2xs"
                        : "bg-surface-canvas hover:bg-brand-50 text-ink-primary hover:text-brand-900 border-surface-border"
                    }`}
                  >
                    + {qn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Bộ tăng giảm số lượng to rõ + Nút xác nhận */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-canvas flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Số lượng phần ăn này:</span>

            {/* Bộ tăng giảm số lượng to bản */}
            <div className="flex items-center bg-white border border-surface-border rounded-2xl shadow-sm p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-ink-primary hover:bg-surface-muted active:scale-90 transition-all"
                title="Giảm 1"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) || val < 1 ? 1 : val);
                }}
                className="w-12 h-10 text-center font-black text-base text-ink-primary bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center font-black text-lg hover:bg-black active:scale-90 transition-all shadow-sm"
                title="Tăng 1"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-border/60">
            <div>
              <span className="text-[11px] text-ink-muted block">Tổng tiền:</span>
              <strong className="text-base sm:text-lg font-black text-brand-900">
                {formatCurrency(totalPrice)}
              </strong>
            </div>

            <Button
              size="lg"
              onClick={handleConfirm}
              className="flex-1 rounded-2xl bg-brand-900 hover:bg-black text-white font-black text-xs sm:text-sm py-3 shadow-md"
            >
              <span>Xác Nhận • Thêm Vào Bàn</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
