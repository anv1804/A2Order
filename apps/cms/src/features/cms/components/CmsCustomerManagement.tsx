import React, { useState, useMemo } from "react";
import { Icon, Button, Badge, Panel, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { CustomerRecord, CustomerMembershipTier } from "@/types/cms.types";

const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: "c1",
    code: "KH-0089",
    name: "Trần Minh Quang",
    phone: "0912 888 999",
    email: "quang.tran@gmail.com",
    tier: "DIAMOND",
    points: 1250,
    totalSpent: 18450000,
    totalVisits: 28,
    favoriteDish: "Lẩu Riêu Cua Bắp Bò",
    lastVisit: "Hôm nay 12:30",
    createdAt: "15/01/2026",
    notes: "Khách VIP thường tiếp đối tác, thích ngồi phòng VIP 1.",
  },
  {
    id: "c2",
    code: "KH-0104",
    name: "Nguyễn Thị Thu Hà",
    phone: "0987 654 321",
    email: "thuha.nguyen@yahoo.com",
    tier: "GOLD",
    points: 680,
    totalSpent: 9200000,
    totalVisits: 16,
    favoriteDish: "Phở Bò Tái Lăn Đặc Biệt",
    lastVisit: "Hôm qua 18:45",
    createdAt: "02/02/2026",
    notes: "Khẩu vị không ăn hành, thích quẩy nóng giòn.",
  },
  {
    id: "c3",
    code: "KH-0155",
    name: "Lê Hoàng Long",
    phone: "0903 112 233",
    tier: "SILVER",
    points: 340,
    totalSpent: 4500000,
    totalVisits: 9,
    favoriteDish: "Bún Chả Nem Cua Bể",
    lastVisit: "24/09/2026",
    createdAt: "20/03/2026",
  },
  {
    id: "c4",
    code: "KH-0210",
    name: "Vũ Phương Linh",
    phone: "0934 999 111",
    email: "phuonglinh@outlook.com",
    tier: "GOLD",
    points: 790,
    totalSpent: 11200000,
    totalVisits: 19,
    favoriteDish: "Trà Đào Cam Sả Tươi",
    lastVisit: "26/09/2026",
    createdAt: "10/04/2026",
    notes: "Hay đi nhóm văn phòng từ 4 - 6 người.",
  },
  {
    id: "c5",
    code: "KH-0328",
    name: "Đặng Tuấn Kiệt",
    phone: "0977 445 566",
    tier: "BRONZE",
    points: 150,
    totalSpent: 1950000,
    totalVisits: 4,
    favoriteDish: "Phở Gà Đùi Lá Chanh",
    lastVisit: "22/09/2026",
    createdAt: "01/08/2026",
  },
  {
    id: "c6",
    code: "KH-0412",
    name: "Phạm Thùy Chi",
    phone: "0915 223 344",
    tier: "MEMBER",
    points: 60,
    totalSpent: 850000,
    totalVisits: 2,
    favoriteDish: "Nem Rán Hà Nội",
    lastVisit: "18/09/2026",
    createdAt: "15/09/2026",
  },
];

const TIER_CONFIG: Record<CustomerMembershipTier, { label: string; badgeClass: string; discountPercent: number; minSpend: string }> = {
  DIAMOND: { label: "Kim Cương", badgeClass: "bg-purple-100 text-purple-900 border-purple-200", discountPercent: 15, minSpend: "15.000.000 đ" },
  GOLD: { label: "Hạng Vàng", badgeClass: "bg-amber-100 text-amber-900 border-amber-200", discountPercent: 10, minSpend: "8.000.000 đ" },
  SILVER: { label: "Hạng Bạc", badgeClass: "bg-blue-100 text-blue-900 border-blue-200", discountPercent: 5, minSpend: "3.000.000 đ" },
  BRONZE: { label: "Hạng Đồng", badgeClass: "bg-orange-100 text-orange-900 border-orange-200", discountPercent: 3, minSpend: "1.000.000 đ" },
  MEMBER: { label: "Thành Viên", badgeClass: "bg-slate-100 text-slate-800 border-slate-200", discountPercent: 0, minSpend: "0 đ" },
};

import { usePersistentState } from "@/hooks/usePersistentState";

