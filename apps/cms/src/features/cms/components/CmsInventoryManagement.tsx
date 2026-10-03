import React, { useState } from "react";
import {
  Panel,
  Button,
  Badge,
  Icon,
  Pagination,
  Portal,
  Table,
  TableContainer,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  FilterSelect,
  SearchInput,
  DataTableCard,
} from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import {
  InventoryIngredient,
  InwardReceipt,
  InwardReceiptItem,
  DishRecipeBOM,
} from "@/types/cms.types";

const INITIAL_INGREDIENTS: InventoryIngredient[] = [
  {
    id: "ing-1",
    code: "NL-001",
    name: "Thăn Bò Wagyu A5",
    category: "MEAT",
    unit: "kg",
    currentStock: 12.5,
    minStockLevel: 5.0,
    avgCostPrice: 850000,
    supplierName: "Công ty Thực Phẩm Cao Cấp Hải Đăng",
    updatedAt: "Hôm nay, 08:30",
  },
  {
    id: "ing-2",
    code: "NL-002",
    name: "Cá Hồi Nauy Tươi Nguyên Con",
    category: "MEAT",
    unit: "kg",
    currentStock: 8.0,
    minStockLevel: 4.0,
    avgCostPrice: 320000,
    supplierName: "Thủy Hải Sản Hoàng Gia",
    updatedAt: "Hôm nay, 07:15",
  },
  {
    id: "ing-3",
    code: "NL-003",
    name: "Nấm Đông Cô & Nấm Linh Chi",
    category: "VEGETABLE",
    unit: "kg",
    currentStock: 2.2,
    minStockLevel: 5.0,
    avgCostPrice: 110000,
    supplierName: "Nông Trại Xanh Đà Lạt",
    updatedAt: "Hôm qua, 15:40",
  },
  {
    id: "ing-4",
    code: "NL-004",
    name: "Cốt Trà Đen Ceylon Thượng Hạng",
    category: "DRINK_RAW",
    unit: "gói",
    currentStock: 25,
    minStockLevel: 10,
    avgCostPrice: 75000,
    supplierName: "Nguyên Liệu Trà Pha Chế Phúc Thịnh",
    updatedAt: "3 ngày trước",
  },
  {
    id: "ing-5",
    code: "NL-005",
    name: "Sữa Tươi Thanh Trùng Dalat Milk",
    category: "DRINK_RAW",
    unit: "lít",
    currentStock: 4.0,
    minStockLevel: 15.0,
    avgCostPrice: 38000,
    supplierName: "Đại Lý Sữa Tươi Miền Nam",
    updatedAt: "Hôm nay, 09:00",
  },
  {
    id: "ing-6",
    code: "NL-006",
    name: "Hạt Tiêu Đen Phú Quốc",
    category: "SPICE",
    unit: "kg",
    currentStock: 6.5,
    minStockLevel: 2.0,
    avgCostPrice: 140000,
    supplierName: "Gia Vị Truyền Thống Việt",
    updatedAt: "Tuần trước",
  },
  {
    id: "ing-7",
    code: "NL-007",
    name: "Gạo ST25 Ông Cua Loại 1",
    category: "OTHER",
    unit: "kg",
    currentStock: 50.0,
    minStockLevel: 20.0,
    avgCostPrice: 34000,
    supplierName: "Tổng Kho Gạo Sạch Sóc Trăng",
    updatedAt: "Tuần trước",
  },
];

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
  const [ingredients, setIngredients] = usePersistentState<InventoryIngredient[]>("inventory_ingredients", INITIAL_INGREDIENTS);

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
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Kho Hàng", dot: true }}
        tagline={`${ingredients.length} Nguyên liệu • ${lowStockCount > 0 ? `${lowStockCount} Sắp hết hàng` : "Đầy đủ định mức"}`}
        title="Quản Lý Kho Hàng"
        description="Theo dõi tồn kho nguyên vật liệu, định mức và phiếu nhập hàng"
        chips={[
          {
            icon: "banknote",
            label: `Giá trị tồn: ${totalStockValue.toLocaleString("vi-VN")} đ`,
            variant: "default",
          },
          {
            icon: "alert",
            label: `${lowStockCount} Món báo động`,
            variant: lowStockCount > 0 ? "amber" : "teal",
            highlight: lowStockCount > 0,
          },
          {
            icon: "fileText",
            label: `${receipts.length} Phiếu nhập tháng`,
            variant: "blue",
          },
        ]}
        actions={
          <>
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
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
            >
              <Icon name="fileText" size={14} />
              <span>Lập Phiếu Nhập</span>
            </button>
          </>
        }
      />

      {/* 2. 4 Thẻ Bento Chỉ Số Kho */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="banknote"
          title="Giá Trị Tồn Kho Thực Tế"
          value={
            <>
              {totalStockValue.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-ink-muted">đ</span>
            </>
          }
          subtext="Vốn lưu trữ hiện hữu"
          badge="Giá trị kho"
          variant="success"
        />

        <StatCard
          icon="menu"
          title="Nguyên Liệu Theo Dõi"
          value={
            <>
              {ingredients.length}{" "}
              <span className="text-xs font-bold text-ink-muted">mặt hàng</span>
            </>
          }
          subtext="Thịt, rau củ & đồ pha chế"
          badge={{ text: "Danh mục", variant: "info" }}
          variant="info"
        />

        <StatCard
          icon="alert"
          title="Cảnh Báo Sắp Hết"
          value={
            <>
              {lowStockCount}{" "}
              <span className="text-xs font-bold text-ink-muted">mặt hàng</span>
            </>
          }
          subtext={lowStockCount > 0 ? "Dưới định mức an toàn" : "Đầy đủ dự trữ"}
          badge={
            lowStockCount > 0
              ? { text: "Cần nhập", variant: "danger" }
              : { text: "An toàn", variant: "success" }
          }
          variant={lowStockCount > 0 ? "danger" : "default"}
        />

        <StatCard
          icon="trending"
          title="Nhập Kho Tháng Này"
          value={
            <>
              {totalInwardMonth.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-ink-muted">đ</span>
            </>
          }
          subtext={`${receipts.length} đợt giao từ NCC`}
          badge={{ text: "Tháng này", variant: "info" }}
          variant="default"
        />
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
        <DataTableCard
          searchPlaceholder="Tìm mã hoặc tên nguyên liệu..."
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setStockPage(1);
          }}
          onSearchClear={() => {
            setSearchQuery("");
            setStockPage(1);
          }}
          filters={
            <>
              <FilterSelect
                labelPrefix="Phân loại: "
                placeholder="Tất Cả Phân Loại"
                searchPlaceholder="Tìm phân loại..."
                value={categoryFilter}
                onChange={(val) => {
                  setCategoryFilter(val);
                  setStockPage(1);
                }}
                options={[
                  { value: "ALL", label: "Tất Cả Phân Loại", count: ingredients.length },
                  { value: "MEAT", label: "Thịt Tươi Sống", count: ingredients.filter((i) => i.category === "MEAT").length },
                  { value: "VEGETABLE", label: "Rau Củ Tươi", count: ingredients.filter((i) => i.category === "VEGETABLE").length },
                  { value: "DRINK_RAW", label: "Đồ Uống & Pha Chế", count: ingredients.filter((i) => i.category === "DRINK_RAW").length },
                  { value: "SPICE", label: "Gia Vị & Khác", count: ingredients.filter((i) => i.category === "SPICE").length },
                ]}
                className="w-full sm:w-52"
              />

              <FilterSelect
                labelPrefix="Trạng thái: "
                placeholder="Tất Cả Kho"
                value={stockStatusFilter}
                onChange={(val) => {
                  setStockStatusFilter(val as any);
                  setStockPage(1);
                }}
                options={[
                  { value: "ALL", label: "Tất Cả Kho", count: ingredients.length },
                  { value: "SAFE", label: "Đủ Tồn Kho (An Toàn)", count: ingredients.filter((i) => i.currentStock > i.minStockLevel).length },
                  { value: "LOW", label: "Cảnh Báo Chạm Đáy", count: lowStockCount },
                ]}
                className="w-full sm:w-52"
              />
            </>
          }
          hasActiveFilters={categoryFilter !== "ALL" || stockStatusFilter !== "ALL" || searchQuery.trim() !== ""}
          onResetFilters={() => {
            setCategoryFilter("ALL");
            setStockStatusFilter("ALL");
            setSearchQuery("");
            setStockPage(1);
          }}
          summaryText={`Hiển thị ${displayedIngredients.length} / ${filteredIngredients.length} nguyên vật liệu`}
          pagination={{
            currentPage: stockPage,
            totalItems: filteredIngredients.length,
            pageSize: STOCK_PAGE_SIZE,
            onPageChange: setStockPage,
          }}
          footer={
            <div className="block md:hidden">
              <MobileInfiniteSentinel
                hasMore={hasMoreIngredients}
                totalCount={filteredIngredients.length}
                visibleCount={visibleIngredientCount}
                sentinelRef={ingredientSentinelRef}
              />
            </div>
          }
        >

          {/* Bảng nguyên vật liệu chuẩn Table UI */}
          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Mã NL</TableHead>
                  <TableHead>Tên Nguyên Vật Liệu</TableHead>
                  <TableHead>Đơn Vị</TableHead>
                  <TableHead className="text-right">Tồn Kho Hiện Tại</TableHead>
                  <TableHead className="text-right">Định Mức Tối Thiểu</TableHead>
                  <TableHead className="text-right">Giá Vốn Bình Quân</TableHead>
                  <TableHead className="text-center">Trạng Thái Kho</TableHead>
                  <TableHead>Nhà Cung Cấp</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedIngredients.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    icon="clipboard"
                    title={ingredients.length === 0 ? "Chưa có nguyên vật liệu nào trong kho" : "Không tìm thấy nguyên vật liệu phù hợp"}
                    description={
                      ingredients.length === 0
                        ? "Thêm nguyên vật liệu (thịt bò, gạo, gia vị, cà phê...) để theo dõi tồn kho và định lượng món ăn."
                        : "Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc."
                    }
                    action={
                      ingredients.length === 0 ? (
                        <Button
                          size="sm"
                          variant="emerald"
                          onClick={() => setIsAddIngredientOpen(true)}
                        >
                          <Icon name="plus" size={14} />
                          <span>Thêm Nguyên Liệu Đầu Tiên</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 font-bold"
                          onClick={() => {
                            setCategoryFilter("ALL");
                            setStockStatusFilter("ALL");
                            setSearchQuery("");
                            setStockPage(1);
                          }}
                        >
                          <Icon name="x" className="w-3.5 h-3.5" />
                          <span>Xóa Bộ Lọc</span>
                        </Button>
                      )
                    }
                  />
                ) : (
                  displayedIngredients.map((item) => {
                    const isLow = item.currentStock <= item.minStockLevel;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-bold text-slate-500">
                          {item.code}
                        </TableCell>
                        <TableCell className="font-black text-slate-900">
                          {item.name}
                        </TableCell>
                        <TableCell className="font-bold text-slate-500">
                          {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-black text-sm">
                          <span className={isLow ? "text-rose-600 font-extrabold" : "text-slate-950"}>
                            {item.currentStock.toLocaleString("vi-VN")} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-500">
                          {item.minStockLevel.toLocaleString("vi-VN")} {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {item.avgCostPrice.toLocaleString("vi-VN")} đ/{item.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              ⚠️ Dưới Định Mức
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              🟢 Đủ Tồn Kho
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-[11px] truncate max-w-[180px]">
                          {item.supplierName}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => {
                              setReceiptItems([{ ingredientId: item.id, quantity: 5, unitPrice: item.avgCostPrice }]);
                              setReceiptSupplier(item.supplierName);
                              setIsCreateReceiptOpen(true);
                            }}
                          >
                            + Nhập Thêm
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </DataTableCard>
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
