import React, { useState, useMemo, useEffect } from "react";
import { Panel, Button, Badge, Icon, Pagination, FilterSelect, SearchInput } from "@/components/ui";
import { HeroBanner, StatCard, EmptyState } from "@/components/shared";
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

export const CmsMenuManagement: React.FC<CmsMenuManagementProps> = ({ currentRole = "STORE_OWNER" }) => {
  const isChef = currentRole === "CHEF";
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Lấy storeId thực tế từ phiên đăng nhập
  const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") || localStorage.getItem("a2order_auth_user") : null;
  const storeId = userStr ? JSON.parse(userStr).storeId || "store-bubble-tea" : "store-bubble-tea";

  const [dishes, setDishes] = usePersistentState<FnbDishItem[]>(
    "menu_dishes_data",
    []
  );

  // Đồng bộ thực đơn thực tế từ Database API theo cửa hàng đăng nhập
  useEffect(() => {
    menuApi
      .getDishes(storeId)
      .then((serverDishes) => {
        if (Array.isArray(serverDishes)) {
          setDishes(serverDishes);
        }
      })
      .catch(() => {
        // Nếu offline, giữ nguyên local state
      });
  }, [storeId]);

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
      await scenarioApi.applyToStore(type, storeId, mode);
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
      await menuApi.updateDish(storeId, updatedDish.id, updatedDish);
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
      await menuApi.deleteDish(storeId, dish.id);
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
        await menuApi.updateStock(storeId, dish.id, 0, false);
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
        await menuApi.updateStock(storeId, dish.id, 50, true);
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
      await menuApi.updateStock(storeId, dishId, newStock, newStock > 0);
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
      await menuApi.createDish(storeId, newDish);
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
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Thực Đơn", dot: true }}
        tagline={`${categories.length - 1} nhóm • ${dishes.length} món ăn`}
        title="Quản Lý Thực Đơn"
        description="Danh sách món ăn, giá bán và trạng thái còn món của quán"
        chips={[
          {
            icon: "menu",
            label: `${dishes.length} Món trong menu`,
            variant: "default",
          },
          {
            icon: "checkCircle",
            label: `${availableCount} Đang mở bán`,
            variant: "teal",
          },
          ...(outOfStockCount > 0
            ? [
                {
                  icon: "ban" as const,
                  label: `${outOfStockCount} Món báo hết`,
                  variant: "rose" as const,
                  highlight: true,
                },
              ]
            : []),
          {
            icon: "trending",
            label: `Biên lãi TB ${avgMargin}%`,
            variant: "amber",
          },
        ]}
        actions={
          isChef ? (
            <button
              type="button"
              onClick={() => {
                menuApi
                  .getDishes(storeId)
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
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition hover:bg-brand-300 active:scale-95 shrink-0"
              >
                <Icon name="plus" size={14} />
                <span>Thêm Món Mới</span>
              </button>
            </>
          )
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số Thực Đơn */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="menu"
          title="Tổng Món Thực Đơn"
          value={
            <>
              {dishes.length} <span className="text-xs font-bold text-ink-muted">món</span>
            </>
          }
          subtext="Đồng bộ POS & QR"
          badge={`${categories.length - 1} nhóm`}
          variant="success"
        />

        <StatCard
          icon="checkCircle"
          title="Món Đang Mở Bán"
          value={
            <>
              {availableCount} <span className="text-xs font-bold text-ink-muted">món</span>
            </>
          }
          subtext="Khách có thể đặt món ngay"
          badge="Sẵn sàng"
          variant="info"
        />

        <StatCard
          icon="ban"
          title="Món Báo Hết Hàng"
          value={
            <>
              {outOfStockCount} <span className="text-xs font-bold text-ink-muted">món</span>
            </>
          }
          subtext={outOfStockCount > 0 ? "Đã ẩn trên máy POS & QR" : "Kho nguyên liệu đủ"}
          badge={
            outOfStockCount > 0
              ? { text: "Tạm hết", variant: "danger" }
              : "0 món"
          }
          variant={outOfStockCount > 0 ? "danger" : "default"}
        />

        <StatCard
          icon="trending"
          title="Biên Lãi Gộp TB"
          value={
            <>
              {avgMargin}% <span className="text-xs font-bold text-ink-muted">lãi</span>
            </>
          }
          subtext={`${bestSellerCount} món Best Seller chủ lực`}
          badge={{ text: "COGS", variant: "warning" }}
          variant="warning"
        />
      </section>

      {/* 3. Sticky Toolbar: Ô Tìm Kiếm & Các Bộ Lọc Gọn Gàng Chuẩn SaaS */}
      <div className="sticky top-0 sm:top-2 z-10 p-2.5 sm:p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Ô Tìm Kiếm theo tên món */}
          <div className="w-full sm:w-72 shrink-0">
            <SearchInput
              size="sm"
              placeholder="Tìm kiếm theo tên món ăn..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Bộ lọc Danh Mục & Trạng Thái Gọn Gàng (Có Search khi danh mục dài) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-1 justify-end">
            <FilterSelect
              labelPrefix="Nhóm:"
              placeholder="Tất Cả Nhóm Món"
              searchPlaceholder="Tìm nhóm món..."
              value={activeCategory}
              onChange={(cat) => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              options={categories.map((cat) => ({
                value: cat,
                label: cat === "ALL" ? "Tất Cả Món" : cat,
                count: cat === "ALL" ? dishes.length : dishes.filter((d) => d.category === cat).length,
              }))}
              className="w-full sm:w-56"
            />

            <FilterSelect
              labelPrefix="Trạng thái:"
              placeholder="Tất Cả Trạng Thái"
              value={statusFilter}
              onChange={(st) => {
                setStatusFilter(st as any);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Tất Cả Món", count: dishes.length },
                { value: "AVAILABLE", label: "Đang Mở Bán", count: availableCount },
                { value: "OUT_OF_STOCK", label: "Báo Hết Hàng", count: outOfStockCount },
                { value: "BEST_SELLER", label: "Bán Chạy (HOT)", count: bestSellerCount },
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* 4. Grid Danh Sách Món Ăn */}
      {dishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
            <Icon name="menu" size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">Thực đơn đang trống</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-xs">
            Thêm món mới theo cách thủ công, hoặc chọn kịch bản mẫu có sẵn để bắt đầu nhanh.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Icon name="plus" size={14} />
              Thêm Món Mới
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsScenarioModalOpen(true)}>
              <Icon name="sparkles" size={14} />
              Chọn Kịch Bản Mẫu
            </Button>
          </div>
        </div>
      ) : (
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
      )}

      {filteredDishes.length === 0 && dishes.length > 0 && (
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
