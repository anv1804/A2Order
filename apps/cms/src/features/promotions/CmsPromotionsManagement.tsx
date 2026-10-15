import React, { useState, useMemo } from "react";
import { Icon, Button, Badge, Panel, Portal } from "@/components/ui";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { PromotionVoucherRecord, DiscountType } from "@/types/cms.types";

const INITIAL_PROMOTIONS: PromotionVoucherRecord[] = [];

export const CmsPromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = usePersistentState<PromotionVoucherRecord[]>("promotions_list", INITIAL_PROMOTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

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

  const {
    displayedItems: displayedPromotions,
    sentinelRef,
    isLoadingMore,
    hasMore,
  } = useMobileInfiniteScroll(filteredPromotions, 10);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Khuyến Mãi & Voucher
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Giảm Giá
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Chương trình giảm giá theo %, tiền mặt, giờ vàng và mã voucher
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-brand-950 text-white hover:bg-black font-bold shadow-sm transition-all shrink-0"
            onClick={handleOpenCreateModal}
            title="Tạo Khuyến Mãi Mới"
            aria-label="Tạo Khuyến Mãi Mới"
          >
            <Icon name="plus" className="w-4 h-4 text-brand-400" />
          </Button>
        </div>
      </div>

      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Chương Trình Đang Chạy</span>
            <div className="w-7 h-7 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center">
              <Icon name="tag" className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-ink-primary">{stats.activeCount} <span className="text-xs text-ink-muted font-medium">chương trình</span></h3>
            <span className="text-[10px] text-emerald-700 font-bold">Tự động áp dụng trên máy thu ngân</span>
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Lượt Khách Đã Sử Dụng</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <Icon name="users" className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-purple-950">{stats.totalUsed} <span className="text-xs text-ink-muted font-medium">lượt</span></h3>
            <span className="text-[10px] text-purple-700 font-bold">Tỷ lệ sử dụng voucher đạt 68%</span>
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Doanh Thu Kích Cầu</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center">
              <Icon name="banknote" className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-brand-950">52.800.000 đ</h3>
            <span className="text-[10px] text-emerald-700 font-bold">Từ các hóa đơn có áp dụng voucher</span>
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">Khung Giờ Vàng Happy Hour</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
              <Icon name="clock" className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-amber-900">11h - 13h30</h3>
            <span className="text-[10px] text-amber-700 font-bold">Tăng 35% lượt khách buổi trưa</span>
          </div>
        </Panel>
      </div>

      {/* Danh Sách Khuyến Mãi */}
      <Panel variant="default" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã voucher, tên chương trình..."
              className="w-full h-10 pl-9 pr-3 rounded-2xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold py-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-brand-900 text-white shadow-xs"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              Tất Cả ({promotions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                statusFilter === "ACTIVE"
                  ? "bg-brand-900 text-white shadow-xs"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              Đang Chạy ({promotions.filter((p) => p.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                statusFilter === "INACTIVE"
                  ? "bg-brand-900 text-white shadow-xs"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              Đã Tạm Dừng ({promotions.filter((p) => !p.isActive).length})
            </button>
          </div>
        </div>

        {/* Bảng Voucher */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                <th className="pb-3 px-3">Mã Voucher & Tiêu Đề</th>
                <th className="pb-3 px-3">Mức Giảm Giá</th>
                <th className="pb-3 px-3">Điều Kiện Áp Dụng</th>
                <th className="pb-3 px-3">Thời Hạn & Lượt Dùng</th>
                <th className="pb-3 px-3">Trạng Thái</th>
                <th className="pb-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-medium">
              {displayedPromotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900">
                        <Icon name="tag" className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-ink-primary">
                        {promotions.length === 0 ? "Chưa có chương trình khuyến mãi nào" : "Không tìm thấy chương trình phù hợp"}
                      </p>
                      <p className="text-[11px] text-ink-muted max-w-sm">
                        {promotions.length === 0
                          ? "Tạo mã giảm giá theo %, số tiền cố định hoặc khung giờ vàng để thu hút khách hàng."
                          : "Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc trạng thái."}
                      </p>
                      {promotions.length === 0 && (
                        <Button
                          size="sm"
                          className="mt-2 rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold"
                          onClick={handleOpenCreateModal}
                        >
                          <Icon name="plus" className="w-3.5 h-3.5 text-brand-400" />
                          <span>Tạo Voucher Đầu Tiên</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedPromotions.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/20 transition-colors">
                    <td className="py-3.5 px-3">
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
                    </td>

                    <td className="py-3.5 px-3">
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
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-ink-primary">
                        Đơn từ {p.minOrderAmount.toLocaleString("vi-VN")} đ
                      </div>
                      {p.happyHourOnly && (
                        <span className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1 mt-0.5">
                          <Icon name="clock" className="w-3 h-3" />
                          Giờ vàng: {p.happyHourTimeRange}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-ink-primary">{p.usedCount} / {p.usageLimit} lượt</div>
                      <span className="text-[10px] text-ink-muted">
                        Hạn: {p.startDate} - {p.endDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
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
                    </td>

                    <td className="py-3.5 px-3 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <MobileInfiniteSentinel
          sentinelRef={sentinelRef}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          displayedCount={displayedPromotions.length}
          totalCount={filteredPromotions.length}
        />
      </Panel>

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
