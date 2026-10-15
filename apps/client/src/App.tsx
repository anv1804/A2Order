import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TablesOverviewTab, ActiveTableActionModal } from "@/features/tables/components";
import { TableStatus, OrderItemStatus } from "@a2order/shared";
import { KdsTicketCard } from "@/features/kds/components/KdsTicketCard";
import { OrderMenuModal } from "@/features/ordering/components/OrderMenuModal";
import { UnifiedAuthModal } from "@/features/auth/components/UnifiedAuthModal";
import { GlobalFeedback } from "@/components/feedback";
import { Panel, Button, Badge, LoadingScreen, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";
import { formatCurrency } from "@/lib/formatters";
import { TableItem, KdsTicket, MenuItemData, StaffMember, CartItem } from "@/types";
import { tableApi } from "@/services/api/tableApi";
import { menuApi } from "@/services/api/menuApi";
import { storeApi } from "@/services/api/storeApi";
import { staffApi } from "@/services/api/staffApi";
import { StaffIntercomWidget } from "@/components/shared/StaffIntercomWidget";

// Code-splitting cho các phân hệ POS & Khách gọi món để tối ưu dung lượng tải lần đầu
const CashierWorkstation = React.lazy(() =>
  import("@/features/billing/components/CashierWorkstation").then((m) => ({ default: m.CashierWorkstation }))
);
const StaffScheduleProfile = React.lazy(() =>
  import("@/features/staff/components/StaffScheduleProfile").then((m) => ({ default: m.StaffScheduleProfile }))
);
const MenuDashboard = React.lazy(() =>
  import("@/features/menu/components/MenuDashboard").then((m) => ({ default: m.MenuDashboard }))
);
const CustomerTableOrderPage = React.lazy(() =>
  import("@/features/ordering/CustomerTableOrderPage").then((m) => ({ default: m.CustomerTableOrderPage }))
);

const INITIAL_KDS_TICKETS: KdsTicket[] = [];

const DEFAULT_STAFF: StaffMember[] = [
  { id: "staff-waiter-1", name: "Nhân Viên Phục Vụ", role: "Phục vụ", pinCode: "1234" },
  { id: "staff-cashier-1", name: "Thu Ngân Quán", role: "Thu ngân", pinCode: "5678" },
  { id: "staff-chef-1", name: "Bếp Trưởng", role: "Đầu bếp", pinCode: "9999" },
];

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getInitialTab = (): "tables" | "kds" | "billing" | "menu" | "chat" | "schedule" | "settings" => {
    if (typeof window === "undefined") return "tables";
    const path = window.location.pathname;
    if (path.startsWith("/kds")) return "kds";
    if (path.startsWith("/pos") || path.startsWith("/billing") || path.startsWith("/cashier")) return "billing";
    if (path.startsWith("/menu")) return "menu";
    if (path.startsWith("/chat")) return "chat";
    if (path.startsWith("/schedule")) return "schedule";
    return "tables";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(() => {
    try {
      const saved = localStorage.getItem("a2order_client_active_staff");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STAFF[0];
  });

  // Data states from DB
  const [activeStore, setActiveStore] = useState<{ id: string; name: string } | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>(INITIAL_KDS_TICKETS);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const queryStore = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("store") : null;
  const activeStoreId = queryStore || (typeof window !== "undefined" ? localStorage.getItem("a2order_active_store_id") : null) || "store-a2-kitchen";

  useEffect(() => {
    // Nếu khách đang quét QR tại bàn, không cần chờ dữ liệu POS nhân viên
    if (currentPath.startsWith("/order")) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadStoreData() {
      try {
        const [storeData, zones, dishes, rawStaff] = await Promise.all([
          storeApi.getStoreById(activeStoreId).catch(() => null),
          tableApi.getTableZones(activeStoreId).catch(() => []),
          menuApi.getDishes(activeStoreId).catch(() => []),
          staffApi.getStaff({ storeId: activeStoreId }).catch(() => []),
        ]);

        if (!isMounted) return;

        if (storeData) {
          setActiveStore({ id: storeData.id, name: storeData.name });
        } else {
          setActiveStore({ id: activeStoreId, name: "A2 Restaurant & Kitchen" });
        }

        if (Array.isArray(zones) && zones.length > 0) {
          const flat = zones.flatMap((z: any) =>
            (z.tables || []).map((t: any) => ({
              id: t.id,
              name: t.name,
              code: t.code,
              status: (t.status as TableStatus) || TableStatus.EMPTY,
              zone: z.name,
              occupiedMinutes: t.occupiedMinutes || 0,
              totalAmount: t.totalAmount || 0,
            }))
          );
          setTables(flat);
        }

        if (Array.isArray(dishes) && dishes.length > 0) {
          setMenuItems(dishes);
        }

        if (Array.isArray(rawStaff) && rawStaff.length > 0) {
          const roleMap: Record<string, string> = {
            WAITER: "Phục vụ",
            CASHIER: "Thu ngân",
            CHEF: "Đầu bếp",
            STORE_OWNER: "Chủ quán",
            ACCOUNTANT: "Kế toán",
            SUPER_ADMIN: "Quản trị viên",
          };
          const formatted: StaffMember[] = rawStaff.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: roleMap[s.role] || s.role,
            pinCode: s.pinCode || "",
            avatar: s.avatar || "",
          }));
          setStaffMembers(formatted);

          const saved = localStorage.getItem("a2order_client_active_staff");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const found = formatted.find((st) => st.id === parsed.id);
              if (found) setCurrentStaff(found);
              else setCurrentStaff(formatted[0]);
            } catch {
              setCurrentStaff(formatted[0]);
            }
          } else {
            setCurrentStaff(formatted[0]);
          }
        }
      } catch (err: any) {
        console.warn("Lỗi nạp dữ liệu POS:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStoreData();
    return () => {
      isMounted = false;
    };
  }, [activeStoreId]);

  // Table pins
  const [pinnedTables, setPinnedTables] = useState<string[]>([]);

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTables((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

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

  // 1. Phân hệ Khách hàng quét mã QR gọi món tại bàn (/order)
  if (currentPath.startsWith("/order")) {
    return (
      <React.Suspense fallback={<LoadingScreen message="Đang tải menu gọi món..." subMessage="Đồng bộ thông tin món và bàn ăn" />}>
        <CustomerTableOrderPage />
      </React.Suspense>
    );
  }

  if (isLoading) {
    return null;
  }

  // RBAC checks

  const isWaiter = currentStaff.role.toLowerCase().includes("phục vụ");


  const handleLogout = async () => {
    const ok = await confirmDialog({
      title: "Chốt Ca & Đổi Nhân Viên?",
      message: `Bạn có chắc muốn kết thúc phiên làm việc của "${currentStaff.name}" và đổi sang nhân viên khác?`,
      confirmText: "Đổi Nhân Viên",
      cancelText: "Ở Lại",
      variant: "danger",
    });
    if (ok) {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <GlobalFeedback />

      <AppShell
        storeName={activeStore?.name || "A2Order POS"}
        userName={currentStaff.name}
        userRole={currentStaff.role}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        configVersion="v1.0.3"
      >
        {/* ===================== TAB 1: SƠ ĐỒ BÀN & GỌI MÓN ===================== */}
        {activeTab === "tables" && (
          <TablesOverviewTab
            tables={tables}
            kdsTickets={kdsTickets}
            isWaiter={isWaiter}
            pinnedTables={pinnedTables}
            onTogglePin={handleTogglePin}
            onTableClick={handleTableClick}
          />
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
          <React.Suspense fallback={<div className="p-8 text-center text-ink-muted">Đang tải bàn thanh toán...</div>}>
            <CashierWorkstation
              tables={tables}
              onFinishPayment={handleFinishPayment}
            />
          </React.Suspense>
        )}

        {/* ===================== TAB 4: DANH MỤC MÓN & BÁO HẾT 86 ===================== */}
        {activeTab === "menu" && (
          <React.Suspense fallback={<div className="p-8 text-center text-ink-muted">Đang tải danh mục món...</div>}>
            <MenuDashboard 
              menuItems={menuItems} 
              onToggleStock={(id, avail) => {
                setMenuItems((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, isAvailable: avail } : m))
                );
              }} 
            />
          </React.Suspense>
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
            <React.Suspense fallback={<div className="p-8 text-center text-ink-muted">Đang tải ca làm việc...</div>}>
              <StaffScheduleProfile 
                currentStaff={currentStaff} 
                attendanceRecords={[]}
                onClockIn={(staff) => {
                  toast.success(`Nhân viên ${staff.name} đã chấm công vào ca!`);
                }}
                onClockOut={async (staff) => {
                  const ok = await confirmDialog({
                    title: "Chốt Ca & Ra Về?",
                    message: `Xác nhận chốt ca làm việc cho nhân viên "${staff.name}"?`,
                    confirmText: "Chốt Ca",
                    cancelText: "Hủy",
                    variant: "danger",
                  });
                  if (ok) {
                    toast.success(`Nhân viên ${staff.name} đã chốt ca và ra về.`);
                    setIsAuthModalOpen(true);
                  }
                }}
                onOpenPinModal={() => setIsAuthModalOpen(true)}
              />
            </React.Suspense>
          </div>
        )}

        {/* ===================== DIALOG THAO TÁC BÀN ĐANG CÓ KHÁCH ===================== */}
        <ActiveTableActionModal
          table={activeTableMenuActions}
          onClose={() => setActiveTableMenuActions(null)}
          onAddDish={(table) => {
            setActiveTableForOrder(table);
            setIsOrderModalOpen(true);
          }}
          onNavigateToBilling={() => setActiveTab("billing")}
        />

        {/* Modal Gọi Món Mới Tương Tác (Order Menu Pad) */}
        <OrderMenuModal
          isOpen={isOrderModalOpen}
          table={activeTableForOrder}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmitOrder={handleOrderSubmitted}
          storeDishes={menuItems}
        />

        {/* Unified Auth Modal */}
        <UnifiedAuthModal
          isOpen={isAuthModalOpen}
          staffList={staffMembers}
          onPinSubmit={(staffId: string, enteredPin: string) => {
            const staff = staffMembers.find((s) => s.id === staffId);
            if (staff) {
              if (staff.pinCode && enteredPin !== staff.pinCode) {
                toast.error("Mã PIN không chính xác! Vui lòng thử lại.");
                return;
              }
              setCurrentStaff(staff);
              localStorage.setItem("a2order_client_active_staff", JSON.stringify(staff));
              toast.success(`Nhân viên ${staff.name} (${staff.role}) vào ca thành công!`);
              if (staff.role.toLowerCase().includes("bếp")) {
                setActiveTab("kds");
              } else if (staff.role.toLowerCase().includes("thu ngân")) {
                setActiveTab("billing");
              }
              setIsAuthModalOpen(false);
            }
          }}
          onAdminLogin={async (adminEmail: string, adminPass: string) => {
            try {
              const res = await fetch("http://localhost:4000/api/auth/login-owner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: adminEmail.trim(), password: adminPass }),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                toast.success(`Xác thực quản trị (${data.user.name}) thành công!`);
                window.open("http://localhost:3001", "_blank");
                setIsAuthModalOpen(false);
              } else {
                toast.error(data.message || "Tài khoản hoặc mật khẩu không chính xác.");
              }
            } catch {
              toast.error("Không thể kết nối đến máy chủ.");
            }
          }}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </AppShell>
    </>
  );
};