export const CmsCustomerManagement: React.FC = () => {
  const [customers, setCustomers] = usePersistentState<CustomerRecord[]>("customers_data", INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  // Modal Thêm / Chỉnh Sửa Khách Hàng
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    tier: "MEMBER" as CustomerMembershipTier,
    notes: "",
  });

  // Modal Điều Chỉnh Điểm Tích Lũy
  const [adjustingCustomer, setAdjustingCustomer] = useState<CustomerRecord | null>(null);
  const [pointDelta, setPointDelta] = useState<number>(50);
  const [pointReason, setPointReason] = useState<string>("Tặng điểm sinh nhật khách hàng");

  // Lọc khách hàng
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedTier !== "ALL" && c.tier !== selectedTier) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, selectedTier, searchQuery]);

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: "", phone: "", email: "", tier: "MEMBER", notes: "" });
    setIsCustomerModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      tier: c.tier,
      notes: c.notes || "",
    });
    setIsCustomerModalOpen(true);
  };

  // Lưu khách hàng
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại khách hàng");
      return;
    }

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                name: customerForm.name.trim(),
                phone: customerForm.phone.trim(),
                email: customerForm.email.trim() || undefined,
                tier: customerForm.tier,
                notes: customerForm.notes.trim() || undefined,
              }
            : c
        )
      );
      toast.success(`Đã cập nhật thông tin khách hàng "${customerForm.name}"`);
    } else {
      const newCustomer: CustomerRecord = {
        id: `c-${Date.now()}`,
        code: `KH-${Math.floor(1000 + Math.random() * 9000)}`,
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim() || undefined,
        tier: customerForm.tier,
        points: 50, // Tặng 50 điểm chào mừng
        totalSpent: 0,
        totalVisits: 0,
        lastVisit: "Chưa ghé quán",
        createdAt: new Date().toLocaleDateString("vi-VN"),
        notes: customerForm.notes.trim() || undefined,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      toast.success(`Đã thêm khách hàng "${customerForm.name}" với 50 điểm chào mừng!`);
    }

    setIsCustomerModalOpen(false);
  };

  // Xóa khách hàng
  const handleDeleteCustomer = async (c: CustomerRecord) => {
    const ok = await confirmDialog({
      title: `Xóa Hồ Sơ Khách Hàng ${c.name}?`,
      message: `Toàn bộ điểm thưởng (${c.points} điểm) và lịch sử tích lũy của khách hàng này sẽ bị xóa khỏi hệ thống.`,
      confirmText: "Xác Nhận Xóa",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setCustomers((prev) => prev.filter((item) => item.id !== c.id));
    toast.info(`Đã xóa khách hàng ${c.name}`);
  };

  // Áp dụng điều chỉnh điểm
  const handleApplyPointAdjustment = () => {
    if (!adjustingCustomer) return;

    const newPoints = Math.max(0, adjustingCustomer.points + pointDelta);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === adjustingCustomer.id
          ? {
              ...c,
              points: newPoints,
            }
          : c
      )
    );

    toast.success(
      `Đã ${pointDelta >= 0 ? "cộng" : "trừ"} ${Math.abs(pointDelta)} điểm cho khách hàng ${adjustingCustomer.name} (${pointReason})`
    );
    setAdjustingCustomer(null);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter((c) => c.tier === "DIAMOND" || c.tier === "GOLD").length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return { total, vipCount, totalRevenue };
  }, [customers]);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Khách Hàng & Thẻ Thành Viên (CRM)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Tích Điểm Tự Động
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Quản lý dữ liệu khách quen, phân hạng thẻ thành viên và điểm thưởng
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-xl gap-2 text-xs bg-brand-950 text-white hover:bg-black font-bold px-3.5 py-2 shadow-sm transition-all whitespace-nowrap"
            onClick={handleOpenCreateModal}
          >
            <Icon name="plus" className="w-3.5 h-3.5 text-brand-400" />
            <span>+ Thêm Khách Hàng Mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ KPI Chỉ Số Khách Hàng - 2 cột trên mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Tổng Khách ĐK</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
              <Icon name="users" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">{stats.total}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">khách</span>
            </div>
            <span className="text-xs font-medium text-emerald-800 truncate block">+14 khách tuần này</span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Hội Viên VIP</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50 text-purple-900 flex items-center justify-center shrink-0">
              <Icon name="sparkles" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-purple-950 tracking-tight">{stats.vipCount}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">hội viên</span>
            </div>
            <span className="text-xs font-medium text-purple-800 truncate block">Giảm 10-15% tự động</span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Doanh Thu Quen</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
              <Icon name="banknote" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-brand-950 tracking-tight">{stats.totalRevenue.toLocaleString("vi-VN")}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">đ</span>
            </div>
            <span className="text-xs font-medium text-emerald-800 truncate block">Chiếm 62% doanh thu</span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Tỷ Lệ Trở Lại</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center shrink-0">
              <Icon name="trending" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-amber-900 tracking-tight">74.2%</span>
            </div>
            <span className="text-xs font-medium text-amber-800 truncate block">Ghé 2.8 lần / tháng</span>
          </div>
        </Panel>
      </div>

      {/* Bộ Lọc & Bảng Danh Sách Khách Hàng */}
      <Panel variant="default" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên khách, số điện thoại, mã thẻ..."
              className="w-full h-10 pl-9 pr-3 rounded-2xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold py-0.5">
            <button
              type="button"
              onClick={() => setSelectedTier("ALL")}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                selectedTier === "ALL"
                  ? "bg-brand-900 text-white shadow-xs"
                  : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              Tất Cả ({customers.length})
            </button>
            {(["DIAMOND", "GOLD", "SILVER", "BRONZE", "MEMBER"] as CustomerMembershipTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                  selectedTier === tier
                    ? "bg-brand-900 text-white shadow-xs"
                    : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
                }`}
              >
                {TIER_CONFIG[tier].label} ({customers.filter((c) => c.tier === tier).length})
              </button>
            ))}
          </div>
        </div>

        {/* Bảng Dữ Liệu Khách Hàng */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[10px] font-extrabold">
                <th className="pb-3 px-3">Mã KH & Tên</th>
                <th className="pb-3 px-3">Hạng Thành Viên</th>
                <th className="pb-3 px-3">Điểm Thưởng</th>
                <th className="pb-3 px-3">Tổng Chi Tiêu & Số Lần</th>
                <th className="pb-3 px-3">Món Ưa Thích</th>
                <th className="pb-3 px-3">Lần Ghé Gần Nhất</th>
                <th className="pb-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-ink-muted font-bold">
                    Không tìm thấy khách hàng nào phù hợp bộ lọc
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-50/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-xs text-brand-900 shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-ink-primary">{c.name}</div>
                          <div className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                            <span className="font-mono">{c.code}</span> •{" "}
                            <a href={`tel:${c.phone}`} className="hover:text-brand-900 hover:underline">
                              {c.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${TIER_CONFIG[c.tier].badgeClass}`}>
                        {TIER_CONFIG[c.tier].label}
                      </span>
                      {TIER_CONFIG[c.tier].discountPercent > 0 && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          Ưu đãi -{TIER_CONFIG[c.tier].discountPercent}%
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-black text-brand-950 text-sm">
                        {c.points} <span className="text-[10px] text-ink-muted font-bold">điểm</span>
                      </div>
                      <span className="text-[10px] text-ink-muted">Tương đương {(c.points * 1000).toLocaleString("vi-VN")} đ</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-black text-ink-primary">
                        {c.totalSpent.toLocaleString("vi-VN")} đ
                      </div>
                      <span className="text-[10px] text-ink-muted">{c.totalVisits} lần ghé quán</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-ink-secondary font-bold text-[11px]">
                        {c.favoriteDish || "Chưa có dữ liệu"}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-ink-muted text-xs">{c.lastVisit}</span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingCustomer(c);
                            setPointDelta(50);
                            setPointReason("Tặng điểm sinh nhật khách hàng");
                          }}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors shadow-xs"
                          title="Cộng/Trừ điểm tích lũy"
                        >
                          ± Điểm
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1 rounded-lg text-ink-subtle hover:text-brand-900 hover:bg-surface-canvas transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1 rounded-lg text-ink-subtle hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa khách hàng"
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
      </Panel>

      {/* MODAL THÊM / CHỈNH SỬA KHÁCH HÀNG */}
      {/* MODAL THÊM / CHỈNH SỬA KHÁCH HÀNG */}
      {isCustomerModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-6 space-y-4 border border-surface-border animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold text-ink-primary">
                  {editingCustomer ? `Chỉnh Sửa Khách Hàng: ${editingCustomer.name}` : "Thêm Khách Hàng Mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Họ Và Tên Khách Hàng *</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-ink-muted mb-1 block">Số Điện Thoại *</label>
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="0912 345 678"
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-muted mb-1 block">Hạng Thành Viên</label>
                    <select
                      value={customerForm.tier}
                      onChange={(e) => setCustomerForm((f) => ({ ...f, tier: e.target.value as any }))}
                      className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 bg-white"
                    >
                      <option value="MEMBER">Thành Viên (0%)</option>
                      <option value="BRONZE">Hạng Đồng (-3%)</option>
                      <option value="SILVER">Hạng Bạc (-5%)</option>
                      <option value="GOLD">Hạng Vàng (-10%)</option>
                      <option value="DIAMOND">Kim Cương (-15%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Email (Tùy chọn)</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="khachhang@gmail.com"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Ghi Chú Khách Quen</label>
                  <textarea
                    rows={2}
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Khẩu vị đặc biệt, thói quen ngồi bàn nào, dị ứng..."
                    className="w-full p-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setIsCustomerModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                  >
                    Lưu Khách Hàng
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL CỘNG / TRỪ ĐIỂM TÍCH LŨY */}
      {adjustingCustomer && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-6 space-y-4 border border-surface-border animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary">Cộng / Trừ Điểm Thưởng</h3>
                  <p className="text-xs text-ink-muted">
                    Khách hàng: <span className="font-bold text-brand-900">{adjustingCustomer.name}</span> (Hiện có {adjustingCustomer.points} điểm)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingCustomer(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1.5 block">
                    Số điểm điều chỉnh (Dấu + hoặc -):
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[20, 50, 100, -50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPointDelta(val)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          pointDelta === val
                            ? "bg-brand-900 text-white"
                            : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                        }`}
                      >
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={pointDelta}
                    onChange={(e) => setPointDelta(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-center focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Lý do điều chỉnh:</label>
                  <input
                    type="text"
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                    placeholder="Lý do tặng hoặc trừ điểm..."
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-xs flex justify-between font-bold text-brand-950">
                  <span>Điểm sau khi điều chỉnh:</span>
                  <span>{Math.max(0, adjustingCustomer.points + pointDelta)} điểm</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setAdjustingCustomer(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                  onClick={handleApplyPointAdjustment}
                >
                  Xác Nhận Điểm
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
