import React, { useState, useEffect, useRef } from "react";
import { Button, Portal, SearchableSelect } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { useUnsavedChanges } from "@/stores/unsavedChangesStore";
import {
  FnbDishItem,
  DishVariantOption,
  DishCustomizationGroup,
  FnbMajorCategory,
  FnbCategoryTemplate,
  FNB_MAJOR_CONFIG,
} from "@a2order/shared";
import {
  Utensils,
  Coffee,
  Cake,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Trash2,
  Plus,
  Layers,
  SlidersHorizontal,
  TrendingUp,
  Tag,
  DollarSign,
  ChevronDown,
  Check,
} from "lucide-react";

export interface ScenarioDishModalProps {
  isOpen: boolean;
  majorType: FnbMajorCategory;
  categories: FnbCategoryTemplate[];
  initialDish?: FnbDishItem | null;
  onClose: () => void;
  onSave: (dishData: Omit<FnbDishItem, "id">, dishId?: string) => Promise<void>;
}

export const ScenarioDishModal: React.FC<ScenarioDishModalProps> = ({
  isOpen,
  majorType: initialMajorType,
  categories,
  initialDish,
  onClose,
  onSave,
}) => {
  // Helper tính dữ liệu khởi tạo chính xác cho Form
  const getInitialFormState = () => {
    if (initialDish) {
      const derivedMajor: FnbMajorCategory =
        initialDish.majorCategory ||
        (initialDish.station === "KITCHEN" ? "FOOD" : initialDish.station === "DESSERT" ? "DESSERT" : "DRINK");
      return {
        selectedMajor: derivedMajor,
        name: initialDish.name || "",
        category: initialDish.category || "",
        price: initialDish.price || 0,
        costPrice: initialDish.costPrice || 0,
        station: initialDish.station || FNB_MAJOR_CONFIG[derivedMajor].station,
        image: initialDish.image || "",
        description: initialDish.description || "",
        variants: initialDish.variants ? [...initialDish.variants] : [],
        customizationGroups: initialDish.customizationGroups ? [...initialDish.customizationGroups] : [],
      };
    }
    const defaultCat = categories.filter((c) => c.majorType === initialMajorType)[0]?.name || "Món Mới";
    return {
      selectedMajor: initialMajorType,
      name: "",
      category: defaultCat,
      price: 35000,
      costPrice: 15000,
      station: FNB_MAJOR_CONFIG[initialMajorType].station,
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
      description: "",
      variants: [
        { id: "v1", name: "Size M (Vừa)", price: 35000 },
        { id: "v2", name: "Size L (Lớn)", price: 45000 },
      ],
      customizationGroups: [],
    };
  };

  const initialValues = getInitialFormState();
  const [selectedMajor, setSelectedMajor] = useState<FnbMajorCategory>(initialValues.selectedMajor);
  const [name, setName] = useState(initialValues.name);
  const [category, setCategory] = useState(initialValues.category);
  const [price, setPrice] = useState(initialValues.price);
  const [costPrice, setCostPrice] = useState(initialValues.costPrice);
  const [station, setStation] = useState<"KITCHEN" | "BAR" | "DESSERT">(initialValues.station);
  const [image, setImage] = useState(initialValues.image);
  const [description, setDescription] = useState(initialValues.description);
  const [variants, setVariants] = useState<DishVariantOption[]>(initialValues.variants);
  const [customizationGroups, setCustomizationGroups] = useState<DishCustomizationGroup[]>(initialValues.customizationGroups);
  const [isSaving, setIsSaving] = useState(false);

  // Tab switch giữa "Tùy Chọn" và "Biến Thể Size"
  const [activeTab, setActiveTab] = useState<"customizations" | "variants">("customizations");

  // State tạo nhóm tùy chọn mới (Custom Group)
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"SINGLE" | "MULTIPLE">("MULTIPLE");
  const [newGroupRequired, setNewGroupRequired] = useState(false);

  // State thêm lựa chọn cho từng nhóm cụ thể
  const [optionInputs, setOptionInputs] = useState<Record<string, { name: string; price: number | "" }>>({});

  // State thêm biến thể size mới
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrice, setNewVarPrice] = useState<number>(10000);

  // Lưu baseline signature chuẩn ngay khi modal mở
  const baselineSignatureRef = useRef<string>("");

  const computeSignature = (data: {
    selectedMajor: FnbMajorCategory;
    name: string;
    category: string;
    price: number;
    costPrice: number;
    station: "KITCHEN" | "BAR" | "DESSERT";
    image: string;
    description: string;
    variants: DishVariantOption[];
    customizationGroups: DishCustomizationGroup[];
  }) => {
    return JSON.stringify({
      selectedMajor: data.selectedMajor,
      name: data.name.trim(),
      category: data.category.trim(),
      price: Number(data.price) || 0,
      costPrice: Number(data.costPrice) || 0,
      station: data.station,
      image: data.image.trim(),
      description: data.description.trim(),
      variants: data.variants.map((v) => ({ name: v.name.trim(), price: Number(v.price) || 0 })),
      customizationGroups: data.customizationGroups.map((g) => ({
        name: g.name.trim(),
        type: g.type,
        required: g.required,
        options: g.options.map((o) => ({ name: o.name.trim(), priceModifier: Number(o.priceModifier) || 0 })),
      })),
    });
  };

  // Filter categories by selected major category
  const filteredCategories = categories.filter((c) => c.majorType === selectedMajor);

  useEffect(() => {
    if (isOpen) {
      const reset = getInitialFormState();
      setSelectedMajor(reset.selectedMajor);
      setName(reset.name);
      setCategory(reset.category);
      setPrice(reset.price);
      setCostPrice(reset.costPrice);
      setStation(reset.station);
      setImage(reset.image);
      setDescription(reset.description);
      setVariants(reset.variants);
      setCustomizationGroups(reset.customizationGroups);
      setNewVarName("");
      setNewVarPrice(reset.price + 10000);
      setIsAddingGroup(false);
      setNewGroupName("");
      setNewGroupType("MULTIPLE");
      setNewGroupRequired(false);
      setOptionInputs({});

      if (reset.variants.length > 0 && reset.customizationGroups.length === 0) {
        setActiveTab("variants");
      } else {
        setActiveTab("customizations");
      }

      baselineSignatureRef.current = computeSignature(reset);
    } else {
      baselineSignatureRef.current = "";
    }
  }, [isOpen, initialDish, initialMajorType]);

  const currentSignature = computeSignature({
    selectedMajor,
    name,
    category,
    price,
    costPrice,
    station,
    image,
    description,
    variants,
    customizationGroups,
  });

  const isDirty =
    isOpen &&
    baselineSignatureRef.current !== "" &&
    currentSignature !== baselineSignatureRef.current;

  useUnsavedChanges("scenario_dish_modal", isDirty);

  const requestClose = async () => {
    if (isDirty) {
      const discard = await confirmDialog({
        title: "Bỏ thay đổi chưa lưu?",
        message: "Những thông tin bạn vừa chỉnh sửa sẽ không được lưu.",
        confirmText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        variant: "warning",
      });
      if (!discard) return;
    }
    onClose();
  };

  const handleSelectMajor = (type: FnbMajorCategory) => {
    setSelectedMajor(type);
    setStation(FNB_MAJOR_CONFIG[type].station);
    const cats = categories.filter((c) => c.majorType === type);
    if (cats.length > 0 && !cats.some((c) => c.name === category)) {
      setCategory(cats[0].name);
    }
  };

  if (!isOpen) return null;

  // --- Thao tác Biến Thể Size ---
  const handleAddVariant = () => {
    if (!newVarName.trim()) {
      toast.error("Vui lòng nhập tên kích thước");
      return;
    }
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: newVarName.trim(),
        price: Number(newVarPrice) || 0,
      },
    ]);
    setNewVarName("");
    setNewVarPrice(price + 10000);
    toast.success(`Đã thêm kích thước "${newVarName.trim()}"!`);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // --- Thao tác Nhóm Tùy Chọn (Custom Group) ---
  const handleCreateCustomGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm tùy chọn");
      return;
    }
    const cleanName = newGroupName.trim();
    if (customizationGroups.some((g) => g.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.info(`Nhóm tùy chọn "${cleanName}" đã tồn tại`);
      return;
    }

    const newGroup: DishCustomizationGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      type: newGroupType,
      required: newGroupRequired,
      options: [],
    };

    setCustomizationGroups((prev) => [...prev, newGroup]);
    setNewGroupName("");
    setNewGroupType("MULTIPLE");
    setNewGroupRequired(false);
    setIsAddingGroup(false);
    toast.success(`Đã tạo nhóm "${cleanName}".`);
  };

  const handleRemoveCustomGroup = (groupId: string) => {
    setCustomizationGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleOptionInputChange = (groupId: string, field: "name" | "price", value: string | number) => {
    setOptionInputs((prev) => ({
      ...prev,
      [groupId]: {
        name: field === "name" ? String(value) : prev[groupId]?.name || "",
        price: field === "price" ? (value === "" ? "" : Number(value)) : prev[groupId]?.price ?? "",
      },
    }));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    const cur = optionInputs[groupId];
    if (!cur || !cur.name.trim()) {
      toast.error("Vui lòng nhập tên lựa chọn");
      return;
    }
    const optName = cur.name.trim();
    const optPrice = Number(cur.price) || 0;

    setCustomizationGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            ...g.options,
            {
              id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: optName,
              priceModifier: optPrice,
            },
          ],
        };
      })
    );

    setOptionInputs((prev) => ({
      ...prev,
      [groupId]: { name: "", price: "" },
    }));
    toast.success(`Đã thêm lựa chọn "${optName}"!`);
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setCustomizationGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.filter((o) => o.id !== optionId),
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên món mẫu");
      return;
    }

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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-ink-primary/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
          onClick={requestClose}
        />

        {/* Modal Container: Siêu gọn gàng (~400px), 2 cột bằng nhau tuyệt đối, không scroll */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-canvas rounded-3xl shadow-elevated flex flex-col z-10 animate-in zoom-in-95 duration-150 overflow-hidden border border-surface-border">
          
          {/* Header gọn gàng, chuẩn SaaS */}
          <div className="px-5 py-2.5 sm:py-3 border-b border-surface-border flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-900 shrink-0">
                {selectedMajor === "FOOD" ? (
                  <Utensils size={16} className="text-brand-800" />
                ) : selectedMajor === "DRINK" ? (
                  <Coffee size={16} className="text-brand-800" />
                ) : (
                  <Cake size={16} className="text-brand-800" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink-primary leading-tight">
                  {initialDish ? `Chỉnh Sửa: ${initialDish.name}` : "Thêm Món Mẫu Mới"}
                </h3>
                <p className="text-[11px] font-bold text-ink-muted flex items-center gap-1.5">
                  <span className="text-brand-900">{FNB_MAJOR_CONFIG[selectedMajor].label}</span>
                  <span>•</span>
                  <span>{station === "KITCHEN" ? "Bếp Nấu" : station === "BAR" ? "Quầy Pha Chế" : "Bếp Tráng Miệng"}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestClose}
              className="w-8 h-8 rounded-xl text-ink-muted hover:text-ink-primary hover:bg-surface-canvas flex items-center justify-center transition-all"
              title="Đóng modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content: 2 cột đối xứng bằng nhau hoàn hảo (items-stretch), không bị cuộn */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
              
              {/* ==================================================== */}
              {/* CỘT TRÁI: ẢNH MÓN + TÊN MÓN + GIÁ BÁN & LỢI NHUẬN    */}
              {/* ==================================================== */}
              <div className="flex flex-col gap-3 h-full">
                
                {/* 1. KHU VỰC ẢNH ĐẠI DIỆN: VUÔNG & NHỎ GỌN */}
                <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-surface-border shadow-2xs">
                  <div className="flex items-center justify-between border-b border-surface-border/70 pb-1.5 mb-2.5">
                    <h4 className="font-extrabold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-brand-800" /> Ảnh Đại Diện Món
                    </h4>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                      >
                        <Trash2 size={12} />
                        <span>Xóa ảnh</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Khung ảnh vuông nhỏ gọn */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 aspect-square rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shadow-inner shrink-0 group">
                      {image ? (
                        <>
                          <img
                            src={image}
                            alt="Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1.5 pointer-events-none">
                            <span className="text-[10px] font-bold text-white drop-shadow">Xem trước</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-brand-50/30">
                          <div className="w-7 h-7 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-800 mb-0.5">
                            {selectedMajor === "FOOD" ? (
                              <Utensils size={14} />
                            ) : selectedMajor === "DRINK" ? (
                              <Coffee size={14} />
                            ) : (
                              <Cake size={14} />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-ink-muted">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Cột nhập link ảnh */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <label className="block text-xs font-bold text-ink-secondary">
                        Đường Dẫn Hình Ảnh (URL)
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
                        <input
                          type="url"
                          placeholder="Dán link ảnh https://..."
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          className="w-full h-9 pl-8 pr-7 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 transition shadow-2xs placeholder:text-ink-subtle"
                        />
                        {image && (
                          <button
                            type="button"
                            onClick={() => setImage("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-primary p-0.5"
                            title="Xóa link"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted">Hỗ trợ định dạng JPG, PNG, WebP từ web</p>
                    </div>
                  </div>
                </div>

                {/* 2. TÊN MÓN MẪU: ĐẶT GIỮA ẢNH VÀ GIÁ BÁN/LỢI NHUẬN */}
                <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-surface-border shadow-2xs space-y-1.5">
                  <label className="block text-xs font-bold text-ink-primary flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag size={14} className="text-brand-800" />
                      <span>Tên Món Mẫu</span>
                      <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10.5px] font-normal text-ink-muted">Tên hiển thị trên menu</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cơm Tấm Sườn Bì Chả Đặc Biệt..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 transition shadow-2xs placeholder:text-ink-subtle"
                  />
                </div>

                {/* 3. GIÁ BÁN, GIÁ VỐN & MÔ TẢ THÀNH PHẦN (CO DÃN TỰ ĐỘNG BẰNG CỘT PHẢI) */}
                <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-surface-border shadow-2xs space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5 border-b border-surface-border/70 pb-1.5">
                      <h4 className="font-extrabold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <DollarSign size={14} className="text-brand-800 shrink-0" />
                        <span>Giá & Lãi Dự Tính</span>
                      </h4>
                      {price > 0 && costPrice > 0 && price > costPrice && (
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md text-[10.5px] sm:text-[11px] inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                          <TrendingUp size={11} className="text-emerald-600 shrink-0" />
                          <span>+{Math.round(((price - costPrice) / price) * 100)}% lãi</span>
                          <span className="hidden sm:inline">(+{(price - costPrice).toLocaleString("vi-VN")}₫)</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-ink-secondary mb-1">
                          Giá Bán Đề Xuất <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min={0}
                            step={1000}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full h-9 pl-3 pr-7 rounded-xl border border-surface-border text-xs font-bold text-brand-950 bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 transition"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">₫</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink-secondary mb-1">
                          Giá Vốn Ước Tính
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={costPrice || ""}
                            onChange={(e) => setCostPrice(Number(e.target.value))}
                            className="w-full h-9 pl-3 pr-7 rounded-xl border border-surface-border text-xs font-semibold text-ink-primary bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 transition"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">₫</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">
                      Mô Tả Hương Vị & Thành Phần
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả hấp dẫn về hương vị, thành phần nguyên liệu món ăn..."
                      className="w-full h-14 p-2 rounded-xl border border-surface-border text-xs font-medium text-ink-primary bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 resize-none transition placeholder:text-ink-subtle"
                    />
                  </div>
                </div>

              </div>

              {/* ==================================================== */}
              {/* CỘT PHẢI: PHÂN LOẠI & TÙY CHỌN / SIZE                */}
              {/* ==================================================== */}
              <div className="flex flex-col gap-3 h-full">
                
                {/* 1. PHÂN LOẠI THỰC ĐƠN: THOÁNG ĐÃNG, KHÔNG BỊ SÁT NHAU */}
                <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-surface-border shadow-2xs space-y-2.5 sm:space-y-3">
                  <h4 className="font-extrabold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-surface-border/70 pb-2 mb-1">
                    <SlidersHorizontal size={14} className="text-brand-800" /> Phân Loại Thực Đơn
                  </h4>

                  {/* 3 Trụ Cột Thực Đơn: Nút h-9 sm:h-10, gap-1 sm:gap-2, text-[10px] sm:text-xs chống tràn màn 320px */}
                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1.5 sm:mb-2">
                      Trụ Cột Ngành Hàng
                    </label>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
                        ([key, cfg]) => {
                          const isSelected = selectedMajor === key;
                          const TabIcon = key === "FOOD" ? Utensils : key === "DRINK" ? Coffee : Cake;
                          const label = key === "DESSERT" ? "Tráng Miệng" : cfg.label;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleSelectMajor(key)}
                              className={`h-9 sm:h-10 rounded-xl text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 px-0.5 sm:px-2 border font-bold text-[10px] sm:text-xs shadow-2xs ${
                                isSelected
                                  ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                                  : "bg-surface-canvas hover:bg-white text-ink-secondary hover:text-ink-primary border-surface-border hover:border-brand-200"
                              }`}
                            >
                              <TabIcon size={12} className={isSelected ? "text-white shrink-0" : "text-brand-800 shrink-0"} />
                              <span className="whitespace-nowrap">{label}</span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Danh Mục Chi Tiết: Dùng component chung SearchableSelect có tìm kiếm */}
                  <div className="pt-0.5">
                    <label className="block text-xs font-bold text-ink-secondary mb-1.5 flex items-center justify-between">
                      <span>Danh Mục Chi Tiết</span>
                      <span className="text-[10px] font-normal text-ink-muted">
                        {filteredCategories.length} danh mục
                      </span>
                    </label>
                    
                    <SearchableSelect
                      options={filteredCategories.map((c) => ({
                        value: c.name,
                        label: c.name,
                      }))}
                      value={category || (filteredCategories[0]?.name ?? "")}
                      onChange={setCategory}
                      placeholder="Chọn danh mục..."
                      searchPlaceholder="Tìm kiếm danh mục..."
                    />
                  </div>
                </div>

                {/* 2. TABBED CARD: NHÓM TÙY CHỌN & BIẾN THỂ SIZE (CO DÃN BẰNG NHAU TUYỆT ĐỐI) */}
                <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-surface-border shadow-2xs space-y-2.5 flex-1 flex flex-col justify-between">
                  
                  {/* Tab Switcher & Nút Tạo Nhóm Mới (Icon Only) - Gọn gàng không tràn màn 320px */}
                  <div className="flex items-center justify-between border-b border-surface-border pb-2 gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1 p-0.5 bg-surface-canvas rounded-xl border border-surface-border">
                      <button
                        type="button"
                        onClick={() => setActiveTab("customizations")}
                        className={`h-8 px-2 sm:px-3 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                          activeTab === "customizations"
                            ? "bg-white text-brand-950 shadow-2xs border border-surface-border/50"
                            : "text-ink-secondary hover:text-ink-primary"
                        }`}
                      >
                        <SlidersHorizontal size={12} className="text-brand-800 shrink-0" />
                        <span className="whitespace-nowrap">Tùy Chọn</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                          activeTab === "customizations" ? "bg-brand-50 text-brand-900" : "bg-surface-border/60 text-ink-muted"
                        }`}>
                          {customizationGroups.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("variants")}
                        className={`h-8 px-2 sm:px-3 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                          activeTab === "variants"
                            ? "bg-white text-brand-950 shadow-2xs border border-surface-border/50"
                            : "text-ink-secondary hover:text-ink-primary"
                        }`}
                      >
                        <Layers size={12} className="text-brand-800 shrink-0" />
                        <span className="whitespace-nowrap">
                          <span className="hidden sm:inline">Biến Thể </span>Size
                        </span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                          activeTab === "variants" ? "bg-brand-50 text-brand-900" : "bg-surface-border/60 text-ink-muted"
                        }`}>
                          {variants.length}
                        </span>
                      </button>
                    </div>

                    {/* Nút Tạo Nhóm Mới: Chỉ cần icon Plus */}
                    {activeTab === "customizations" && !isAddingGroup && (
                      <button
                        type="button"
                        onClick={() => setIsAddingGroup(true)}
                        className="w-8 h-8 rounded-xl bg-brand-900 hover:bg-brand-950 text-white flex items-center justify-center shrink-0 shadow-2xs transition active:scale-98"
                        title="Tạo nhóm tùy chọn mới"
                      >
                        <Plus size={15} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {/* ==================================================== */}
                  {/* NỘI DUNG TAB 1: NHÓM TÙY CHỌN & TOPPING ĐÍNH KÈM     */}
                  {/* ==================================================== */}
                  {activeTab === "customizations" && (
                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      
                      {/* Form Tạo Nhóm Mới (Khi người dùng bấm nút icon +) */}
                      {isAddingGroup && (
                        <div className="p-3 rounded-xl bg-brand-50/50 border border-brand-200/80 space-y-2 animate-in fade-in-50 duration-150">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black text-brand-950 flex items-center gap-1.5">
                              <SlidersHorizontal size={13} className="text-brand-800" /> Tạo Nhóm Tùy Chọn Mới
                            </h5>
                            <button
                              type="button"
                              onClick={() => setIsAddingGroup(false)}
                              className="text-ink-subtle hover:text-ink-primary p-0.5 rounded-md"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                                Tên Nhóm Tùy Chọn <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="VD: Topping Thêm, Mức Đá, Chọn Nước Sốt, Loại Thịt..."
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCreateCustomGroup();
                                  }
                                }}
                                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium bg-white text-ink-primary focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 placeholder:text-ink-subtle"
                                autoFocus
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                                  Hình Thức Chọn
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-surface-border">
                                  <button
                                    type="button"
                                    onClick={() => setNewGroupType("MULTIPLE")}
                                    className={`h-7.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                                      newGroupType === "MULTIPLE"
                                        ? "bg-brand-900 text-white shadow-2xs"
                                        : "text-ink-secondary hover:text-ink-primary"
                                    }`}
                                  >
                                    <span>Chọn Nhiều</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNewGroupType("SINGLE")}
                                    className={`h-7.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                                      newGroupType === "SINGLE"
                                        ? "bg-brand-900 text-white shadow-2xs"
                                        : "text-ink-secondary hover:text-ink-primary"
                                    }`}
                                  >
                                    <span>Chọn 1</span>
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                                  Quy Định Đặt Món
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setNewGroupRequired(!newGroupRequired)}
                                  className={`w-full h-8 sm:h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                                    newGroupRequired
                                      ? "bg-rose-50 border-rose-200 text-rose-800"
                                      : "bg-white border-surface-border text-ink-secondary hover:border-brand-200"
                                  }`}
                                >
                                  <span>Bắt buộc chọn</span>
                                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    newGroupRequired ? "bg-rose-600 border-rose-600 text-white" : "border-ink-subtle bg-white"
                                  }`}>
                                    {newGroupRequired && <Check size={12} strokeWidth={3} />}
                                  </span>
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8.5 px-3.5 rounded-xl text-xs font-semibold border-surface-border text-ink-secondary"
                                onClick={() => setIsAddingGroup(false)}
                              >
                                Hủy
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8.5 px-4 rounded-xl text-xs font-bold bg-brand-900 hover:bg-brand-950 text-white shadow-2xs"
                                onClick={handleCreateCustomGroup}
                              >
                                Tạo Nhóm Này
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Danh Sách Các Nhóm Tùy Chọn Đang Có */}
                      {customizationGroups.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-0.5 flex-1">
                          {customizationGroups.map((group) => {
                            const curOpt = optionInputs[group.id] || { name: "", price: "" };
                            return (
                              <div
                                key={group.id}
                                className="p-2.5 rounded-xl border border-surface-border bg-surface-canvas/50 hover:border-brand-200 transition-colors space-y-1.5"
                              >
                                {/* Header của Nhóm */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-black text-ink-primary truncate">
                                      {group.name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-900 border border-brand-200/60">
                                      {group.type === "SINGLE" ? "Chọn 1" : "Chọn nhiều"}
                                    </span>
                                    {group.required ? (
                                      <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                                        Bắt buộc
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-white text-ink-muted border border-surface-border">
                                        Tùy chọn
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomGroup(group.id)}
                                    className="w-6 h-6 rounded-lg text-ink-subtle hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                                    title="Xóa nhóm tùy chọn này"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {/* Danh Sách Các Lựa Chọn Bên Trong Nhóm */}
                                {group.options.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.options.map((opt) => (
                                      <span
                                        key={opt.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-surface-border text-ink-primary shadow-2xs group/opt hover:border-brand-300 transition-colors"
                                      >
                                        <span>{opt.name}</span>
                                        <span className="font-bold text-brand-900 text-[11px]">
                                          {opt.priceModifier ? `+${opt.priceModifier.toLocaleString("vi-VN")}₫` : "+0₫"}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveOptionFromGroup(group.id, opt.id)}
                                          className="text-ink-subtle hover:text-rose-600 transition-colors ml-0.5 p-0.5 rounded"
                                          title="Xóa lựa chọn này"
                                        >
                                          <X size={12} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-ink-muted italic">
                                    Chưa có lựa chọn nào trong nhóm. Nhập bên dưới để thêm.
                                  </p>
                                )}

                                {/* Hàng Thêm Lựa Chọn Trực Tiếp Vào Nhóm */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-1.5 border-t border-surface-border/50">
                                  <input
                                    type="text"
                                    placeholder="Tên lựa chọn (VD: Trân châu đen...)"
                                    value={curOpt.name}
                                    onChange={(e) => handleOptionInputChange(group.id, "name", e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddOptionToGroup(group.id);
                                      }
                                    }}
                                    className="w-full sm:flex-1 sm:min-w-0 h-8 px-2.5 rounded-lg border border-surface-border text-xs font-medium bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 placeholder:text-ink-subtle"
                                  />
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="relative flex-1 sm:w-24">
                                      <input
                                        type="number"
                                        placeholder="Phụ thu"
                                        min={0}
                                        step={1000}
                                        value={curOpt.price}
                                        onChange={(e) => handleOptionInputChange(group.id, "price", e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddOptionToGroup(group.id);
                                          }
                                        }}
                                        className="w-full h-8 pl-2 pr-5 rounded-lg border border-surface-border text-xs font-bold bg-white text-brand-950 focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10"
                                      />
                                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">₫</span>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 px-3 rounded-lg text-xs font-bold bg-brand-900 hover:bg-brand-950 text-white shrink-0 shadow-2xs flex items-center gap-1 active:scale-98"
                                      onClick={() => handleAddOptionToGroup(group.id)}
                                    >
                                      <Plus size={12} />
                                      <span>Thêm</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        !isAddingGroup && (
                          <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-surface-canvas/60 text-center border border-dashed border-surface-border my-auto space-y-1">
                            <SlidersHorizontal size={22} className="text-brand-800/60 mb-0.5" />
                            <p className="text-xs font-bold text-ink-primary">Chưa có nhóm tùy chọn nào</p>
                            <p className="text-[11px] text-ink-muted max-w-[260px]">
                              Bấm nút dấu cộng <strong>"+"</strong> ở trên để thêm nhóm tùy chọn (topping, lượng đá, mức đường...)
                            </p>
                          </div>
                        )
                      )}

                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* NỘI DUNG TAB 2: BIẾN THỂ SIZE ĐỀ XUẤT                */}
                  {/* ==================================================== */}
                  {activeTab === "variants" && (
                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      {variants.length > 0 ? (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-0.5 flex-1">
                          {variants.map((v, idx) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas border border-surface-border group hover:border-brand-200 transition-colors"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-800 text-[10px] font-black shrink-0">
                                  {idx + 1}
                                </div>
                                <span className="text-xs font-bold text-ink-primary truncate">{v.name}</span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-xs font-black text-brand-900 bg-white px-2.5 py-0.5 rounded-lg border border-surface-border">
                                  {v.price.toLocaleString("vi-VN")} ₫
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(v.id)}
                                  className="w-6 h-6 rounded-lg text-ink-subtle hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                                  title="Xóa biến thể size"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl bg-surface-canvas/60 text-center border border-dashed border-surface-border text-xs text-ink-muted my-auto">
                          Chưa có kích cỡ nào. Món ăn sẽ sử dụng giá bán mặc định ở cột trái.
                        </div>
                      )}

                      {/* Hàng Thêm Size Mới: Full width trên mobile, đồng bộ h-9, rounded-xl */}
                      <div className="bg-surface-canvas p-1.5 rounded-xl border border-surface-border mt-auto flex flex-col sm:flex-row gap-1.5 sm:gap-2 sm:items-center">
                        <input
                          type="text"
                          placeholder="Tên Size (VD: Size M, Size L, Tô Lớn...)"
                          value={newVarName}
                          onChange={(e) => setNewVarName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddVariant();
                            }
                          }}
                          className="w-full sm:flex-1 sm:min-w-0 h-9 px-3 rounded-xl border border-surface-border text-xs font-medium bg-white focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 placeholder:text-ink-subtle"
                        />
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <div className="relative flex-1 sm:w-28">
                            <input
                              type="number"
                              placeholder="Giá bán"
                              min={0}
                              step={1000}
                              value={newVarPrice || ""}
                              onChange={(e) => setNewVarPrice(Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddVariant();
                                }
                              }}
                              className="w-full h-9 pl-2.5 pr-6 rounded-xl border border-surface-border text-xs font-bold bg-white text-brand-950 focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">₫</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 px-3.5 rounded-xl text-xs font-bold bg-brand-900 hover:bg-brand-950 text-white shrink-0 shadow-2xs flex items-center justify-center gap-1.5 active:scale-98"
                            onClick={handleAddVariant}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>Thêm Size</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          </form>

          {/* Footer đồng bộ chuẩn SaaS: Cân đối 50-50 trên mobile, đồng bộ h-10 */}
          <div className="p-3 sm:px-5 sm:py-3 border-t border-surface-border bg-white grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-10 px-4 rounded-xl font-bold text-xs border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas justify-center"
              onClick={requestClose}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto h-10 px-5 rounded-xl font-bold text-xs bg-brand-900 hover:bg-brand-950 text-white shadow-sm shadow-brand-950/15 justify-center"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : initialDish ? "Lưu Thay Đổi" : "Tạo Món Mẫu"}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
