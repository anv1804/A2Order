import React, { useState } from "react";
import { Panel, Button, Badge, Icon, Pagination } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";

import { ModifierOption, FnbDishItem } from "@/types/cms.types";

export const CmsMenuManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [dishes, setDishes] = useState<FnbDishItem[]>([
    {
      id: "m1",
      name: "Phở Bò Tái Nạm",
      category: "Phở Bò Truyền Thống",
      price: 65000,
      costPrice: 26000,
      station: "KITCHEN",
      isAvailable: true,
      stockCount: 85,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=400&auto=format&fit=crop",
      description: "Thịt bò tái tươi mọng kết hợp nạm giòn thơm ngon đậm đà",
      modifiers: [
        { name: "Thêm trứng trần", price: 15000 },
        { name: "Thêm quẩy giòn", price: 10000 },
        { name: "Thêm bánh phở", price: 10000 },
      ],
    },
    {
      id: "m2",
      name: "Bún Chả Hà Nội Đặc Biệt",
      category: "Món Nước Khác",
      price: 60000,
      costPrice: 22000,
      station: "KITCHEN",
      isAvailable: true,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=400&auto=format&fit=crop",
      description: "Chả viên nướng than hoa thơm nức mũi kèm nem rán giòn",
      modifiers: [
        { name: "Thêm nem rán (2 chiếc)", price: 20000 },
        { name: "Thêm bún", price: 10000 },
      ],
    },
    {
      id: "m3",
      name: "Bò Tái Thăn Thượng Hạng",
      category: "Phở Bò Truyền Thống",
      price: 85000,
      costPrice: 48000,
      station: "KITCHEN",
      isAvailable: false, // Tạm ngưng phục vụ
      stockCount: 0,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
      description: "Thăn bò mềm tan thái tay theo ngày, chỉ phục vụ số lượng giới hạn",
    },
    {
      id: "m4",
      name: "Lẩu Đuôi Bò Nồi Đất",
      category: "Lẩu & Món Nhậu",
      price: 350000,
      costPrice: 120000,
      station: "KITCHEN",
      isAvailable: true,
      stockCount: 8,
      image: "https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=600&auto=format&fit=crop",
      description: "Nồi lẩu đuôi bò ninh nhừ thuốc bắc tẩm bổ cho 3-4 người",
    },
    {
      id: "m5",
      name: "Trà Đào Cam Sả Ủ Lạnh",
      category: "Đồ Uống & Tráng Miệng",
      price: 35000,
      costPrice: 11000,
      station: "BAR",
      isAvailable: true,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop",
      description: "Trà thảo mộc thanh mát ủ lạnh cùng đào ngâm giòn",
      modifiers: [
        { name: "Ít đường (50%)", price: 0 },
        { name: "Không đá", price: 0 },
        { name: "Thêm đào miếng", price: 10000 },
      ],
    },
    {
      id: "m6",
      name: "Quẩy Giòn Chiên Phồng",
      category: "Đồ Uống & Tráng Miệng",
      price: 10000,
      costPrice: 3000,
      station: "DESSERT",
      isAvailable: true,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop",
      description: "Quẩy nóng chiên phồng giòn tan ăn cùng nước phở",
    },
    {
      id: "m7",
      name: "Cà Phê Muối Xứ Huế",
      category: "Đồ Uống & Tráng Miệng",
      price: 32000,
      costPrice: 9500,
      station: "BAR",
      isAvailable: true,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop",
      description: "Cà phê pha phin truyền thống hòa quyện cùng lớp kem muối béo mặn",
    },
    {
      id: "m8",
      name: "Nem Rán Hà Nội Giòn Rụm",
      category: "Món Nước Khác",
      price: 45000,
      costPrice: 16000,
      station: "KITCHEN",
      isAvailable: true,
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop",
      description: "Nem thịt nấm mộc nhĩ chiên vàng ruộm ăn kèm nước mắm chua ngọt",
    },
  ]);

  // Bộ sưu tập ảnh mẫu món ăn chất lượng cao gợi ý cho chủ quán
  const SAMPLE_FOOD_IMAGES = [
    { label: "Phở Bò Tái Nạm", url: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop" },
    { label: "Bún Chả Hà Nội", url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=600&auto=format&fit=crop" },
    { label: "Bò Bít Tết / Thăn", url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop" },
    { label: "Lẩu Đuôi Bò", url: "https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=600&auto=format&fit=crop" },
    { label: "Cơm Tấm Sườn", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600&auto=format&fit=crop" },
    { label: "Nem Rán Giòn", url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop" },
    { label: "Cà Phê Muối", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop" },
    { label: "Trà Đào Cam Sả", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop" },
  ];

  const categories = ["ALL", "Phở Bò Truyền Thống", "Món Nước Khác", "Lẩu & Món Nhậu", "Đồ Uống & Tráng Miệng"];

  // Bộ lọc trạng thái & Phân trang
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "OUT_OF_STOCK" | "BEST_SELLER">("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Modal thêm món mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    category: "Phở Bò Truyền Thống",
    price: 60000,
    costPrice: 22000,
    station: "KITCHEN" as "KITCHEN" | "BAR" | "DESSERT",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop",
    description: "",
    isBestSeller: false,
    stockCount: 50,
  });

  // Modal Chỉnh Sửa Món Ăn
  const [editingDish, setEditingDish] = useState<FnbDishItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "Phở Bò Truyền Thống",
    price: 60000,
    costPrice: 22000,
    station: "KITCHEN" as "KITCHEN" | "BAR" | "DESSERT",
    image: "",
    description: "",
    isBestSeller: false,
    stockCount: 50,
    modifiers: [] as ModifierOption[],
  });

  // Modal cập nhật số suất còn lại
  const [stockEditDish, setStockEditDish] = useState<FnbDishItem | null>(null);
  const [editStockCount, setEditStockCount] = useState<number>(10);

  // Mở modal sửa món
  const handleOpenEditModal = (dish: FnbDishItem) => {
    setEditingDish(dish);
    setEditForm({
      name: dish.name,
      category: dish.category,
      price: dish.price,
      costPrice: dish.costPrice,
      station: dish.station,
      image: dish.image || "",
      description: dish.description || "",
      isBestSeller: Boolean(dish.isBestSeller),
      stockCount: dish.stockCount ?? 50,
      modifiers: dish.modifiers ? [...dish.modifiers] : [],
    });
  };

  // Lưu chỉnh sửa món ăn
  const handleSaveEditDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    if (!editForm.name.trim()) {
      toast.error("Vui lòng nhập tên món ăn");
      return;
    }

    setDishes((prev) =>
      prev.map((d) =>
        d.id === editingDish.id
          ? {
              ...d,
              name: editForm.name.trim(),
              category: editForm.category,
              price: Number(editForm.price) || 0,
              costPrice: Number(editForm.costPrice) || 0,
              station: editForm.station,
              image: editForm.image,
              description: editForm.description.trim() || undefined,
              isBestSeller: editForm.isBestSeller,
              stockCount: Number(editForm.stockCount) || 0,
              isAvailable: (Number(editForm.stockCount) || 0) > 0,
              modifiers: editForm.modifiers,
            }
          : d
      )
    );
    toast.success(`Đã cập nhật thông tin món "${editForm.name}" thành công!`);
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

      setDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: true, stockCount: 50 } : d))
      );
      toast.success(`Đã mở bán lại món "${dish.name}" thành công!`);
    }
  };

  const handleOpenStockEdit = (dish: FnbDishItem) => {
    setStockEditDish(dish);
    setEditStockCount(dish.stockCount || 10);
  };

  const handleSaveStockCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEditDish) return;

    setDishes((prev) =>
      prev.map((d) =>
        d.id === stockEditDish.id
          ? { ...d, stockCount: editStockCount, isAvailable: editStockCount > 0 }
          : d
      )
    );
    toast.info(`Đã cập nhật: ${stockEditDish.name} còn lại đúng ${editStockCount} suất`);
    setStockEditDish(null);
  };

  const handleCreateDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Vui lòng nhập tên món ăn");
      return;
    }

    const newDish: FnbDishItem = {
      id: `m-${Date.now()}`,
      name: addForm.name.trim(),
      category: addForm.category,
      price: Number(addForm.price) || 0,
      costPrice: Number(addForm.costPrice) || 0,
      station: addForm.station,
      image: addForm.image,
      description: addForm.description.trim() || undefined,
      isBestSeller: addForm.isBestSeller,
      isAvailable: true,
      stockCount: Number(addForm.stockCount) || 50,
    };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Quản Lý Thực Đơn & Kỹ Thuật Menu (Menu Engineering)
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Tối Ưu Lợi Nhuận F&B
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Quản lý giá bán, giá vốn (COGS), tỷ lệ lãi gộp, phân luồng trạm chế biến và kiểm soát mở bán tức thì.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-brand-900 text-white shadow-sm"
            onClick={() => {
              setAddForm({
                name: "",
                category: categories[1] || "Phở Bò Truyền Thống",
                price: 65000,
                costPrice: 25000,
                station: "KITCHEN",
                image: SAMPLE_FOOD_IMAGES[0].url,
                description: "",
                isBestSeller: false,
                stockCount: 50,
              });
              setIsAddModalOpen(true);
            }}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>+ Thêm Món Mới</span>
          </Button>
        </div>
      </div>

      {/* Tabs thanh công cụ: Danh mục + Trạng thái + Tìm kiếm */}
      <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-surface-border">
        {/* Hàng 1: Danh mục & Tìm kiếm */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <span className="text-ink-muted text-xs font-extrabold px-1">Danh mục:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                  activeCategory === cat
                    ? "bg-brand-900 text-white shadow-sm font-black"
                    : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                }`}
              >
                {cat === "ALL" ? "Tất cả món" : cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm nhanh tên món..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-3.5 pr-4 rounded-xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-800 w-56 shadow-xs"
            />
          </div>
        </div>

        {/* Hàng 2: Bộ lọc theo Trạng Thái Món */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-surface-border/60 text-xs font-bold overflow-x-auto">
          <span className="text-ink-muted text-xs font-extrabold px-1">Trạng thái:</span>
          {[
            { id: "ALL", label: "Tất cả", count: dishes.length },
            { id: "AVAILABLE", label: "Đang mở bán", count: dishes.filter((d) => d.isAvailable).length },
            { id: "OUT_OF_STOCK", label: "Tạm hết hàng", count: dishes.filter((d) => !d.isAvailable).length },
            { id: "BEST_SELLER", label: "Món bán chạy", count: dishes.filter((d) => d.isBestSeller).length },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setStatusFilter(st.id as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                statusFilter === st.id
                  ? "bg-brand-100 text-brand-900 border border-brand-300 font-black shadow-xs"
                  : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === st.id ? "bg-brand-900 text-white" : "bg-surface-muted text-ink-subtle"
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách món ăn F&B */}
      {paginatedDishes.length === 0 ? (
        <Panel variant="default" padding="lg" className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-3 text-ink-subtle">
            <Icon name="menu" className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-ink-primary">Không tìm thấy món ăn phù hợp</h4>
          <p className="text-xs text-ink-muted mt-1">Thử thay đổi bộ lọc danh mục hoặc từ khóa tìm kiếm</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDishes.map((dish) => {
            const marginPercent = Math.round(((dish.price - dish.costPrice) / dish.price) * 100);
            const isHighMargin = marginPercent >= 55;

            return (
              <Panel
                key={dish.id}
                variant="default"
                padding="none"
                className={`overflow-hidden flex flex-col justify-between border transition-all relative ${
                  !dish.isAvailable ? "opacity-75 bg-slate-50 border-rose-200" : "hover:border-brand-800 shadow-card"
                }`}
              >
                {/* Ảnh món ăn thực tế sắc nét */}
                <div className="relative h-44 w-full overflow-hidden bg-surface-canvas group">
                  <img
                    src={dish.image || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Trạm chế biến & Bán chạy tags */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-950/80 backdrop-blur-sm text-white shadow-sm">
                      {dish.station === "KITCHEN" ? "🍳 Bếp Nấu" : dish.station === "BAR" ? "☕ Quầy Bar" : "🍰 Tráng Miệng"}
                    </span>
                    {dish.isBestSeller && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-0.5 shadow-sm">
                        <Icon name="flame" className="w-3 h-3 text-white" />
                        Bán chạy
                      </span>
                    )}
                  </div>

                  {/* Nút Sửa & Xóa món */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(dish)}
                      className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-ink-primary hover:bg-white hover:text-brand-900 flex items-center justify-center shadow-sm transition-all"
                      title="Chỉnh sửa thông tin món"
                    >
                      <Icon name="edit" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish)}
                      className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-ink-muted hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center shadow-sm transition-all"
                      title="Xóa món ăn"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Overlay khi tạm hết hàng */}
                  {!dish.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs tracking-wider shadow-lg flex items-center gap-1.5">
                        <Icon name="alert" className="w-3.5 h-3.5" />
                        TẠM HẾT HÀNG
                      </span>
                    </div>
                  )}
                </div>

                {/* Header card */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-black text-sm text-ink-primary">{dish.name}</h4>
                      <span className="text-[10px] text-ink-muted mt-0.5 block">{dish.category}</span>
                    </div>

                    <span className="font-black text-base text-brand-900 shrink-0">
                      {dish.price.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {dish.description && (
                    <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed mb-3">
                      {dish.description}
                    </p>
                  )}

                  {/* Dải thông số F&B: Giá vốn, % Lợi nhuận gộp, Trạm chế biến */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-surface-canvas text-center text-xs">
                    <div>
                      <span className="text-[10px] text-ink-subtle block">Giá vốn</span>
                      <span className="font-extrabold text-ink-primary font-mono text-[11px]">
                        {dish.costPrice.toLocaleString("vi-VN")} đ
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-ink-subtle block">Biên lãi</span>
                      <span
                        className={`font-black text-[11px] ${
                          isHighMargin ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {marginPercent}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-ink-subtle block">Trạm</span>
                      <span className="font-extrabold text-brand-900 text-[10px] uppercase">
                        {dish.station === "KITCHEN" ? "Bếp nấu" : dish.station === "BAR" ? "Quầy Bar" : "Tráng miệng"}
                      </span>
                    </div>
                  </div>

                  {/* Topping / Tùy chọn đi kèm */}
                  {dish.modifiers && dish.modifiers.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-surface-border/60">
                      <span className="text-[10px] font-bold text-ink-muted block mb-1">Tùy chọn thêm:</span>
                      <div className="flex flex-wrap gap-1">
                        {dish.modifiers.map((mod, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-surface-muted text-[10px] font-semibold text-ink-primary">
                            {mod.name} {mod.price > 0 && `(+${mod.price.toLocaleString("vi-VN")}đ)`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Trạng thái còn suất + Nút Báo Hết Hàng */}
                <div className="p-3 bg-surface-canvas border-t border-surface-border flex items-center justify-between">
                  <div>
                    {dish.isAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleOpenStockEdit(dish)}
                        className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        <span>● Còn {dish.stockCount ?? "đầy đủ"} suất</span>
                        <Icon name="edit" className="w-3 h-3 text-ink-subtle" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-black text-rose-600 flex items-center gap-1">
                        <Icon name="alert" className="w-3.5 h-3.5" />
                        <span>TẠM HẾT HÀNG</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStock(dish)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
                      dish.isAvailable
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <Icon name="power" className="w-3.5 h-3.5" />
                    <span>{dish.isAvailable ? "Báo Hết Hàng" : "Mở Bán Lại"}</span>
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Phân trang đồng bộ */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredDishes.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Modal Thêm Món Mới */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 border border-surface-border animate-scaleUp max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="menu" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Thêm Món Mới Vào Menu</h3>
                  <p className="text-xs text-ink-muted">Thiết lập ảnh món, giá bán, giá vốn và trạm chế biến</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDishSubmit} className="space-y-3.5 overflow-y-auto flex-1 pr-1">
              {/* Image Picker */}
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                  Hình Ảnh Món Ăn *
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                    <img
                      src={addForm.image || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={addForm.image}
                      onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                      placeholder="Dán link ảnh món ăn (URL)..."
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none mb-1"
                    />
                    <span className="text-[10px] text-ink-subtle">
                      Chọn ảnh gợi ý nhanh bên dưới hoặc dán link ảnh tùy chỉnh
                    </span>
                  </div>
                </div>

                {/* Sample Images Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-ink-muted uppercase">Gợi ý ảnh ẩm thực Việt Nam sắc nét:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_FOOD_IMAGES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, image: sample.url })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          addForm.image === sample.url
                            ? "bg-brand-900 text-white border-brand-900"
                            : "bg-surface-canvas border-surface-border text-ink-primary hover:bg-brand-50"
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Tên Món Ăn *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Ví dụ: Phở Gà Ta Đồi"
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Nhóm Thực Đơn</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Bán (VND) *</label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: Number(e.target.value) })}
                    step={1000}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-brand-900 focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Vốn COGS *</label>
                  <input
                    type="number"
                    value={addForm.costPrice}
                    onChange={(e) => setAddForm({ ...addForm, costPrice: Number(e.target.value) })}
                    step={1000}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Trạm Chế Biến</label>
                  <select
                    value={addForm.station}
                    onChange={(e) =>
                      setAddForm({ ...addForm, station: e.target.value as "KITCHEN" | "BAR" | "DESSERT" })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value="KITCHEN">Bếp Nấu</option>
                    <option value="BAR">Quầy Bar</option>
                    <option value="DESSERT">Tráng Miệng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Số Suất Dự Kiến</label>
                  <input
                    type="number"
                    value={addForm.stockCount}
                    onChange={(e) => setAddForm({ ...addForm, stockCount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink-primary">
                    <input
                      type="checkbox"
                      checked={addForm.isBestSeller}
                      onChange={(e) => setAddForm({ ...addForm, isBestSeller: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-900 focus:ring-brand-800"
                    />
                    <span>Gắn nhãn Bán Chạy</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Mô Tả Hương Vị</label>
                <textarea
                  rows={2}
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Gợi ý: Thơm ngon, đậm đà theo công thức gia truyền..."
                  className="w-full p-2.5 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-5"
                >
                  Lưu Món Vào Thực Đơn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Món Ăn */}
      {editingDish && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingDish(null);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 border border-surface-border animate-scaleUp max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="edit" className="w-4 h-4 text-brand-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Chỉnh Sửa Món Ăn</h3>
                  <p className="text-xs text-ink-muted">Cập nhật giá bán, công thức và hình ảnh hiển thị</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDish} className="space-y-3.5 overflow-y-auto flex-1 pr-1">
              {/* Image Picker */}
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                  Hình Ảnh Món Ăn
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                    <img
                      src={editForm.image || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      placeholder="Dán đường dẫn ảnh món (URL)..."
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-ink-muted mt-0.5 block">
                      Hoặc bấm chọn nhanh ảnh mẫu chất lượng cao bên dưới:
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {SAMPLE_FOOD_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, image: img.url })}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-canvas border border-surface-border hover:border-brand-800 shrink-0 text-ink-secondary hover:text-ink-primary"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tên & Nhóm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Tên Món Ăn *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Danh Mục Thực Đơn</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Giá bán, COGS, Trạm */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Bán (VND) *</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    step={1000}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-brand-900 focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Giá Vốn COGS *</label>
                  <input
                    type="number"
                    value={editForm.costPrice}
                    onChange={(e) => setEditForm({ ...editForm, costPrice: Number(e.target.value) })}
                    step={1000}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Trạm Chế Biến</label>
                  <select
                    value={editForm.station}
                    onChange={(e) =>
                      setEditForm({ ...editForm, station: e.target.value as "KITCHEN" | "BAR" | "DESSERT" })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  >
                    <option value="KITCHEN">Bếp Nấu</option>
                    <option value="BAR">Quầy Bar</option>
                    <option value="DESSERT">Tráng Miệng</option>
                  </select>
                </div>
              </div>

              {/* Suất phục vụ & Bán chạy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Số Suất Dự Kiến Còn Lại</label>
                  <input
                    type="number"
                    value={editForm.stockCount}
                    onChange={(e) => setEditForm({ ...editForm, stockCount: Number(e.target.value) })}
                    min={0}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink-primary">
                    <input
                      type="checkbox"
                      checked={editForm.isBestSeller}
                      onChange={(e) => setEditForm({ ...editForm, isBestSeller: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-900 focus:ring-brand-800"
                    />
                    <span>Gắn nhãn Bán Chạy (Best Seller)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">Mô Tả Chi Tiết Món</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Gợi ý: Thơm ngon, đậm đà theo công thức gia truyền..."
                  className="w-full p-2.5 rounded-xl border border-surface-border text-xs focus:border-brand-800 focus:outline-none"
                />
              </div>

              {/* Tùy chọn đi kèm (Toppings/Modifiers) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-ink-secondary">
                    Tùy Chọn Kèm / Topping ({editForm.modifiers.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        modifiers: [...editForm.modifiers, { name: "Tùy chọn mới", price: 10000 }],
                      })
                    }
                    className="text-[11px] font-bold text-brand-900 hover:underline"
                  >
                    + Thêm tùy chọn
                  </button>
                </div>

                <div className="space-y-1.5">
                  {editForm.modifiers.map((mod, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mod.name}
                        onChange={(e) => {
                          const updated = [...editForm.modifiers];
                          updated[idx].name = e.target.value;
                          setEditForm({ ...editForm, modifiers: updated });
                        }}
                        className="flex-1 h-8 px-2.5 rounded-xl border border-surface-border text-xs font-medium"
                        placeholder="Tên topping..."
                      />
                      <input
                        type="number"
                        value={mod.price}
                        onChange={(e) => {
                          const updated = [...editForm.modifiers];
                          updated[idx].price = Number(e.target.value);
                          setEditForm({ ...editForm, modifiers: updated });
                        }}
                        className="w-24 h-8 px-2 rounded-xl border border-surface-border text-xs font-bold"
                        step={1000}
                        placeholder="Giá..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            modifiers: editForm.modifiers.filter((_, i) => i !== idx),
                          });
                        }}
                        className="w-7 h-7 rounded-lg text-ink-subtle hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center"
                      >
                        <Icon name="x" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setEditingDish(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-5 shadow-sm"
                >
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập Nhật Suất Còn Lại (Kiểm Soát Bán Ra) */}
      {stockEditDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated p-5 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <h3 className="text-sm font-black text-ink-primary">
                Cập Nhật Suất Phục Vụ: {stockEditDish.name}
              </h3>
              <button
                onClick={() => setStockEditDish(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockCount} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1">
                  Số suất nguyên liệu còn lại có thể chế biến:
                </label>
                <input
                  type="number"
                  min={0}
                  value={editStockCount}
                  onChange={(e) => setEditStockCount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-sm font-black text-center text-brand-900 focus:border-brand-800 focus:outline-none"
                />
                <p className="text-[10px] text-ink-muted mt-1 text-center">
                  Nếu nhập về 0, hệ thống sẽ tự động chuyển sang trạng thái Tạm Hết Hàng trên POS và mã QR
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setStockEditDish(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-brand-900 text-white text-xs px-4"
                >
                  Lưu Số Suất
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
