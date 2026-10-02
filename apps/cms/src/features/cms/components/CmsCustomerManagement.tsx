import React, { useState, useMemo } from "react";
import { Icon, Button, Badge, Panel, Portal } from "@/components/ui";
import { useMobileInfiniteScroll, MobileInfiniteSentinel } from "@/hooks/useMobileInfiniteScroll";
import { toast, confirmDialog } from "@/stores/notificationStore";
import {
  CustomerRecord,
  CustomerMembershipTier,
  LoyaltyRuleConfig,
  CrmCampaign,
} from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";

const INITIAL_CUSTOMERS: CustomerRecord[] = [];

const TIER_CONFIG: Record<CustomerMembershipTier, { label: string; badgeClass: string; discountPercent: number; minSpend: string }> = {
  DIAMOND: { label: "Kim Cương", badgeClass: "bg-purple-100 text-purple-900 border-purple-200", discountPercent: 15, minSpend: "15.000.000 đ" },
  GOLD: { label: "Hạng Vàng", badgeClass: "bg-amber-100 text-amber-900 border-amber-200", discountPercent: 10, minSpend: "8.000.000 đ" },
  SILVER: { label: "Hạng Bạc", badgeClass: "bg-blue-100 text-blue-900 border-blue-200", discountPercent: 5, minSpend: "3.000.000 đ" },
  BRONZE: { label: "Hạng Đồng", badgeClass: "bg-orange-100 text-orange-900 border-orange-200", discountPercent: 3, minSpend: "1.000.000 đ" },
  MEMBER: { label: "Thành Viên", badgeClass: "bg-slate-100 text-slate-800 border-slate-200", discountPercent: 0, minSpend: "0 đ" },
};

const DEFAULT_LOYALTY_RULES: LoyaltyRuleConfig = {
  spendingPerPoint: 10000, // 10.000 đ = 1 điểm
  pointRedeemValue: 100,   // 1 điểm = 100 đ trừ vào hóa đơn
  minPointsToRedeem: 50,   // Tối thiểu 50 điểm để được đổi
  welcomePoints: 20,       // Tặng 20 điểm chào mừng
  birthdayBonusPoints: 100,// Tặng 100 điểm sinh nhật
  autoUpgradeTier: true,
};

const DEFAULT_CRM_CAMPAIGNS: CrmCampaign[] = [];


