import { useResource } from "@a2order/shared/react";
import type { AttendanceRecord } from "@/types";
import { readAuth, saveAuth, clearAuth, getAuthUser, ApiError } from "@a2order/shared";
import type { BrowserAuthUser, OperationalTable } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { getSocketClient } from "@/lib/socket";
import { useAntiSpamAction } from "@/hooks/useAntiSpamAction";
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
const PublicLandingPage = React.lazy(() => import("@/features/landing/PublicLandingPage").then(m => ({ default: m.PublicLandingPage })));

const INITIAL_KDS_TICKETS: KdsTicket[] = [];

const DEFAULT_STAFF: StaffMember[] = [];

export const App: React.FC = () => {
  const landingSlug = new URLSearchParams(window.location.search).get("landing") || (window.location.pathname.startsWith("/s/") ? window.location.pathname.slice(3) : "");
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
  const [sessionUser, setSessionUser] = useState<BrowserAuthUser | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [attendanceRecords, refreshAttendance] = useResource<AttendanceRecord[]>(isVerified ? "/workforce/attendance" : null, []);
  const attendanceAction = useAntiSpamAction("attendance", (action: string, key) => requestApi("/workforce/attendance", { method: "POST", headers: { "x-idempotency-key": key }, body: JSON.stringify({ action }) }));
  const recordAttendance = async (action: string) => { try { const result = await attendanceAction.execute(action); if (!result) return; await refreshAttendance(); toast.success(action === "IN" ? "Đã ghi nhận vào ca" : "Đã ghi nhận kết ca"); } catch (e: any) { toast.error(e.message); } };

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
  const [currentStaff, setCurrentStaff] = useState<StaffMember>({ id: "", name: "Chưa đăng nhập", role: "Nhân viên", pinCode: "" });

  // Data states from DB
  const [activeStore, setActiveStore] = useState<{ id: string; name: string } | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>(INITIAL_KDS_TICKETS);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const queryStore = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("store") : null;
  const activeStoreId = sessionUser?.storeId || queryStore || "";

  const applyUser = (user: BrowserAuthUser) => {
    const roles: Record<string, string> = { WAITER: "Phục vụ", CASHIER: "Thu ngân", CHEF: "Đầu bếp", STORE_OWNER: "Chủ quán", ACCOUNTANT: "Kế toán", SUPER_ADMIN: "Quản trị viên" };
    setSessionUser(user); setCurrentStaff({ id: user.id, name: user.name, role: roles[user.role] || user.role, pinCode: "" }); setIsVerified(true);
  };
  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (currentPath.startsWith("/order") || landingSlug) { setIsLoading(false); return; }
      const previousAuth = readAuth();
      if (!previousAuth) { setSessionUser(null); setIsVerified(false); setTables([]); setKdsTickets([]); setMenuItems([]); setIsLoading(false); return; }
      try { const result = await requestApi<{ user: BrowserAuthUser }>("/auth/me"); if (active && readAuth()?.token === previousAuth.token) { applyUser(result.user); getSocketClient(); } }
      catch (error) { if (active && readAuth()?.token === previousAuth.token) { if (error instanceof ApiError && [401, 403].includes(error.status)) { clearAuth(false); setIsVerified(false); setSessionUser(null); } else toast.error("Chưa thể xác minh phiên đăng nhập. Hệ thống sẽ thử kết nối lại."); } }
      finally { if (active) setIsLoading(false); }
    };
    void verify();
    const changed = () => { void verify(); };
    window.addEventListener("a2order:auth", changed);
    window.addEventListener("online", changed);
    const timer = setInterval(changed, 30000);
    return () => { active = false; clearInterval(timer); window.removeEventListener("online", changed); window.removeEventListener("a2order:auth", changed); };
  }, [currentPath]);
  useEffect(() => {
    if (!activeStoreId || currentPath.startsWith("/order") || landingSlug) return;
    let active = true;
    requestApi<StaffMember[]>("/auth/staff/" + encodeURIComponent(activeStoreId)).then(list => { if (active) setStaffMembers(list.map(s => ({ ...s, pinCode: "" }))); }).catch(error => toast.error(error.message));
    return () => { active = false; };
  }, [activeStoreId, currentPath]);
  const refreshOperational = React.useCallback(async () => {
    if (!isVerified || !sessionUser) return;
    const store = await storeApi.getStoreById(sessionUser.storeId);
    const dishes = await menuApi.getDishes(sessionUser.storeId);
    setActiveStore({ id: store.id, name: store.name });
    setMenuItems(dishes.map((d: any) => ({ ...d, optionGroups: d.customizationGroups || [] })));
    if (sessionUser.role !== "CHEF") {
      const snapshot = await requestApi<OperationalTable[]>("/orders/" + sessionUser.storeId + "/snapshot");
      setTables(snapshot.map(t => ({ id: t.tableId, name: t.tableName, code: t.tableCode, status: t.status as TableStatus, zone: t.zoneName, occupiedMinutes: t.openedAtMs ? Math.max(0, Math.floor((Date.now() - t.openedAtMs) / 60000)) : 0, totalAmount: t.balanceAmount ?? t.totalAmount })));
    }
    if ((store.modules || []).includes("MODULE_KDS" as any) && sessionUser.role !== "CASHIER") {
      const tickets = await requestApi<any[]>("/orders/kds/tickets");
      setKdsTickets(tickets.map(t => ({ id: t.id, tableName: t.tableName, minutesAgo: Math.max(0, Math.floor((Date.now() - t.orderTimestamp) / 60000)), batchNumber: 1, items: t.items.map((i: any) => ({ id: i.id, name: i.name || i.dishName, quantity: i.quantity, notes: i.notes, status: i.status === "WAITING" ? OrderItemStatus.QUEUED : i.status === "READY" ? OrderItemStatus.DONE : i.status })) })));
    }
  }, [isVerified, sessionUser?.storeId, sessionUser?.role]);
  useEffect(() => {
    const refresh = () => { void refreshOperational().catch(error => toast.error(error.message)); };
    refresh(); const timer = setInterval(refresh, 15000);
    window.addEventListener("a2order:data", refresh);
    return () => { clearInterval(timer); window.removeEventListener("a2order:data", refresh); };
  }, [refreshOperational]);
  const { execute: submitStaffOrder } = useAntiSpamAction("STAFF_ORDER", async (payload: { tableId: string; items: CartItem[] }, key) => {
    return requestApi("/orders/submit", { method: "POST", headers: { "x-idempotency-key": key }, body: JSON.stringify({ storeId: activeStoreId, tableId: payload.tableId, items: payload.items.map(item => {
      const dish = menuItems.find(d => d.id === item.dishId);
      return { dishId: item.dishId, quantity: item.quantity, notes: item.notes, variantId: dish?.variants?.find((v: any) => v.name === item.selectedVariant)?.id, customizationIds: (dish?.customizationGroups || []).flatMap((g: any) => g.options || []).filter((o: any) => item.selectedOptions?.includes(o.id) || item.selectedOptions?.includes(o.name)).map((o: any) => o.id) };
    }) }) });
  });

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
  const handleOrderSubmitted = async (_tableName: string, items: CartItem[]) => {
    const table = activeTableForOrder;
    if (!table) throw new Error("Chưa chọn bàn");
    try {
      const result = await submitStaffOrder({ tableId: table.id, items });
      if (!result) throw new Error("Đơn đang được xử lý, vui lòng chờ");
      await refreshOperational(); sound.playKitchenChime(); toast.success("Đã lưu đơn và gửi vào bếp"); setIsOrderModalOpen(false); setActiveTableMenuActions(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể gửi đơn"); throw error; }
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
  const handleToggleKdsItem = async (itemId: string) => {
    const item = kdsTickets.flatMap(t => t.items).find(i => i.id === itemId);
    if (!item || item.status === OrderItemStatus.DONE) return;
    try { await requestApi("/orders/items/" + itemId + "/status", { method: "PATCH", body: JSON.stringify({ status: item.status === OrderItemStatus.QUEUED ? "COOKING" : "DONE" }) }); await refreshOperational(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể cập nhật món"); }
  };

  const handleCompleteKdsTicket = async (ticketId: string) => {
    const ticket = kdsTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    try { for (const item of ticket.items) { if (item.status === OrderItemStatus.QUEUED) await requestApi("/orders/items/" + item.id + "/status", { method: "PATCH", body: JSON.stringify({ status: "COOKING" }) }); if (item.status !== OrderItemStatus.DONE) await requestApi("/orders/items/" + item.id + "/status", { method: "PATCH", body: JSON.stringify({ status: "DONE" }) }); } await refreshOperational(); toast.success("Đã hoàn tất vé bếp"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể hoàn tất vé"); }
  };

  // 1. Phân hệ Khách hàng quét mã QR gọi món tại bàn (/order)
  if (landingSlug) return <React.Suspense fallback={<LoadingScreen />}><PublicLandingPage slug={landingSlug} /></React.Suspense>;
  if (currentPath.startsWith("/order")) {
    return (
      <React.Suspense fallback={<LoadingScreen message="Đang tải menu gọi món..." subMessage="Đồng bộ thông tin món và bàn ăn" />}>
        <GlobalFeedback /><CustomerTableOrderPage />
      </React.Suspense>
    );
  }

  const authModal = (<UnifiedAuthModal
          isOpen={isAuthModalOpen || !isVerified}
          staffList={staffMembers}
          onPinSubmit={async (staffId: string, enteredPin: string) => {
    try { const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-pin", { method: "POST", body: JSON.stringify({ storeId: activeStoreId, staffId, pinCode: enteredPin }) }); saveAuth(result.user, result.token); applyUser(result.user); setActiveTab(result.user.role === "CHEF" ? "kds" : result.user.role === "CASHIER" ? "billing" : "tables"); setIsAuthModalOpen(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đăng nhập"); }
  }}
          onAdminLogin={async (email: string, password: string) => {
    try { const result = await requestApi<{ user: BrowserAuthUser; token: string }>("/auth/login-owner", { method: "POST", body: JSON.stringify({ email, password }) }); if (["SUPER_ADMIN", "ACCOUNTANT"].includes(result.user.role)) { window.location.assign(import.meta.env.VITE_CMS_URL || window.location.origin); return; } saveAuth(result.user, result.token); applyUser(result.user); setActiveTab("tables"); setIsAuthModalOpen(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đăng nhập"); }
  }}
          onClose={() => { if (isVerified) setIsAuthModalOpen(false); }}
        />);

  if (!isLoading && !isVerified) return <><GlobalFeedback />{authModal}</>;

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
      try { await requestApi("/auth/logout", { method: "POST" }); } catch { /* Local sign-out remains available. */ }
      clearAuth(); setIsVerified(false); setSessionUser(null); setIsAuthModalOpen(true);
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
              onToggleStock={async (id, avail) => { try { await requestApi(`/menu/${activeStoreId}/dishes/${id}/stock`, { method: "PATCH", body: JSON.stringify({ isAvailable: avail }) }); await refreshOperational(); } catch (e: any) { toast.error(e.message); } }}
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
                attendanceRecords={attendanceRecords}
                onClockIn={() => recordAttendance("IN")}
                onClockOut={async (staff) => {
                  const ok = await confirmDialog({
                    title: "Chốt Ca & Ra Về?",
                    message: `Xác nhận chốt ca làm việc cho nhân viên "${staff.name}"?`,
                    confirmText: "Chốt Ca",
                    cancelText: "Hủy",
                    variant: "danger",
                  });
                  if (ok) {
                    await recordAttendance("OUT");
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

        {authModal}
      </AppShell>
    </>
  );
};
