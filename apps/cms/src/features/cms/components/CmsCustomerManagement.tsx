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
import { toast, confirmDialog } from "@/stores/notificationStore";
import {
  CustomerRecord,
  CustomerMembershipTier,
  LoyaltyRuleConfig,
  CrmCampaign,
} from "@/types/cms.types";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  DigitalMemberCardModal,
  CustomerFormModal,
  AdjustPointsModal,
  CustomerFormData,
} from "./customers";

const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: "c-1",
    code: "KH00088",
    name: "Trần Anh Tuấn",
    phone: "0901234567",
    email: "tuan.tran@gmail.com",
    tier: "DIAMOND",
    points: 850,
    totalSpent: 18500000,
    totalVisits: 32,
    favoriteDish: "Bò Wagyu Nướng Đá",
    lastVisit: "Hôm qua, 19:30",
    createdAt: "12/01/2026",
    notes: "Khách VIP quen, thích ngồi bàn ngoài trời view hồ",
  },
  {
    id: "c-2",
    code: "KH00042",
    name: "Nguyễn Thảo Mai",
    phone: "0912345678",
    email: "mai.nguyen@outlook.com",
    tier: "GOLD",
    points: 420,
    totalSpent: 9600000,
    totalVisits: 18,
    favoriteDish: "Sashimi Cá Hồi Thượng Hạng",
    lastVisit: "3 ngày trước",
    createdAt: "20/02/2026",
    notes: "Dị ứng hải sản có vỏ (tôm cua)",
  },
  {
    id: "c-3",
    code: "KH00015",
    name: "Phạm Quốc Hùng",
    phone: "0987654321",
    email: "hung.pham@company.vn",
    tier: "GOLD",
    points: 390,
    totalSpent: 8900000,
    totalVisits: 14,
    favoriteDish: "Rượu Vang Đỏ & Steak Thăn Nội",
    lastVisit: "Tuần trước",
    createdAt: "05/03/2026",
  },
  {
    id: "c-4",
    code: "KH00103",
    name: "Lê Hoàng Yến",
    phone: "0934567890",
    email: "yen.le@gmail.com",
    tier: "SILVER",
    points: 180,
    totalSpent: 4200000,
    totalVisits: 8,
    favoriteDish: "Lẩu Nấm Hải Sản",
    lastVisit: "2 tuần trước",
    createdAt: "15/03/2026",
  },
  {
    id: "c-5",
    code: "KH00077",
    name: "Đặng Minh Trí",
    phone: "0945678901",
    tier: "BRONZE",
    points: 95,
    totalSpent: 2100000,
    totalVisits: 4,
    favoriteDish: "Cơm Chiên Hải Sản Hoàng Kim",
    lastVisit: "01/05/2026",
    createdAt: "10/04/2026",
  },
  {
    id: "c-6",
    code: "KH00119",
    name: "Vũ Phương Linh",
    phone: "0976543210",
    tier: "MEMBER",
    points: 40,
    totalSpent: 950000,
    totalVisits: 2,
    favoriteDish: "Trà Đào Cam Sả",
    lastVisit: "10/05/2026",
    createdAt: "01/05/2026",
  },
];

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
  const [customerPage, setCustomerPage] = useState(1);
  const CUSTOMER_PAGE_SIZE = 8;

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

  const paginatedDesktopCustomers = filteredCustomers.slice(
    (customerPage - 1) * CUSTOMER_PAGE_SIZE,
    customerPage * CUSTOMER_PAGE_SIZE
  );

  const {
    displayedItems: mobileCustomers,
    sentinelRef,
    isLoadingMore,
    hasMore,
    isMobile,
  } = useMobileInfiniteScroll(filteredCustomers, 10);

  const displayedCustomers = isMobile ? mobileCustomers : paginatedDesktopCustomers;

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-16">
      {/* 1. Header Banner Chuẩn Sang Trọng Emerald PRO */}
      <HeroBanner
        badge={{ label: "Khách Hàng", dot: true }}
        tagline={`${customers.length} hội viên • ${stats.vipCount} VIP`}
        title="Khách Hàng & Hội Viên"
        description="Quản lý hồ sơ khách hàng, phân hạng thẻ thành viên và quy tắc tích lũy điểm thưởng"
        chips={[
          { icon: "users", label: `${stats.total} Khách lưu hồ sơ`, variant: "default" },
          { icon: "sparkles", label: `${stats.vipCount} Hội viên VIP`, variant: "teal" },
          { icon: "banknote", label: `Chi tiêu: ${stats.totalRevenue.toLocaleString("vi-VN")} đ`, variant: "amber" },
          { icon: "trending", label: `${stats.totalPoints} Điểm thưởng`, variant: "blue" },
        ]}
        actions={
          activeTab === "members" ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 hover:bg-brand-300 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition active:scale-95 shrink-0"
            >
              <Icon name="plus" size={14} />
              <span>Thêm Hội Viên</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. 4 Thẻ KPI Chỉ Số Khách Hàng */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          icon="users"
          variant="default"
          title="Tổng Khách ĐK"
          value={stats.total}
          unit="khách"
          subtext={stats.total > 0 ? `${stats.total} khách đã lưu` : "Chưa có khách hàng"}
        />
        <StatCard
          icon="sparkles"
          variant="info"
          title="Hội Viên VIP"
          value={stats.vipCount}
          unit="hội viên"
          subtext={stats.vipCount > 0 ? "Ưu đãi tự động theo hạng" : "Chưa có hội viên VIP"}
        />
        <StatCard
          icon="banknote"
          variant="success"
          title="Doanh Thu Quen"
          value={stats.totalRevenue.toLocaleString("vi-VN")}
          unit="đ"
          subtext={stats.totalRevenue > 0 ? "Tổng chi tiêu tích lũy" : "Chưa phát sinh doanh thu"}
        />
        <StatCard
          icon="trending"
          variant="warning"
          title="Tổng Điểm Thưởng"
          value={stats.totalPoints}
          unit="điểm"
          subtext={stats.totalPoints > 0 ? `Quy đổi ${(stats.totalPoints * loyaltyRules.pointRedeemValue).toLocaleString("vi-VN")} đ` : "Chưa tích điểm"}
        />
      </section>

      {/* 3. Sticky Toolbar: Tabs Danh Mục */}
      <div className="sticky top-0 sm:top-2 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "members"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Hội Viên ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("loyalty_rules")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "loyalty_rules"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Quy Tắc Tích Điểm
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-3 sm:px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all shrink-0 ${
              activeTab === "campaigns"
                ? "bg-brand-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Chiến Dịch Tự Động ({campaigns.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH HỘI VIÊN */}
      {activeTab === "members" && (
        <DataTableCard
          searchPlaceholder="Tìm theo tên khách, số điện thoại, mã thẻ..."
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); setCustomerPage(1); }}
          onSearchClear={() => { setSearchQuery(""); setCustomerPage(1); }}
          filters={
            <FilterSelect
              labelPrefix="Hạng: "
              value={selectedTier}
              onChange={(val) => { setSelectedTier(val); setCustomerPage(1); }}
              options={[
                { value: "ALL", label: "Tất cả hạng", count: customers.length },
                ...(["DIAMOND", "GOLD", "SILVER", "BRONZE", "MEMBER"] as CustomerMembershipTier[]).map((tier) => ({
                  value: tier,
                  label: TIER_CONFIG[tier].label,
                  count: customers.filter((c) => c.tier === tier).length,
                })),
              ]}
              className="w-full sm:w-48 shrink-0"
            />
          }
          hasActiveFilters={selectedTier !== "ALL" || searchQuery.trim() !== ""}
          onResetFilters={() => {
            setSelectedTier("ALL");
            setSearchQuery("");
            setCustomerPage(1);
          }}
          pagination={{
            currentPage: customerPage,
            totalItems: filteredCustomers.length,
            pageSize: CUSTOMER_PAGE_SIZE,
            onPageChange: setCustomerPage,
          }}
          footer={
            <div className="block md:hidden">
              <MobileInfiniteSentinel
                sentinelRef={sentinelRef}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                totalCount={filteredCustomers.length}
              />
            </div>
          }
        >

          {/* Bảng Dữ Liệu Khách Hàng */}
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH & Tên</TableHead>
                  <TableHead>Hạng Thành Viên</TableHead>
                  <TableHead>Điểm Thưởng</TableHead>
                  <TableHead>Tổng Chi Tiêu & Số Lần</TableHead>
                  <TableHead>Món Ưa Thích</TableHead>
                  <TableHead>Lần Ghé Gần Nhất</TableHead>
                  <TableHead align="right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCustomers.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    title="Không tìm thấy khách hàng nào"
                    description={
                      customers.length === 0
                        ? "Chưa có dữ liệu khách hàng nào trong hệ thống."
                        : "Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc hạng thành viên."
                    }
                    action={
                      filteredCustomers.length === 0 && customers.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 font-bold"
                          onClick={() => {
                            setSelectedTier("ALL");
                            setSearchQuery("");
                            setCustomerPage(1);
                          }}
                        >
                          <Icon name="x" className="w-3.5 h-3.5" />
                          <span>Xóa Bộ Lọc</span>
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  displayedCustomers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
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
                      </TableCell>

                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${TIER_CONFIG[c.tier].badgeClass}`}>
                          {TIER_CONFIG[c.tier].label}
                        </span>
                        {TIER_CONFIG[c.tier].discountPercent > 0 && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                            Ưu đãi -{TIER_CONFIG[c.tier].discountPercent}%
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="font-black text-brand-950 text-sm">
                          {c.points} <span className="text-[10px] text-ink-muted font-bold">điểm</span>
                        </div>
                        <span className="text-[10px] text-ink-muted">
                          Đổi được {(c.points * loyaltyRules.pointRedeemValue).toLocaleString("vi-VN")} đ
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="font-black text-ink-primary">
                          {c.totalSpent.toLocaleString("vi-VN")} đ
                        </div>
                        <span className="text-[10px] text-ink-muted">{c.totalVisits} lần ghé quán</span>
                      </TableCell>

                      <TableCell>
                        <span className="text-ink-secondary font-bold text-[11px]">
                          {c.favoriteDish || "Chưa có dữ liệu"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-ink-muted text-xs">{c.lastVisit}</span>
                      </TableCell>

                      <TableCell align="right">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </DataTableCard>
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
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hạng Thẻ</TableHead>
                    <TableHead>Chi Tiêu Tích Lũy Để Lên Hạng</TableHead>
                    <TableHead align="right">Giảm Giá Mọi Đơn (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(["MEMBER", "BRONZE", "SILVER", "GOLD", "DIAMOND"] as CustomerMembershipTier[]).map((tier) => (
                    <TableRow key={tier}>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${TIER_CONFIG[tier].badgeClass}`}>
                          {TIER_CONFIG[tier].label}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {TIER_CONFIG[tier].minSpend}
                      </TableCell>
                      <TableCell align="right" className="font-mono font-bold text-emerald-700">
                        {TIER_CONFIG[tier].discountPercent > 0 ? `-${TIER_CONFIG[tier].discountPercent}%` : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
      <DigitalMemberCardModal
        customer={viewingDigitalCard}
        onClose={() => setViewingDigitalCard(null)}
        tierConfig={TIER_CONFIG}
      />

      {/* Modal Thêm / Chỉnh Sửa Khách Hàng */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleSaveCustomer}
        editingCustomer={editingCustomer}
        form={customerForm}
        setForm={setCustomerForm}
      />

      {/* Modal Điều Chỉnh Điểm Tích Lũy */}
      <AdjustPointsModal
        customer={adjustingCustomer}
        onClose={() => setAdjustingCustomer(null)}
        onConfirm={handleApplyPointAdjustment}
        pointDelta={pointDelta}
        setPointDelta={setPointDelta}
        pointReason={pointReason}
        setPointReason={setPointReason}
      />
    </div>
  );
};
