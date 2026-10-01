import React, { useState, useEffect, useMemo } from "react";
import { Panel, Icon, Pagination, SearchableSelect, SearchableSelectOption } from "@/components/ui";
import {
  FnbDishItem,
  FnbMajorCategory,
  FnbCategoryTemplate,
  FNB_MAJOR_CONFIG,
} from "@a2order/shared";
import { INITIAL_CATEGORIES, INITIAL_TEMPLATE_DISHES } from "@/data/menuTemplateData";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { useScrollHideKpi } from "@/hooks/useScrollHideKpi";
import { useMobileInfiniteScroll } from "@/hooks/useMobileInfiniteScroll";
import { ScenarioDesktopTable } from "./ScenarioDesktopTable";
import { ScenarioMobileCards } from "./ScenarioMobileCards";
import { ScenarioDishModal } from "./modals/ScenarioDishModal";
import { AddCategoryModal } from "./modals/AddCategoryModal";

const STORAGE_KEY_DISHES = "a2order_template_dishes_v2";
const STORAGE_KEY_CATEGORIES = "a2order_template_categories_v2";
const PAGE_SIZE = 10;

export interface ScenarioTemplateManagerProps {
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
  downloadCsv?: (filename: string, headers: string[], rows: unknown[][]) => void;
}

