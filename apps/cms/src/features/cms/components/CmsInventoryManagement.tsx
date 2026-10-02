import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Pagination, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import {
  InventoryIngredient,
  InwardReceipt,
  InwardReceiptItem,
  DishRecipeBOM,
} from "@/types/cms.types";

export const CmsInventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"stock" | "receipts" | "recipes">("stock");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<"ALL" | "SAFE" | "LOW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const STOCK_PAGE_SIZE = 6;
  const [receiptPage, setReceiptPage] = useState(1);
  const RECEIPT_PAGE_SIZE = 3;

  // Dữ liệu nguyên vật liệu thực tế F&B
  const [ingredients, setIngredients] = usePersistentState<InventoryIngredient[]>("inventory_ingredients", []);

  // Danh sách phiếu nhập hàng từ nhà cung cấp
  const [receipts, setReceipts] = usePersistentState<InwardReceipt[]>("inventory_receipts", []);

  // Định lượng món ăn (Recipe BOM)
  const [recipes, setRecipes] = usePersistentState<DishRecipeBOM[]>("inventory_recipes", []);

  // Modal State: Tạo phiếu nhập kho
  const [isCreateReceiptOpen, setIsCreateReceiptOpen] = useState(false);
  const [receiptSupplier, setReceiptSupplier] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptItems, setReceiptItems] = useState<{ ingredientId: string; quantity: number; unitPrice: number }[]>([]);

  // Modal State: Thêm nguyên liệu mới
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [newIngCode, setNewIngCode] = useState("");
  const [newIngName, setNewIngName] = useState("");
  const [newIngCategory, setNewIngCategory] = useState<"MEAT" | "VEGETABLE" | "SPICE" | "DRINK_RAW">("MEAT");
  const [newIngUnit, setNewIngUnit] = useState("kg");
  const [newIngCurrentStock, setNewIngCurrentStock] = useState(10);
  const [newIngMinStock, setNewIngMinStock] = useState(5);
  const [newIngPrice, setNewIngPrice] = useState(100000);
  const [newIngSupplier, setNewIngSupplier] = useState("Nhà cung cấp nông sản địa phương");

  // Tính toán chỉ số tổng hợp
  const totalStockValue = ingredients.reduce((sum, item) => sum + item.currentStock * item.avgCostPrice, 0);
  const lowStockCount = ingredients.filter((item) => item.currentStock <= item.minStockLevel).length;
  const totalInwardMonth = receipts.reduce((sum, r) => sum + r.totalAmount, 0);

  // Thêm dòng nguyên liệu trong phiếu nhập
  const handleAddReceiptRow = () => {
    setReceiptItems((prev) => [...prev, { ingredientId: ingredients[0]?.id || "ing-1", quantity: 1, unitPrice: ingredients[0]?.avgCostPrice || 50000 }]);
  };

  const handleRemoveReceiptRow = (idx: number) => {
    setReceiptItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateReceiptRow = (idx: number, field: string, value: any) => {
    setReceiptItems((prev) =>
      prev.map((row, i) => {
        if (i === idx) {
          const updated = { ...row, [field]: value };
          if (field === "ingredientId") {
            const ing = ingredients.find((item) => item.id === value);
            if (ing) updated.unitPrice = ing.avgCostPrice;
          }
          return updated;
        }
        return row;
      })
    );
  };

  // Submit tạo phiếu nhập kho
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptItems.length === 0) {
      toast.warning("Phiếu nhập phải có ít nhất 1 mặt hàng");
      return;
    }

    const calculatedItems: InwardReceiptItem[] = receiptItems.map((rItem) => {
      const ing = ingredients.find((i) => i.id === rItem.ingredientId);
      const name = ing ? ing.name : "Nguyên liệu";
      const unit = ing ? ing.unit : "kg";
      return {
        ingredientId: rItem.ingredientId,
        ingredientName: name,
        quantity: Number(rItem.quantity) || 1,
        unit: unit,
        unitPrice: Number(rItem.unitPrice) || 0,
        subtotal: (Number(rItem.quantity) || 1) * (Number(rItem.unitPrice) || 0),
      };
    });

    const total = calculatedItems.reduce((acc, cur) => acc + cur.subtotal, 0);
    const newReceipt: InwardReceipt = {
      id: `rc-${Date.now()}`,
      code: `PNK-2026-00${receipts.length + 1}`,
      supplierName: receiptSupplier,
      receivedDate: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      receivedBy: "Nguyễn Thành An (Chủ quán)",
      items: calculatedItems,
      totalAmount: total,
      paymentStatus: "PAID",
      notes: receiptNotes || "Nhập bổ sung kho nhà hàng",
      createdAt: new Date().toISOString(),
    };

    // Tự động cộng tồn kho cho các nguyên liệu
    setIngredients((prev) =>
      prev.map((ing) => {
        const added = calculatedItems.find((ci) => ci.ingredientId === ing.id);
        if (added) {
          const newStock = ing.currentStock + added.quantity;
          return {
            ...ing,
            currentStock: Math.round(newStock * 100) / 100,
            updatedAt: "Vừa cập nhật",
          };
        }
        return ing;
      })
    );

    setReceipts((prev) => [newReceipt, ...prev]);
    setIsCreateReceiptOpen(false);
    setReceiptNotes("");
    toast.success(`Đã lưu phiếu nhập ${newReceipt.code} thành công! Tồn kho đã được cộng dồn.`);
  };

  // Submit thêm nguyên liệu mới
  const handleAddIngredientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) {
      toast.error("Vui lòng nhập tên nguyên liệu");
      return;
    }

    const code = newIngCode.trim() || `NL-${Date.now().toString().slice(-4)}`;
    const newIng: InventoryIngredient = {
      id: `ing-${Date.now()}`,
      code: code,
      name: newIngName.trim(),
      category: newIngCategory,
      unit: newIngUnit.trim() || "kg",
      currentStock: Number(newIngCurrentStock) || 0,
      minStockLevel: Number(newIngMinStock) || 0,
      avgCostPrice: Number(newIngPrice) || 0,
      supplierName: newIngSupplier.trim() || "Nhà cung cấp tươi sống",
      updatedAt: "Vừa tạo",
    };

    setIngredients((prev) => [newIng, ...prev]);
    setIsAddIngredientOpen(false);
    setNewIngName("");
    setNewIngCode("");
    toast.success(`Đã thêm nguyên liệu [${newIng.name}] vào danh mục kho!`);
  };

  // Lọc nguyên liệu theo danh mục, trạng thái và tìm kiếm
  const filteredIngredients = ingredients.filter((ing) => {
    const matchCat = categoryFilter === "ALL" || ing.category === categoryFilter;
    const isLow = ing.currentStock <= ing.minStockLevel;
    const matchStatus =
      stockStatusFilter === "ALL" ||
      (stockStatusFilter === "SAFE" && !isLow) ||
      (stockStatusFilter === "LOW" && isLow);
    const matchQuery =
      ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStatus && matchQuery;
  });

  const paginatedIngredients = filteredIngredients.slice(
    (stockPage - 1) * STOCK_PAGE_SIZE,
    stockPage * STOCK_PAGE_SIZE
  );

  const {
    visibleItems: mobileIngredients,
    visibleCount: visibleIngredientCount,
    hasMore: hasMoreIngredients,
    sentinelRef: ingredientSentinelRef,
    isMobile,
  } = useMobileInfiniteScroll({
    items: filteredIngredients,
    pageSize: 10,
    mobileBreakpoint: 768,
  });

  const displayedIngredients = isMobile ? mobileIngredients : paginatedIngredients;

  const paginatedReceipts = receipts.slice(
    (receiptPage - 1) * RECEIPT_PAGE_SIZE,
    receiptPage * RECEIPT_PAGE_SIZE
  );

  const {
    visibleItems: mobileReceipts,
    visibleCount: visibleReceiptCount,
    hasMore: hasMoreReceipts,
    sentinelRef: receiptSentinelRef,
  } = useMobileInfiniteScroll({
    items: receipts,
    pageSize: 10,
    mobileBreakpoint: 768,
  });

  const displayedReceipts = isMobile ? mobileReceipts : paginatedReceipts;

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
                Kho Hàng
              </span>
              <span className="text-[10px] text-emerald-100/70 font-semibold truncate">
                {ingredients.length} Nguyên liệu • {lowStockCount > 0 ? `${lowStockCount} Sắp hết hàng` : "Đầy đủ định mức"}
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight">
              Quản Lý Kho Hàng
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/70 font-medium mt-0.5 max-w-xl">
              Theo dõi tồn kho nguyên vật liệu, định mức và phiếu nhập hàng
            </p>

            {/* Quick Live Stats Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="banknote" size={12} className="text-emerald-300" />
                <span>Giá trị tồn: {totalStockValue.toLocaleString("vi-VN")} đ</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="alert" size={12} className={lowStockCount > 0 ? "text-amber-300" : "text-emerald-300"} />
                <span>{lowStockCount} Món báo động</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-[10.5px] font-bold text-emerald-100">
                <Icon name="fileText" size={12} className="text-blue-300" />
                <span>{receipts.length} Phiếu nhập tháng</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setNewIngCode(`NL-${Math.floor(100 + Math.random() * 900)}`);
                setIsAddIngredientOpen(true);
              }}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 sm:px-4 text-xs font-bold text-white transition active:scale-95 shrink-0"
              title="Thêm Nguyên Liệu Mới"
            >
              <Icon name="plus" size={14} />
              <span>Thêm Nguyên Liệu</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateReceiptOpen(true)}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 px-3.5 sm:px-4 text-xs font-black text-slate-950 shadow-sm transition active:scale-95 shrink-0"
            >
              <Icon name="fileText" size={14} />
              <span>Lập Phiếu Nhập</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4 Thẻ Bento Chỉ Số Kho */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="banknote" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
              Giá trị kho
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Giá Trị Tồn Kho Thực Tế
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {totalStockValue.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-400">đ</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              Vốn lưu trữ hiện hữu
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Icon name="menu" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
              Danh mục
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Nguyên Liệu Theo Dõi
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {ingredients.length} <span className="text-xs font-bold text-slate-400">mặt hàng</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-600 mt-1 truncate">
              Thịt, rau củ & đồ pha chế
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${lowStockCount > 0 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
              <Icon name="alert" size={16} />
            </span>
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${lowStockCount > 0 ? "text-rose-700 bg-rose-50 border-rose-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"}`}>
              {lowStockCount > 0 ? "Cần nhập" : "An toàn"}
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Cảnh Báo Sắp Hết
            </h4>
            <p className={`text-base sm:text-xl font-black tracking-tight leading-tight truncate ${lowStockCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {lowStockCount} <span className="text-xs font-bold text-slate-400">mặt hàng</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
              {lowStockCount > 0 ? "Dưới định mức an toàn" : "Đầy đủ dự trữ"}
            </p>
          </div>
        </article>

        <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon name="trending" size={16} />
            </span>
            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              Tháng này
            </span>
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              Nhập Kho Tháng Này
            </h4>
            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {totalInwardMonth.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-400">đ</span>
            </p>
            <p className="text-[10px] font-semibold text-blue-600 mt-1 truncate">
              {receipts.length} đợt giao từ NCC
            </p>
          </div>
        </article>
      </section>

      {/* 3. Sticky Segmented Control Tabs */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "stock"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="table" size={14} />
          <span>Tồn Kho & Định Mức</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("receipts")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "receipts"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="fileText" size={14} />
          <span>Phiếu Nhập NCC</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-current">
            {receipts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "recipes"
              ? "bg-slate-950 text-white shadow-2xs font-black"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Icon name="menu" size={14} />
          <span>Định Lượng Món (Recipe BOM)</span>
        </button>
      </div>

      {/* TAB 1: TỒN KHO & ĐỊNH MỨC NGUYÊN LIỆU */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          {/* Bộ lọc theo nhóm danh mục & Tìm kiếm */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {[
                { id: "ALL", label: "Tất Cả Phân Loại" },
                { id: "MEAT", label: "Thịt Tươi Sống" },
                { id: "VEGETABLE", label: "Rau Củ Tươi" },
                { id: "DRINK_RAW", label: "Đồ Uống & Pha Chế" },
                { id: "SPICE", label: "Gia Vị & Khác" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategoryFilter(c.id);
                    setStockPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    categoryFilter === c.id
                      ? "bg-brand-900 text-white shadow-sm"
                      : "bg-white border border-surface-border text-ink-muted hover:bg-surface-canvas"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên nguyên liệu..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setStockPage(1);
                }}
                className="w-full h-8 pl-8 pr-3 rounded-full bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-1 focus:ring-brand-800"
              />
            </div>
          </div>

          {/* Bộ lọc trạng thái tồn kho */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-canvas p-2 rounded-2xl border border-surface-border">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold text-ink-muted px-2">Trạng thái kho:</span>
              <button
                onClick={() => {
                  setStockStatusFilter("ALL");
                  setStockPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  stockStatusFilter === "ALL"
                    ? "bg-brand-900 text-white shadow-sm"
                    : "bg-white border border-surface-border text-ink-muted hover:text-ink-primary"
                }`}
              >
                Tất Cả ({ingredients.length})
              </button>
              <button
                onClick={() => {
                  setStockStatusFilter("SAFE");
                  setStockPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stockStatusFilter === "SAFE"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white border border-surface-border text-ink-muted hover:text-emerald-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Đủ Tồn Kho ({ingredients.filter((i) => i.currentStock > i.minStockLevel).length})</span>
              </button>
              <button
                onClick={() => {
                  setStockStatusFilter("LOW");
                  setStockPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stockStatusFilter === "LOW"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white border border-surface-border text-rose-600 hover:bg-rose-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Cảnh Báo Chạm Đáy ({lowStockCount})</span>
              </button>
            </div>

            <span className="text-[11px] font-bold text-ink-muted px-2">
              Khớp {filteredIngredients.length} nguyên liệu
            </span>
          </div>

          {/* Bảng nguyên vật liệu */}
          <Panel variant="default" padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-canvas border-b border-surface-border text-ink-muted font-bold">
                    <th className="py-3 px-4">Mã NL</th>
                    <th className="py-3 px-4">Tên Nguyên Vật Liệu</th>
                    <th className="py-3 px-4">Đơn Vị</th>
                    <th className="py-3 px-4 text-right">Tồn Kho Hiện Tại</th>
                    <th className="py-3 px-4 text-right">Định Mức Tối Thiểu</th>
                    <th className="py-3 px-4 text-right">Giá Vốn Bình Quân</th>
                    <th className="py-3 px-4 text-center">Trạng Thái Kho</th>
                    <th className="py-3 px-4">Nhà Cung Cấp</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-medium text-ink-primary">
                  {paginatedIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900">
                            <Icon name="clipboard" className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-ink-primary">
                            {ingredients.length === 0 ? "Chưa có nguyên vật liệu nào trong kho" : "Không tìm thấy nguyên vật liệu phù hợp"}
                          </p>
                          <p className="text-[11px] text-ink-muted max-w-sm">
                            {ingredients.length === 0
                              ? "Thêm nguyên vật liệu (thịt bò, gạo, gia vị, cà phê...) để theo dõi tồn kho và định lượng món ăn."
                              : "Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc."}
                          </p>
                          {ingredients.length === 0 && (
                            <Button
                              size="sm"
                              className="mt-2 rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold"
                              onClick={() => setIsAddIngredientOpen(true)}
                            >
                              <Icon name="plus" className="w-3.5 h-3.5 text-brand-400" />
                              <span>Thêm Nguyên Liệu Đầu Tiên</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedIngredients.map((item) => {
                      const isLow = item.currentStock <= item.minStockLevel;
                      return (
                        <tr key={item.id} className="hover:bg-brand-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-ink-muted">
                            {item.code}
                          </td>
                          <td className="py-3 px-4 font-black text-ink-primary">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 font-bold text-ink-muted">
                            {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-sm">
                            <span className={isLow ? "text-rose-600 font-extrabold" : "text-ink-primary"}>
                              {item.currentStock.toLocaleString("vi-VN")} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-ink-muted">
                            {item.minStockLevel.toLocaleString("vi-VN")} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-ink-primary">
                            {item.avgCostPrice.toLocaleString("vi-VN")} đ/{item.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                ⚠️ Dưới Định Mức
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                🟢 Đủ Tồn Kho
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-ink-muted text-[11px] truncate max-w-[180px]">
                            {item.supplierName}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setReceiptItems([{ ingredientId: item.id, quantity: 5, unitPrice: item.avgCostPrice }]);
                                setReceiptSupplier(item.supplierName);
                                setIsCreateReceiptOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-900 font-bold text-[11px] transition-all"
                            >
                              + Nhập Thêm
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Mobile Infinite Scroll Sentinel */}
          <div className="block md:hidden">
            <MobileInfiniteSentinel
              hasMore={hasMoreIngredients}
              totalCount={filteredIngredients.length}
              visibleCount={visibleIngredientCount}
              sentinelRef={ingredientSentinelRef}
            />
          </div>

          {/* Phân trang tồn kho trên Desktop (>= md) */}
          <div className="hidden md:block">
            <Pagination
              currentPage={stockPage}
              totalItems={filteredIngredients.length}
              pageSize={STOCK_PAGE_SIZE}
              onPageChange={setStockPage}
            />
          </div>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ PHIẾU NHẬP KHO */}
      {activeTab === "receipts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted font-bold">
              Danh sách các phiếu nhập hàng từ nhà cung cấp có hóa đơn đối soát
            </span>
            <Button
              size="sm"
              className="rounded-full gap-2 text-xs bg-brand-900 text-white"
              onClick={() => setIsCreateReceiptOpen(true)}
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              <span>Tạo Phiếu Nhập Kho Mới</span>
            </Button>
          </div>

          {receipts.length === 0 ? (
            <div className="py-14 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-white shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-3">
                <Icon name="fileText" className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-ink-primary">Chưa có phiếu nhập kho nào</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Tạo phiếu nhập kho để ghi nhận hàng hóa và chi phí nguyên liệu từ các nhà cung cấp.
              </p>
              <Button
                size="sm"
                className="mt-4 rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold"
                onClick={() => setIsCreateReceiptOpen(true)}
              >
                <Icon name="plus" className="w-3.5 h-3.5 text-brand-400" />
                <span>Tạo Phiếu Nhập Đầu Tiên</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReceipts.map((rc) => (
                <Panel key={rc.id} variant="default" padding="lg" className="space-y-4 border border-surface-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-ink-primary font-mono">{rc.code}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          Đã Thanh Toán
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Nhà cung cấp: <strong className="text-ink-primary">{rc.supplierName}</strong> • Người nhận: {rc.receivedBy}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-ink-muted block">{rc.receivedDate}</span>
                      <span className="text-base font-black text-brand-900">
                        {rc.totalAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>

                  {/* Danh sách mặt hàng trong phiếu */}
                  <div className="bg-surface-canvas rounded-2xl p-3 border border-surface-border/60">
                    <span className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider block mb-2">
                      Chi Tiết Các Mặt Hàng Nhập
                    </span>
                    <div className="divide-y divide-surface-border/50 text-xs">
                      {rc.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between">
                          <div className="font-bold text-ink-primary">
                            {item.ingredientName}
                            <span className="text-ink-muted font-normal ml-2">
                              ({item.quantity} {item.unit} × {item.unitPrice.toLocaleString("vi-VN")} đ)
                            </span>
                          </div>
                          <div className="font-black text-ink-primary">
                            {item.subtotal.toLocaleString("vi-VN")} đ
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rc.notes && (
                    <p className="text-[11px] text-ink-muted italic">
                      Ghi chú: {rc.notes}
                    </p>
                  )}
                </Panel>
              ))}
            </div>
          )}

          {/* Mobile Infinite Scroll Sentinel */}
          <div className="block md:hidden">
            <MobileInfiniteSentinel
              hasMore={hasMoreReceipts}
              totalCount={receipts.length}
              visibleCount={visibleReceiptCount}
              sentinelRef={receiptSentinelRef}
            />
          </div>

          {/* Phân trang phiếu nhập kho trên Desktop (>= md) */}
          <div className="hidden md:block">
            <Pagination
              currentPage={receiptPage}
              totalItems={receipts.length}
              pageSize={RECEIPT_PAGE_SIZE}
              onPageChange={setReceiptPage}
            />
          </div>
        </div>
      )}

      {/* TAB 3: ĐỊNH LƯỢNG MÓN ĂN (RECIPE BOM) */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          <Panel variant="default" padding="lg" className="space-y-3 bg-brand-50/50 border border-brand-200">
            <div className="flex items-center gap-2">
              <Icon name="info" className="w-4 h-4 text-brand-900" />
              <h4 className="font-black text-xs text-brand-950 uppercase tracking-wider">
                Cơ Chế Tự Động Báo Hết Món Theo Tồn Kho Nguyên Liệu
              </h4>
            </div>
            <p className="text-xs text-brand-900/90 leading-relaxed">
              Mỗi khi nhân viên thu ngân hoặc khách quét QR gọi 1 món ăn, hệ thống sẽ tự động đối chiếu với lượng nguyên vật liệu trong kho theo định lượng dưới đây. Khi một trong các nguyên liệu chính chạm đáy, món ăn sẽ tự động chuyển sang trạng thái **Tạm Hết Hàng** để ngăn chặn tình trạng khách đặt món nhưng bếp không đủ nguyên liệu để chế biến.
            </p>
          </Panel>

          {recipes.length === 0 ? (
            <div className="py-14 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-white shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-3">
                <Icon name="clipboard" className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-ink-primary">Chưa cấu hình định lượng món ăn (Recipe BOM)</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Thiết lập định lượng nguyên liệu cho từng món trong thực đơn để hệ thống tự động trừ kho và cảnh báo hết hàng tức thì.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((rcp) => (
                <Panel key={rcp.dishId} variant="default" padding="lg" className="space-y-3">
                  <div className="flex items-start justify-between border-b border-surface-border pb-2.5">
                    <div>
                      <h4 className="font-black text-sm text-ink-primary">{rcp.dishName}</h4>
                      <span className="text-[11px] text-ink-muted font-bold">{rcp.category}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-100 text-brand-800">
                      BOM Ready
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-ink-subtle">
                      Nguyên liệu cấu thành (1 Suất ăn):
                    </span>
                    <div className="space-y-1.5">
                      {rcp.ingredients.map((ingItem, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-canvas border border-surface-border">
                          <span className="font-bold text-ink-primary">{ingItem.ingredientName}</span>
                          <span className="font-black text-brand-900 font-mono">
                            {ingItem.quantity} {ingItem.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: TẠO PHIẾU NHẬP KHO */}
      {isCreateReceiptOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCreateReceiptOpen(false);
            }}
          >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4 border border-surface-border animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-ink-primary">Lập Phiếu Nhập Kho Từ Nhà Cung Cấp</h3>
                <p className="text-xs text-ink-muted mt-0.5">Nhập số lượng thực tế để tự động cộng dồn tồn kho và cập nhật giá vốn</p>
              </div>
              <button
                onClick={() => setIsCreateReceiptOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Nhà Cung Cấp *
                  </label>
                  <input
                    type="text"
                    value={receiptSupplier}
                    onChange={(e) => setReceiptSupplier(e.target.value)}
                    required
                    placeholder="Tên nhà cung cấp..."
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Ghi Chú Đợt Giao
                  </label>
                  <input
                    type="text"
                    value={receiptNotes}
                    onChange={(e) => setReceiptNotes(e.target.value)}
                    placeholder="Ví dụ: Giao sáng sớm, kiểm dịch đạt chuẩn..."
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Danh sách mặt hàng nhập */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-ink-primary uppercase tracking-wide">
                    Mặt Hàng Nhập Kho
                  </span>
                  <button
                    type="button"
                    onClick={handleAddReceiptRow}
                    className="text-xs font-bold text-brand-800 hover:text-brand-950 flex items-center gap-1"
                  >
                    <Icon name="plus" className="w-3.5 h-3.5" />
                    <span>Thêm Hàng</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {receiptItems.map((row, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-surface-canvas border border-surface-border flex flex-col sm:flex-row items-center gap-2.5">
                      <div className="flex-1 w-full sm:w-auto">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => handleUpdateReceiptRow(idx, "ingredientId", e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-28 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={row.quantity}
                          onChange={(e) => handleUpdateReceiptRow(idx, "quantity", Number(e.target.value))}
                          placeholder="SL"
                          className="w-full h-8 px-2 rounded-lg border border-surface-border text-xs font-bold text-right focus:border-brand-800 focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-36 flex items-center gap-1">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={row.unitPrice}
                          onChange={(e) => handleUpdateReceiptRow(idx, "unitPrice", Number(e.target.value))}
                          placeholder="Đơn giá"
                          className="w-full h-8 px-2 rounded-lg border border-surface-border text-xs font-bold text-right focus:border-brand-800 focus:outline-none"
                        />
                        <span className="text-[10px] text-ink-muted font-bold">đ</span>
                      </div>

                      <div className="w-full sm:w-32 text-right font-black text-xs text-brand-900 pr-2">
                        {(row.quantity * row.unitPrice).toLocaleString("vi-VN")} đ
                      </div>

                      {receiptItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReceiptRow(idx)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-subtle hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng tiền phiếu nhập */}
              <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-950">Tổng Tiền Thanh Toán:</span>
                <span className="text-lg font-black text-brand-900">
                  {receiptItems.reduce((acc, cur) => acc + (cur.quantity || 0) * (cur.unitPrice || 0), 0).toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setIsCreateReceiptOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-6"
                >
                  Xác Nhận Nhập Kho & Cộng Tồn
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
      )}

      {/* MODAL 2: THÊM NGUYÊN LIỆU MỚI */}
      {isAddIngredientOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddIngredientOpen(false);
            }}
          >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-black text-ink-primary">Thêm Nguyên Liệu Mới Vào Kho</h3>
              <button
                onClick={() => setIsAddIngredientOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIngredientSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Mã Nguyên Liệu *
                  </label>
                  <input
                    type="text"
                    value={newIngCode}
                    onChange={(e) => setNewIngCode(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold uppercase focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Đơn Vị Tính *
                  </label>
                  <input
                    type="text"
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    required
                    placeholder="kg, lít, lon, quả..."
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Tên Nguyên Liệu Tươi Sống *
                </label>
                <input
                  type="text"
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  required
                  placeholder="Ví dụ: Thịt bò bắp hoa, Sữa tươi tiệt trùng..."
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Nhóm Phân Loại
                </label>
                <select
                  value={newIngCategory}
                  onChange={(e) => setNewIngCategory(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                >
                  <option value="MEAT">Thịt & Tươi Sống</option>
                  <option value="VEGETABLE">Rau Củ Tươi</option>
                  <option value="DRINK_RAW">Nguyên Liệu Pha Chế</option>
                  <option value="SPICE">Gia Vị & Đóng Gói</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Tồn Ban Đầu ({newIngUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newIngCurrentStock}
                    onChange={(e) => setNewIngCurrentStock(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">
                    Định Mức Tối Thiểu
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newIngMinStock}
                    onChange={(e) => setNewIngMinStock(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Đơn Giá Vốn Ước Tính (VNĐ / {newIngUnit})
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={newIngPrice}
                  onChange={(e) => setNewIngPrice(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Tên Nhà Cung Cấp
                </label>
                <input
                  type="text"
                  value={newIngSupplier}
                  onChange={(e) => setNewIngSupplier(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setIsAddIngredientOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-5"
                >
                  Lưu Nguyên Liệu
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
      )}
    </div>
  );
};
