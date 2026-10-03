import React, { useState, useMemo } from "react";
import {
  Icon,
  Button,
  Badge,
  Panel,
  Portal,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  SearchInput,
  FilterSelect,
  DataTableCard,
} from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { PromotionVoucherRecord, DiscountType } from "@/types/cms.types";

const INITIAL_PROMOTIONS: PromotionVoucherRecord[] = [
  {
    id: "promo-1",
    code: "HAPPYHOUR",
    title: "Giờ Vàng Trưa Vui Vẻ",
    description: "Giảm 15% cho bàn dùng bữa trong khung giờ trưa từ 11:00 đến 13:30",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 200000,
    maxDiscountAmount: 100000,
    startDate: "01/05/2026",
    endDate: "30/12/2026",
    usageLimit: 500,
    usedCount: 142,
    happyHourOnly: true,
    happyHourTimeRange: "11:00 - 13:30",
    isActive: true,
  },
  {
    id: "promo-2",
    code: "CHAOBAN50K",
    title: "Chào Bạn Mới Giảm 50K",
    description: "Tặng ngay 50.000đ cho khách hàng đăng ký thành viên lần đầu",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    minOrderAmount: 250000,
    startDate: "01/01/2026",
    endDate: "31/12/2026",
    usageLimit: 300,
    usedCount: 89,
    happyHourOnly: false,
    isActive: true,
  },
  {
    id: "promo-3",
    code: "VIPGOLD20",
    title: "Đặc Quyền Thành Viên Vàng",
    description: "Chiết khấu 20% cho hạng thẻ Gold và Diamond",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 500000,
    maxDiscountAmount: 200000,
    startDate: "01/01/2026",
    endDate: "31/12/2026",
    usageLimit: 200,
    usedCount: 45,
    happyHourOnly: false,
    isActive: true,
  },
  {
    id: "promo-4",
    code: "COMBOFAMILY",
    title: "Gia Đình Sum Vầy Giảm 100K",
    description: "Áp dụng cho hóa đơn từ 4 người trở lên hoặc trên 1 triệu đồng",
    discountType: "FIXED_AMOUNT",
    discountValue: 100000,
    minOrderAmount: 1000000,
    startDate: "15/04/2026",
    endDate: "15/10/2026",
    usageLimit: 150,
    usedCount: 68,
    happyHourOnly: false,
    isActive: true,
  },
  {
    id: "promo-5",
    code: "WEEKEND10",
    title: "Cuối Tuần Rộn Ràng",
    description: "Giảm 10% toàn bộ thực đơn vào thứ 7 và chủ nhật",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 300000,
    maxDiscountAmount: 80000,
    startDate: "01/06/2026",
    endDate: "31/08/2026",
    usageLimit: 400,
    usedCount: 210,
    happyHourOnly: false,
    isActive: false,
  },
];