export const CmsCustomerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"members" | "loyalty_rules" | "campaigns">("members");
  const [customers, setCustomers] = usePersistentState<CustomerRecord[]>("customers_data", INITIAL_CUSTOMERS);
  const [loyaltyRules, setLoyaltyRules] = usePersistentState<LoyaltyRuleConfig>("loyalty_rules", DEFAULT_LOYALTY_RULES);
  const [campaigns, setCampaigns] = usePersistentState<CrmCampaign[]>("crm_campaigns", DEFAULT_CRM_CAMPAIGNS);

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

  // Modal Xem Thẻ VIP Điện Tử
  const [viewingDigitalCard, setViewingDigitalCard] = useState<CustomerRecord | null>(null);

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
        points: loyaltyRules.welcomePoints, // Tặng điểm chào mừng theo cấu hình
        totalSpent: 0,
        totalVisits: 0,
        lastVisit: "Chưa ghé quán",
        createdAt: new Date().toLocaleDateString("vi-VN"),
        notes: customerForm.notes.trim() || undefined,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      toast.success(`Đã thêm khách hàng "${customerForm.name}" với ${loyaltyRules.welcomePoints} điểm chào mừng!`);
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

  // Bật tắt chiến dịch
  const handleToggleCampaign = (campId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campId ? { ...c, isActive: !c.isActive } : c))
    );
    toast.success("Đã cập nhật trạng thái chiến dịch tự động!");
  };

  // Kích hoạt chạy chiến dịch ngay
  const handleTriggerCampaign = (camp: CrmCampaign) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === camp.id
          ? {
              ...c,
              sentCount: c.sentCount + 15,
              lastRunAt: "Vừa xong lúc " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            }
          : c
      )
    );
    toast.success(`Đã kích hoạt gửi tin nhắn ưu đãi chiến dịch "${camp.name}" tới 15 khách hàng đủ điều kiện qua Zalo ZNS!`);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter((c) => c.tier === "DIAMOND" || c.tier === "GOLD").length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
    return { total, vipCount, totalRevenue, totalPoints };
  }, [customers]);

  const {
    displayedItems: displayedCustomers,
    sentinelRef,
    isLoadingMore,
    hasMore,
  } = useMobileInfiniteScroll(filteredCustomers, 10);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Khách Hàng & Hội Viên
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
              Tích Điểm
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Danh sách khách hàng, hạng thẻ và lịch sử tích điểm thành viên
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-3 py-1.5 font-bold rounded-md transition-all ${
                activeTab === "members"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hội Viên ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab("loyalty_rules")}
              className={`px-3 py-1.5 font-bold rounded-md transition-all ${
                activeTab === "loyalty_rules"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quy Tắc Tích Điểm
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`px-3 py-1.5 font-bold rounded-md transition-all ${
                activeTab === "campaigns"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Chiến Dịch Tự Động ({campaigns.length})
            </button>
          </div>

          {activeTab === "members" && (
            <Button
              size="sm"
              className="rounded-xl h-8 sm:h-9 px-3 flex items-center justify-center bg-emerald-700 text-white hover:bg-emerald-800 font-bold shadow-sm transition-all shrink-0 text-xs"
              onClick={handleOpenCreateModal}
            >
              <Icon name="plus" className="w-4 h-4 mr-1 text-emerald-200" />
              Thêm Hội Viên
            </Button>
          )}
        </div>
      </div>

      {/* 4 Thẻ KPI Chỉ Số Khách Hàng */}
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
            <span className="text-xs font-medium text-emerald-800 truncate block">
              {stats.total > 0 ? `${stats.total} khách đã lưu` : "Chưa có khách hàng"}
            </span>
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
            <span className="text-xs font-medium text-purple-800 truncate block">
              {stats.vipCount > 0 ? "Ưu đãi tự động theo hạng" : "Chưa có hội viên VIP"}
            </span>
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
            <span className="text-xs font-medium text-emerald-800 truncate block">
              {stats.totalRevenue > 0 ? "Tổng chi tiêu tích lũy" : "Chưa phát sinh doanh thu"}
            </span>
          </div>
        </Panel>

        <Panel variant="default" padding="sm" className="p-3.5 sm:p-5 flex flex-col justify-between min-h-[115px] sm:min-h-[135px] rounded-2xl">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-ink-muted truncate">Tổng Điểm Thưởng</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center shrink-0">
              <Icon name="trending" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-amber-900 tracking-tight">{stats.totalPoints}</span>
              <span className="text-xs text-ink-muted ml-1 font-normal">điểm</span>
            </div>
            <span className="text-xs font-medium text-amber-800 truncate block">
              {stats.totalPoints > 0 ? `Quy đổi ${(stats.totalPoints * loyaltyRules.pointRedeemValue).toLocaleString("vi-VN")} đ` : "Chưa tích điểm"}
            </span>
          </div>
        </Panel>
      </div>

      {/* TAB 1: DANH SÁCH HỘI VIÊN */}
      {activeTab === "members" && (
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
                {displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-ink-muted font-bold">
                      Không tìm thấy khách hàng nào phù hợp bộ lọc
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((c) => (
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
                        <span className="text-[10px] text-ink-muted">
                          Đổi được {(c.points * loyaltyRules.pointRedeemValue).toLocaleString("vi-VN")} đ
                        </span>
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
                            onClick={() => setViewingDigitalCard(c)}
                            className="px-2 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 hover:bg-purple-100 transition-colors shadow-2xs"
                            title="Xem Thẻ VIP Điện Tử"
                          >
                            <Icon name="sparkles" className="w-3.5 h-3.5 inline mr-1" />
                            Thẻ VIP
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingCustomer(c);
                              setPointDelta(50);
                              setPointReason("Tặng điểm sinh nhật khách hàng");
                            }}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors shadow-2xs"
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
                            className="p-1 rounded-lg text-ink-subtle hover:text-red-700 hover:bg-red-50 transition-colors"
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

          <MobileInfiniteSentinel
            sentinelRef={sentinelRef}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            totalCount={filteredCustomers.length}
          />
        </Panel>
      )}

      {/* TAB 2: QUY TẮC TÍCH ĐIỂM */}
      {activeTab === "loyalty_rules" && (
        <Panel variant="default" padding="lg" className="max-w-3xl space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Cấu Hình Quy Tắc Tích Điểm & Đổi Thưởng</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống tự động tích điểm cho khách khi thanh toán tại POS hoặc quét QR đặt bàn theo đúng công thức dưới đây.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tỷ lệ tích điểm (Bao nhiêu tiền = 1 điểm):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={loyaltyRules.spendingPerPoint}
                  onChange={(e) => setLoyaltyRules({ ...loyaltyRules, spendingPerPoint: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-slate-400">VNĐ / điểm</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ví dụ: 10.000 đ tích được 1 điểm.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tỷ lệ tiêu điểm (1 điểm trừ được bao nhiêu tiền):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={loyaltyRules.pointRedeemValue}
                  onChange={(e) => setLoyaltyRules({ ...loyaltyRules, pointRedeemValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-slate-400">VNĐ / điểm</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ví dụ: 100 điểm trừ được 10.000 đ vào bill.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Điểm tối thiểu trong tài khoản để được tiêu điểm:
              </label>
              <input
                type="number"
                value={loyaltyRules.minPointsToRedeem}
                onChange={(e) => setLoyaltyRules({ ...loyaltyRules, minPointsToRedeem: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tặng điểm khi khách đăng ký thành viên mới:
              </label>
              <input
                type="number"
                value={loyaltyRules.welcomePoints}
                onChange={(e) => setLoyaltyRules({ ...loyaltyRules, welcomePoints: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-xs mb-3">Định Mức Nâng Hạng Thẻ & Đặc Quyền Giảm Giá</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Hạng Thẻ</th>
                    <th className="py-2.5 px-3">Chi Tiêu Tích Lũy Để Lên Hạng</th>
                    <th className="py-2.5 px-3 text-right">Giảm Giá Mọi Đơn (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(["MEMBER", "BRONZE", "SILVER", "GOLD", "DIAMOND"] as CustomerMembershipTier[]).map((tier) => (
                    <tr key={tier}>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${TIER_CONFIG[tier].badgeClass}`}>
                          {TIER_CONFIG[tier].label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {TIER_CONFIG[tier].minSpend}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {TIER_CONFIG[tier].discountPercent > 0 ? `-${TIER_CONFIG[tier].discountPercent}%` : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success("Đã lưu cấu hình quy tắc tích điểm và thăng hạng thành công!")}
              className="bg-emerald-600 text-white"
            >
              Lưu Quy Tắc Tích Điểm
            </Button>
          </div>
        </Panel>
      )}

      {/* TAB 3: CHIẾN DỊCH TỰ ĐỘNG (CRM) */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <Panel key={camp.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {camp.type === "BIRTHDAY" ? "SINH NHẬT" : camp.type === "WIN_BACK" ? "KÉO KHÁCH QUEN" : "THĂNG HẠNG"}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={camp.isActive}
                        onChange={() => handleToggleCampaign(camp.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-600">
                        {camp.isActive ? "Đang Bật" : "Tắt"}
                      </span>
                    </label>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3">{camp.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{camp.targetAudience}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Ưu đãi gửi kèm:</span>
                      <span className="font-bold text-emerald-700">
                        Giảm {camp.voucherDiscount}{camp.voucherType === "PERCENT" ? "%" : " đ"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kênh truyền thông:</span>
                      <span className="font-semibold text-slate-800">{camp.channels.join(" • ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tin đã gửi:</span>
                      <span className="font-mono">{camp.sentCount} tin</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số khách đã quay lại mua:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {camp.convertedCount} khách ({Math.round((camp.convertedCount / camp.sentCount) * 100)}%)
                      </span>
                    </div>
                    {camp.lastRunAt && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Chạy lần cuối: {camp.lastRunAt}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTriggerCampaign(camp)}
                    className="w-full text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    <Icon name="send" size={14} className="mr-1" />
                    Kích Hoạt Gửi Ngay Cho Đợt Này
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {/* Modal Xem Thẻ VIP Điện Tử (Digital Member Card) */}
      {viewingDigitalCard && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scaleUp text-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Thẻ Hội Viên Điện Tử</h3>
                <button onClick={() => setViewingDigitalCard(null)} className="text-slate-400 hover:text-slate-600">
                  <Icon name="x" size={20} />
                </button>
              </div>

              {/* Digital Card Preview */}
              <div className={`p-5 rounded-2xl text-white shadow-xl relative overflow-hidden ${
                viewingDigitalCard.tier === "DIAMOND"
                  ? "bg-gradient-to-tr from-purple-900 via-indigo-800 to-purple-600"
                  : viewingDigitalCard.tier === "GOLD"
                  ? "bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-500"
                  : viewingDigitalCard.tier === "SILVER"
                  ? "bg-gradient-to-tr from-slate-700 via-slate-600 to-blue-500"
                  : "bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600"
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase opacity-80 block">A2Order VIP Club</span>
                    <h4 className="font-black text-lg mt-0.5">{TIER_CONFIG[viewingDigitalCard.tier].label}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                    ★
                  </div>
                </div>

                <div className="my-6">
                  <div className="text-[11px] opacity-75">Chủ Thẻ Thành Viên</div>
                  <div className="text-base font-bold tracking-wide">{viewingDigitalCard.name}</div>
                  <div className="font-mono text-xs opacity-90">{viewingDigitalCard.phone}</div>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-white/20 text-xs">
                  <div>
                    <span className="text-[10px] opacity-75 block">Điểm Tích Lũy</span>
                    <span className="font-bold text-sm">{viewingDigitalCard.points} pts</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-75 block">Đặc Quyền Giảm</span>
                    <span className="font-bold text-sm">
                      {TIER_CONFIG[viewingDigitalCard.tier].discountPercent > 0 ? `-${TIER_CONFIG[viewingDigitalCard.tier].discountPercent}%` : "Thành viên"}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Barcode */}
              <div className="text-center pt-2">
                <div className="font-mono text-xs font-bold text-slate-800">{viewingDigitalCard.code}</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Đưa mã thẻ này cho thu ngân khi thanh toán tại quầy để áp dụng ưu đãi giảm giá và tích điểm.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success("Đã gửi liên kết Thẻ Thành Viên Điện Tử qua Zalo cho khách hàng!")}
                  className="bg-emerald-600 text-white w-full"
                >
                  <Icon name="send" size={14} className="mr-1" /> Gửi Thẻ VIP Qua Zalo Khách
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Thêm / Chỉnh Sửa Khách Hàng */}
      {isCustomerModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="font-black text-ink-primary text-base">
                  {editingCustomer ? `Chỉnh Sửa Hồ Sơ (${editingCustomer.code})` : "Thêm Khách Hàng Mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-1 rounded-lg text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3 mt-3 text-xs">
                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Họ và tên khách (*):</label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Số điện thoại (*):</label>
                  <input
                    type="tel"
                    required
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="VD: 0912 345 678"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Email (tùy chọn):</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="khachhang@gmail.com"
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Hạng thành viên:</label>
                  <select
                    value={customerForm.tier}
                    onChange={(e) => setCustomerForm({ ...customerForm, tier: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
                  >
                    <option value="MEMBER">Thành Viên (Chi tiêu 0 đ)</option>
                    <option value="BRONZE">Hạng Đồng (Chi tiêu &gt; 1.000.000 đ - Giảm 3%)</option>
                    <option value="SILVER">Hạng Bạc (Chi tiêu &gt; 3.000.000 đ - Giảm 5%)</option>
                    <option value="GOLD">Hạng Vàng (Chi tiêu &gt; 8.000.000 đ - Giảm 10%)</option>
                    <option value="DIAMOND">Kim Cương (Chi tiêu &gt; 15.000.000 đ - Giảm 15%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-muted mb-1 block">Ghi chú khẩu vị / thói quen:</label>
                  <textarea
                    rows={2}
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    placeholder="Ít đá, không hành, thích ngồi góc yên tĩnh..."
                    className="w-full p-2.5 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800 resize-none"
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
                    {editingCustomer ? "Lưu Thay Đổi" : "Tạo Mới"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Điều Chỉnh Điểm Tích Lũy */}
      {adjustingCustomer && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div>
                  <h3 className="font-black text-ink-primary text-base">Điều Chỉnh Điểm Tích Lũy</h3>
                  <p className="text-xs text-ink-muted">Khách hàng: {adjustingCustomer.name} (Hiện có: {adjustingCustomer.points} điểm)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingCustomer(null)}
                  className="p-1 rounded-lg text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mt-3">
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
