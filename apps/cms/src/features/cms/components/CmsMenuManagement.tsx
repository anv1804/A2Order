import React, { useState, useMemo, useEffect } from "react";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";

import {
  FnbDishItem,
  BusinessType,
  BUSINESS_TYPE_CONFIG,
  CmsMenuManagementProps,
} from "@/types/cms.types";
import { BUSINESS_SCENARIOS } from "@/data/businessScenarios";
import { menuApi } from "@/services/api/menuApi";
import { scenarioApi } from "@/services/api/scenarioApi";
import { AddDishModal } from "./menu/modals/AddDishModal";
import { EditDishModal } from "./menu/modals/EditDishModal";
import { StockEditModal } from "./menu/modals/StockEditModal";
import { ScenarioPickerModal } from "./menu/modals/ScenarioPickerModal";

const STORE_ID = "store-pho-noodles";

export const CmsMenuManagement: React.FC<CmsMenuManagementProps> = ({ currentRole = "STORE_OWNER" }) => {
  const isChef = currentRole === "CHEF";
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [dishes, setDishes] = usePersistentState<FnbDishItem[]>(
    "menu_dishes_data",
    BUSINESS_SCENARIOS.COFFEE_SHOP.dishes
  );

  // Thử đồng bộ dữ liệu từ Server API khi mount
  useEffect(() => {
    menuApi
      .getDishes(STORE_ID)
      .then((serverDishes) => {
        if (serverDishes && serverDishes.length > 0) {
          setDishes(serverDishes);
        }
      })
      .catch(() => {
        // Nếu server chưa bật hoặc offline, giữ nguyên local state
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    dishes.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [dishes]);

  // Bộ lọc trạng thái & Phân trang
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "OUT_OF_STOCK" | "BEST_SELLER">("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Modals state
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<FnbDishItem | null>(null);
  const [stockEditDish, setStockEditDish] = useState<FnbDishItem | null>(null);

  // Nạp kịch bản thực đơn
  const handleApplyScenario = async (type: BusinessType, mode: "REPLACE" | "APPEND") => {
    const scenario = BUSINESS_SCENARIOS[type];
    if (!scenario) return;

    try {
      await scenarioApi.applyToStore(type, STORE_ID, mode);
    } catch {
      // Offline fallback
    }

    if (mode === "REPLACE") {
      setDishes(scenario.dishes);
      toast.success(`Đã nạp toàn bộ thực đơn kịch bản "${scenario.label}" (${scenario.dishes.length} món)!`);
    } else {
      setDishes((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const newDishes = scenario.dishes.filter((d) => !existingIds.has(d.id));
        return [...prev, ...newDishes];
      });
      toast.success(`Đã thêm các món từ kịch bản "${scenario.label}" vào thực đơn!`);
    }
    setActiveCategory("ALL");
    setCurrentPage(1);
    setIsScenarioModalOpen(false);
  };

  // Mở modal sửa món
  const handleOpenEditModal = (dish: FnbDishItem) => {
    setEditingDish(dish);
  };

  // Lưu chỉnh sửa món ăn
  const handleSaveEditDish = async (updatedDish: FnbDishItem) => {
    try {
      await menuApi.updateDish(STORE_ID, updatedDish.id, updatedDish);
    } catch {
      // Local fallback
    }

    setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)));
    toast.success(`Đã cập nhật thông tin món "${updatedDish.name}" thành công!`);
    setEditingDish(null);
  };

  // Xóa món ăn an toàn với confirmDialog
  const handleDeleteDish = async (dish: FnbDishItem) => {
    const ok = await confirmDialog({
      title: "Xóa Món Khỏi Thực Đơn?",
      message: `Bạn có chắc chắn muốn xóa món "${dish.name}" khỏi thực đơn không? Thao tác này sẽ loại bỏ món này khỏi máy POS và thực đơn gọi món của khách.`,
      confirmText: "Xác Nhận Xóa",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await menuApi.deleteDish(STORE_ID, dish.id);
    } catch {
      // Local fallback
    }

    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    toast.info(`Đã xóa món "${dish.name}" khỏi thực đơn`);
  };

  // Cập nhật trạng thái Còn hàng / Tạm hết an toàn với confirmDialog
  const handleToggleStock = async (dish: FnbDishItem) => {
    if (dish.isAvailable) {
      const ok = await confirmDialog({
        title: "Xác Nhận Báo Hết Hàng?",
        message: `Báo tạm hết món "${dish.name}"? Món này sẽ ngưng phục vụ ngay trên máy thu ngân POS và trang QR của thực khách để tránh gọi nhầm.`,
        confirmText: "Báo Hết Món",
        cancelText: "Quay Lại",
        variant: "danger",
      });
      if (!ok) return;

      try {
        await menuApi.updateStock(STORE_ID, dish.id, 0, false);
      } catch {
        // Local fallback
      }

      setDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: false, stockCount: 0 } : d))
      );
      toast.warning(`Đã báo hết món "${dish.name}". Hệ thống POS & QR đã tạm ẩn món này.`);
    } else {
      const ok = await confirmDialog({
        title: "Xác Nhận Mở Bán Lại?",
        message: `Mở bán lại món "${dish.name}"? Món sẽ xuất hiện trở lại trên thực đơn phục vụ.`,
        confirmText: "Mở Bán Lại",
        cancelText: "Hủy",
        variant: "primary",
      });
      if (!ok) return;

      try {
        await menuApi.updateStock(STORE_ID, dish.id, 50, true);
      } catch {
        // Local fallback
      }

      setDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: true, stockCount: 50 } : d))
      );
      toast.success(`Đã mở bán lại món "${dish.name}" thành công!`);
    }
  };

  const handleSaveStockCount = async (dishId: string, newStock: number) => {
    try {
      await menuApi.updateStock(STORE_ID, dishId, newStock, newStock > 0);
    } catch {
      // Local fallback
    }

    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, stockCount: newStock, isAvailable: newStock > 0 } : d
      )
    );
    toast.info(`Đã cập nhật số suất còn lại: ${newStock} suất`);
    setStockEditDish(null);
  };

  const handleAddDishSubmit = async (formData: any) => {
    const newDish: FnbDishItem = {
      id: `m-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price) || 0,
      costPrice: Number(formData.costPrice) || 0,
      station: formData.station,
      image: formData.image,
      description: formData.description.trim() || undefined,
      isBestSeller: formData.isBestSeller,
      isAvailable: true,
      stockCount: Number(formData.stockCount) || 50,
      modifiers: formData.modifiers,
      variants: formData.variants,
    };

    try {
      await menuApi.createDish(STORE_ID, newDish);
    } catch {
      // Local fallback
    }

    setDishes((prev) => [newDish, ...prev]);
    setIsAddModalOpen(false);
    toast.success(`Đã thêm món "${newDish.name}" vào thực đơn thành công!`);
  };

  // Lọc đa chiều: Danh mục + Tìm kiếm + Trạng thái
  const filteredDishes = dishes.filter((d) => {
    const matchCategory = activeCategory === "ALL" || d.category === activeCategory;
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "AVAILABLE"
        ? d.isAvailable
        : statusFilter === "OUT_OF_STOCK"
        ? !d.isAvailable
        : Boolean(d.isBestSeller);
    return matchCategory && matchSearch && matchStatus;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredDishes.length / pageSize) || 1;
  const paginatedDishes = filteredDishes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const {
    visibleItems: mobileDishes,
    visibleCount: visibleDishCount,
    hasMore: hasMoreDishes,
    sentinelRef: dishSentinelRef,
    isMobile,
  } = useMobileInfiniteScroll({
    items: filteredDishes,
    pageSize: 10,
    mobileBreakpoint: 768,
  });

  const displayedDishes = isMobile ? mobileDishes : paginatedDishes;

  // Tính toán chỉ số nghiệp vụ menu
  const availableCount = useMemo(() => dishes.filter((d) => d.isAvailable).length, [dishes]);
  const outOfStockCount = useMemo(() => dishes.filter((d) => !d.isAvailable).length, [dishes]);
  const bestSellerCount = useMemo(() => dishes.filter((d) => d.isBestSeller).length, [dishes]);
  const avgMargin = useMemo(() => {
    if (!dishes.length) return 0;
    const total = dishes.reduce((acc, d) => {
      if (!d.price) return acc;
      const profit = d.price - (d.costPrice || 0);
      return acc + Math.round((profit / d.price) * 100);
    }, 0);
    return Math.round(total / dishes.length);
  }, [dishes]);

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#061f17] via-[#0d2a21] to-[#133b2e] p-3.5 sm:p-5 lg:p-6 text-white shadow-lg border border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isChef ? "Chế Độ Bếp Trưởng (Kitchen Station)" : "Menu Engineering"}
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {categories.length - 1} danh mục • {dishes.length} món ăn
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              {isChef ? "Báo Hết Món & Tồn Kho Tức Thời" : "Quản Lý Thực Đơn & Kỹ Thuật Menu"}
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              {isChef
                ? "Bật/tắt trạng thái hết món khi cạn nguyên liệu, điều chỉnh suất phục vụ tức thì đồng bộ tới quầy POS & QR."
                : "Kiểm soát định lượng, giá vốn (COGS), lãi gộp và bật/tắt báo hết món ngay lập tức tới máy POS."}
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="menu" size={12} className="text-emerald-300" />
                <span>{dishes.length} Món trong menu</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="checkCircle" size={12} className="text-teal-300" />
                <span>{availableCount} Đang mở bán</span>
              </span>
              {outOfStockCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-400/30 text-[10px] sm:text-[10.5px] font-bold text-rose-200">
                  <Icon name="ban" size={12} className="text-rose-300" />
                  <span>{outOfStockCount} Món báo hết</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="trending" size={12} className="text-amber-300" />
                <span>Biên lãi TB {avgMargin}%</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            {isChef ? (
              <button
                type="button"
                onClick={() => {
                  menuApi
                    .getDishes(STORE_ID)
                    .then((serverDishes) => {
                      if (serverDishes && serverDishes.length > 0) {
                        setDishes(serverDishes);
                      }
                      toast.success("Đã đồng bộ thực đơn mới nhất từ máy chủ.");
                    })
                    .catch(() => {
                      toast.info("Đã làm mới dữ liệu thực đơn bếp.");
                    });
                }}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 sm:px-4 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 shrink-0"
              >
                <Icon name="refresh" size={14} />
                <span>Đồng Bộ Menu</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsScenarioModalOpen(true)}
                  className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 sm:px-3.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 shrink-0"
                >
                  <Icon name="sparkles" size={14} className="text-amber-300" />
                  <span>Nạp Kịch Bản Mẫu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 sm:px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-emerald-300 active:scale-95 shrink-0"
                >
                  <Icon name="plus" size={14} />
                  <span>Thêm Món Mới</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. 4 Thẻ Bento Chỉ Số Thực Đơn */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="menu" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              {categories.length - 1} nhóm
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Tổng Món Thực Đơn
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {dishes.length} <span className="text-xs font-bold text-slate-400">món</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              Đồng bộ POS & QR
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Icon name="checkCircle" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
              Sẵn sàng
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Món Đang Mở Bán
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {availableCount} <span className="text-xs font-bold text-slate-400">món</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-600 mt-1 truncate">
              Khách có thể đặt món ngay
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Icon name="ban" size={16} />
            </span>
            {outOfStockCount > 0 ? (
              <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                Tạm hết
              </span>
            ) : (
              <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                0 món
              </span>
            )}
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Món Báo Hết Hàng
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {outOfStockCount} <span className="text-xs font-bold text-slate-400">món</span>
            </p>
            <p className="text-[10px] font-semibold text-rose-600 mt-1 truncate">
              {outOfStockCount > 0 ? "Đã ẩn trên máy POS & QR" : "Kho nguyên liệu đủ"}
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Icon name="trending" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
              COGS
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Biên Lãi Gộp TB
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {avgMargin}% <span className="text-xs font-bold text-slate-400">lãi</span>
            </p>
            <p className="text-[10px] font-semibold text-amber-600 mt-1 truncate">
              {bestSellerCount} món Best Seller chủ lực
            </p>
          </div>
        </article>
      </section>

      {/* 3. Sticky Toolbar: Tabs Danh Mục & Bộ Lọc Trạng Thái */}
      <div className="sticky top-0 sm:top-2 z-10 p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count = cat === "ALL" ? dishes.length : dishes.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-950 text-white shadow-2xs font-black"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <span>{cat === "ALL" ? "Tất Cả Món" : cat}</span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-slate-500 shadow-2xs"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên món ăn..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 sm:h-9 pl-8 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: "ALL", label: "Tất Cả" },
              { id: "AVAILABLE", label: "Đang Bán" },
              { id: "OUT_OF_STOCK", label: "Hết Hàng" },
              { id: "BEST_SELLER", label: "Bán Chạy" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-emerald-800 text-white shadow-2xs font-extrabold"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Grid Danh Sách Món Ăn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {displayedDishes.map((dish) => {
          const grossProfit = dish.price - (dish.costPrice || 0);
          const marginPercent = dish.price > 0 ? Math.round((grossProfit / dish.price) * 100) : 0;
          return (
            <div
              key={dish.id}
              className={`bg-white rounded-2xl border p-3.5 sm:p-4 transition-all hover:shadow-md flex flex-col justify-between ${
                dish.isAvailable
                  ? "border-slate-200/80 shadow-2xs"
                  : "border-slate-200/60 bg-slate-50/60 opacity-80"
              }`}
            >
              <div>
                {/* Image and Basic Info */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                    <img
                      src={dish.image || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    {dish.isBestSeller && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs">
                        HOT
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-sm font-black text-slate-900 truncate">{dish.name}</h3>
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                          dish.isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {dish.isAvailable ? "Đang Bán" : "Hết Hàng"}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{dish.category}</span>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-emerald-950">
                        {dish.price.toLocaleString("vi-VN")} đ
                      </span>
                      {dish.costPrice !== undefined && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          Vốn: {dish.costPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profit Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Lãi gộp: <strong className="text-emerald-700">{grossProfit.toLocaleString("vi-VN")} đ</strong>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Biên lãi {marginPercent}%
                  </span>
                </div>

                {/* Modifiers & Variants Info */}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {dish.variants && dish.variants.length > 0 && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {dish.variants.length} size
                    </span>
                  )}
                  {dish.modifiers && dish.modifiers.length > 0 && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                      {dish.modifiers.length} tùy chọn kèm
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStockEditDish(dish)}
                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-800 ml-auto flex items-center gap-1 transition"
                  >
                    <Icon name="tag" size={11} />
                    <span>Còn {dish.stockCount ?? 0} suất</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                {isChef ? (
                  <>
                    <button
                      type="button"
                      className={`rounded-xl text-xs h-9 px-3 flex-1 flex items-center justify-center gap-1.5 border font-black transition active:scale-95 shadow-2xs ${
                        dish.isAvailable
                          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                      onClick={() => handleToggleStock(dish)}
                    >
                      <Icon name={dish.isAvailable ? "ban" : "checkCircle"} size={14} />
                      <span>{dish.isAvailable ? "Báo Hết Món (Khóa)" : "Mở Bán Trở Lại"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStockEditDish(dish)}
                      className="rounded-xl text-xs h-9 px-3 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold transition flex items-center gap-1 shrink-0 active:scale-95"
                      title="Chỉnh sửa số suất tồn"
                    >
                      <Icon name="tag" size={13} />
                      <span>Tồn: {dish.stockCount ?? 0}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`rounded-xl text-[11px] h-8 px-2.5 flex-1 flex items-center justify-center gap-1 border font-bold transition active:scale-95 ${
                        dish.isAvailable
                          ? "border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                      onClick={() => handleToggleStock(dish)}
                    >
                      <Icon name={dish.isAvailable ? "ban" : "checkCircle"} size={13} />
                      <span>{dish.isAvailable ? "Báo Hết" : "Mở Bán"}</span>
                    </button>

                    <button
                      type="button"
                      className="rounded-xl text-[11px] h-8 px-2.5 flex-1 flex items-center justify-center gap-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition active:scale-95"
                      onClick={() => handleOpenEditModal(dish)}
                    >
                      <Icon name="edit" size={13} />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 hover:border-rose-200 shrink-0"
                      title="Xóa món ăn"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredDishes.length === 0 && (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Icon name="search" size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-900">Không tìm thấy món ăn phù hợp</h4>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
        </div>
      )}

      {/* Mobile Infinite Scroll Sentinel */}
      <div className="block md:hidden">
        <MobileInfiniteSentinel
          hasMore={hasMoreDishes}
          totalCount={filteredDishes.length}
          visibleCount={visibleDishCount}
          sentinelRef={dishSentinelRef}
        />
      </div>

      {/* Phân trang trên Desktop (>= md) */}
      <div className="hidden md:block">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDishes.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals đã được tách thành các module riêng biệt */}
      <AddDishModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onSubmit={handleAddDishSubmit}
      />

      <EditDishModal
        dish={editingDish}
        categories={categories}
        onClose={() => setEditingDish(null)}
        onSave={handleSaveEditDish}
      />

      <StockEditModal
        dish={stockEditDish}
        onClose={() => setStockEditDish(null)}
        onSave={handleSaveStockCount}
      />

      <ScenarioPickerModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onApply={handleApplyScenario}
      />
    </div>
  );
};
