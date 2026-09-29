import React, { useState, useEffect } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import {
  FnbDishItem,
  DishVariantOption,
  DishCustomizationGroup,
  FnbMajorCategory,
  FnbCategoryTemplate,
  FNB_MAJOR_CONFIG,
} from "@a2order/shared";

export interface CustomizationPreset {
  label: string;
  name: string;
  type: "SINGLE" | "MULTIPLE";
  required?: boolean;
  options: { name: string; priceModifier?: number }[];
}

export const SMART_CUSTOMIZATION_PRESETS: Record<FnbMajorCategory, CustomizationPreset[]> = {
  FOOD: [
    {
      label: "Hành Lá & Rau Thơm",
      name: "Hành Lá & Rau Thơm",
      type: "SINGLE",
      required: false,
      options: [
        { name: "Nhiều hành lá" },
        { name: "Hành lá vừa (Chuẩn vị)" },
        { name: "Không lấy hành" },
        { name: "Hành trần để riêng" },
      ],
    },
    {
      label: "Cấp Độ Cay / Ớt",
      name: "Cấp Độ Cay",
      type: "SINGLE",
      required: true,
      options: [
        { name: "Không cay (Không ớt)" },
        { name: "Ít cay (Hơi tê nhẹ)" },
        { name: "Cay vừa (Chuẩn vị)" },
        { name: "Cay nồng (Nhiều ớt)" },
        { name: "Ớt tươi để riêng" },
      ],
    },
    {
      label: "Khẩu Vị Mặn / Nhạt",
      name: "Khẩu Vị Nêm Nếm",
      type: "SINGLE",
      required: false,
      options: [
        { name: "Chuẩn vị vừa vặn" },
        { name: "Thanh nhạt (Ít muối / mắm)" },
        { name: "Đậm đà (Thêm nước mắm)" },
        { name: "Nước trong ít mỡ" },
      ],
    },
    {
      label: "Tỏi & Tiêu Thơm",
      name: "Gia Vị Tỏi & Tiêu",
      type: "MULTIPLE",
      required: false,
      options: [
        { name: "Nhiều tỏi phi giòn" },
        { name: "Không lấy tỏi phi" },
        { name: "Nhiều hạt tiêu thơm" },
        { name: "Không cho tiêu" },
      ],
    },
    {
      label: "Món Ăn Kèm Thêm",
      name: "Món Ăn Kèm Thêm",
      type: "MULTIPLE",
      required: false,
      options: [
        { name: "Thêm trứng ốp la", priceModifier: 10000 },
        { name: "Thêm cơm nóng", priceModifier: 8000 },
        { name: "Đĩa quẩy giòn (3 cái)", priceModifier: 10000 },
        { name: "Nước canh nóng thêm", priceModifier: 5000 },
      ],
    },
  ],
  DRINK: [
    {
      label: "Lượng Đá",
      name: "Lượng Đá",
      type: "SINGLE",
      required: true,
      options: [
        { name: "100% Đá (Đầy đủ ly chuẩn)" },
        { name: "70% Đá" },
        { name: "50% Ít đá" },
        { name: "Không đá" },
        { name: "Uống nóng" },
      ],
    },
    {
      label: "Mức Đường / Ngọt",
      name: "Mức Đường",
      type: "SINGLE",
      required: true,
      options: [
        { name: "100% Đường chuẩn" },
        { name: "70% Đường" },
        { name: "50% Ít ngọt" },
        { name: "30% Rất ít ngọt" },
        { name: "0% Không đường" },
      ],
    },
    {
      label: "Topping Thêm",
      name: "Topping Thêm",
      type: "MULTIPLE",
      required: false,
      options: [
        { name: "Trân châu đen dẻo", priceModifier: 6000 },
        { name: "Kem cheese Macchiato", priceModifier: 10000 },
        { name: "Pudding trứng béo", priceModifier: 8000 },
        { name: "Thạch dừa giòn", priceModifier: 6000 },
        { name: "Sốt cốt dừa tươi", priceModifier: 5000 },
      ],
    },
  ],
  DESSERT: [
    {
      label: "Độ Ngọt & Cốt Dừa",
      name: "Độ Ngọt & Cốt Dừa",
      type: "SINGLE",
      required: false,
      options: [
        { name: "Ngọt vừa thanh mát (Chuẩn)" },
        { name: "Ít ngọt" },
        { name: "Thêm nước cốt dừa béo", priceModifier: 5000 },
        { name: "Nhiều đá bào" },
        { name: "Không lấy đá bào" },
      ],
    },
    {
      label: "Topping Tráng Miệng",
      name: "Topping Tráng Miệng",
      type: "MULTIPLE",
      required: false,
      options: [
        { name: "Dừa khô giòn Bến Tre", priceModifier: 5000 },
        { name: "Cơm dừa non tươi", priceModifier: 5000 },
        { name: "Thạch khúc bạch phô mai", priceModifier: 8000 },
        { name: "Hạt sen Huế ninh mềm", priceModifier: 8000 },
        { name: "Hạt chia hữu cơ", priceModifier: 5000 },
      ],
    },
  ],
};

