import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TableGrid } from "@/features/tables/components/TableGrid";
import { TableStatus, OrderItemStatus } from "@a2order/shared";
import { KdsTicketCard } from "@/features/kds/components/KdsTicketCard";
import { MenuItemCard } from "@/features/menu/components/MenuItemCard";
import { OrderMenuModal } from "@/features/ordering/components/OrderMenuModal";
import { CashierWorkstation } from "@/features/billing/components/CashierWorkstation";
import { UnifiedAuthModal } from "@/features/auth/components/UnifiedAuthModal";
import { GlobalFeedback } from "@/components/feedback";
import { Panel, Button, Badge, LoadingScreen, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";
import { formatCurrency } from "@/lib/formatters";
import { TableItem, KdsTicket, MenuItemData, StaffMember, CartItem } from "@/types";
import { INITIAL_MENU } from "@/data/mockMenu";
import { StaffIntercomWidget } from "@/components/shared/StaffIntercomWidget";
import { StaffScheduleProfile } from "@/features/staff/components/StaffScheduleProfile";
import { MenuDashboard } from "@/features/menu/components/MenuDashboard";

const INITIAL_TABLES: (TableItem & { zone?: string })[] = [
  { id: "1", name: "Bàn 01", status: TableStatus.EMPTY, zone: "T1" },
  { id: "2", name: "Bàn 02", status: TableStatus.OCCUPIED, occupiedMinutes: 12, totalAmount: 184000, zone: "T1" },
  { id: "3", name: "Bàn 03", status: TableStatus.WAITING_FOOD, occupiedMinutes: 18, totalAmount: 193000, zone: "T1" },
  { id: "4", name: "Bàn 04", status: TableStatus.SERVED, occupiedMinutes: 35, totalAmount: 388000, zone: "T1" },
  { id: "5", name: "Bàn 05", status: TableStatus.PAYMENT_PENDING, occupiedMinutes: 45, totalAmount: 250000, zone: "T2" },
  { id: "6", name: "Bàn 06", status: TableStatus.EMPTY, zone: "T2" },
  { id: "7", name: "Bàn 07 (VIP 1)", status: TableStatus.OCCUPIED, occupiedMinutes: 28, totalAmount: 650000, zone: "VIP" },
  { id: "8", name: "Bàn 08 (Sân Vườn)", status: TableStatus.EMPTY, zone: "SAN_VUON" },
];

const INITIAL_KDS_TICKETS: KdsTicket[] = [
  {
    id: "t1",
    tableName: "Bàn 03",
    minutesAgo: 14,
    batchNumber: 1,
    items: [
      { id: "i1", name: "Phở Bò Tái Nạm", quantity: 2, notes: "Không hành, nhiều nước béo", status: OrderItemStatus.COOKING },
      { id: "i2", name: "Trứng Gà Trần", quantity: 2, status: OrderItemStatus.DONE },
      { id: "i3", name: "Quẩy Giòn Phở", quantity: 1, status: OrderItemStatus.DONE },
    ],
  },
  {
    id: "t2",
    tableName: "Bàn 02",
    minutesAgo: 5,
    batchNumber: 1,
    items: [
      { id: "i4", name: "Bún Chả Hà Nội Đặc Biệt", quantity: 1, status: OrderItemStatus.QUEUED },
      { id: "i5", name: "Nem Rán Hải Sản", quantity: 2, status: OrderItemStatus.QUEUED },
    ],
  },
  {
    id: "t3",
    tableName: "Bàn 07 (VIP 1)",
    minutesAgo: 2,
    batchNumber: 2,
    items: [
      { id: "i6", name: "Lẩu Đuôi Bò Nồi Đất", quantity: 1, notes: "Cay vừa", status: OrderItemStatus.COOKING },
    ],
  },
];

const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Em Hùng", role: "Phục vụ" },
  { id: "s2", name: "Chị Lan", role: "Thu ngân" },
  { id: "s3", name: "Bác Ba", role: "Đầu bếp" },
];

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"tables" | "kds" | "billing" | "menu" | "chat" | "schedule" | "settings">("tables");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(MOCK_STAFF[0]);

  // Data states
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES);
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>(INITIAL_KDS_TICKETS);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);

  // Table filters
  const [tableSearch, setTableSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [pinnedTables, setPinnedTables] = useState<string[]>([]);

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTables((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Active table interaction modal
  const [activeTableForOrder, setActiveTableForOrder] = useState<TableItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeTableMenuActions, setActiveTableMenuActions] = useState<TableItem | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const loader = document.getElementById("initial-loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.remove();
        }, 400);
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      window.location.href = "http://localhost:3000";
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  // Xử lý khi nhấn vào bàn ăn trên sơ đồ
  const handleTableClick = (table: TableItem) => {
    if (table.status === TableStatus.EMPTY) {
      // Bàn trống -> Mở modal gọi món ngay
      setActiveTableForOrder(table);
      setIsOrderModalOpen(true);
    } else if (table.status === TableStatus.PAYMENT_PENDING) {
      // Chờ tính tiền -> Chuyển thẳng sang tab Thu ngân
      setActiveTab("billing");
      toast.info(`Chuyển sang Quầy Thu Ngân để thanh toán ${table.name}`);
    } else {
      // Bàn đang có khách -> Mở bảng thao tác nhanh bàn
      setActiveTableMenuActions(table);
    }
  };

  // Xác nhận gọi món và gửi đơn vào bếp KDS
  const handleOrderSubmitted = (tableName: string, items: CartItem[]) => {
    const sum = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    // 1. Cập nhật trạng thái bàn
    setTables((prev) =>
      prev.map((t) =>
        t.name === tableName
          ? {
              ...t,
              status: TableStatus.WAITING_FOOD,
              occupiedMinutes: t.occupiedMinutes ? t.occupiedMinutes : 1,
              totalAmount: (t.totalAmount || 0) + sum,
            }
          : t
      )
    );

    // 2. Tạo vé KDS mới cho bếp
    const newTicket: KdsTicket = {
      id: `t-${Date.now()}`,
      tableName,
      minutesAgo: 0,
      batchNumber: 1,
      items: items.map((i, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
        status: OrderItemStatus.QUEUED,
      })),
    };
    setKdsTickets((prev) => [newTicket, ...prev]);

    sound.playKitchenChime();
    toast.success(`Đã gửi ${items.length} món của ${tableName} vào bếp KDS!`);
    setIsOrderModalOpen(false);
    setActiveTableMenuActions(null);
  };

  // Hoàn tất thu tiền bàn từ quầy thu ngân
  const handleFinishPayment = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: TableStatus.EMPTY,
              occupiedMinutes: 0,
              totalAmount: 0,
            }
          : t
      )
    );
  };

  // Đổi trạng thái món KDS
  const handleToggleKdsItem = (itemId: string) => {
    setKdsTickets((prev) =>
      prev.map((ticket) => ({
        ...ticket,
        items: ticket.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status:
                  i.status === OrderItemStatus.QUEUED
                    ? OrderItemStatus.COOKING
                    : i.status === OrderItemStatus.COOKING
                    ? OrderItemStatus.DONE
                    : OrderItemStatus.QUEUED,
              }
            : i
        ),
      }))
    );
  };

  const handleCompleteKdsTicket = (ticketId: string) => {
    setKdsTickets((prev) => prev.filter((t) => t.id !== ticketId));
    sound.playKitchenChime();
    toast.success("Đã hoàn tất vé bếp!");
  };

  if (isLoading) {
    return null;
  }

  // RBAC checks
  const isWaiter = currentStaff.role.toLowerCase().includes("phục vụ");

  // Lọc bàn ăn
  const filteredTables = tables.filter((t: any) => {
    if (selectedZone !== "ALL" && t.zone !== selectedZone) return false;
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
    if (tableSearch.trim() && !t.name.toLowerCase().includes(tableSearch.toLowerCase())) return false;
    return true;
  });

  const sortedFilteredTables = [...filteredTables].sort((a, b) => {
    const aIndex = pinnedTables.indexOf(a.id);
    const bIndex = pinnedTables.indexOf(b.id);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex; // pinned earlier comes first
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  const occupiedCount = tables.filter((t) => t.status !== TableStatus.EMPTY).length;
  const emptyCount = tables.length - occupiedCount;
  const waitingFoodCount = tables.filter((t) => t.status === TableStatus.WAITING_FOOD).length;
  const currentTotalRevenue = tables.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  return (
    <>
      <GlobalFeedback />

      <AppShell
        storeName="Phở Bò Nam Định - Chi Nhánh 1"
        userName={currentStaff.name}
        userRole={currentStaff.role}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => setIsAuthModalOpen(true)}
        configVersion="v1.0.3"
      >
        {/* ===================== TAB 1: SƠ ĐỒ BÀN & GỌI MÓN ===================== */}
        {activeTab === "tables" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-ink-primary tracking-tight">Sơ Đồ Bàn Phục Vụ</h2>
              <Badge variant="success" className="font-extrabold text-[10px]">Thời Gian Thực</Badge>
            </div>

            {/* Metric KPI Cards (Forest Green Donezo style) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              <Panel variant="featured" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-brand-200">Đang Có Khách</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Icon name="arrowUpRight" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
                  </div>
                </div>
                <div className="my-1.5 sm:my-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight">{occupiedCount}</span>
                  <span className="text-[11px] sm:text-xs text-brand-200 ml-1">/ {tables.length} bàn</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-brand-200 truncate">
                  {Math.round((occupiedCount / tables.length) * 100)}% công suất quán
                </span>
              </Panel>

              <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Bàn Trống</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-emerald-600 shrink-0">
                    <Icon name="checkCircle" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
                  </div>
                </div>
                <div className="my-1.5 sm:my-2">
                  <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">{emptyCount}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                  Sẵn sàng đón khách
                </span>
              </Panel>

              <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Chờ Món</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-orange-600 shrink-0">
                    <Icon name="clock" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
                  </div>
                </div>
                <div className="my-1.5 sm:my-2">
                  <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">{waitingFoodCount}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                  {kdsTickets.length} vé trong bếp
                </span>
              </Panel>

              {!isWaiter ? (
                <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Tạm Tính</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center text-brand-800 shrink-0">
                      <Icon name="banknote" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
                    </div>
                  </div>
                  <div className="my-1.5 sm:my-2">
                    <span className="text-lg sm:text-2xl font-black text-brand-900 tracking-tight truncate block">
                      {formatCurrency(currentTotalRevenue)}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-ink-muted truncate">
                    {occupiedCount} bàn chưa thanh toán
                  </span>
                </Panel>
              ) : (
                <Panel variant="default" padding="sm" className="p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full"></div>
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] sm:text-xs font-bold text-ink-muted">Chờ Bưng</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Icon name="bell" className="w-3.5 h-3.5 sm:w-4 sm:h-4" size={15} />
                    </div>
                  </div>
                  <div className="my-1.5 sm:my-2">
                    <span className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">{Math.floor(Math.random() * 5) + 1}</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full w-fit animate-pulse flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Bếp vừa trả đồ
                  </span>
                </Panel>
              )}
            </div>

            {/* Zone, Status, and Search Filters */}
            <div className="flex flex-col gap-1.5 sticky top-16 z-30 bg-surface-canvas/95 backdrop-blur-md pt-2 pb-3 -mx-2 px-2 sm:mx-0 sm:px-0 border-b border-surface-border">
              {/* Zone Filter */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedZone("ALL")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                    selectedZone === "ALL"
                      ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                      : "bg-surface-canvas text-ink-muted border-surface-border hover:text-ink-primary"
                  }`}
                >
                  Tất Cả Khu Vực
                </button>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
                  {[
                    { id: "T1", label: "Tầng 1 (Máy Lạnh)" },
                    { id: "T2", label: "Tầng 2 (Sân Vườn)" },
                    { id: "VIP", label: "Phòng VIP" },
                    { id: "SAN_VUON", label: "Khu Ngoài Trời" },
                  ].map((z) => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZone(z.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                        selectedZone === z.id
                          ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                          : "bg-white text-ink-muted border-surface-border hover:text-ink-primary"
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => setSelectedStatus("ALL")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                    selectedStatus === "ALL"
                      ? "bg-brand-100 text-brand-900 border-brand-300 shadow-sm"
                      : "bg-surface-canvas text-ink-muted border-surface-border hover:text-ink-primary"
                  }`}
                >
                  Tất Cả Trạng Thái
                </button>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
                  {[
                    { id: TableStatus.EMPTY, label: "Trống" },
                    { id: TableStatus.WAITING_FOOD, label: "Chờ Món" },
                    { id: TableStatus.OCCUPIED, label: "Đang Dùng" },
                    { id: TableStatus.PAYMENT_PENDING, label: "Chờ Tính Tiền" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                        selectedStatus === st.id
                          ? "bg-brand-100 text-brand-900 border-brand-300 shadow-sm"
                          : "bg-white text-ink-muted border-surface-border hover:text-ink-primary"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Reset */}
              <div className="flex items-center gap-2 mt-2 w-full">
                <div className="relative flex-1">
                  <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Tìm nhanh bàn ăn..."
                    className="w-full h-10 pl-9 pr-9 rounded-xl bg-white border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-800 shadow-sm"
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-muted flex items-center justify-center text-ink-subtle hover:text-ink-primary transition-colors"
                    >
                      <Icon name="x" className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {(selectedZone !== "ALL" || selectedStatus !== "ALL" || tableSearch) && (
                  <button
                    onClick={() => {
                      setTableSearch("");
                      setSelectedZone("ALL");
                      setSelectedStatus("ALL");
                    }}
                    className="h-10 px-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <Icon name="refresh" className="w-3.5 h-3.5" />
                    <span>Xóa Lọc</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tables Grid */}
            <div className="pt-1 min-h-[60vh]">
              <TableGrid tables={sortedFilteredTables} onTableClick={handleTableClick} pinnedTables={pinnedTables} onTogglePin={handleTogglePin} />
            </div>
          </div>
        )}

        {/* ===================== TAB 2: MÀN HÌNH BẾP (KDS) ===================== */}
        {activeTab === "kds" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-ink-primary">Màn Hình Bếp Trưởng (KDS)</h2>
                  <Badge variant="success" className="animate-pulse">Live {kdsTickets.length} Vé</Badge>
                </div>
                <p className="text-xs text-ink-muted">Chạm vào từng món để đổi trạng thái Nấu Xong hoặc bấm Hoàn Tất Vé</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs gap-1.5 bg-white"
                onClick={() => {
                  sound.playKitchenChime();
                  toast.info("Đã phát âm thanh kiểm tra loa bếp!");
                }}
              >
                <Icon name="bell" className="w-3.5 h-3.5" />
                <span>Thử Chuông Bếp</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kdsTickets.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-surface-border">
                  <Icon name="kitchen" className="w-12 h-12 text-ink-subtle mx-auto mb-2" />
                  <h3 className="text-sm font-black text-ink-primary">Bếp Đang Trống Vé</h3>
                  <p className="text-xs text-ink-muted mt-1">Khi phục vụ nhấn "Gửi Bếp", đơn món sẽ lập tức hiện tại đây</p>
                </div>
              ) : (
                kdsTickets.map((ticket) => (
                  <KdsTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onItemStatusToggle={handleToggleKdsItem}
                    onCompleteTicket={handleCompleteKdsTicket}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: QUẦY THU NGÂN (CASHIER WORKSTATION) ===================== */}
        {activeTab === "billing" && (
          <CashierWorkstation
            tables={tables}
            onFinishPayment={handleFinishPayment}
          />
        )}

        {/* ===================== TAB 4: DANH MỤC MÓN & BÁO HẾT 86 ===================== */}
        {activeTab === "menu" && (
          <MenuDashboard 
            menuItems={menuItems} 
            onToggleStock={(id, avail) => {
              setMenuItems((prev) =>
                prev.map((m) => (m.id === id ? { ...m, isAvailable: avail } : m))
              );
            }} 
          />
        )}

        {/* ===================== TAB 5: BỘ ĐÀM (CHAT) ===================== */}
        {activeTab === "chat" && (
          <div className="w-full flex-1 flex flex-col animate-fadeIn">
            <StaffIntercomWidget 
              currentStaffName={currentStaff.name} 
              currentStaffRole={currentStaff.role} 
              fullScreenMode={true}
              tables={tables} 
            />
          </div>
        )}

        {/* ===================== TAB 6: LỊCH TRÌNH ===================== */}
        {activeTab === "schedule" && (
          <div className="w-full">
            <StaffScheduleProfile 
              currentStaff={currentStaff} 
              attendanceRecords={[]}
              onClockIn={() => {}}
              onClockOut={() => {}}
              onOpenPinModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {/* ===================== DIALOG THAO TÁC BÀN ĐANG CÓ KHÁCH ===================== */}
        {activeTableMenuActions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-surface-border space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-base font-black text-ink-primary">{activeTableMenuActions.name}</h3>
                  <p className="text-xs text-ink-muted">
                    Thời gian ngồi: {activeTableMenuActions.occupiedMinutes || 10} phút • Tạm tính:{" "}
                    <strong className="text-brand-900">{formatCurrency(activeTableMenuActions.totalAmount || 180000)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveTableMenuActions(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Button
                  size="md"
                  className="w-full rounded-2xl bg-brand-900 text-white font-black text-xs gap-2 justify-start h-11"
                  onClick={() => {
                    setActiveTableForOrder(activeTableMenuActions);
                    setIsOrderModalOpen(true);
                    setActiveTableMenuActions(null);
                  }}
                >
                  <Icon name="plus" className="w-4 h-4 text-white" />
                  <span>Gọi Thêm Món Ăn Vào Bếp</span>
                </Button>

                <Button
                  size="md"
                  variant="outline"
                  className="w-full rounded-2xl border-surface-border text-ink-primary font-bold text-xs gap-2 justify-start h-11"
                  onClick={() => {
                    setActiveTableMenuActions(null);
                    setActiveTab("billing");
                  }}
                >
                  <Icon name="cashier" className="w-4 h-4 text-brand-900" />
                  <span>Thanh Toán / Xuất VietQR (Quầy Thu Ngân)</span>
                </Button>

                <Button
                  size="md"
                  variant="outline"
                  className="w-full rounded-2xl border-surface-border text-ink-primary font-bold text-xs gap-2 justify-start h-11"
                  onClick={() => {
                    sound.playKitchenChime();
                    toast.info(`Đang in phiếu tạm tính cho ${activeTableMenuActions.name}...`);
                    setActiveTableMenuActions(null);
                  }}
                >
                  <Icon name="print" className="w-4 h-4 text-ink-muted" />
                  <span>In Phiếu Tạm Tính Cho Khách Xem</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Gọi Món Mới Tương Tác (Order Menu Pad) */}
        <OrderMenuModal
          isOpen={isOrderModalOpen}
          table={activeTableForOrder}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmitOrder={handleOrderSubmitted}
        />

        {/* Unified Auth Modal */}
        <UnifiedAuthModal
          isOpen={isAuthModalOpen}
          staffList={MOCK_STAFF}
          onPinSubmit={(staffId: string) => {
            const staff = MOCK_STAFF.find((s) => s.id === staffId);
            if (staff) {
              setCurrentStaff(staff);
              toast.success(`Nhân viên ${staff.name} vào ca thành công!`);
            }
            setIsAuthModalOpen(false);
          }}
          onAdminLogin={(email: string) => {
            toast.success(`Đăng nhập quản trị viên (${email}) thành công!`);
            setIsAuthModalOpen(false);
          }}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </AppShell>
    </>
  );
};
