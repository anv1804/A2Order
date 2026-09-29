import React, { useState, useMemo, useEffect } from "react";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";

import {
  FnbDishItem,
  BusinessType,
  BUSINESS_TYPE_CONFIG,
} from "@/types/cms.types";
import { BUSINESS_SCENARIOS } from "@/data/businessScenarios";
import { menuApi } from "@/services/api/menuApi";
import { scenarioApi } from "@/services/api/scenarioApi";
import { AddDishModal } from "./menu/modals/AddDishModal";
import { EditDishModal } from "./menu/modals/EditDishModal";
import { StockEditModal } from "./menu/modals/StockEditModal";
import { ScenarioPickerModal } from "./menu/modals/ScenarioPickerModal";

const STORE_ID = "store-pho-noodles";

export const CmsMenuManagement: React.FC = () => {
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Quản Lý Thực Đơn & Kỹ Thuật Menu
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Tối Ưu Lợi Nhuận F&B
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Quản lý giá bán, giá vốn (COGS), lãi gộp và phân luồng chế biến
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2 text-xs border-brand-300 text-brand-900 bg-brand-50 hover:bg-brand-100 font-black px-3.5 py-2 shadow-xs transition-all whitespace-nowrap"
            onClick={() => setIsScenarioModalOpen(true)}
          >
            <Icon name="sparkles" className="w-3.5 h-3.5 text-brand-900" />
            <span>Nạp Kịch Bản Mẫu F&B</span>
          </Button>

          <Button
            size="sm"
            className="rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold px-3.5 py-2 shadow-sm transition-all whitespace-nowrap"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>+ Thêm Món Mới</span>
          </Button>
        </div>
      </div>

      {/* Bộ Lọc Tầng 1: Tabs Danh Mục */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count = cat === "ALL" ? dishes.length : dishes.filter((d) => d.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                isActive
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-surface-canvas text-ink-secondary hover:text-ink-primary hover:bg-surface-muted border border-surface-border"
              }`}
            >
              <span>{cat === "ALL" ? "Tất Cả Món" : cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bộ Lọc Tầng 2: Tìm kiếm + Trạng thái */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-canvas p-3 rounded-2xl border border-surface-border">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên món ăn..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 h-9 bg-white border border-surface-border rounded-xl text-xs font-medium focus:border-brand-800 focus:outline-none placeholder:text-ink-subtle"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          {[
            { id: "ALL", label: "Tất Cả" },
            { id: "AVAILABLE", label: "Đang Bán" },
            { id: "OUT_OF_STOCK", label: "Hết Hàng" },
            { id: "BEST_SELLER", label: "Bán Chạy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-white text-ink-primary shadow-xs border border-surface-border font-extrabold"
                  : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Danh Sách Món Ăn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedDishes.map((dish) => {
          const grossProfit = dish.price - (dish.costPrice || 0);
          const marginPercent = dish.price > 0 ? Math.round((grossProfit / dish.price) * 100) : 0;
          return (
            <div
              key={dish.id}
              className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md flex flex-col justify-between ${
                dish.isAvailable ? "border-surface-border" : "border-surface-border/60 bg-surface-canvas/40 opacity-75"
              }`}
            >
              <div>
                {/* Image and Basic Info */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0 relative">
                    <img
                      src={dish.image || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    {dish.isBestSeller && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                        HOT
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-sm font-black text-ink-primary truncate">{dish.name}</h3>
                      <Badge
                        variant={dish.isAvailable ? "success" : "outline"}
                        className="text-[10px] shrink-0"
                      >
                        {dish.isAvailable ? "Đang Bán" : "Hết Hàng"}
                      </Badge>
                    </div>

                    <span className="text-[11px] text-ink-muted block mt-0.5">{dish.category}</span>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-brand-900">
                        {dish.price.toLocaleString("vi-VN")} đ
                      </span>
                      {dish.costPrice !== undefined && (
                        <span className="text-[10px] text-ink-subtle">
                          Vốn: {dish.costPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profit Bar */}
                <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">
                    Lãi gộp: <strong className="text-emerald-700">{grossProfit.toLocaleString("vi-VN")} đ</strong>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Biên lãi {marginPercent}%
                  </span>
                </div>

                {/* Modifiers & Variants Info */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {dish.variants && dish.variants.length > 0 && (
                    <span className="text-[10px] font-bold bg-brand-50 text-brand-900 px-2 py-0.5 rounded-lg border border-brand-200">
                      {dish.variants.length} size
                    </span>
                  )}
                  {dish.modifiers && dish.modifiers.length > 0 && (
                    <span className="text-[10px] font-bold bg-surface-muted text-ink-secondary px-2 py-0.5 rounded-lg">
                      {dish.modifiers.length} tùy chọn kèm
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStockEditDish(dish)}
                    className="text-[10px] font-bold text-ink-muted hover:text-brand-900 ml-auto flex items-center gap-1"
                  >
                    <Icon name="tag" className="w-3 h-3" />
                    <span>Còn {dish.stockCount ?? 0} suất</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-[11px] h-8 px-2.5 flex-1 gap-1"
                  onClick={() => handleToggleStock(dish)}
                >
                  <Icon name={dish.isAvailable ? "ban" : "checkCircle"} className="w-3.5 h-3.5" />
                  <span>{dish.isAvailable ? "Báo Hết" : "Mở Bán"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-[11px] h-8 px-2.5 flex-1 gap-1 border-surface-border text-ink-primary hover:bg-surface-muted"
                  onClick={() => handleOpenEditModal(dish)}
                >
                  <Icon name="edit" className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </Button>

                <button
                  type="button"
                  onClick={() => handleDeleteDish(dish)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-subtle hover:bg-rose-50 hover:text-rose-600 transition-all border border-surface-border hover:border-rose-200"
                >
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDishes.length === 0 && (
        <div className="py-12 text-center bg-white rounded-3xl border border-surface-border">
          <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-3 text-ink-subtle">
            <Icon name="search" className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-ink-primary">Không tìm thấy món ăn phù hợp</h4>
          <p className="text-xs text-ink-muted mt-1">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
        </div>
      )}

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredDishes.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

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
