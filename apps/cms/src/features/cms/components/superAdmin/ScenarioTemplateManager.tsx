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
import { ScenarioSidebar } from "./scenario/ScenarioSidebar";
import {
  ScenarioDishList,
  QuickFilterType,
  SortByType,
} from "./scenario/ScenarioDishList";
import {
  Utensils,
  Coffee,
  Cake,
  Flame,
  Layers,
  TrendingUp,
} from "lucide-react";

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

  // 3. Bộ lọc, tìm kiếm, sắp xếp & phân trang
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("ALL");
  const [sortBy, setSortBy] = useState<SortByType>("DEFAULT");
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

  // Reset trang khi thay đổi bộ lọc, danh mục, từ khóa hoặc sắp xếp
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMajor, selectedCategory, searchQuery, quickFilter, sortBy]);

  // Reset category filter & quick filter khi chuyển Trụ Cột
  const handleSwitchMajor = (major: FnbMajorCategory) => {
    setActiveMajor(major);
    setSelectedCategory("ALL");
    setQuickFilter("ALL");
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

  // Toàn bộ danh sách món thuộc trụ cột đang chọn
  const allPillarDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const dishMajor: FnbMajorCategory =
        dish.majorCategory ||
        (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");
      return dishMajor === activeMajor;
    });
  }, [dishes, activeMajor]);

  // Chỉ số KPI tóm tắt cho Trụ cột hiện tại
  const metrics = useMemo(() => {
    const total = allPillarDishes.length;
    const hot = allPillarDishes.filter((d) => d.isBestSeller).length;
    const withVariants = allPillarDishes.filter((d) => d.variants && d.variants.length > 1).length;
    let totalMargin = 0;
    let marginCount = 0;
    allPillarDishes.forEach((d) => {
      if (d.costPrice && d.costPrice > 0 && d.price > d.costPrice) {
        totalMargin += ((d.price - d.costPrice) / d.price) * 100;
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? Math.round(totalMargin / marginCount) : 0;
    return { total, hot, withVariants, avgMargin };
  }, [allPillarDishes]);

  // Lọc món theo Trụ Cột, Danh mục con, Quick filter, Từ khóa & Sắp xếp
  const filteredDishes = useMemo(() => {
    let result = dishes.filter((dish) => {
      const dishMajor: FnbMajorCategory =
        dish.majorCategory ||
        (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");

      if (dishMajor !== activeMajor) return false;
      if (selectedCategory !== "ALL" && dish.category !== selectedCategory) return false;

      // Quick filter
      if (quickFilter === "BEST_SELLER" && !dish.isBestSeller) return false;
      if (quickFilter === "HAS_VARIANTS" && (!dish.variants || dish.variants.length <= 1)) return false;
      if (
        quickFilter === "HAS_CUSTOMIZATIONS" &&
        (!dish.customizationGroups || dish.customizationGroups.length === 0)
      ) {
        return false;
      }

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dish.name.toLocaleLowerCase("vi").includes(q);
        const matchCat = dish.category?.toLocaleLowerCase("vi").includes(q);
        const matchDesc = dish.description?.toLocaleLowerCase("vi").includes(q);
        const priceText = `${dish.price} ${dish.price.toLocaleString("vi-VN")} ${
          dish.costPrice || ""
        } ${dish.costPrice?.toLocaleString("vi-VN") || ""}`;
        const matchPrice = priceText.includes(q) || priceText.includes(q.replace(/\./g, ""));
        if (!matchName && !matchCat && !matchDesc && !matchPrice) return false;
      }

      return true;
    });

    // Sắp xếp
    if (sortBy === "PRICE_ASC") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "PRICE_DESC") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "MARGIN_DESC") {
      result = [...result].sort((a, b) => {
        const marginA = a.costPrice ? (a.price - a.costPrice) / a.price : 0;
        const marginB = b.costPrice ? (b.price - b.costPrice) / b.price : 0;
        return marginB - marginA;
      });
    } else if (sortBy === "NAME_ASC") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return result;
  }, [dishes, activeMajor, selectedCategory, searchQuery, quickFilter, sortBy]);

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
    toast.success(
      `Đã thêm danh mục "${newCategory.name}" vào ${FNB_MAJOR_CONFIG[newCategory.majorType].label}!`
    );
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
        setCategories((prev) => [
          ...prev,
          {
            id: `cat_general_${activeMajor.toLowerCase()}`,
            name: "Món Chung",
            majorType: activeMajor,
            order: activeCategories.length + 1,
          },
        ]);
      }
      setDishes((prev) =>
        prev.map((dish) => {
          const dishMajor =
            dish.majorCategory ||
            (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");
          return dish.category === cat.name && dishMajor === activeMajor
            ? { ...dish, category: "Món Chung" }
            : dish;
        })
      );
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
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-28 sm:pb-12">
      {/* 1. HEADER CHÍNH & KPI STRIP */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
                Quản Trị Kịch Bản & Thực Đơn Mẫu F&B
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-brand-50 text-brand-900 border border-brand-200/80 font-black text-xs whitespace-nowrap shrink-0 shadow-2xs">
                {dishes.length} món mẫu
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Quản lý kho thực đơn mẫu, các biến thể size và nhóm tùy chọn đề xuất cho từng mô hình F&B.
            </p>
          </div>
        </div>

        {/* Thanh KPI chỉ số thực đơn: Tối ưu chống tràn dòng trên mobile (360px) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-surface-border shadow-2xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-800 shrink-0">
              {activeMajor === "FOOD" ? (
                <Utensils size={17} />
              ) : activeMajor === "DRINK" ? (
                <Coffee size={17} />
              ) : (
                <Cake size={17} />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-muted font-bold truncate">
                {activeMajor === "FOOD" ? "Món Ăn" : activeMajor === "DRINK" ? "Đồ Uống" : "Tráng Miệng"}
              </div>
              <div className="text-sm sm:text-lg font-black text-ink-primary leading-tight">
                {metrics.total} món
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-surface-border shadow-2xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Flame size={17} className="fill-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-muted font-bold truncate">Bán chạy</div>
              <div className="text-sm sm:text-lg font-black text-amber-700 leading-tight">
                {metrics.hot} món hot
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-surface-border shadow-2xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Layers size={17} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-muted font-bold truncate">Đa kích cỡ</div>
              <div className="text-sm sm:text-lg font-black text-ink-primary leading-tight">
                {metrics.withVariants} món có size
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-surface-border shadow-2xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <TrendingUp size={17} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-muted font-bold truncate">Lợi nhuận TB</div>
              <div className="text-sm sm:text-lg font-black text-emerald-800 leading-tight">
                {metrics.avgMargin > 0 ? `${metrics.avgMargin}% margin` : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC CHÍNH: SIDEBAR & DISH LIST */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <ScenarioSidebar
          activeMajor={activeMajor}
          handleSwitchMajor={handleSwitchMajor}
          countsByMajor={countsByMajor}
          activeCategories={activeCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          handleOpenAddCategory={handleOpenAddCategory}
          handleDeleteCategory={handleDeleteCategory}
          categoryDishCount={categoryDishCount}
        />

        <div className="flex-1 w-full min-w-0 space-y-4 flex flex-col min-h-[600px]">
          <ScenarioDishList
            activeMajor={activeMajor}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filteredDishes={filteredDishes}
            allPillarDishes={allPillarDishes}
            quickFilter={quickFilter}
            setQuickFilter={setQuickFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentPage={currentPage}
            handleEditDish={handleOpenEditDish}
            handleDeleteDish={handleDeleteDish}
            handleOpenAddDish={handleOpenAddDish}
          />

          {filteredDishes.length > PAGE_SIZE && (
            <div className="flex justify-end items-center bg-white rounded-2xl border border-surface-border p-3 shadow-sm">
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

      {/* 3. MODALS */}
      {isDishModalOpen && (
        <ScenarioDishModal
          isOpen={isDishModalOpen}
          onClose={() => setIsDishModalOpen(false)}
          onSave={handleSaveDish}
          initialDish={editingDish}
          majorType={activeMajor}
          categories={categories}
        />
      )}

      {isAddCatModalOpen && (
        <AddCategoryModal
          isOpen={isAddCatModalOpen}
          onClose={() => setIsAddCatModalOpen(false)}
          onSave={handleSaveCategory}
          initialMajorType={catModalTargetMajor}
        />
      )}
    </div>
  );
};