export const CmsPromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = usePersistentState<PromotionVoucherRecord[]>("promotions_list", INITIAL_PROMOTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [promoPage, setPromoPage] = useState(1);
  const PROMO_PAGE_SIZE = 8;

  // Modal Thêm / Chỉnh Sửa Voucher
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionVoucherRecord | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "PERCENTAGE" as DiscountType,
    discountValue: 10,
    minOrderAmount: 100000,
    maxDiscountAmount: 50000,
    startDate: new Date().toLocaleDateString("vi-VN"),
    endDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString("vi-VN"),
    usageLimit: 200,
    happyHourOnly: false,
    happyHourTimeRange: "11:00 - 13:30",
  });

  // Lọc danh sách
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      if (statusFilter === "ACTIVE" && !p.isActive) return false;
      if (statusFilter === "INACTIVE" && p.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.code.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [promotions, statusFilter, searchQuery]);

  // Bật / Tắt trạng thái voucher
  const handleToggleActive = (p: PromotionVoucherRecord) => {
    setPromotions((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, isActive: !item.isActive } : item))
    );
    toast.info(`Đã ${p.isActive ? "tạm dừng" : "kích hoạt"} chương trình [${p.code}]`);
  };

  // Sao chép mã voucher
  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Đã sao chép mã khuyến mãi: ${code}`);
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingPromotion(null);
    setPromoForm({
      code: `KM${Math.floor(10 + Math.random() * 90)}`,
      title: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 100000,
      maxDiscountAmount: 50000,
      startDate: new Date().toLocaleDateString("vi-VN"),
      endDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString("vi-VN"),
      usageLimit: 200,
      happyHourOnly: false,
      happyHourTimeRange: "11:00 - 13:30",
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEditModal = (p: PromotionVoucherRecord) => {
    setEditingPromotion(p);
    setPromoForm({
      code: p.code,
      title: p.title,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderAmount: p.minOrderAmount,
      maxDiscountAmount: p.maxDiscountAmount || 50000,
      startDate: p.startDate,
      endDate: p.endDate,
      usageLimit: p.usageLimit,
      happyHourOnly: !!p.happyHourOnly,
      happyHourTimeRange: p.happyHourTimeRange || "11:00 - 13:30",
    });
    setIsModalOpen(true);
  };

  // Lưu voucher
  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code.trim() || !promoForm.title.trim()) {
      toast.error("Vui lòng nhập mã và tiêu đề chương trình khuyến mãi");
      return;
    }

    if (editingPromotion) {
      setPromotions((prev) =>
        prev.map((item) =>
          item.id === editingPromotion.id
            ? {
                ...item,
                code: promoForm.code.trim().toUpperCase(),
                title: promoForm.title.trim(),
                description: promoForm.description.trim(),
                discountType: promoForm.discountType,
                discountValue: promoForm.discountValue,
                minOrderAmount: promoForm.minOrderAmount,
                maxDiscountAmount: promoForm.maxDiscountAmount,
                startDate: promoForm.startDate,
                endDate: promoForm.endDate,
                usageLimit: promoForm.usageLimit,
                happyHourOnly: promoForm.happyHourOnly,
                happyHourTimeRange: promoForm.happyHourTimeRange,
              }
            : item
        )
      );
      toast.success(`Đã cập nhật chương trình [${promoForm.code}]`);
    } else {
      const newPromo: PromotionVoucherRecord = {
        id: `p-${Date.now()}`,
        code: promoForm.code.trim().toUpperCase(),
        title: promoForm.title.trim(),
        description: promoForm.description.trim(),
        discountType: promoForm.discountType,
        discountValue: promoForm.discountValue,
        minOrderAmount: promoForm.minOrderAmount,
        maxDiscountAmount: promoForm.maxDiscountAmount,
        startDate: promoForm.startDate,
        endDate: promoForm.endDate,
        usageLimit: promoForm.usageLimit,
        usedCount: 0,
        happyHourOnly: promoForm.happyHourOnly,
        happyHourTimeRange: promoForm.happyHourTimeRange,
        isActive: true,
      };
      setPromotions((prev) => [newPromo, ...prev]);
      toast.success(`Đã tạo chương trình khuyến mãi mới [${newPromo.code}]`);
    }

    setIsModalOpen(false);
  };

  // Xóa voucher
  const handleDeletePromotion = async (p: PromotionVoucherRecord) => {
    const ok = await confirmDialog({
      title: `Xóa Khuyến Mãi ${p.code}?`,
      message: `Chương trình "${p.title}" sẽ bị xóa hoàn toàn khỏi hệ thống POS thu ngân.`,
      confirmText: "Xóa Khuyến Mãi",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setPromotions((prev) => prev.filter((item) => item.id !== p.id));
    toast.info(`Đã xóa khuyến mãi ${p.code}`);
  };

  // Thống kê
  const stats = useMemo(() => {
    const activeCount = promotions.filter((p) => p.isActive).length;
    const totalUsed = promotions.reduce((sum, p) => sum + p.usedCount, 0);
    return { activeCount, totalUsed };
  }, [promotions]);

  const paginatedPromotions = useMemo(() => {
    const start = (promoPage - 1) * PROMO_PAGE_SIZE;
    return filteredPromotions.slice(start, start + PROMO_PAGE_SIZE);
  }, [filteredPromotions, promoPage]);

  const {
    displayedItems: mobilePromotions,
    sentinelRef,
    isLoadingMore,
    hasMore,
  } = useMobileInfiniteScroll(filteredPromotions, 10);

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Khuyến Mãi", dot: true }}
        tagline={`${promotions.length} chương trình • ${stats.activeCount} đang hoạt động`}
        title="Khuyến Mãi & Voucher"
        description="Chương trình giảm giá theo %, tiền mặt, giờ vàng happy hour và mã voucher tự động"
        chips={[
          { icon: "tag", label: `${stats.activeCount} Đang chạy`, variant: "default" },
          { icon: "users", label: `${stats.totalUsed} Lượt sử dụng`, variant: "teal" },
          { icon: "banknote", label: "Doanh thu kích cầu: 52.8M", variant: "amber" },
          { icon: "clock", label: "Giờ vàng: 11h - 13h30", variant: "blue" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
          >
            <Icon name="plus" size={14} />
            <span>Tạo Khuyến Mãi Mới</span>
          </button>
        }
      />

      {/* 2. 4 Thẻ KPI Chỉ Số Khuyến Mãi */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="tag"
          variant="default"
          title="Chương Trình Đang Chạy"
          value={stats.activeCount}
          unit="CT"
          subtext="Tự động áp dụng trên POS"
          badge="Đang chạy"
        />

        <StatCard
          icon="users"
          variant="info"
          title="Lượt Đã Sử Dụng"
          value={stats.totalUsed}
          unit="lượt"
          subtext="Tỷ lệ sử dụng voucher 68%"
          badge="Hiệu quả"
        />

        <StatCard
          icon="banknote"
          variant="success"
          title="Doanh Thu Kích Cầu"
          value="52.800.000"
          unit="đ"
          subtext="Từ hóa đơn có mã giảm giá"
          badge="+35% DT"
        />

        <StatCard
          icon="clock"
          variant="warning"
          title="Giờ Vàng Happy Hour"
          value="11h - 13h30"
          subtext="Tăng 35% lượt khách trưa"
          badge="Khung giờ"
        />
      </section>

      {/* Danh Sách Khuyến Mãi */}
      <DataTableCard
        searchPlaceholder="Tìm theo mã voucher, tên chương trình..."
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPromoPage(1);
        }}
        onSearchClear={() => {
          setSearchQuery("");
          setPromoPage(1);
        }}
        filters={
          <FilterSelect
            labelPrefix="Trạng thái: "
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as "ALL" | "ACTIVE" | "INACTIVE");
              setPromoPage(1);
            }}
            options={[
              { value: "ALL", label: "Tất cả", count: promotions.length },
              { value: "ACTIVE", label: "Đang chạy", count: promotions.filter((p) => p.isActive).length },
              { value: "INACTIVE", label: "Đã tạm dừng", count: promotions.filter((p) => !p.isActive).length },
            ]}
            className="w-full sm:w-44 shrink-0"
          />
        }
        hasActiveFilters={statusFilter !== "ALL" || searchQuery.trim() !== ""}
        onResetFilters={() => {
          setStatusFilter("ALL");
          setSearchQuery("");
          setPromoPage(1);
        }}
        pagination={{
          currentPage: promoPage,
          totalItems: filteredPromotions.length,
          pageSize: PROMO_PAGE_SIZE,
          onPageChange: setPromoPage,
        }}
        footer={
          <div className="block md:hidden">
            <MobileInfiniteSentinel
              sentinelRef={sentinelRef}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              displayedCount={mobilePromotions.length}
              totalCount={filteredPromotions.length}
            />
          </div>
        }
      >

        {/* Bảng Voucher */}
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Voucher & Tiêu Đề</TableHead>
                <TableHead>Mức Giảm Giá</TableHead>
                <TableHead>Điều Kiện Áp Dụng</TableHead>
                <TableHead>Thời Hạn & Lượt Dùng</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead align="right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPromotions.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon="tag"
                  title={promotions.length === 0 ? "Chưa có chương trình khuyến mãi nào" : "Không tìm thấy chương trình phù hợp"}
                  description={
                    promotions.length === 0
                      ? "Tạo mã giảm giá theo %, số tiền cố định hoặc khung giờ vàng để thu hút khách hàng."
                      : "Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc trạng thái."
                  }
                  action={
                    promotions.length === 0 ? (
                      <Button
                        size="sm"
                        variant="emerald"
                        className="gap-2 font-bold"
                        onClick={handleOpenCreateModal}
                      >
                        <Icon name="plus" className="w-3.5 h-3.5" />
                        <span>Tạo Voucher Đầu Tiên</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 font-bold"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setSearchQuery("");
                          setPromoPage(1);
                        }}
                      >
                        <Icon name="x" className="w-3.5 h-3.5" />
                        <span>Xóa Bộ Lọc</span>
                      </Button>
                    )
                  }
                />
              ) : (
                paginatedPromotions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-brand-950 px-2 py-0.5 rounded-lg bg-surface-canvas border border-surface-border shadow-xs">
                          {p.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(p.code)}
                          className="text-ink-subtle hover:text-brand-900 transition-colors p-1"
                          title="Sao chép mã"
                        >
                          <Icon name="clipboard" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="font-bold text-ink-primary mt-1">{p.title}</div>
                      <div className="text-[10px] text-ink-muted line-clamp-1">{p.description}</div>
                    </TableCell>

                    <TableCell>
                      <div className="font-black text-brand-900 text-sm">
                        {p.discountType === "PERCENTAGE"
                          ? `Giảm ${p.discountValue}%`
                          : `Giảm ${p.discountValue.toLocaleString("vi-VN")} đ`}
                      </div>
                      {p.maxDiscountAmount && p.discountType === "PERCENTAGE" && (
                        <span className="text-[10px] text-ink-muted">
                          Tối đa {p.maxDiscountAmount.toLocaleString("vi-VN")} đ
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-ink-primary">
                        Đơn từ {p.minOrderAmount.toLocaleString("vi-VN")} đ
                      </div>
                      {p.happyHourOnly && (
                        <span className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1 mt-0.5">
                          <Icon name="clock" className="w-3 h-3" />
                          Giờ vàng: {p.happyHourTimeRange}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-ink-primary">{p.usedCount} / {p.usageLimit} lượt</div>
                      <span className="text-[10px] text-ink-muted">
                        Hạn: {p.startDate} - {p.endDate}
                      </span>
                    </TableCell>

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {p.isActive ? "● Đang Chạy" : "○ Tạm Dừng"}
                      </button>
                    </TableCell>

                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1 rounded-lg text-ink-subtle hover:text-brand-900 hover:bg-surface-canvas transition-colors"
                          title="Sửa chương trình"
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePromotion(p)}
                          className="p-1 rounded-lg text-ink-subtle hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa voucher"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

      </DataTableCard>

      {/* MODAL TẠO / SỬA VOUCHER */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-black text-ink-primary">
                {editingPromotion ? `Chỉnh Sửa Voucher [${editingPromotion.code}]` : "Tạo Mã Khuyến Mãi Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">Mã Voucher *</label>
                  <input
                    type="text"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="VD: GIAM20K, VIP10"
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-mono font-black focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">Hình Thức Giảm *</label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm((f) => ({ ...f, discountType: e.target.value as any }))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-white"
                  >
                    <option value="PERCENTAGE">Giảm theo % (Phần trăm)</option>
                    <option value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">Tên Chương Trình *</label>
                <input
                  type="text"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Chào Bạn Mới Giảm 20%"
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">
                    {promoForm.discountType === "PERCENTAGE" ? "Giá Trị Giảm (%):" : "Số Tiền Giảm (VNĐ):"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm((f) => ({ ...f, discountValue: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-black focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">Đơn Tối Thiểu (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={promoForm.minOrderAmount}
                    onChange={(e) => setPromoForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-black focus:outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              {promoForm.discountType === "PERCENTAGE" && (
                <div>
                  <label className="text-xs font-extrabold text-ink-muted mb-1 block">Giảm Tối Đa (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={promoForm.maxDiscountAmount}
                    onChange={(e) => setPromoForm((f) => ({ ...f, maxDiscountAmount: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>
              )}

              {/* Giờ vàng Happy hour */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoForm.happyHourOnly}
                    onChange={(e) => setPromoForm((f) => ({ ...f, happyHourOnly: e.target.checked }))}
                    className="w-4 h-4 rounded text-brand-900"
                  />
                  <span>Chỉ áp dụng trong Khung Giờ Vàng (Happy Hour)</span>
                </label>

                {promoForm.happyHourOnly && (
                  <div>
                    <label className="text-[11px] font-bold text-ink-secondary mb-1 block">Khung Giờ Áp Dụng:</label>
                    <input
                      type="text"
                      value={promoForm.happyHourTimeRange}
                      onChange={(e) => setPromoForm((f) => ({ ...f, happyHourTimeRange: e.target.value }))}
                      placeholder="VD: 11:00 - 13:30 hoặc 17:00 - 19:00"
                      className="w-full h-9 px-3 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-ink-muted mb-1 block">Số Lượt Áp Dụng Tối Đa:</label>
                <input
                  type="number"
                  min={1}
                  value={promoForm.usageLimit}
                  onChange={(e) => setPromoForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))}
                  className="w-full h-10 px-3 rounded-xl border border-surface-border text-xs font-black focus:outline-none focus:border-brand-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                >
                  Lưu Khuyến Mãi
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
