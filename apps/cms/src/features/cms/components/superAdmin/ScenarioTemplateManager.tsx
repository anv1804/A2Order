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
import { ScenarioDishList } from "./scenario/ScenarioDishList";


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
    <div className="space-y-5 animate-fadeIn pb-10">
      {/* HEADER TỐI GIẢN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Quản Trị Kịch Bản & Thực Đơn Mẫu F&B
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 font-extrabold text-[10px] whitespace-nowrap shrink-0">
              {dishes.length} món mẫu
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Quản lý kho thực đơn mẫu, các biến thể size và nhóm tùy chọn đề xuất cho từng mô hình F&B.
          </p>
        </div>
      </div>

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
            currentPage={currentPage}
            handleEditDish={handleOpenEditDish}
            handleDeleteDish={handleDeleteDish}
            handleOpenAddDish={() => { setEditingDish(null); setIsDishModalOpen(true); }}
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
