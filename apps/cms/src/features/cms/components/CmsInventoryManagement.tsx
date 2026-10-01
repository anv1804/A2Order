import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Pagination, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
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

  // Dữ liệu mẫu nguyên vật liệu thực tế F&B
  const [ingredients, setIngredients] = useState<InventoryIngredient[]>([
    {
      id: "ing-1",
      code: "NL-BO",
      name: "Thịt Bò Phi Lê Tươi",
      category: "MEAT",
      unit: "kg",
      currentStock: 4.5,
      minStockLevel: 5.0, // Cảnh báo dưới định mức
      avgCostPrice: 240000,
      supplierName: "CTCP Thực Phẩm Sạch Hà Nội",
      updatedAt: "28/09/2026 08:30",
    },
    {
      id: "ing-2",
      code: "NL-NAM",
      name: "Thịt Bò Nạm Giòn",
      category: "MEAT",
      unit: "kg",
      currentStock: 8.2,
      minStockLevel: 4.0,
      avgCostPrice: 190000,
      supplierName: "CTCP Thực Phẩm Sạch Hà Nội",
      updatedAt: "28/09/2026 08:30",
    },
    {
      id: "ing-3",
      code: "NL-PHO",
      name: "Bánh Phở Tươi Hà Nội",
      category: "MEAT", // Tinh bột
      unit: "kg",
      currentStock: 18.0,
      minStockLevel: 10.0,
      avgCostPrice: 22000,
      supplierName: "Lò Bánh Phở Truyền Thống Nam Định",
      updatedAt: "28/09/2026 06:15",
    },
    {
      id: "ing-4",
      code: "NL-HANH",
      name: "Hành Hoa & Mùi Tươi",
      category: "VEGETABLE",
      unit: "kg",
      currentStock: 1.2,
      minStockLevel: 2.0, // Cảnh báo sắp hết
      avgCostPrice: 35000,
      supplierName: "Đại Lý Rau Sạch Vân Nội",
      updatedAt: "28/09/2026 06:30",
    },
    {
      id: "ing-5",
      code: "NL-CAFE",
      name: "Cà Phê Hạt Robusta Rang Mộc",
      category: "DRINK_RAW",
      unit: "kg",
      currentStock: 6.5,
      minStockLevel: 3.0,
      avgCostPrice: 180000,
      supplierName: "Nông Trại Cà Phê Buôn Ma Thuột",
      updatedAt: "27/09/2026 16:00",
    },
    {
      id: "ing-6",
      code: "NL-SUA",
      name: "Sữa Đặc Có Đường (Thùng 48 lon)",
      category: "DRINK_RAW",
      unit: "lon",
      currentStock: 34,
      minStockLevel: 24,
      avgCostPrice: 24500,
      supplierName: "Công Ty TNHH Phân Phối Sữa Việt",
      updatedAt: "26/09/2026 14:00",
    },
    {
      id: "ing-7",
      code: "NL-TRUNG",
      name: "Trứng Gà Ta Tươi (Quả)",
      category: "SPICE",
      unit: "quả",
      currentStock: 85,
      minStockLevel: 50,
      avgCostPrice: 3800,
      supplierName: "Trang Trại Trứng Gia Cầm Ba Vì",
      updatedAt: "28/09/2026 07:00",
    },
    {
      id: "ing-8",
      code: "NL-XUONG",
      name: "Xương Ống Bò Ninh Nước Dùng",
      category: "MEAT",
      unit: "kg",
      currentStock: 25.0,
      minStockLevel: 15.0,
      avgCostPrice: 65000,
      supplierName: "CTCP Thực Phẩm Sạch Hà Nội",
      updatedAt: "27/09/2026 22:00",
    },
  ]);

  // Danh sách phiếu nhập hàng từ nhà cung cấp
  const [receipts, setReceipts] = useState<InwardReceipt[]>([
    {
      id: "rc-3",
      code: "PNK-2026-003",
      supplierName: "CTCP Thực Phẩm Sạch Hà Nội",
      supplierPhone: "0988 123 456",
      receivedDate: "28/09/2026 08:30",
      receivedBy: "Nguyễn Văn Hùng (Bếp trưởng)",
      totalAmount: 2638000,
      paymentStatus: "PAID",
      notes: "Giao đợt sáng sớm, thịt bò tươi nguyên tảng đạt chuẩn kiểm dịch",
      createdAt: "2026-09-28T08:30:00Z",
      items: [
        { ingredientId: "ing-1", ingredientName: "Thịt Bò Phi Lê Tươi", quantity: 5, unit: "kg", unitPrice: 240000, subtotal: 1200000 },
        { ingredientId: "ing-2", ingredientName: "Thịt Bò Nạm Giòn", quantity: 6, unit: "kg", unitPrice: 190000, subtotal: 1140000 },
        { ingredientId: "ing-4", ingredientName: "Hành Hoa & Mùi Tươi", quantity: 3, unit: "kg", unitPrice: 35000, subtotal: 105000 },
        { ingredientId: "ing-7", ingredientName: "Trứng Gà Ta Tươi", quantity: 50, unit: "quả", unitPrice: 3800, subtotal: 190000 },
      ],
    },
    {
      id: "rc-2",
      code: "PNK-2026-002",
      supplierName: "Nông Trại Cà Phê Buôn Ma Thuột",
      supplierPhone: "0912 888 999",
      receivedDate: "27/09/2026 16:00",
      receivedBy: "Lê Thu Trang (Thu ngân ca chiều)",
      totalAmount: 1488000,
      paymentStatus: "PAID",
      notes: "Nguyên liệu pha chế quầy bar cho 1 tuần",
      createdAt: "2026-09-27T16:00:00Z",
      items: [
        { ingredientId: "ing-5", ingredientName: "Cà Phê Hạt Robusta", quantity: 5, unit: "kg", unitPrice: 180000, subtotal: 900000 },
        { ingredientId: "ing-6", ingredientName: "Sữa Đặc Có Đường", quantity: 24, unit: "lon", unitPrice: 24500, subtotal: 588000 },
      ],
    },
    {
      id: "rc-1",
      code: "PNK-2026-001",
      supplierName: "Lò Bánh Phở Truyền Thống Nam Định",
      supplierPhone: "0904 555 777",
      receivedDate: "26/09/2026 06:15",
      receivedBy: "Nguyễn Thành An (Chủ quán)",
      totalAmount: 660000,
      paymentStatus: "PAID",
      notes: "Bánh phở tươi tráng tay không hàn the",
      createdAt: "2026-09-26T06:15:00Z",
      items: [
        { ingredientId: "ing-3", ingredientName: "Bánh Phở Tươi Hà Nội", quantity: 30, unit: "kg", unitPrice: 22000, subtotal: 660000 },
      ],
    },
  ]);

  // Định lượng món ăn (Recipe BOM)
  const [recipes] = useState<DishRecipeBOM[]>([
    {
      dishId: "m1",
      dishName: "Phở Bò Tái Nạm Đặc Biệt",
      category: "Phở Bò Truyền Thống",
      ingredients: [
        { ingredientId: "ing-1", ingredientName: "Thịt Bò Phi Lê Tươi", quantity: 0.08, unit: "kg" },
        { ingredientId: "ing-2", ingredientName: "Thịt Bò Nạm Giòn", quantity: 0.06, unit: "kg" },
        { ingredientId: "ing-3", ingredientName: "Bánh Phở Tươi", quantity: 0.16, unit: "kg" },
        { ingredientId: "ing-4", ingredientName: "Hành Hoa & Mùi", quantity: 0.02, unit: "kg" },
      ],
    },
    {
      dishId: "m2",
      dishName: "Cà Phê Muối Xứ Huế",
      category: "Đồ Uống Pha Chế",
      ingredients: [
        { ingredientId: "ing-5", ingredientName: "Cà Phê Robusta Hạt", quantity: 0.025, unit: "kg" },
        { ingredientId: "ing-6", ingredientName: "Sữa Đặc Có Đường", quantity: 0.05, unit: "lon" },
      ],
    },
  ]);

  // Modal State: Tạo phiếu nhập kho
  const [isCreateReceiptOpen, setIsCreateReceiptOpen] = useState(false);
  const [receiptSupplier, setReceiptSupplier] = useState("CTCP Thực Phẩm Sạch Hà Nội");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptItems, setReceiptItems] = useState<{ ingredientId: string; quantity: number; unitPrice: number }[]>([
    { ingredientId: "ing-1", quantity: 5, unitPrice: 240000 },
  ]);

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
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Quản Lý Kho & Nhập Hàng
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Định Mức & Trừ Tồn Kho
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Kiểm soát nguyên vật liệu tươi sống, định mức an toàn và trừ tồn tự động khi bán món
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Thêm Nguyên Liệu (Icon-only) */}
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center border-surface-border text-ink-primary hover:bg-surface-muted shrink-0"
            onClick={() => {
              setNewIngCode(`NL-${Math.floor(100 + Math.random() * 900)}`);
              setIsAddIngredientOpen(true);
            }}
            title="Thêm Nguyên Liệu Mới"
            aria-label="Thêm Nguyên Liệu Mới"
          >
            <Icon name="plus" className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-brand-900 text-white hover:bg-brand-950 px-4 shadow-sm"
            onClick={() => setIsCreateReceiptOpen(true)}
          >
            <Icon name="fileText" className="w-3.5 h-3.5" />
            <span>+ Lập Phiếu Nhập Kho</span>
          </Button>
        </div>
      </div>

      {/* 2. Chỉ Số Tổng Quan Kho */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel variant="featured" padding="lg" className="flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-brand-200">Giá Trị Tồn Kho Thực Tế</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Icon name="banknote" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {totalStockValue.toLocaleString("vi-VN")} đ
            </h3>
            <span className="text-[11px] font-medium text-brand-200 mt-1 block">
              Tổng giá vốn các mặt hàng đang trữ trong kho
            </span>
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-ink-muted">Danh Mục Nguyên Liệu</span>
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted">
              <Icon name="menu" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-ink-primary tracking-tight">
              {ingredients.length} <span className="text-sm font-bold text-ink-muted">mặt hàng</span>
            </h3>
            <span className="text-[11px] font-medium text-ink-muted mt-1 block">
              Thịt tươi, rau củ, tinh bột & pha chế
            </span>
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-ink-muted">Cảnh Báo Sắp Hết Hàng</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lowStockCount > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
              <Icon name="alert" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className={`text-3xl font-black tracking-tight ${lowStockCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {lowStockCount} <span className="text-sm font-bold">mặt hàng</span>
            </h3>
            <span className="text-[11px] font-medium text-ink-muted mt-1 block">
              {lowStockCount > 0 ? "Dưới định mức an toàn - Cần nhập ngay!" : "Mọi mặt hàng đều đạt chuẩn tồn kho"}
            </span>
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-ink-muted">Nhập Kho Tháng Này</span>
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted">
              <Icon name="trending" className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-ink-primary tracking-tight">
              {totalInwardMonth.toLocaleString("vi-VN")} đ
            </h3>
            <span className="text-[11px] font-medium text-ink-muted mt-1 block">
              {receipts.length} đợt giao từ các nhà cung cấp
            </span>
          </div>
        </Panel>
      </div>

      {/* 3. Tab Switcher Navigation */}
      <div className="flex border-b border-surface-border gap-6 text-xs font-black">
        <button
          onClick={() => setActiveTab("stock")}
          className={`pb-3.5 relative flex items-center gap-2 transition-all ${
            activeTab === "stock"
              ? "text-brand-900 border-b-2 border-brand-900"
              : "text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="table" className="w-4 h-4" />
          <span>Tồn Kho & Định Mức An Toàn</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("receipts")}
          className={`pb-3.5 relative flex items-center gap-2 transition-all ${
            activeTab === "receipts"
              ? "text-brand-900 border-b-2 border-brand-900"
              : "text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="fileText" className="w-4 h-4" />
          <span>Lịch Sử Phiếu Nhập Kho NCC</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-muted text-ink-muted font-bold">
            {receipts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("recipes")}
          className={`pb-3.5 relative flex items-center gap-2 transition-all ${
            activeTab === "recipes"
              ? "text-brand-900 border-b-2 border-brand-900"
              : "text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon name="menu" className="w-4 h-4" />
          <span>Định Lượng Món Ăn (Recipe BOM)</span>
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
                      <td colSpan={9} className="py-8 text-center text-xs text-ink-muted font-bold">
                        Không tìm thấy nguyên vật liệu phù hợp với bộ lọc tìm kiếm
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
