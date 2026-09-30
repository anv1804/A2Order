import React, { useState, useEffect, useMemo } from "react";
import { Button, Icon, Pagination, ScenarioTemplateSkeleton } from "@/components/ui";
import {
  FnbDishItem,
  FnbMajorCategory,
  FnbCategoryTemplate,
  FNB_MAJOR_CONFIG,
} from "@a2order/shared";
import { INITIAL_CATEGORIES, INITIAL_TEMPLATE_DISHES } from "@/data/menuTemplateData";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { ScenarioDishModal } from "./modals/ScenarioDishModal";
import { AddCategoryModal } from "./modals/AddCategoryModal";

const STORAGE_KEY_DISHES = "a2order_template_dishes_v2";
const STORAGE_KEY_CATEGORIES = "a2order_template_categories_v2";
const PAGE_SIZE = 9;

export const ScenarioTemplateManager: React.FC = () => {
  // Trạng thái nạp dữ liệu ban đầu (chống giật trắng trang)
  const [isLoading, setIsLoading] = useState(true);

  // 1. Trụ Cột Chính: FOOD | DRINK | DESSERT
  const [activeMajor, setActiveMajor] = useState<FnbMajorCategory>("FOOD");

  // 2. Danh mục & Món ăn mẫu (khởi tạo từ Storage hoặc Initial Data)
  const [categories, setCategories] = useState<FnbCategoryTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [dishes, setDishes] = useState<FnbDishItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISHES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEMPLATE_DISHES;
  });

  // 3. Bộ lọc, tìm kiếm & phân trang
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("LIST");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 4. Modals
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<FnbDishItem | null>(null);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [catModalTargetMajor, setCatModalTargetMajor] = useState<FnbMajorCategory>("FOOD");

  // Đồng bộ LocalStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISHES, JSON.stringify(dishes));
    } catch {}
  }, [dishes]);

  // Giả lập nạp mượt mà 150ms chống giật trắng trang
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Reset trang khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMajor, selectedCategory, searchQuery]);

  // Reset category filter khi chuyển Trụ Cột
  const handleSwitchMajor = (major: FnbMajorCategory) => {
    setActiveMajor(major);
    setSelectedCategory("ALL");
  };

  // Danh mục thuộc Trụ Cột đang chọn
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.majorType === activeMajor);
  }, [categories, activeMajor]);

  // Thống kê số lượng món theo từng Trụ Cột
  const countsByMajor = useMemo(() => {
    const map: Record<FnbMajorCategory, number> = { FOOD: 0, DRINK: 0, DESSERT: 0 };
    dishes.forEach((d) => {
      const m =
        d.majorCategory ||
        (d.station === "KITCHEN" ? "FOOD" : d.station === "DESSERT" ? "DESSERT" : "DRINK");
      if (map[m] !== undefined) map[m]++;
    });
    return map;
  }, [dishes]);

  // Lọc món theo Trụ Cột, Danh mục con và Từ khóa tìm kiếm
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const dishMajor: FnbMajorCategory =
        dish.majorCategory ||
        (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");

      if (dishMajor !== activeMajor) return false;
      if (selectedCategory !== "ALL" && dish.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dish.name.toLocaleLowerCase("vi").includes(q);
        const matchCat = dish.category?.toLocaleLowerCase("vi").includes(q);
        const matchDesc = dish.description?.toLocaleLowerCase("vi").includes(q);
        const priceText = `${dish.price} ${dish.price.toLocaleString("vi-VN")} ${dish.costPrice || ""} ${dish.costPrice?.toLocaleString("vi-VN") || ""}`;
        const matchPrice = priceText.includes(q) || priceText.includes(q.replace(/\./g, ""));
        if (!matchName && !matchCat && !matchDesc && !matchPrice) return false;
      }

      return true;
    });
  }, [dishes, activeMajor, selectedCategory, searchQuery]);

  // Danh sách món sau phân trang
  const paginatedDishes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDishes.slice(start, start + PAGE_SIZE);
  }, [filteredDishes, currentPage]);

  // Tính số lượng món cho từng danh mục
  const categoryDishCount = useMemo(() => {
    const map: Record<string, number> = {};
    dishes.forEach((d) => {
      const dishMajor: FnbMajorCategory =
        d.majorCategory ||
        (d.station === "KITCHEN" ? "FOOD" : d.station === "DESSERT" ? "DESSERT" : "DRINK");
      if (dishMajor === activeMajor && d.category) {
        map[d.category] = (map[d.category] || 0) + 1;
      }
    });
    return map;
  }, [dishes, activeMajor]);

  // Thao tác với Danh Mục
  const handleOpenAddCategory = (major?: FnbMajorCategory) => {
    setCatModalTargetMajor(major || activeMajor);
    setIsAddCatModalOpen(true);
  };

  const handleSaveCategory = (newCatData: Omit<FnbCategoryTemplate, "id">) => {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCategory: FnbCategoryTemplate = {
      ...newCatData,
      id,
    };
    setCategories((prev) => [...prev, newCategory]);
    if (newCategory.majorType === activeMajor) {
      setSelectedCategory(newCategory.name);
    }
    toast.success(`Đã thêm danh mục "${newCategory.name}" vào ${FNB_MAJOR_CONFIG[newCategory.majorType].label}!`);
  };

  const handleDeleteCategory = async (cat: FnbCategoryTemplate) => {
    const count = categoryDishCount[cat.name] || 0;
    const confirmed = await confirmDialog({
      title: "Xóa Danh Mục Thực Đơn?",
      message:
        count > 0
          ? `Danh mục "${cat.name}" hiện đang có ${count} món mẫu. Bạn có chắc muốn xóa? Các món mẫu thuộc danh mục này sẽ được chuyển về nhóm Món Chung.`
          : `Bạn có chắc muốn xóa danh mục "${cat.name}" khỏi thư viện mẫu?`,
      confirmText: "Xóa Danh Mục",
      variant: "danger",
    });

    if (!confirmed) return;

    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    if (count > 0) {
      const hasGeneralCategory = activeCategories.some((category) => category.name === "Món Chung");
      if (!hasGeneralCategory) {
        setCategories((prev) => [...prev, {
          id: `cat_general_${activeMajor.toLowerCase()}`,
          name: "Món Chung",
          majorType: activeMajor,
          order: activeCategories.length + 1,
        }]);
      }
      setDishes((prev) => prev.map((dish) => {
        const dishMajor = dish.majorCategory || (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");
        return dish.category === cat.name && dishMajor === activeMajor
          ? { ...dish, category: "Món Chung" }
          : dish;
      }));
    }
    if (selectedCategory === cat.name) {
      setSelectedCategory("ALL");
    }
    toast.success(`Đã xóa danh mục "${cat.name}"!`);
  };

  // Thao tác với Món Ăn Mẫu
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: FnbDishItem) => {
    setEditingDish(dish);
    setIsDishModalOpen(true);
  };

  const handleDeleteDish = async (dish: FnbDishItem) => {
    const confirmed = await confirmDialog({
      title: "Xóa Món Mẫu?",
      message: `Bạn có chắc muốn xóa món "${dish.name}" khỏi thư viện mẫu nền tảng? Thao tác này hoàn toàn không ảnh hưởng đến thực đơn các quán đang hoạt động.`,
      confirmText: "Xóa Món Mẫu",
      variant: "danger",
    });

    if (!confirmed) return;

    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    toast.success(`Đã xóa món mẫu "${dish.name}"!`);
  };

  const handleSaveDish = async (dishData: Omit<FnbDishItem, "id">, dishId?: string) => {
    if (dishId) {
      setDishes((prev) =>
        prev.map((d) => (d.id === dishId ? { ...d, ...dishData, id: dishId } : d))
      );
      toast.success(`Đã cập nhật món mẫu "${dishData.name}"!`);
    } else {
      const newDish: FnbDishItem = {
        ...dishData,
        id: `dish_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setDishes((prev) => [newDish, ...prev]);
      toast.success(`Đã thêm món mẫu "${newDish.name}" vào thư viện!`);
    }
  };

  if (isLoading) {
    return <ScenarioTemplateSkeleton />;
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Trang Quản Trị Thực Đơn Mẫu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-ink-primary tracking-tight">
              Quản Trị Kịch Bản & Thực Đơn Mẫu F&B
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] whitespace-nowrap shrink-0">
              {dishes.length} món mẫu
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Quản lý kho thực đơn mẫu, các biến thể size và nhóm tùy chọn đề xuất cho từng mô hình F&B. Độc lập 100% với dữ liệu các quán.
          </p>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 PANEL: PANEL 1 (MENU / DANH MỤC) & PANEL 2 (DANH SÁCH ĐỒ ĂN) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ======================================================== */}
        {/* PANEL 1: MENU & DANH MỤC THỰC ĐƠN (CỘT TRÁI CỐ ĐỊNH)       */}
        {/* ======================================================== */}
        <div className="hidden w-full shrink-0 space-y-4 lg:block lg:w-80 xl:w-[340px]">
          <div className="bg-white rounded-3xl border border-surface-border shadow-xs p-4 sm:p-5 space-y-4">
            {/* 1.1 Khung Chuyển Đổi 3 Trụ Cột Chính */}
            <div>
              <label className="block text-[11px] font-black text-ink-primary uppercase tracking-wider mb-2">
                Trụ Cột Thực Đơn
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-canvas rounded-2xl border border-surface-border">
                {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(
                  ([key, cfg]) => {
                    const isSelected = activeMajor === key;
                    const count = countsByMajor[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSwitchMajor(key)}
                        className={`py-2 px-1.5 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "bg-white text-brand-950 shadow-xs border border-surface-border"
                            : "text-ink-secondary hover:text-ink-primary hover:bg-white/60"
                        }`}
                        title={`${cfg.label} (${count} món)`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? "bg-brand-900 text-white" : "bg-surface-muted text-ink-muted"
                          }`}
                        >
                          <Icon name={cfg.icon as any} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-bold leading-tight line-clamp-1">{cfg.label}</span>
                        <span className={`text-[10px] font-black ${isSelected ? "text-brand-900" : "text-ink-muted"}`}>
                          {count} món
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 1.2 Danh Sách Menu / Danh Mục (Vertical Nav List) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                <span className="text-[11px] font-black text-ink-primary uppercase tracking-wider flex items-center gap-1">
                  <span>Menu / Danh Mục</span>
                  <span className="text-ink-muted font-normal">({activeCategories.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenAddCategory(activeMajor)}
                  className="text-xs font-bold text-brand-900 hover:text-brand-950 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <Icon name="plus" className="w-3 h-3" />
                  <span>Thêm</span>
                </button>
              </div>

              {/* Danh sách danh mục dạng cuộn dọc */}
              <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-0.5 scrollbar-thin">
                {/* Nút Tất Cả Món */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-left ${
                    selectedCategory === "ALL"
                      ? "bg-brand-900 text-white shadow-xs font-black"
                      : "bg-surface-canvas/60 text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas border border-transparent hover:border-surface-border"
                  }`}
                >
                  <span className="truncate pr-2">Tất Cả Món</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"
                    }`}
                  >
                    {countsByMajor[activeMajor]}
                  </span>
                </button>

                {/* Các danh mục con */}
                {activeCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  const count = categoryDishCount[cat.name] || 0;
                  return (
                    <div
                      key={cat.id}
                      className={`group w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-brand-900 text-white shadow-xs font-black"
                          : "bg-surface-canvas/60 text-ink-secondary hover:text-ink-primary hover:bg-surface-canvas border border-transparent hover:border-surface-border"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className="flex-1 text-left truncate mr-2"
                        title={cat.name}
                      >
                        {cat.name}
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isSelected ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"
                          }`}
                        >
                          {count}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity ${
                            isSelected
                              ? "text-white/80 hover:text-white hover:bg-white/20"
                              : "text-ink-muted hover:text-rose-600 hover:bg-rose-50"
                          }`}
                          title={`Xóa danh mục "${cat.name}"`}
                        >
                          <Icon name="trash" className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nút Thêm Danh Mục Dưới Cùng */}
              <button
                type="button"
                onClick={() => handleOpenAddCategory(activeMajor)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-surface-border hover:border-brand-400 bg-surface-canvas/40 hover:bg-brand-50 text-xs font-bold text-ink-muted hover:text-brand-900 transition-all flex items-center justify-center gap-1.5"
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                <span>+ Thêm Danh Mục Mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bộ lọc gọn cho điện thoại: ưu tiên danh sách món, danh mục cuộn ngang */}
        <section aria-label="Lọc kịch bản món mẫu" className="w-full space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
            {(Object.entries(FNB_MAJOR_CONFIG) as [FnbMajorCategory, typeof FNB_MAJOR_CONFIG[FnbMajorCategory]][]).map(([key, cfg]) => (
              <button key={key} type="button" onClick={() => handleSwitchMajor(key)} className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition ${activeMajor === key ? "bg-white text-emerald-950 shadow-sm" : "text-slate-500"}`}>
                <Icon name={cfg.icon as any} size={14} />
                <span className="truncate">{cfg.label}</span>
                <span className="text-[9px] opacity-60">{countsByMajor[key]}</span>
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
            <button type="button" onClick={() => setSelectedCategory("ALL")} className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition ${selectedCategory === "ALL" ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-600"}`}>
              Tất cả <span className="ml-1 opacity-70">{countsByMajor[activeMajor]}</span>
            </button>
            {activeCategories.map((category) => (
              <div key={category.id} className={`flex shrink-0 items-center rounded-full text-[11px] font-bold transition ${selectedCategory === category.name ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                <button type="button" onClick={() => setSelectedCategory(category.name)} className="py-2 pl-3 pr-1.5">
                  {category.name}<span className="ml-1.5 opacity-70">{categoryDishCount[category.name] || 0}</span>
                </button>
                <button type="button" onClick={() => handleDeleteCategory(category)} className="mr-1 rounded-full p-1.5 opacity-75 transition hover:bg-rose-100 hover:text-rose-700" aria-label={`Xóa danh mục ${category.name}`}>
                  <Icon name="x" size={11} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => handleOpenAddCategory(activeMajor)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-300 text-emerald-800" aria-label="Thêm danh mục">
              <Icon name="plus" size={15} />
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* PANEL 2: DANH SÁCH ĐỒ ĂN / MÓN ĂN (CỘT PHẢI LIỀN KHỐI)    */}
        {/* ======================================================== */}
        <div className="flex w-full min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-surface-border bg-white shadow-xs">
          {/* Header Panel 2: Tên danh mục đang xem + Toolbar hành động liền khối */}
          <div className="flex min-w-0 flex-col justify-between gap-3 border-b border-surface-border bg-white p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 shrink-0">
                <Icon name={FNB_MAJOR_CONFIG[activeMajor].icon as any} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="min-w-0 truncate text-sm font-black text-ink-primary sm:text-base">
                    {selectedCategory === "ALL"
                      ? `Tất Cả Món ${FNB_MAJOR_CONFIG[activeMajor].label}`
                      : selectedCategory}
                  </h3>
                  <span className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-black text-brand-900">
                    {filteredDishes.length} món
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  Trụ cột: <span className="font-bold text-ink-primary">{FNB_MAJOR_CONFIG[activeMajor].label}</span> •{" "}
                  {selectedCategory === "ALL" ? "Toàn bộ nhóm món" : `Danh mục: ${selectedCategory}`}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              {/* Ô tìm kiếm món */}
              <div className="relative w-full sm:w-52">
                <Icon
                  name="search"
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                />
                <input
                  type="text"
                  placeholder="Tìm món, giá bán..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-8 pl-8 pr-7 rounded-xl border border-surface-border text-xs font-bold text-ink-primary bg-surface-canvas focus:bg-white focus:outline-none focus:border-brand-800 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Chuyển đổi Lưới / Bảng */}
              <div className="flex items-center p-0.5 bg-surface-canvas rounded-xl border border-surface-border">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-2 sm:p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === "GRID"
                      ? "bg-white text-brand-900 shadow-xs font-bold"
                      : "text-ink-muted hover:text-ink-primary"
                  }`}
                  title="Dạng thẻ lưới"
                >
                  <Icon name="grid" className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className={`p-2 sm:p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === "LIST"
                      ? "bg-white text-brand-900 shadow-xs font-bold"
                      : "text-ink-muted hover:text-ink-primary"
                  }`}
                  title="Dạng bảng danh sách"
                >
                  <Icon name="list" className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Nút Thêm Món Mẫu Mới */}
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs font-black gap-1.5 h-10 sm:h-8 px-3.5 shadow-sm whitespace-nowrap"
                onClick={handleOpenAddDish}
              >
                <Icon name="plus" className="w-3 h-3 text-white" />
                <span>+ Thêm Món Mới</span>
              </Button>
            </div>
          </div>

          {/* Danh Sách Món Mẫu (Empty State, Grid View, hoặc Table View) */}
          {filteredDishes.length === 0 ? (
            <div className="text-center py-20 px-4 space-y-3 flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-surface-canvas flex items-center justify-center text-ink-muted mx-auto">
                <Icon name={FNB_MAJOR_CONFIG[activeMajor].icon as any} className="w-7 h-7 text-brand-900" />
              </div>
              <div>
                <h4 className="text-sm font-black text-ink-primary">Không có món mẫu nào trong danh mục này</h4>
                <p className="text-xs text-ink-muted mt-1">
                  Thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để thêm món đầu tiên
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-2xl bg-brand-900 text-white font-bold text-xs"
                onClick={handleOpenAddDish}
              >
                + Thêm Món Vào Danh Mục Này
              </Button>
            </div>
          ) : viewMode === "GRID" ? (
            /* GRID VIEW: Lưới thẻ bên trong Card liền khối */
            <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin sm:max-h-[calc(100dvh-300px)] sm:min-h-[320px] sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedDishes.map((dish) => {
                  const margin =
                    dish.costPrice && dish.price
                      ? Math.round(((dish.price - dish.costPrice) / dish.price) * 100)
                      : 0;

                  return (
                    <div
                      key={dish.id}
                      className="group p-4 rounded-3xl bg-white border border-surface-border hover:border-brand-300 shadow-xs hover:shadow-elevated transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3">
                          {dish.image ? (
                            <img
                              src={dish.image}
                              alt={dish.name}
                              loading="lazy"
                              decoding="async"
                              className="w-14 h-14 rounded-2xl object-cover border border-surface-border shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center text-brand-900 shrink-0">
                              <Icon name={FNB_MAJOR_CONFIG[activeMajor].icon as any} className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-brand-50 text-brand-900 border border-brand-200 truncate">
                                {dish.category}
                              </span>
                              {dish.isBestSeller && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                                  ★ Bán chạy
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs sm:text-sm font-black text-ink-primary truncate leading-tight" title={dish.name}>
                              {dish.name}
                            </h4>

                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-black text-brand-900">
                                {dish.price.toLocaleString("vi-VN")} đ
                              </span>
                              {dish.costPrice ? (
                                <span className="text-[10px] text-ink-muted">
                                  (Vốn {dish.costPrice.toLocaleString("vi-VN")}đ • Lãi {margin}%)
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {dish.description && (
                          <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-border/60 text-[10px]">
                          {dish.variants && dish.variants.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-surface-canvas border border-surface-border text-ink-primary font-bold">
                              {dish.variants.length} size
                            </span>
                          ) : (
                            <span className="text-ink-muted italic">1 size chuẩn</span>
                          )}

                          {dish.customizationGroups && dish.customizationGroups.length > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold">
                              {dish.customizationGroups.length} nhóm tùy chọn
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-surface-border flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs h-7 px-2.5 font-bold text-ink-secondary hover:text-ink-primary"
                          onClick={() => handleOpenEditDish(dish)}
                        >
                          <Icon name="edit" className="w-3 h-3 mr-1" />
                          <span>Sửa</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs h-7 px-2 font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
                          onClick={() => handleDeleteDish(dish)}
                        >
                          <Icon name="trash" className="w-3 h-3 mr-1 text-rose-600" />
                          <span>Xóa</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TABLE VIEW: Bảng Danh Sách Món Có Sticky Header Liền Khối */
            <>
              <div className="w-full min-w-0 shrink-0 p-3 sm:p-4 xl:hidden">
                <div className="space-y-2.5">
                  {paginatedDishes.map((dish) => (
                    <article key={dish.id} className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        {dish.image ? (
                          <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon name={FNB_MAJOR_CONFIG[activeMajor].icon as any} size={20} /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="min-w-0 line-clamp-2 text-sm font-extrabold leading-snug text-slate-900">{dish.name}</h4>
                            {dish.isBestSeller && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-800">Bán chạy</span>}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{dish.category}{dish.description ? ` · ${dish.description}` : ""}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                            <span className="font-extrabold text-emerald-900">{dish.price.toLocaleString("vi-VN")} đ</span>
                            <span className="text-slate-500">Giá vốn {dish.costPrice ? `${dish.costPrice.toLocaleString("vi-VN")} đ` : "—"}</span>
                            <span className="text-slate-500">{dish.variants?.length ? `${dish.variants.length} size` : "1 size"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-2.5">
                        <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl px-3 text-xs" onClick={() => handleOpenEditDish(dish)}><Icon name="edit" size={13} /><span className="ml-1">Sửa món</span></Button>
                        <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteDish(dish)}><Icon name="trash" size={13} /><span className="ml-1">Xóa</span></Button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="hidden flex-1 overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] min-h-[400px] scrollbar-thin xl:block">
              <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 bg-surface-canvas/95 backdrop-blur-xs border-b border-surface-border shadow-2xs">
                    <tr className="text-[11px] font-black text-ink-muted uppercase tracking-wider">
                      <th className="py-3 px-4">Món Mẫu</th>
                      <th className="py-3 px-4">Danh Mục</th>
                      <th className="py-3 px-4">Giá Bán Đề Xuất</th>
                      <th className="py-3 px-4">Giá Vốn</th>
                      <th className="py-3 px-4">Quy Cách & Size</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {paginatedDishes.map((dish) => (
                      <tr key={dish.id} className="hover:bg-surface-canvas/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {dish.image ? (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                loading="lazy"
                                decoding="async"
                                className="w-10 h-10 rounded-xl object-cover border border-surface-border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-surface-canvas flex items-center justify-center text-brand-900 shrink-0">
                                <Icon name={FNB_MAJOR_CONFIG[activeMajor].icon as any} className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-black text-ink-primary block leading-tight">{dish.name}</span>
                              {dish.description && (
                                <span className="text-[10px] text-ink-muted line-clamp-1 mt-0.5">{dish.description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-ink-secondary">{dish.category}</td>
                        <td className="py-3 px-4 font-black text-brand-900">{dish.price.toLocaleString("vi-VN")} đ</td>
                        <td className="py-3 px-4 font-medium text-ink-muted">
                          {dish.costPrice ? `${dish.costPrice.toLocaleString("vi-VN")} đ` : "—"}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-ink-muted">
                          {dish.variants && dish.variants.length > 0
                            ? `${dish.variants.length} size`
                            : "1 size chuẩn"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs font-bold"
                              onClick={() => handleOpenEditDish(dish)}
                            >
                              <Icon name="edit" className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
                              onClick={() => handleDeleteDish(dish)}
                            >
                              <Icon name="trash" className="w-3 h-3 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Phân trang cố định ở chân cùng của Card Panel 2 */}
          {filteredDishes.length > PAGE_SIZE && (
            <div className="p-3.5 border-t border-surface-border bg-surface-canvas/30 mt-auto">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredDishes.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Modal Thêm / Sửa Món Mẫu */}
      <ScenarioDishModal
        isOpen={isDishModalOpen}
        majorType={activeMajor}
        categories={categories}
        initialDish={editingDish}
        onClose={() => setIsDishModalOpen(false)}
        onSave={handleSaveDish}
        onOpenAddCategory={(major) => handleOpenAddCategory(major)}
      />

      {/* 4. Modal Thêm Danh Mục Mới */}
      <AddCategoryModal
        isOpen={isAddCatModalOpen}
        initialMajorType={catModalTargetMajor}
        onClose={() => setIsAddCatModalOpen(false)}
        onSave={handleSaveCategory}
      />
    </div>
  );
};