export interface ScenarioDishModalProps {
  isOpen: boolean;
  majorType: FnbMajorCategory;
  categories: FnbCategoryTemplate[];
  initialDish?: FnbDishItem | null;
  onClose: () => void;
  onSave: (dishData: Omit<FnbDishItem, "id">, dishId?: string) => Promise<void>;
  onOpenAddCategory?: (type: FnbMajorCategory) => void;
}

export const ScenarioDishModal: React.FC<ScenarioDishModalProps> = ({
  isOpen,
  majorType: initialMajorType,
  categories,
  initialDish,
  onClose,
  onSave,
  onOpenAddCategory,
}) => {
  const [selectedMajor, setSelectedMajor] = useState<FnbMajorCategory>(initialMajorType);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(35000);
  const [costPrice, setCostPrice] = useState(15000);
  const [station, setStation] = useState<"KITCHEN" | "BAR" | "DESSERT">("BAR");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<DishVariantOption[]>([]);
  const [customizationGroups, setCustomizationGroups] = useState<DishCustomizationGroup[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New variant state
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrice, setNewVarPrice] = useState<number>(10000);

  // New customization group state
  const [newGroupName, setNewGroupName] = useState("");
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState<number>(5000);

  // Filter categories by selected major category
  const filteredCategories = categories.filter((c) => c.majorType === selectedMajor);

  useEffect(() => {
    if (initialDish) {
      const derivedMajor: FnbMajorCategory =
        initialDish.majorCategory ||
        (initialDish.station === "KITCHEN" ? "FOOD" : initialDish.station === "DESSERT" ? "DESSERT" : "DRINK");
      setSelectedMajor(derivedMajor);
      setName(initialDish.name || "");
      setCategory(initialDish.category || "");
      setPrice(initialDish.price || 0);
      setCostPrice(initialDish.costPrice || 0);
      setStation(initialDish.station || FNB_MAJOR_CONFIG[derivedMajor].station);
      setImage(initialDish.image || "");
      setDescription(initialDish.description || "");
      setVariants(initialDish.variants ? [...initialDish.variants] : []);
      setCustomizationGroups(initialDish.customizationGroups ? [...initialDish.customizationGroups] : []);
    } else {
      setSelectedMajor(initialMajorType);
      const defaultCat = filteredCategories[0]?.name || "Món Mới";
      setName("");
      setCategory(defaultCat);
      setPrice(35000);
      setCostPrice(15000);
      setStation(FNB_MAJOR_CONFIG[initialMajorType].station);
      setImage("https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80");
      setDescription("");
      setVariants([
        { id: "v1", name: "Size M (Vừa)", price: 35000 },
        { id: "v2", name: "Size L (Lớn)", price: 45000 },
      ]);
      setCustomizationGroups([]);
    }
  }, [initialDish, isOpen, initialMajorType]);

  // When major category changes, update station and select first category if needed
  const handleSelectMajor = (type: FnbMajorCategory) => {
    setSelectedMajor(type);
    setStation(FNB_MAJOR_CONFIG[type].station);
    const cats = categories.filter((c) => c.majorType === type);
    if (cats.length > 0 && !cats.some((c) => c.name === category)) {
      setCategory(cats[0].name);
    }
  };

  if (!isOpen) return null;

  const handleAddVariant = () => {
    if (!newVarName.trim()) return;
    setVariants([
      ...variants,
      {
        id: `var-${Date.now()}`,
        name: newVarName.trim(),
        price: Number(newVarPrice) || 0,
      },
    ]);
    setNewVarName("");
    setNewVarPrice(price + 10000);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleAddCustomGroup = () => {
    if (!newGroupName.trim()) return;
    setCustomizationGroups([
      ...customizationGroups,
      {
        id: `grp-${Date.now()}`,
        name: newGroupName.trim(),
        type: "MULTIPLE",
        options: [],
      },
    ]);
    setNewGroupName("");
  };

  const handleRemoveCustomGroup = (groupId: string) => {
    setCustomizationGroups(customizationGroups.filter((g) => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    if (!newOptionName.trim()) return;
    setCustomizationGroups(
      customizationGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            ...g.options,
            {
              id: `opt-${Date.now()}`,
              name: newOptionName.trim(),
              priceModifier: Number(newOptionPrice) || 0,
            },
          ],
        };
      })
    );
    setNewOptionName("");
    setNewOptionPrice(5000);
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setCustomizationGroups(
      customizationGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.filter((o) => o.id !== optionId),
        };
      })
    );
  };

  const handleApplyPreset = (preset: CustomizationPreset) => {
    if (customizationGroups.some((g) => g.name.toLowerCase() === preset.name.toLowerCase())) {
      toast.info(`Nhóm tùy chọn "${preset.name}" đã tồn tại trong món`);
      return;
    }
    const newGroup: DishCustomizationGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      type: preset.type,
      required: preset.required,
      options: preset.options.map((opt) => ({
        id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: opt.name,
        priceModifier: opt.priceModifier || 0,
      })),
    };
    setCustomizationGroups([...customizationGroups, newGroup]);
    toast.success(`Đã thêm nhanh nhóm "${preset.name}"!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category: category.trim() || filteredCategories[0]?.name || "Món Nổi Bật",
          majorCategory: selectedMajor,
          price: Number(price) || 0,
          costPrice: Number(costPrice) || 0,
          station,
          isAvailable: true,
          image: image.trim(),
          description: description.trim(),
          variants: variants.length > 0 ? variants : undefined,
          customizationGroups: customizationGroups.length > 0 ? customizationGroups : undefined,
        },
        initialDish?.id
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-elevated border border-surface-border flex flex-col z-10 animate-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between bg-surface-canvas shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 shrink-0">
                <Icon name={FNB_MAJOR_CONFIG[selectedMajor].icon as any} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink-primary">
                  {initialDish ? `Sửa Món Mẫu: ${initialDish.name}` : "Thêm Món Mẫu Mới Vào Thư Viện"}
                </h3>
                <p className="text-xs text-ink-muted">
                  Thuộc trụ cột <span className="font-bold text-brand-900">{FNB_MAJOR_CONFIG[selectedMajor].label}</span> • Trạm:{" "}
                  {station === "KITCHEN" ? "Bếp Nấu" : station === "BAR" ? "Quầy Pha Chế" : "Bếp Tráng Miệng"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-ink-muted hover:text-ink-primary hover:bg-white rounded-xl transition-all"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content (Scrollable) */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* 1. Chọn Trụ Cột Chính */}
            <div>
              <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-2">
                1. Trụ Cột Thực Đơn <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
                  ([key, cfg]) => {
                    const isSelected = selectedMajor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectMajor(key)}
                        className={`p-2 sm:p-2.5 rounded-2xl border-2 text-center transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? "border-brand-900 bg-brand-50 shadow-xs font-black text-brand-900"
                            : "border-surface-border bg-white hover:border-brand-300 text-ink-secondary"
                        }`}
                      >
                        <Icon name={cfg.icon as any} className="w-4 h-4" />
                        <span className="text-xs">{cfg.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 2. Danh mục chi tiết */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-ink-primary uppercase tracking-wider">
                  2. Danh Mục Chi Tiết <span className="text-rose-500">*</span>
                </label>
                {onOpenAddCategory && (
                  <button
                    type="button"
                    onClick={() => onOpenAddCategory(selectedMajor)}
                    className="text-xs font-bold text-brand-900 hover:underline flex items-center gap-1"
                  >
                    <Icon name="plus" className="w-3 h-3" />
                    <span>+ Thêm danh mục mới</span>
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-brand-900 text-white shadow-xs"
                            : "bg-surface-canvas text-ink-secondary border border-surface-border hover:bg-white"
                        }`}
                      >
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>Chưa có danh mục nào trong nhóm này.</span>
                  {onOpenAddCategory && (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl text-xs font-bold h-7"
                      onClick={() => onOpenAddCategory(selectedMajor)}
                    >
                      Tạo Danh Mục Ngay
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Tên món, Giá bán, Giá vốn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                  Tên Món Mẫu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cà Phê Muối Kem Béo, Lẩu Bò Nhúng Dấm..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                  Giá Bán Đề Xuất (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-xl border border-surface-border text-xs font-black text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                  Giá Vốn Ước Tính (Cost)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-xl border border-surface-border text-xs font-bold text-ink-muted bg-white focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>

            {/* 4. Ảnh minh họa & Mô tả */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                  Đường Dẫn Ảnh Món (URL / Unsplash)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800"
                  />
                  {image && (
                    <img
                      src={image}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-surface-border shrink-0 shadow-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-ink-primary uppercase tracking-wider mb-1.5">
                  Mô Tả Món Ăn
                </label>
                <textarea
                  rows={2}
                  placeholder="Gợi ý thành phần, hương vị đặc trưng, nguyên liệu nổi bật..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 resize-none"
                />
              </div>
            </div>

            {/* 5. Biến Thể Size (Kích thước) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="tag" className="w-3.5 h-3.5 text-brand-900" />
                  <span>Biến Thể Size Đề Xuất ({variants.length})</span>
                </span>
                <span className="text-[11px] text-ink-muted">Tùy chọn kích cỡ (M, L, Ly lớn...)</span>
              </div>

              {variants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-surface-border text-xs"
                    >
                      <div>
                        <span className="font-bold text-ink-primary block">{v.name}</span>
                        <span className="text-[11px] text-brand-900 font-black">
                          {v.price.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="p-1 text-ink-muted hover:text-rose-600 transition-colors"
                        title="Xóa size"
                      >
                        <Icon name="x" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
                <input
                  type="text"
                  placeholder="Tên Size (VD: Size Lớn 700ml)"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="flex-1 h-8 px-3 rounded-xl border border-surface-border text-xs font-medium bg-white"
                />
                <input
                  type="number"
                  placeholder="Giá (VNĐ)"
                  value={newVarPrice || ""}
                  onChange={(e) => setNewVarPrice(Number(e.target.value))}
                  className="w-28 h-8 px-3 rounded-xl border border-surface-border text-xs font-bold bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 rounded-xl text-xs font-bold"
                  onClick={handleAddVariant}
                >
                  + Thêm
                </Button>
              </div>
            </div>

            {/* 6. Nhóm Tùy Chọn / Topping */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-3.5 h-3.5 text-brand-900" />
                  <span>Nhóm Topping / Tùy Chọn ({customizationGroups.length})</span>
                </span>
                <span className="text-[11px] text-ink-muted">Mức đường, đá, mặn/nhạt, hành tỏi, topping thêm...</span>
              </div>

              {/* Gợi Ý Mẫu Nhanh 1-Chạm Cho Từng Trụ Cột */}
              <div className="p-3 rounded-xl bg-white border border-surface-border shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-ink-primary flex items-center gap-1.5">
                    <Icon name="sparkles" className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi Ý Mẫu Nhanh 1-Chạm Cho {FNB_MAJOR_CONFIG[selectedMajor].label}:</span>
                  </span>
                  <span className="text-[10px] text-ink-muted">Bấm nút để chèn nhanh nhóm cấu hình chuẩn</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SMART_CUSTOMIZATION_PRESETS[selectedMajor].map((preset) => {
                    const isAdded = customizationGroups.some(
                      (g) => g.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        disabled={isAdded}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isAdded
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default opacity-80"
                            : "bg-surface-canvas hover:bg-brand-50 hover:border-brand-300 text-ink-secondary hover:text-brand-900 border-surface-border shadow-2xs active:scale-95"
                        }`}
                      >
                        {isAdded ? (
                          <Icon name="check" className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Icon name="plus" className="w-3 h-3 text-brand-900" />
                        )}
                        <span>{preset.label}</span>
                        {isAdded && <span className="text-[10px] font-normal text-emerald-600">(Đã thêm)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {customizationGroups.map((grp) => (
                <div key={grp.id} className="p-3 rounded-xl bg-white border border-surface-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-ink-primary">{grp.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomGroup(grp.id)}
                      className="text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      Xóa nhóm này
                    </button>
                  </div>

                  {grp.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {grp.options.map((opt) => (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-xs font-medium text-ink-secondary"
                        >
                          <span>{opt.name}</span>
                          {opt.priceModifier ? (
                            <span className="text-brand-900 font-bold">
                              +{opt.priceModifier.toLocaleString("vi-VN")}đ
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromGroup(grp.id, opt.id)}
                            className="text-ink-muted hover:text-rose-600 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
                    <input
                      type="text"
                      placeholder="Tên topping (VD: Trân Châu Đen)"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      className="flex-1 h-7 px-2.5 rounded-lg border border-surface-border text-xs bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Phụ thu (VNĐ)"
                      value={newOptionPrice || ""}
                      onChange={(e) => setNewOptionPrice(Number(e.target.value))}
                      className="w-24 h-7 px-2.5 rounded-lg border border-surface-border text-xs font-bold bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 rounded-lg text-xs font-bold"
                      onClick={() => handleAddOptionToGroup(grp.id)}
                    >
                      + Thêm Option
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
                <input
                  type="text"
                  placeholder="Tên nhóm mới (VD: Topping Thêm, Mức Đá, Độ Cay...)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 h-8 px-3 rounded-xl border border-surface-border text-xs font-medium bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 rounded-xl text-xs font-bold"
                  onClick={handleAddCustomGroup}
                >
                  + Tạo Nhóm Tùy Chọn
                </Button>
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-canvas flex items-center justify-end gap-2.5 shrink-0">
            <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold text-xs" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              className="rounded-xl bg-brand-900 text-white font-black text-xs px-6 shadow-sm gap-1.5"
              onClick={handleSubmit}
            >
              {isSaving ? (
                <>
                  <Icon name="refresh" className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Icon name="checkCircle" className="w-3.5 h-3.5" />
                  <span>{initialDish ? "Cập Nhật Món Mẫu" : "+ Lưu Món Mẫu Vào Thư Viện"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