export const ScenarioTemplateManager: React.FC<ScenarioTemplateManagerProps> = ({
  isMaximized: propIsMaximized,
  setIsMaximized: propSetIsMaximized,
  downloadCsv: propDownloadCsv,
}) => {
  // 1. Quản lý trạng thái Phóng to / Toàn màn hình
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = propIsMaximized !== undefined ? propIsMaximized : internalMaximized;
  const setIsMaximized = propSetIsMaximized || setInternalMaximized;

  // Tự động thu gọn KPI khi cuộn
  const { isScrolled, handleInnerScroll } = useScrollHideKpi(isMaximized);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, setIsMaximized]);

  // 2. Dữ liệu Danh mục & Món ăn mẫu
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

  // Đồng bộ LocalStorage
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

  // 3. Bộ lọc, tìm kiếm, phân trang & sắp xếp
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("DEFAULT");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 4. Quản lý chọn món hàng loạt
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);

  // 5. Modals
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<FnbDishItem | null>(null);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [catModalTargetMajor, setCatModalTargetMajor] = useState<FnbMajorCategory>("FOOD");

  // Reset trang khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, majorFilter, categoryFilter, propertyFilter, sortBy]);

  // Reset categoryFilter khi majorFilter đổi
  const handleMajorFilterChange = (newMajor: string) => {
    setMajorFilter(newMajor);
    setCategoryFilter("ALL");
  };

  // Thống kê số lượng theo trụ cột
  const countsByMajor = useMemo(() => {
    const map: Record<string, number> = { FOOD: 0, DRINK: 0, DESSERT: 0 };
    dishes.forEach((d) => {
      const m =
        d.majorCategory ||
        (d.station === "KITCHEN" ? "FOOD" : d.station === "DESSERT" ? "DESSERT" : "DRINK");
      if (map[m] !== undefined) map[m]++;
    });
    return map;
  }, [dishes]);

  // Danh mục hiển thị theo Trụ Cột đang chọn
  const availableCategories = useMemo(() => {
    if (majorFilter === "ALL") return categories;
    return categories.filter((c) => c.majorType === majorFilter);
  }, [categories, majorFilter]);

  // Thống kê số lượng món cho từng danh mục
  const categoryDishCount = useMemo(() => {
    const map: Record<string, number> = {};
    dishes.forEach((d) => {
      const cat = d.category || "Món Chung";
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [dishes]);

  // Mini Dashboard KPI
  const kpiMetrics = useMemo(() => {
    const total = dishes.length;
    const hotCount = dishes.filter((d) => d.isBestSeller).length;
    const multiVariantCount = dishes.filter(
      (d) => (d.variants && d.variants.length > 1) || (d.customizationGroups && d.customizationGroups.length > 0)
    ).length;

    let totalMargin = 0;
    let marginCount = 0;
    dishes.forEach((d) => {
      if (d.costPrice && d.costPrice > 0 && d.price > d.costPrice) {
        totalMargin += ((d.price - d.costPrice) / d.price) * 100;
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? Math.round(totalMargin / marginCount) : 0;

    return { total, hotCount, multiVariantCount, avgMargin };
  }, [dishes]);

  const kpiCards = [
    {
      label: "Tổng Món Mẫu",
      val: kpiMetrics.total,
      sub: "Kho thực đơn mẫu F&B toàn diện",
      icon: "utensils" as const,
      wrapBg: "bg-emerald-50/50 border-emerald-100/80",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      textColor: "text-emerald-950",
    },
    {
      label: "Món Bán Chạy (Hot)",
      val: kpiMetrics.hotCount,
      sub: "Đề xuất ưu tiên cho quán mới",
      icon: "flame" as const,
      wrapBg: "bg-amber-50/50 border-amber-100/80",
      iconBg: "bg-amber-500 text-white shadow-amber-500/20",
      textColor: "text-amber-950",
    },
    {
      label: "Đa Kích Cỡ & Topping",
      val: kpiMetrics.multiVariantCount,
      sub: "Món có size S/M/L hoặc tùy chọn",
      icon: "tag" as const,
      wrapBg: "bg-blue-50/50 border-blue-100/80",
      iconBg: "bg-blue-600 text-white shadow-blue-500/20",
      textColor: "text-blue-950",
    },
    {
      label: "Lợi Nhuận Gộp TB",
      val: `${kpiMetrics.avgMargin}%`,
      sub: "Biên lợi nhuận gộp đề xuất",
      icon: "trending" as const,
      wrapBg: "bg-indigo-50/50 border-indigo-100/80",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      textColor: "text-indigo-950",
    },
  ];

  // Lọc danh sách món ăn
  const filteredDishes = useMemo(() => {
    let result = dishes.filter((dish) => {
      const dishMajor: FnbMajorCategory =
        dish.majorCategory ||
        (dish.station === "KITCHEN" ? "FOOD" : dish.station === "DESSERT" ? "DESSERT" : "DRINK");

      if (majorFilter !== "ALL" && dishMajor !== majorFilter) return false;
      if (categoryFilter !== "ALL" && dish.category !== categoryFilter) return false;

      // Lọc theo đặc tính
      if (propertyFilter === "BEST_SELLER" && !dish.isBestSeller) return false;
      if (propertyFilter === "HAS_VARIANTS" && (!dish.variants || dish.variants.length <= 1)) return false;
      if (
        propertyFilter === "HAS_CUSTOMIZATIONS" &&
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
        const priceStr = `${dish.price} ${dish.costPrice || ""}`;
        const matchPrice = priceStr.includes(q.replace(/\./g, ""));
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
  }, [dishes, majorFilter, categoryFilter, propertyFilter, searchQuery, sortBy]);

  // Phân trang Desktop
  const paginatedDishes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDishes.slice(start, start + PAGE_SIZE);
  }, [filteredDishes, currentPage]);

  // Cuộn vô tận trên Mobile (10 món/lần)
  const {
    visibleItems: mobileDishes,
    visibleCount: visibleMobileCount,
    hasMore: hasMoreMobile,
    sentinelRef: mobileSentinelRef,
  } = useMobileInfiniteScroll({
    items: filteredDishes,
    pageSize: 10,
  });

  // Chọn món trên trang hiện tại
  const currentPageDishIds = useMemo(() => paginatedDishes.map((d) => d.id), [paginatedDishes]);

  const isAllSelected = useMemo(
    () => currentPageDishIds.length > 0 && currentPageDishIds.every((id) => selectedDishIds.includes(id)),
    [currentPageDishIds, selectedDishIds]
  );

  const isIndeterminate = useMemo(
    () => currentPageDishIds.some((id) => selectedDishIds.includes(id)) && !isAllSelected,
    [currentPageDishIds, selectedDishIds, isAllSelected]
  );

  const handleToggleSelectDish = (id: string) => {
    setSelectedDishIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDishIds((prev) => prev.filter((id) => !currentPageDishIds.includes(id)));
    } else {
      setSelectedDishIds((prev) => Array.from(new Set([...prev, ...currentPageDishIds])));
    }
  };

  // Tùy chọn cho SearchableSelect
  const majorOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "Trụ Cột", badge: dishes.length },
      { value: "FOOD", label: "Đồ Ăn (Food)", badge: countsByMajor.FOOD },
      { value: "DRINK", label: "Đồ Uống (Drink)", badge: countsByMajor.DRINK },
      { value: "DESSERT", label: "Tráng Miệng", badge: countsByMajor.DESSERT },
    ],
    [dishes.length, countsByMajor]
  );

  const categoryOptions: SearchableSelectOption[] = useMemo(() => {
    const opts: SearchableSelectOption[] = [
      { value: "ALL", label: "Danh Mục", badge: filteredDishes.length },
    ];
    availableCategories.forEach((cat) => {
      opts.push({
        value: cat.name,
        label: cat.name,
        badge: categoryDishCount[cat.name] || 0,
      });
    });
    return opts;
  }, [availableCategories, categoryDishCount, filteredDishes.length]);

  const propertyOptions: SearchableSelectOption[] = [
    { value: "ALL", label: "Đặc Tính" },
    { value: "BEST_SELLER", label: "Bán Chạy (Hot)" },
    { value: "HAS_VARIANTS", label: "Có Nhiều Size" },
    { value: "HAS_CUSTOMIZATIONS", label: "Có Topping" },
  ];

  const sortOptions: SearchableSelectOption[] = [
    { value: "DEFAULT", label: "Sắp Xếp" },
    { value: "PRICE_ASC", label: "Giá: Thấp → Cao" },
    { value: "PRICE_DESC", label: "Giá: Cao → Thấp" },
    { value: "MARGIN_DESC", label: "Lợi Nhuận Cao" },
    { value: "NAME_ASC", label: "Tên: A → Z" },
  ];

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    majorFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    propertyFilter !== "ALL" ||
    sortBy !== "DEFAULT";

  const handleResetFilters = () => {
    setSearchQuery("");
    setMajorFilter("ALL");
    setCategoryFilter("ALL");
    setPropertyFilter("ALL");
    setSortBy("DEFAULT");
    setCurrentPage(1);
  };

  // Thao tác với món ăn
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: FnbDishItem) => {
    setEditingDish(dish);
    setIsDishModalOpen(true);
  };

  const handleDeleteDish = async (dish: FnbDishItem) => {
    const ok = await confirmDialog({
      title: "Xóa Món Ăn Mẫu?",
      message: `Bạn có chắc muốn xóa món "${dish.name}" khỏi kho thực đơn mẫu? Thao tác này hoàn toàn không làm ảnh hưởng đến menu các quán đang hoạt động.`,
      confirmText: "Xóa Món",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    setSelectedDishIds((prev) => prev.filter((id) => id !== dish.id));
    toast.success(`Đã xóa món mẫu "${dish.name}"!`);
  };

  const handleBatchDeleteDishes = async () => {
    if (selectedDishIds.length === 0) return;
    const ok = await confirmDialog({
      title: `Xóa ${selectedDishIds.length} Món Đã Chọn?`,
      message: `Bạn có chắc muốn xóa đồng loạt ${selectedDishIds.length} món mẫu khỏi thư viện?`,
      confirmText: "Xóa Đồng Loạt",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setDishes((prev) => prev.filter((d) => !selectedDishIds.includes(d.id)));
    setSelectedDishIds([]);
    toast.success(`Đã xóa thành công ${selectedDishIds.length} món mẫu!`);
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
    setIsDishModalOpen(false);
  };

  // Thao tác với danh mục
  const handleOpenAddCategory = (major?: FnbMajorCategory) => {
    setCatModalTargetMajor(major || (majorFilter !== "ALL" ? (majorFilter as FnbMajorCategory) : "FOOD"));
    setIsAddCatModalOpen(true);
  };

  const handleSaveCategory = (newCatData: Omit<FnbCategoryTemplate, "id">) => {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCategory: FnbCategoryTemplate = {
      ...newCatData,
      id,
    };
    setCategories((prev) => [...prev, newCategory]);
    setCategoryFilter(newCategory.name);
    toast.success(
      `Đã thêm danh mục "${newCategory.name}" vào ${FNB_MAJOR_CONFIG[newCategory.majorType].label}!`
    );
    setIsAddCatModalOpen(false);
  };

  const handleDeleteSelectedCategory = async () => {
    if (categoryFilter === "ALL") return;
    const cat = categories.find((c) => c.name === categoryFilter);
    if (!cat) return;

    const count = categoryDishCount[cat.name] || 0;
    const ok = await confirmDialog({
      title: `Xóa Danh Mục "${cat.name}"?`,
      message:
        count > 0
          ? `Danh mục "${cat.name}" đang có ${count} món mẫu. Khi xóa, các món này sẽ được chuyển về nhóm "Món Chung".`
          : `Bạn có chắc muốn xóa danh mục "${cat.name}" khỏi thư viện mẫu?`,
      confirmText: "Xóa Danh Mục",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    if (count > 0) {
      setDishes((prev) =>
        prev.map((d) => (d.category === cat.name ? { ...d, category: "Món Chung" } : d))
      );
    }
    setCategoryFilter("ALL");
    toast.success(`Đã xóa danh mục "${cat.name}"!`);
  };

  // Xuất file CSV
  const handleExportCsv = () => {
    const filename = `a2order-thuc-don-mau-${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = [
      "ID",
      "Tên Món",
      "Trụ Cột",
      "Danh Mục",
      "Đơn Giá (đ)",
      "Giá Vốn (đ)",
      "Tỷ Suất Lợi Nhuận (%)",
      "Trạm Chế Biến",
      "Bán Chạy",
      "Số Biến Thể Size",
      "Số Nhóm Topping",
      "Mô Tả",
    ];

    const rows = filteredDishes.map((d) => {
      const major =
        d.majorCategory ||
        (d.station === "KITCHEN" ? "FOOD" : dishMajorFallback(d));
      const margin =
        d.costPrice && d.costPrice > 0 && d.price > d.costPrice
          ? Math.round(((d.price - d.costPrice) / d.price) * 100)
          : 0;

      return [
        d.id,
        d.name,
        major === "FOOD" ? "Đồ Ăn" : major === "DRINK" ? "Đồ Uống" : "Tráng Miệng",
        d.category || "Món Chung",
        d.price,
        d.costPrice || "",
        margin ? `${margin}%` : "",
        d.station || "KITCHEN",
        d.isBestSeller ? "Có" : "Không",
        d.variants?.length || 0,
        d.customizationGroups?.length || 0,
        d.description || "",
      ];
    });

    if (propDownloadCsv) {
      propDownloadCsv(filename, headers, rows);
    } else {
      const escapeCell = (val: unknown) => {
        let text = String(val ?? "").replace(/[\r\n]+/g, " ").trim();
        if (/^[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
      };
      const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    toast.success(`Đã xuất ${filteredDishes.length} món mẫu ra file CSV!`);
  };

  const dishMajorFallback = (d: FnbDishItem): FnbMajorCategory => {
    return d.station === "DESSERT" ? "DESSERT" : "DRINK";
  };

  return (
    <div className={`flex-1 min-h-0 flex flex-col space-y-2 sm:space-y-3.5 ${isMaximized ? "h-full" : ""}`}>
      {/* 1. KHỐI MINI DASHBOARD KPI (THU GỌN KHI PHÓNG TO HOẶC KHI CUỘN) */}
      {!isMaximized && !isScrolled && (
        <section className="shrink-0 grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
          {kpiCards.map((m, i) => (
            <article
              key={i}
              className={`rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-[0_2px_12px_rgba(15,23,42,.03)] flex items-center justify-between transition-all hover:shadow-md ${m.wrapBg}`}
            >
              <div className="min-w-0 flex-1 pr-1">
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 mb-0.5 truncate">
                  {m.label}
                </h4>
                <p className={`text-base sm:text-2xl font-black tracking-tight truncate ${m.textColor}`}>
                  {m.val}
                </p>
                <p className="hidden sm:block text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  {m.sub}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.iconBg}`}>
                <Icon name={m.icon} size={15} className="sm:hidden" />
                <Icon name={m.icon} size={20} className="hidden sm:block" />
              </div>
            </article>
          ))}
        </section>
      )}

      {/* 2. KHUNG LÀM VIỆC CHUẨN PANEL CHO THỰC ĐƠN MẪU */}
      <Panel
        variant="default"
        padding="none"
        className={`transition-all duration-200 flex flex-col p-2.5 sm:p-5 lg:p-6 ${
          isMaximized
            ? "flex-1 min-h-0 h-full shadow-sm border border-slate-200"
            : "flex-1 min-h-[calc(100dvh-5.5rem)] sm:min-h-[calc(100vh-6rem)] lg:min-h-[480px] lg:h-[calc(100vh-230px)] sticky top-2 z-10 shadow-sm"
        }`}
      >
        {/* Header Toolbar */}
        <div className="shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="sm:hidden">Thực Đơn Mẫu</span>
              <span className="hidden sm:inline">Quản Trị Kịch Bản & Thực Đơn Mẫu F&B</span>
            </h3>
            <span className="h-6 inline-flex items-center text-[10px] sm:text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-2 rounded-lg">
              {filteredDishes.length} <span className="hidden sm:inline">/ {dishes.length}</span> món
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Nút Thêm Món Mới (Icon-only) */}
            <button
              type="button"
              onClick={handleOpenAddDish}
              title="Thêm món mẫu mới"
              aria-label="Thêm món mẫu mới"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-brand-900 text-xs font-bold text-white shadow-xs transition hover:bg-brand-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="plus" size={14} className="text-white" />
            </button>

            {/* Nút Thêm Danh Mục Mới (Icon-only) */}
            <button
              type="button"
              onClick={() => handleOpenAddCategory()}
              title="Thêm danh mục món mới"
              aria-label="Thêm danh mục"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="tag" size={14} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Xóa Danh Mục Đang Chọn (nếu đang lọc danh mục cụ thể) */}
            {categoryFilter !== "ALL" && (
              <button
                type="button"
                onClick={handleDeleteSelectedCategory}
                title={`Xóa danh mục "${categoryFilter}"`}
                aria-label="Xóa danh mục này"
                className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-100 active:scale-95 cursor-pointer shrink-0"
              >
                <Icon name="trash" size={14} />
              </button>
            )}

            {/* Nút Xuất CSV (Icon-only) */}
            <button
              type="button"
              onClick={handleExportCsv}
              title="Xuất thực đơn mẫu ra CSV"
              aria-label="Xuất CSV"
              className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 cursor-pointer shrink-0"
            >
              <Icon name="download" size={14} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Phóng to / Thu nhỏ */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className={`inline-flex h-8 sm:h-9 w-8 sm:w-auto items-center justify-center gap-1.5 rounded-xl border text-xs font-bold shadow-xs transition cursor-pointer px-0 sm:px-3 active:scale-95 ${
                isMaximized
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
              title={isMaximized ? "Thu nhỏ lại (Phím Esc)" : "Phóng to toàn khung làm việc"}
            >
              <Icon name={isMaximized ? "minimize" : "maximize"} size={14} className="shrink-0" />
              <span className="hidden sm:inline">{isMaximized ? "Thu nhỏ" : "Phóng to"}</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc Dropdown chuẩn lưới 12 cột (Gọn gàng, scannable) */}
        <div className="shrink-0 mb-2.5 sm:mb-3 p-2 sm:p-3 bg-slate-50/75 rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2.5 items-center">
            {/* Ô tìm kiếm */}
            <div className={`relative col-span-2 sm:col-span-2 ${hasActiveFilters ? "lg:col-span-3" : "lg:col-span-3"}`}>
              <Icon name="search" className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên món, danh mục, giá..."
                className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-7 sm:pr-8 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>

            {/* Trụ Cột F&B */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={majorOptions}
                value={majorFilter}
                onChange={handleMajorFilterChange}
                placeholder="Trụ Cột F&B..."
                showSearch={false}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Danh Mục */}
            <div className={`col-span-1 sm:col-span-1 ${hasActiveFilters ? "lg:col-span-3" : "lg:col-span-3"}`}>
              <SearchableSelect
                options={categoryOptions}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Danh Mục Món..."
                searchPlaceholder="Tìm danh mục..."
                showSearch={true}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Đặc Tính Món */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-2">
              <SearchableSelect
                options={propertyOptions}
                value={propertyFilter}
                onChange={setPropertyFilter}
                placeholder="Đặc Tính Món..."
                showSearch={false}
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Sắp Xếp */}
            <div className={`col-span-1 sm:col-span-1 ${hasActiveFilters ? "lg:col-span-1" : "lg:col-span-2"}`}>
              <SearchableSelect
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                placeholder="Sắp xếp..."
                showSearch={false}
                align="right"
                triggerClassName="h-8 sm:h-10 text-[11px] sm:text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Nút Đặt Lại Bộ Lọc */}
            {hasActiveFilters && (
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full h-8 sm:h-10 inline-flex items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                  title="Đặt lại tất cả bộ lọc"
                >
                  <Icon name="refresh" size={12} />
                  <span>Đặt lại</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Khung cuộn nội dung chính (Cô lập cuộn nội bộ bảng với overscroll-y-contain) */}
        <div
          onScroll={handleInnerScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain scrollbar-thin pr-0.5 sm:pr-1 pb-24 lg:pb-4"
        >
          {/* Bảng chuẩn trên Desktop */}
          <ScenarioDesktopTable
            paginatedDishes={paginatedDishes}
            selectedDishIds={selectedDishIds}
            onToggleSelectDish={handleToggleSelectDish}
            onToggleSelectAll={handleToggleSelectAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            handleEditDish={handleOpenEditDish}
            handleDeleteDish={handleDeleteDish}
          />

          {/* Danh sách Thẻ Món Mẫu trên Mobile (Kèm Cuộn Vô Tận 10 món/lần) */}
          <ScenarioMobileCards
            dishes={mobileDishes}
            selectedDishIds={selectedDishIds}
            onToggleSelectDish={handleToggleSelectDish}
            handleEditDish={handleOpenEditDish}
            handleDeleteDish={handleDeleteDish}
            sentinelRef={mobileSentinelRef}
            hasMore={hasMoreMobile}
            totalCount={filteredDishes.length}
            visibleCount={visibleMobileCount}
          />
        </div>

        {/* Thanh tác vụ chọn hàng loạt (Batch Actions Bar) */}
        {selectedDishIds.length > 0 && (
          <div className="shrink-0 mt-2 p-2 sm:p-2.5 bg-emerald-950 text-white rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đã chọn {selectedDishIds.length} món</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleBatchDeleteDishes}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Icon name="trash" size={12} />
                <span>Xóa các món đã chọn</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDishIds([])}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {/* Phân Trang Chuẩn Đồng Bộ (Chỉ hiển thị trên Desktop >= lg, Mobile dùng Infinite Scroll) */}
        <div className="shrink-0 mt-3 pt-2 sm:pt-3 border-t border-slate-100 hidden lg:block">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredDishes.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      </Panel>

      {/* 3. MODALS */}
      {isDishModalOpen && (
        <ScenarioDishModal
          isOpen={isDishModalOpen}
          onClose={() => setIsDishModalOpen(false)}
          onSave={handleSaveDish}
          initialDish={editingDish}
          majorType={majorFilter !== "ALL" ? (majorFilter as FnbMajorCategory) : "FOOD"}
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

export default ScenarioTemplateManager;
