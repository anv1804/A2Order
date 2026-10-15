import React, { useState, useMemo, useEffect } from "react";
import { Icon, Button, Badge, Portal } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  WaiterOrderItem,
  WaiterTableOrder,
  CmsStaffOrderViewProps,
  CanceledItemRecord,
  OrderSurcharge,
  OrderDiscount,
} from "@/types/cms.types";
import { CmsKdsTicket, KdsOrderItem } from "@/types/kds.types";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";
import { SocketEvents } from "@a2order/shared";
import { tableApi } from "@/services/api/tableApi";
import { menuApi } from "@/services/api/menuApi";
import { orderApi } from "@/services/api/orderApi";
import { sound } from "@/lib/sound";
import { PendingSessionRequest, StaffOrderDishItem as DishItem, PendingOrder } from "@/types";
import {
  ModifyingDishModal,
  TransferTableModal,
  VoidCookingModal,
  ServedActionModal,
  SplitBillModal,
  SurchargeModal,
  OfflineEmergencyModal,
  ManualOpenTableModal,
} from "./modals";
import { StaffOrderNotificationFeed } from "./components/StaffOrderNotificationFeed";


const INITIAL_TABLES: WaiterTableOrder[] = [];


const calculateTableTotal = (
  items: WaiterOrderItem[],
  surcharges?: OrderSurcharge[],
  discount?: OrderDiscount
): number => {
  const food = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const sur = (surcharges || []).reduce((s, sc) => s + sc.amount, 0);
  let disc = 0;
  if (discount) {
    disc = discount.type === "PERCENT" ? Math.round((food * discount.value) / 100) : discount.value;
  }
  return Math.max(0, food + sur - disc);
};

export const CmsStaffOrderView: React.FC<CmsStaffOrderViewProps> = ({
  currentRole = "STORE_OWNER",
  onNavigateTab,
}) => {
  const isCashier = currentRole === "CASHIER";
  const [tables, setTables] = usePersistentState<WaiterTableOrder[]>("staff_order_tables_data", INITIAL_TABLES);
  const [zonesData, setZonesData] = usePersistentState<any[]>("tables_zones_data", []);
  const [menuDishes, setMenuDishes] = usePersistentState<any[]>("menu_dishes_data", []);

  const dishesList: DishItem[] = useMemo(() => {
    if (menuDishes && menuDishes.length > 0) {
      return menuDishes.map((d: any) => ({
        id: d.id,
        name: d.name,
        category: d.category || "Món Chính",
        price: d.price || 0,
        image: d.image || "",
        description: d.description || "",
        isPopular: d.isBestSeller,
        modifiers: d.options?.flatMap((opt: any) => opt.choices || []) || [],
      }));
    }
    return [];
  }, [menuDishes]);

  const [selectedZone, setSelectedZone] = useState<string>("TẤT CẢ");
  const [activeTableId, setActiveTableId] = usePersistentState<string>("staff_order_active_table", "");
  const [activeTab, setActiveTab] = useState<"MENU" | "SERVED_ITEMS">("MENU");

  // Tự động đồng bộ bàn thực tế từ sơ đồ bàn (Database) và loại bỏ bàn fake cũ
  useEffect(() => {
    if (zonesData && zonesData.length > 0) {
      const allZoneTableIds = new Set(zonesData.flatMap((z: any) => (z.tables || []).map((t: any) => t.id)));
      const hasInvalidTables =
        tables.length === 0 ||
        tables.some((t) => !allZoneTableIds.has(t.tableId)) ||
        tables.some((t) => {
          const found = zonesData.flatMap((z: any) => z.tables || []).find((zt: any) => zt.id === t.tableId);
          return found && !t.pin && found.pin;
        });

      if (tables.length === 0 || hasInvalidTables) {
        const synced: WaiterTableOrder[] = zonesData.flatMap((z: any) =>
          (z.tables || []).map((t: any) => {
            const existing = tables.find((et) => et.tableId === t.id);
            return existing
              ? { ...existing, pin: t.pin || existing.pin, tableCode: t.code || existing.tableCode }
              : {
                  tableId: t.id,
                  tableName: t.name,
                  tableCode: t.code,
                  pin: t.pin,
                  zoneName: z.name,
                  guestCount: 0,
                  status: "EMPTY" as const,
                  items: [],
                  totalAmount: 0,
                };
          })
        );
        if (synced.length > 0) {
          setTables(synced);
          if (!synced.some((t) => t.tableId === activeTableId)) {
            setActiveTableId(synced[0].tableId);
          }
        }
      }
    }
  }, [zonesData, tables, activeTableId, setTables, setActiveTableId]);

  const userStr = typeof window !== "undefined" ? localStorage.getItem("a2order_current_user") || localStorage.getItem("user") : null;
  const storeId = userStr ? JSON.parse(userStr).storeId || "store-a2-kitchen" : "store-a2-kitchen";

  const formatTableName = (name?: string) => {
    if (!name) return "Bàn";
    return name.trim().toLowerCase().startsWith("bàn") ? name.trim() : `Bàn ${name.trim()}`;
  };

  // Tự động tải sơ đồ bàn và thực đơn món từ Database vào POS nếu chưa có
  useEffect(() => {
    tableApi.getTableZones(storeId).then((res) => {
      const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
      if (list.length > 0) {
        setZonesData(list);
      }
    }).catch(() => {});

    menuApi.getDishes(storeId).then((res) => {
      const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
      if (list.length > 0) {
        setMenuDishes(list);
      }
    }).catch(() => {});
  }, [storeId, setZonesData, setMenuDishes]);

  const [pendingRequests, setPendingRequests] = useState<PendingSessionRequest[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<
    Array<{ id: string; tableId?: string; tableName?: string; type: string; note?: string; time: string }>
  >([]);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [isProcessingOrderId, setIsProcessingOrderId] = useState<string | null>(null);

  // Notification Center state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"ORDERS" | "SERVICE" | "OPEN_TABLE">("ORDERS");
  const totalNotifCount = pendingOrders.length + serviceRequests.length + pendingRequests.length;

  // Live session timer ticker (re-render mỗi 30s để cập nhật elapsed time)
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTimerTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (openedAtMs?: number): string => {
    if (!openedAtMs) return "";
    const elapsed = Date.now() - openedAtMs;
    const mins = Math.floor(elapsed / 60000);
    if (mins < 60) return `${mins}p`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}g ${rem}p` : `${hrs}g`;
  };

  // Mở bàn thủ công từ POS (không cần khách quét QR)
  const [openTableModal, setOpenTableModal] = useState<{ tableId: string; tableName: string } | null>(null);
  const [openTableGuestCount, setOpenTableGuestCount] = useState(2);
  const [isOpeningTable, setIsOpeningTable] = useState(false);

  const handleOpenTableManually = async () => {
    if (!openTableModal) return;
    setIsOpeningTable(true);
    try {
      await tableApi.approveTableSession(storeId, openTableModal.tableId, openTableGuestCount);
      const openedAtMs = Date.now();
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setTables((prev) =>
        prev.map((t) =>
          t.tableId === openTableModal.tableId
            ? { ...t, status: "OCCUPIED", guestCount: openTableGuestCount, openedAt: timeStr, openedAtMs }
            : t
        )
      );
      setActiveTableId(openTableModal.tableId);
      sound.playKitchenChime();
      toast.success(`Đã mở ${openTableModal.tableName} (${openTableGuestCount} khách)!`);
      setOpenTableModal(null);
    } catch (err: any) {
      toast.error("Không thể mở bàn: " + (err.message || "Lỗi kết nối"));
    } finally {
      setIsOpeningTable(false);
    }
  };

  // Lắng nghe yêu cầu mở bàn QR từ khách và các sự kiện thời gian thực
  useEffect(() => {
    joinStoreRoom(storeId);
    const socket = getSocketClient();

    // 1. Tải các yêu cầu mở bàn đang chờ duyệt từ server
    tableApi
      .getPendingRequests(storeId)
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
        setPendingRequests(list);
      })
      .catch(() => {});

    // 1.1 Tải danh sách đơn hàng QR đang chờ duyệt vào bếp
    orderApi
      .getPendingOrders(storeId)
      .then((res) => {
        if (Array.isArray(res)) setPendingOrders(res);
      })
      .catch(() => {});

    // 2. Khách quét QR bấm "Yêu Cầu Mở Bàn"
    const handleSessionRequested = (data: PendingSessionRequest) => {
      if (!data) return;
      sound.playAlertTone();
      setNotifTab("OPEN_TABLE");
      setPendingRequests((prev) => {
        const filtered = prev.filter((r) => r.tableId !== data.tableId);
        return [data, ...filtered];
      });
      toast.info(`🔔 ${formatTableName(data.tableName)} vừa quét QR yêu cầu mở bàn (${data.guestCount || 2} khách)!`);
    };

    // 3. Đã duyệt mở bàn
    const handleSessionApproved = (data: any) => {
      if (!data) return;
      setPendingRequests((prev) => prev.filter((r) => r.tableId !== data.tableId));
      const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setTables((prev) =>
        prev.map((t) =>
          t.tableId === data.tableId
            ? {
                ...t,
                status: "OCCUPIED",
                guestCount: data.guestCount || t.guestCount || 2,
                openedAt: t.openedAt || timeNow,
                openedAtMs: t.openedAtMs || Date.now(),
              }
            : t
        )
      );
    };

    // 4. Từ chối mở bàn
    const handleSessionRejected = (data: any) => {
      if (!data) return;
      setPendingRequests((prev) => prev.filter((r) => r.tableId !== data.tableId));
    };

    // 5. Đóng phiên bàn (thanh toán / dọn bàn)
    const handleSessionClosed = (data: any) => {
      if (!data) return;
      setTables((prev) =>
        prev.map((t) =>
          t.tableId === data.tableId
            ? { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined, guestCount: 0 }
            : t
        )
      );
    };

    // 6. Đơn hàng khách gửi chờ duyệt trước khi vào bếp
    const handleOrderApprovalRequested = (order: PendingOrder) => {
      if (!order || order.storeId !== storeId) return;
      sound.playAlertTone();
      setNotifTab("ORDERS");
      setPendingOrders((prev) => {
        const filtered = prev.filter((o) => o.orderId !== order.orderId);
        return [order, ...filtered];
      });
      toast.info(`🔔 ${formatTableName(order.tableName)} vừa gửi đơn ${order.items.length} món (Chờ duyệt vào bếp)!`);
    };

    // 7. Đơn đã được duyệt vào bếp (đồng bộ trên mọi tab POS)
    const handleOrderApproved = (data: any) => {
      if (!data) return;
      setPendingOrders((prev) => prev.filter((o) => o.orderId !== data.orderId));
    };

    // 8. Đơn bị từ chối
    const handleOrderRejected = (data: any) => {
      if (!data) return;
      setPendingOrders((prev) => prev.filter((o) => o.orderId !== data.orderId));
    };

    // 9. Khách hủy món khi quán chưa duyệt (PENDING_APPROVAL)
    const handleOrderItemCancelled = (data: any) => {
      if (!data) return;
      sound.playAlertTone();
      setPendingOrders((prev) =>
        prev
          .map((o) => {
            if (o.orderId === data.orderId) {
              return {
                ...o,
                items: o.items.filter((it) => it.id !== data.itemId),
              };
            }
            return o;
          })
          .filter((o) => o.items.length > 0)
      );

      setTables((prev) =>
        prev.map((t) => {
          if (t.tableId === data.tableId) {
            return {
              ...t,
              items: t.items.filter((it) => it.id !== data.itemId),
            };
          }
          return t;
        })
      );
      toast.info(`Khách tại ${data.tableName || "bàn"} đã hủy món ${data.dishName || ""}`);
    };

    // 10. Khách gửi yêu cầu hỗ trợ nhanh (đá, giấy, dọn bàn...)
    const handleServiceRequested = (data: any) => {
      if (!data || data.storeId !== storeId) return;
      sound.playAlertTone();
      setNotifTab("SERVICE");
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setServiceRequests((prev) => [
        {
          id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          tableId: data.tableId,
          tableName: data.tableName || "Bàn",
          type: data.type,
          note: data.note,
          time: timeStr,
        },
        ...prev,
      ]);
      toast.warning(`⚡ ${formatTableName(data.tableName)} yêu cầu: ${data.type}!`);
    };

    // 11. Đơn hàng chính thức vào bếp (qua POS hoặc sau khi duyệt)
    const handleOrderSubmitted = (data: any) => {
      if (!data || !data.items || !Array.isArray(data.items)) return;
      sound.playKitchenChime();
      const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      const newItems: WaiterOrderItem[] = data.items.map((it: any, idx: number) => ({
        id: `cust-${Date.now()}-${idx}`,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        status: "COOKING",
        orderedAt: timeNow,
        round: 1,
      }));

      setTables((prev) =>
        prev.map((t) => {
          if (t.tableId === data.tableId || t.tableName === data.tableName) {
            const addedSum = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
            return {
              ...t,
              status: "WAITING_FOOD",
              openedAt: t.openedAt || timeNow,
              items: [...t.items, ...newItems],
              totalAmount: t.totalAmount + addedSum,
            };
          }
          return t;
        })
      );

      // Thêm vé vào KDS Bếp
      try {
        const rawKds = localStorage.getItem("a2order_kds_tickets_data");
        const existingTickets: CmsKdsTicket[] = rawKds ? JSON.parse(rawKds) : [];
        const newTicket: CmsKdsTicket = {
          id: "kt-qr-" + Date.now(),
          ticketCode: `#QR-${String(data.tableName || "BAN").replace(/\s+/g, "")}-${String(Date.now()).slice(-4)}`,
          tableName: `${data.tableName || "Bàn QR"}`,
          orderTime: timeNow,
          orderTimestamp: Date.now(),
          status: "NEW",
          station: "KITCHEN",
          waiterName: "Khách Quét QR",
          priority: "NORMAL",
          items: newItems.map((i) => ({
            dishName: i.name,
            quantity: i.quantity,
            notes: "[Khách gọi qua QR]",
          })),
        };
        localStorage.setItem("a2order_kds_tickets_data", JSON.stringify([newTicket, ...existingTickets]));
      } catch (e) {
        console.warn("Lỗi lưu vé KDS từ khách:", e);
      }

      toast.success(`Khách tại ${data.tableName || "Bàn"} vừa gọi ${newItems.length} món qua QR! Bếp đã nhận vé.`);
    };

    socket.on(SocketEvents.SESSION_REQUESTED, handleSessionRequested);
    socket.on(SocketEvents.SESSION_APPROVED, handleSessionApproved);
    socket.on(SocketEvents.SESSION_REJECTED, handleSessionRejected);
    socket.on(SocketEvents.SESSION_CLOSED, handleSessionClosed);
    socket.on(SocketEvents.ORDER_APPROVAL_REQUESTED, handleOrderApprovalRequested);
    socket.on(SocketEvents.ORDER_APPROVED, handleOrderApproved);
    socket.on(SocketEvents.ORDER_REJECTED, handleOrderRejected);
    socket.on(SocketEvents.ORDER_ITEM_CANCELLED, handleOrderItemCancelled);
    socket.on(SocketEvents.SERVICE_REQUESTED, handleServiceRequested);
    socket.on(SocketEvents.ORDER_SUBMITTED, handleOrderSubmitted);

    return () => {
      socket.off(SocketEvents.SESSION_REQUESTED, handleSessionRequested);
      socket.off(SocketEvents.SESSION_APPROVED, handleSessionApproved);
      socket.off(SocketEvents.SESSION_REJECTED, handleSessionRejected);
      socket.off(SocketEvents.SESSION_CLOSED, handleSessionClosed);
      socket.off(SocketEvents.ORDER_APPROVAL_REQUESTED, handleOrderApprovalRequested);
      socket.off(SocketEvents.ORDER_APPROVED, handleOrderApproved);
      socket.off(SocketEvents.ORDER_REJECTED, handleOrderRejected);
      socket.off(SocketEvents.ORDER_ITEM_CANCELLED, handleOrderItemCancelled);
      socket.off(SocketEvents.SERVICE_REQUESTED, handleServiceRequested);
      socket.off(SocketEvents.ORDER_SUBMITTED, handleOrderSubmitted);
    };
  }, [storeId, setTables]);

  // Duyệt mở bàn 1-chạm
  const handleApproveSession = async (req: PendingSessionRequest) => {
    setIsApprovingId(req.tableId);
    try {
      await tableApi.approveTableSession(storeId, req.tableId, req.guestCount);
      setPendingRequests((prev) => prev.filter((r) => r.tableId !== req.tableId));
      const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const openedAtMs = Date.now();
      setTables((prev) =>
        prev.map((t) =>
          t.tableId === req.tableId
            ? {
                ...t,
                status: "OCCUPIED",
                guestCount: req.guestCount || 2,
                openedAt: t.openedAt || timeNow,
                openedAtMs: t.openedAtMs || openedAtMs,
              }
            : t
        )
      );
      setActiveTableId(req.tableId);
      sound.playKitchenChime();
      toast.success(
        `Đã duyệt mở ${formatTableName(req.tableName)} (${req.guestCount} khách)! Khách có thể gọi món ngay trên điện thoại.`
      );
    } catch (err: any) {
      toast.error("Không thể duyệt mở bàn: " + (err.message || "Lỗi kết nối"));
    } finally {
      setIsApprovingId(null);
    }
  };

  // Từ chối mở bàn
  const handleRejectSession = async (req: PendingSessionRequest) => {
    try {
      await tableApi.rejectTableSession(storeId, req.tableId, "Nhân viên xác nhận bàn hiện chưa có khách ngồi thực tế");
      setPendingRequests((prev) => prev.filter((r) => r.tableId !== req.tableId));
      toast.info(`Đã từ chối yêu cầu mở ${formatTableName(req.tableName)}`);
    } catch (err: any) {
      toast.error("Lỗi khi từ chối yêu cầu: " + (err.message || "Lỗi kết nối"));
    }
  };

  // Duyệt đơn hàng vào bếp
  const handleApproveOrder = async (order: PendingOrder) => {
    setIsProcessingOrderId(order.orderId);
    try {
      await orderApi.approveOrder(storeId, order.orderId);
      setPendingOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
      sound.playKitchenChime();
      toast.success(`Đã duyệt đơn của ${formatTableName(order.tableName)} vào bếp!`);
    } catch (err: any) {
      toast.error("Không thể duyệt đơn: " + (err.message || "Lỗi kết nối"));
    } finally {
      setIsProcessingOrderId(null);
    }
  };

  // Từ chối đơn hàng
  const handleRejectOrder = async (order: PendingOrder) => {
    const ok = await confirmDialog({
      title: `Từ chối đơn của ${formatTableName(order.tableName)}?`,
      message: `Đơn gồm ${order.items.length} món (${order.finalAmount.toLocaleString("vi-VN")} đ) sẽ bị hủy và thông báo tới khách hàng.`,
      confirmText: "Từ Chối Đơn",
      cancelText: "Xem Lại",
      variant: "danger",
    });
    if (!ok) return;

    setIsProcessingOrderId(order.orderId);
    try {
      await orderApi.rejectOrder(storeId, order.orderId, "Nhà hàng hiện đang quá tải hoặc hết món");
      setPendingOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
      toast.info(`Đã từ chối đơn của ${formatTableName(order.tableName)}`);
    } catch (err: any) {
      toast.error("Không thể từ chối đơn: " + (err.message || "Lỗi kết nối"));
    } finally {
      setIsProcessingOrderId(null);
    }
  };

  // Xoay mã PIN mới cho bàn (Dynamic PIN Rotation)
  const handleRotateTablePin = async (tableId: string, tableName: string) => {
    try {
      const res = await tableApi.rotatePin(storeId, tableId);
      const newPin = res?.pin || res?.data?.pin;
      toast.success(`Đã tạo mã PIN mới cho ${formatTableName(tableName)}${newPin ? `: ${newPin}` : ""}!`);
      if (newPin) {
        setTables((prev) =>
          prev.map((t) => (t.tableId === tableId ? { ...t, pin: newPin } : t))
        );
      }
    } catch (err: any) {
      toast.error("Lỗi đổi mã PIN: " + (err.message || "Lỗi kết nối"));
    }
  };

  // Đóng phiên bàn & dọn bàn
  const handleCloseTableSession = async (tableId: string, tableName: string) => {
    const ok = await confirmDialog({
      title: `Đóng phiên & dọn ${tableName}?`,
      message: `Bàn sẽ chuyển về trạng thái TRỐNG. Mọi thiết bị khách đang quét mã QR bàn này sẽ tự động đóng phiên và không thể gọi thêm món cho đến khi nhân viên mở phiên mới.`,
      confirmText: "Đóng Phiên & Dọn Bàn",
      cancelText: "Giữ Lại",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await tableApi.closeTableSession(storeId, tableId);
      setTables((prev) =>
        prev.map((t) =>
          t.tableId === tableId
            ? { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined, openedAtMs: undefined, guestCount: 0 }
            : t
        )
      );
      toast.success(`Đã đóng phiên và giải phóng ${tableName} thành công!`);
    } catch (err: any) {
      toast.error("Lỗi đóng phiên bàn: " + (err.message || "Lỗi kết nối"));
    }
  };

  // Điểm then chốt giải quyết khiếu nại UX Mobile: Luồng 3 bước rõ ràng
  const [mobileStep, setMobileStep] = useState<"TABLES" | "MENU" | "CART">("TABLES");

  // Giỏ hàng món mới đang chọn cho bàn active
  const [newOrderCart, setNewOrderCart] = useState<WaiterOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TẤT CẢ");

  // Modal tùy chỉnh ghi chú món
  const [modifyingDish, setModifyingDish] = useState<DishItem | null>(null);
  const [dishModifiers, setDishModifiers] = useState<string[]>([]);
  const [dishCustomNote, setDishCustomNote] = useState("");

  // Modal chuyển / ghép bàn
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState("");
  const [transferMode, setTransferMode] = useState<"MOVE" | "MERGE">("MOVE");

  // Modal Hủy món đang nấu (COOKING: Loss Prevention & Void Audit)
  const [voidCookingModal, setVoidCookingModal] = useState<{
    isOpen: boolean;
    item: WaiterOrderItem | null;
    itemIndex: number;
    reason: string;
  }>({
    isOpen: false,
    item: null,
    itemIndex: -1,
    reason: "",
  });

  // Modal Xử lý món đã lên bàn (SERVED: Remake vs Return)
  const [servedActionModal, setServedActionModal] = useState<{
    isOpen: boolean;
    item: WaiterOrderItem | null;
    itemIndex: number;
    mode: "CHOICE" | "REMAKE" | "RETURN";
    reason: string;
  }>({
    isOpen: false,
    item: null,
    itemIndex: -1,
    mode: "CHOICE",
    reason: "",
  });

  // Modal Tách Hóa Đơn (Split Bill: Itemized vs Equal Split)
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [splitBillTab, setSplitBillTab] = useState<"ITEMIZED" | "EQUAL">("ITEMIZED");
  const [splitItemCounts, setSplitItemCounts] = useState<Record<number, number>>({});
  const [equalSplitGuests, setEqualSplitGuests] = useState<number>(2);
  const [equalSplitPaid, setEqualSplitPaid] = useState<Record<number, boolean>>({});
  const [activePersonQr, setActivePersonQr] = useState<number | null>(null);

  // Modal Phụ Thu & Giảm Giá Quản Lý (Surcharges & Loss Prevention Discounts)
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [surchargeTab, setSurchargeTab] = useState<"SURCHARGE" | "DISCOUNT">("SURCHARGE");
  const [customSurchargeName, setCustomSurchargeName] = useState("");
  const [customSurchargeAmount, setCustomSurchargeAmount] = useState<number>(50000);
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState<string>("Khách quen VIP");

  // Modal Khẩn Cấp Mất Điện / Rớt Mạng (Offline Emergency VietQR Mode)
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [cashGivenAmount, setCashGivenAmount] = useState<number>(0);

  const FALLBACK_EMPTY_TABLE: WaiterTableOrder = useMemo(
    () => ({
      tableId: "",
      tableName: "Chưa chọn bàn",
      zoneName: "",
      guestCount: 0,
      status: "EMPTY",
      items: [],
      totalAmount: 0,
    }),
    []
  );

  // Bàn đang được chọn
  const activeTable = useMemo(
    () => tables.find((t) => t.tableId === activeTableId) || tables[0] || FALLBACK_EMPTY_TABLE,
    [tables, activeTableId, FALLBACK_EMPTY_TABLE]
  );

  // Tính toán tài chính hóa đơn bàn ăn
  const foodTotalAmount = useMemo(() => {
    return activeTable.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [activeTable.items]);

  const surchargesTotalAmount = useMemo(() => {
    return (activeTable.surcharges || []).reduce((sum, s) => sum + s.amount, 0);
  }, [activeTable.surcharges]);

  const discountTotalAmount = useMemo(() => {
    if (!activeTable.discount) return 0;
    if (activeTable.discount.type === "PERCENT") {
      return Math.round((foodTotalAmount * activeTable.discount.value) / 100);
    }
    return activeTable.discount.value;
  }, [activeTable.discount, foodTotalAmount]);

  const finalPayableAmount = useMemo(() => {
    return Math.max(0, foodTotalAmount + surchargesTotalAmount - discountTotalAmount);
  }, [foodTotalAmount, surchargesTotalAmount, discountTotalAmount]);

  // Danh sách khu vực bàn
  const zones = useMemo(() => {
    const list = Array.from(new Set(tables.map((t) => t.zoneName)));
    return ["TẤT CẢ", ...list];
  }, [tables]);

  // Lọc bàn theo khu vực
  const filteredTables = useMemo(() => {
    if (selectedZone === "TẤT CẢ") return tables;
    return tables.filter((t) => t.zoneName === selectedZone);
  }, [tables, selectedZone]);

  // Danh mục món
  const categories = useMemo(() => {
    const list = Array.from(new Set(dishesList.map((d) => d.category)));
    return ["TẤT CẢ", ...list];
  }, [dishesList]);

  // Lọc món theo category & search
  const filteredDishes = useMemo(() => {
    return dishesList.filter((d) => {
      const matchCat = selectedCategory === "TẤT CẢ" || d.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [dishesList, selectedCategory, searchQuery]);

  // Thêm món nhanh vào giỏ order
  const handleQuickAddDish = (dish: DishItem) => {
    setNewOrderCart((prev) => {
      const existIdx = prev.findIndex((item) => item.dishId === dish.id && !item.notes);
      if (existIdx > -1) {
        const updated = [...prev];
        updated[existIdx] = {
          ...updated[existIdx],
          quantity: updated[existIdx].quantity + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          status: "WAITING",
        },
      ];
    });
    toast.success(`Đã thêm ${dish.name} vào đơn bàn ${activeTable.tableName}`);
  };

  // Mở modal tùy chỉnh ghi chú cho món
  const handleOpenCustomize = (dish: DishItem) => {
    setModifyingDish(dish);
    setDishModifiers([]);
    setDishCustomNote("");
  };

  // Xác nhận thêm món có tùy chỉnh ghi chú
  const handleAddToCart = (dish: DishItem, modifiers: string[], customNote: string) => {
    const allNotes = [...modifiers, customNote.trim()].filter(Boolean).join(", ");
    setNewOrderCart((prev) => [
      ...prev,
      {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        notes: allNotes,
        status: "WAITING",
      },
    ]);
    toast.success(`Đã thêm ${dish.name} (có ghi chú)`);
  };

  // Tăng giảm số lượng trong giỏ
  const handleUpdateQuantity = (index: number, delta: number) => {
    setNewOrderCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
      }
      return updated;
    });
  };

  // Gửi order mới vào bếp nấu (hỗ trợ nhiều đợt gọi món: đợt 1 khách đến trước, đợt 2 khách đến sau)
  const handleSendToKitchen = () => {
    if (newOrderCart.length === 0) return;

    const addedAmount = newOrderCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    // Tự động tính đợt gọi món tiếp theo (round)
    const currentMaxRound = activeTable.items.reduce((max, i) => Math.max(max, i.round || 1), 0);
    const nextRound = activeTable.items.length === 0 ? 1 : currentMaxRound + 1;

    const newServedItems: WaiterOrderItem[] = newOrderCart.map((item) => ({
      ...item,
      status: "COOKING",
      orderedAt: timeNow,
      round: nextRound,
    }));

    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          return {
            ...t,
            status: "WAITING_FOOD",
            openedAt: t.openedAt || timeNow,
            guestCount: t.guestCount || 2,
            items: [...t.items, ...newServedItems],
            totalAmount: t.totalAmount + addedAmount,
          };
        }
        return t;
      })
    );

    // Đồng bộ vé vào KDS Bếp
    try {
      const rawKds = localStorage.getItem("a2order_kds_tickets_data");
      const existingTickets: CmsKdsTicket[] = rawKds ? JSON.parse(rawKds) : [];
      const newTicket: CmsKdsTicket = {
        id: "kt-" + Date.now(),
        ticketCode: `#${activeTable.tableName.replace(/\s+/g, "")}-${String(Date.now()).slice(-4)}`,
        tableName: `${activeTable.tableName} (${activeTable.zoneName})`,
        orderTime: timeNow,
        orderTimestamp: Date.now(),
        status: "NEW",
        station: "KITCHEN",
        waiterName: isCashier ? "Thu ngân" : "Nhân viên phục vụ",
        priority: "NORMAL",
        items: newOrderCart.map((i: WaiterOrderItem) => ({
          dishName: i.name,
          quantity: i.quantity,
          notes: i.notes ? `[Đợt ${nextRound}] ${i.notes}` : `[Đợt ${nextRound}]`,
        })),
      };
      localStorage.setItem("a2order_kds_tickets_data", JSON.stringify([newTicket, ...existingTickets]));
    } catch (e) {
      console.warn("Lỗi lưu vé KDS:", e);
    }

    toast.success(`Đã bắn Đợt ${nextRound} (${newOrderCart.length} món) của ${activeTable.tableName} vào Bếp KDS thành công! 🔥`);
    setNewOrderCart([]);
    setActiveTab("SERVED_ITEMS");
    setMobileStep("CART");
  };

  // Yêu cầu in tạm tính bill cho bàn
  const handleRequestBill = async () => {
    const ok = await confirmDialog({
      title: `In tạm tính cho ${activeTable.tableName}?`,
      message: `Tổng tiền hiện tại: ${activeTable.totalAmount.toLocaleString("vi-VN")} đ (${activeTable.items.length} món). Bấm xác nhận để gửi lệnh in bill tới máy in thu ngân.`,
      confirmText: isCashier ? "Thanh Toán & In Bill" : "In Tạm Tính Ngay",
      cancelText: "Hủy",
      variant: "primary",
    });
    if (!ok) return;

    if (isCashier) {
      tableApi.closeTableSession(storeId, activeTable.tableId).catch(() => {});
      setTables((prev) =>
        prev.map((t) =>
          t.tableId === activeTable.tableId
            ? { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined, guestCount: 0 }
            : t
        )
      );
      sound.playPaymentChime();
      toast.success(`Đã thanh toán hóa đơn cho ${activeTable.tableName} và giải phóng bàn!`);
      return;
    }

    setTables((prev) =>
      prev.map((t) => (t.tableId === activeTable.tableId ? { ...t, status: "BILL_REQUESTED" } : t))
    );
    toast.success(`Đã gửi lệnh in tạm tính cho ${activeTable.tableName} tới thu ngân!`);
  };

  // Gọi dịch vụ phục vụ bàn
  const handleCallStaffService = (serviceName: string) => {
    toast.info(`Đã gửi yêu cầu "${serviceName}" cho ${activeTable.tableName}`);
  };

  // Thực hiện chuyển hoặc ghép bàn (khách đến trước, đến sau gộp bàn)
  const handleExecuteTransfer = () => {
    if (!targetTransferTableId) {
      toast.error("Vui lòng chọn bàn đích để thực hiện");
      return;
    }

    const target = tables.find((t) => t.tableId === targetTransferTableId);
    if (!target) return;

    if (transferMode === "MOVE") {
      setTables((prev) =>
        prev.map((t) => {
          if (t.tableId === activeTable.tableId) {
            return { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined, guestCount: 0 };
          }
          if (t.tableId === target.tableId) {
            return {
              ...t,
              items: activeTable.items,
              totalAmount: activeTable.totalAmount,
              status: activeTable.status,
              openedAt: activeTable.openedAt,
              guestCount: activeTable.guestCount,
            };
          }
          return t;
        })
      );
      toast.success(`Đã chuyển toàn bộ đơn từ ${activeTable.tableName} sang ${target.tableName}`);
      setActiveTableId(target.tableId);
    } else {
      // GỘP BÀN (MERGE TABLES)
      const mergedGuests = (target.guestCount || 0) + (activeTable.guestCount || 0);
      const mergedTotal = target.totalAmount + activeTable.totalAmount;
      const mergedItems = [...target.items, ...activeTable.items];
      const targetOpened = target.openedAt || activeTable.openedAt;

      setTables((prev) =>
        prev.map((t) => {
          if (t.tableId === activeTable.tableId) {
            // Giải phóng bàn nguồn về trạng thái BÀN TRỐNG để đón lượt khách mới
            return { ...t, items: [], totalAmount: 0, status: "EMPTY", openedAt: undefined, guestCount: 0 };
          }
          if (t.tableId === target.tableId) {
            return {
              ...t,
              items: mergedItems,
              totalAmount: mergedTotal,
              guestCount: mergedGuests,
              status: "OCCUPIED",
              openedAt: targetOpened,
              mergedTables: [...(target.mergedTables || []), activeTable.tableName],
            };
          }
          return t;
        })
      );
      toast.success(`Đã gộp đơn ${activeTable.tableName} vào ${target.tableName} thành công! (${activeTable.tableName} đã được giải phóng thành bàn trống)`);
      setActiveTableId(target.tableId);
    }

    setIsTransferModalOpen(false);
    setTargetTransferTableId("");
  };

  // ------------------ TÁCH HÓA ĐƠN (SPLIT BILL SOP) ------------------
  const handleOpenSplitBill = () => {
    setSplitItemCounts({});
    setEqualSplitGuests(activeTable.guestCount || 2);
    setEqualSplitPaid({});
    setActivePersonQr(null);
    setIsSplitBillModalOpen(true);
  };

  const handleExecuteItemizedSplit = () => {
    const totalSelected = Object.values(splitItemCounts).reduce((s, c) => s + c, 0);
    if (totalSelected === 0) {
      toast.error("Vui lòng chọn ít nhất 1 món để tách sang Bill B");
      return;
    }

    const itemsRemaining: WaiterOrderItem[] = [];
    const itemsSplit: WaiterOrderItem[] = [];

    activeTable.items.forEach((item, idx) => {
      const splitCount = splitItemCounts[idx] || 0;
      if (splitCount > 0) {
        itemsSplit.push({ ...item, quantity: splitCount });
      }
      const remainingCount = item.quantity - splitCount;
      if (remainingCount > 0) {
        itemsRemaining.push({ ...item, quantity: remainingCount });
      }
    });

    const splitTotal = itemsSplit.reduce((s, it) => s + it.price * it.quantity, 0);
    const newRemainingTotal = calculateTableTotal(itemsRemaining, activeTable.surcharges, activeTable.discount);

    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          return {
            ...t,
            items: itemsRemaining,
            totalAmount: newRemainingTotal,
            isSplit: true,
          };
        }
        return t;
      })
    );

    toast.success(
      `Đã tách riêng Bill B (${splitTotal.toLocaleString("vi-VN")} đ - ${itemsSplit.length} món) để khách thanh toán trước! Bàn ${activeTable.tableName} còn lại ${newRemainingTotal.toLocaleString("vi-VN")} đ.`
    );
    setIsSplitBillModalOpen(false);
  };

  // ------------------ PHỤ THU & GIẢM GIÁ QUẢN LÝ ------------------
  const handleAddSurcharge = (name: string, amount: number) => {
    if (!name.trim() || amount <= 0) {
      toast.error("Vui lòng nhập tên phụ thu và số tiền hợp lệ");
      return;
    }
    const newSurcharge: OrderSurcharge = {
      id: "sur_" + Date.now(),
      name: name.trim(),
      amount,
    };
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updatedSurcharges = [...(t.surcharges || []), newSurcharge];
          const newTotal = calculateTableTotal(t.items, updatedSurcharges, t.discount);
          return { ...t, surcharges: updatedSurcharges, totalAmount: newTotal };
        }
        return t;
      })
    );
    toast.success(`Đã thêm phụ thu "${name}" (+${amount.toLocaleString("vi-VN")} đ)`);
    setCustomSurchargeName("");
  };

  const handleRemoveSurcharge = (id: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updatedSurcharges = (t.surcharges || []).filter((s) => s.id !== id);
          const newTotal = calculateTableTotal(t.items, updatedSurcharges, t.discount);
          return { ...t, surcharges: updatedSurcharges, totalAmount: newTotal };
        }
        return t;
      })
    );
    toast.info("Đã xóa khoản phụ thu khỏi bàn");
  };

  const handleApplyDiscount = () => {
    if (!discountReason.trim()) {
      toast.error("Vui lòng chọn hoặc nhập lý do giảm giá để phục vụ kiểm toán");
      return;
    }
    if (discountValue <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0");
      return;
    }
    const newDiscount: OrderDiscount = {
      type: discountType,
      value: discountValue,
      reason: discountReason.trim(),
    };
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const newTotal = calculateTableTotal(t.items, t.surcharges, newDiscount);
          return { ...t, discount: newDiscount, totalAmount: newTotal };
        }
        return t;
      })
    );
    toast.success(
      `Đã áp dụng giảm giá ${discountType === "PERCENT" ? `${discountValue}%` : `${discountValue.toLocaleString("vi-VN")} đ`}! Lý do: "${discountReason}".`
    );
    setIsSurchargeModalOpen(false);
  };

  const handleRemoveDiscount = () => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const newTotal = calculateTableTotal(t.items, t.surcharges, undefined);
          return { ...t, discount: undefined, totalAmount: newTotal };
        }
        return t;
      })
    );
    toast.info("Đã gỡ bỏ giảm giá khỏi bàn");
  };

  // ------------------ KHẨN CẤP MẤT ĐIỆN / RỚT MẠNG ------------------
  const handleOpenOfflineModal = () => {
    setCashGivenAmount(0);
    setIsOfflineModalOpen(true);
  };

  const handleConfirmOfflinePaid = () => {
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          return {
            ...t,
            offlinePaid: true,
            offlinePaidAt: timeNow,
            status: "BILL_REQUESTED",
          };
        }
        return t;
      })
    );

    try {
      const rawOffline = localStorage.getItem("a2order_offline_bills") || "[]";
      const offlineBills = JSON.parse(rawOffline);
      offlineBills.push({
        tableId: activeTable.tableId,
        tableName: activeTable.tableName,
        amount: finalPayableAmount,
        paidAt: timeNow,
        itemsCount: activeTable.items.length,
      });
      localStorage.setItem("a2order_offline_bills", JSON.stringify(offlineBills));
    } catch (e) {
      console.warn("Lỗi lưu offline bill:", e);
    }

    toast.success(
      `Đã ghi nhận thanh toán Ngoại Tuyến cho ${activeTable.tableName} (${finalPayableAmount.toLocaleString("vi-VN")} đ)! Dữ liệu đã lưu an toàn trong máy POS.`
    );
    setIsOfflineModalOpen(false);
  };

  // 1. Hủy món chờ bếp (WAITING)
  const handleCancelWaitingItem = async (index: number) => {
    const item = activeTable.items[index];
    if (!item) return;

    const ok = await confirmDialog({
      title: `Hủy món "${item.name}"?`,
      message: `Món chưa nấu. Hủy món sẽ trừ ${(item.price * item.quantity).toLocaleString("vi-VN")} đ khỏi bàn ${activeTable.tableName}.`,
      confirmText: "Hủy Món Ngay",
      cancelText: "Không Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updated = [...t.items];
          updated.splice(index, 1);
          return {
            ...t,
            items: updated,
            totalAmount: Math.max(0, t.totalAmount - item.price * item.quantity),
            status: updated.length === 0 ? "EMPTY" : t.status,
          };
        }
        return t;
      })
    );
    toast.info(`Đã hủy món "${item.name}" của ${activeTable.tableName}`);
  };

  // 2. Mở modal hủy món đang nấu (COOKING)
  const handleOpenVoidCooking = (index: number) => {
    const item = activeTable.items[index];
    if (!item) return;
    setVoidCookingModal({
      isOpen: true,
      item,
      itemIndex: index,
      reason: "Khách đợi quá lâu (> 20 phút)",
    });
  };

  // Xác nhận hủy món đang nấu (COOKING)
  const handleConfirmVoidCooking = (selectedReason: string) => {
    if (!voidCookingModal.item || voidCookingModal.itemIndex < 0) return;
    const item = voidCookingModal.item;
    const idx = voidCookingModal.itemIndex;
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const reasonToUse = selectedReason.trim() || voidCookingModal.reason || "Khách yêu cầu hủy món đang nấu";

    // Trừ bill và cập nhật danh sách món của bàn
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updated = [...t.items];
          updated.splice(idx, 1);
          return {
            ...t,
            items: updated,
            totalAmount: Math.max(0, t.totalAmount - item.price * item.quantity),
            status: updated.length === 0 ? "EMPTY" : t.status,
          };
        }
        return t;
      })
    );

    // Ghi nhận nhật ký kiểm toán thất thoát (Void Audit)
    try {
      const raw = localStorage.getItem("a2order_void_audit_canceled_items");
      const list: CanceledItemRecord[] = raw ? JSON.parse(raw) : [];
      const newRecord: CanceledItemRecord = {
        id: "void-" + Date.now(),
        dishName: item.name,
        quantity: item.quantity,
        price: item.price,
        canceledAt: `${timeNow} Hôm nay`,
        tableName: activeTable.tableName,
        canceledBy: isCashier ? "Thu ngân" : "Nhân viên phục vụ",
        reason: reasonToUse,
        type: "CANCEL_COOKING",
      };
      localStorage.setItem("a2order_void_audit_canceled_items", JSON.stringify([newRecord, ...list]));
    } catch (e) {
      console.warn("Lỗi ghi void audit:", e);
    }

    // Bắn cảnh báo ngừng nấu tới Bếp KDS
    try {
      const rawKds = localStorage.getItem("a2order_kds_tickets_data");
      if (rawKds) {
        const tickets: CmsKdsTicket[] = JSON.parse(rawKds);
        const updated = tickets.map((t: CmsKdsTicket) => {
          if (t.tableName.includes(activeTable.tableName) && t.status !== "DONE") {
            return {
              ...t,
              items: t.items.map((i: KdsOrderItem) =>
                i.dishName.toLowerCase().includes(item.name.toLowerCase()) ? { ...i, isCanceled: true } : i
              ),
              cancelReason: `Bàn ${activeTable.tableName} vừa hủy "${item.name}": ${reasonToUse}`,
            };
          }
          return t;
        });
        localStorage.setItem("a2order_kds_tickets_data", JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Lỗi cập nhật KDS:", e);
    }

    toast.info(`⚠️ Đã hủy "${item.name}" và thông báo ngừng nấu tới Bếp KDS!`);
    setVoidCookingModal({ isOpen: false, item: null, itemIndex: -1, reason: "" });
  };

  // 3. Mở modal xử lý món đã lên bàn (SERVED: Remake vs Return)
  const handleOpenServedAction = (index: number) => {
    const item = activeTable.items[index];
    if (!item) return;
    setServedActionModal({
      isOpen: true,
      item,
      itemIndex: index,
      mode: "CHOICE",
      reason: "",
    });
  };

  // Xác nhận làm lại món (REMAKE)
  const handleConfirmRemake = (reason: string) => {
    if (!servedActionModal.item || servedActionModal.itemIndex < 0) return;
    const item = servedActionModal.item;
    const idx = servedActionModal.itemIndex;
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const reasonToUse = reason.trim() || "Khách khiếu nại chất lượng món";

    // Cập nhật món trên bàn thành COOKING kèm ghi chú làm lại (KHÔNG tính thêm tiền khách)
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updated = [...t.items];
          updated[idx] = {
            ...updated[idx],
            status: "COOKING",
            notes: `[LÀM LẠI: ${reasonToUse}] ${updated[idx].notes || ""}`.trim(),
          };
          return { ...t, items: updated };
        }
        return t;
      })
    );

    // Bắn vé ưu tiên khẩn cấp LÀM LẠI xuống Bếp KDS
    try {
      const rawKds = localStorage.getItem("a2order_kds_tickets_data");
      const tickets: CmsKdsTicket[] = rawKds ? JSON.parse(rawKds) : [];
      const remakeTicket: CmsKdsTicket = {
        id: "kt-remake-" + Date.now(),
        ticketCode: `#${activeTable.tableName.replace(/\s+/g, "")}-REMAKE`,
        tableName: `${activeTable.tableName} (${activeTable.zoneName})`,
        orderTime: timeNow,
        orderTimestamp: Date.now(),
        status: "NEW",
        station: "KITCHEN",
        waiterName: isCashier ? "Thu ngân" : "Nhân viên phục vụ",
        priority: "REMAKE",
        remakeReason: reasonToUse,
        items: [
          {
            dishName: item.name,
            quantity: item.quantity,
            notes: `🔥 LÀM LẠI KHẨN CẤP: ${reasonToUse}`,
          },
        ],
      };
      localStorage.setItem("a2order_kds_tickets_data", JSON.stringify([remakeTicket, ...tickets]));
    } catch (e) {
      console.warn("Lỗi gửi vé remake KDS:", e);
    }

    toast.success(`🔥 Đã gửi vé LÀM LẠI KHẨN CẤP món "${item.name}" xuống Bếp! (Không tính thêm tiền)`);
    setServedActionModal({ isOpen: false, item: null, itemIndex: -1, mode: "CHOICE", reason: "" });
  };

  // Xác nhận trả món & trừ tiền (RETURN)
  const handleConfirmReturn = (reason: string) => {
    if (!servedActionModal.item || servedActionModal.itemIndex < 0) return;
    const item = servedActionModal.item;
    const idx = servedActionModal.itemIndex;
    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const reasonToUse = reason.trim() || "Khách trả món đã lên bàn";
    const deductAmount = item.price * item.quantity;

    // Trừ món và trừ tiền bill
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableId === activeTable.tableId) {
          const updated = [...t.items];
          updated.splice(idx, 1);
          return {
            ...t,
            items: updated,
            totalAmount: Math.max(0, t.totalAmount - deductAmount),
            status: updated.length === 0 ? "EMPTY" : t.status,
          };
        }
        return t;
      })
    );

    // Ghi nhận vào Void Audit (nhật ký hoàn/hủy)
    try {
      const raw = localStorage.getItem("a2order_void_audit_canceled_items");
      const list: CanceledItemRecord[] = raw ? JSON.parse(raw) : [];
      const newRecord: CanceledItemRecord = {
        id: "ret-" + Date.now(),
        dishName: item.name,
        quantity: item.quantity,
        price: item.price,
        canceledAt: `${timeNow} Hôm nay`,
        tableName: activeTable.tableName,
        canceledBy: isCashier ? "Thu ngân" : "Nhân viên phục vụ",
        reason: `[TRẢ MÓN] ${reasonToUse}`,
        type: "RETURN_SERVED",
      };
      localStorage.setItem("a2order_void_audit_canceled_items", JSON.stringify([newRecord, ...list]));
    } catch (e) {
      console.warn("Lỗi lưu void audit trả món:", e);
    }

    toast.info(`Đã hoàn trả món "${item.name}" và trừ ${deductAmount.toLocaleString("vi-VN")} đ khỏi bill.`);
    setServedActionModal({ isOpen: false, item: null, itemIndex: -1, mode: "CHOICE", reason: "" });
  };

  const cartTotalAmount = newOrderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalQuantity = newOrderCart.reduce((sum, item) => sum + item.quantity, 0);

  // Component UI: Khung Thông Báo Cố Định (Fixed Notification Panel)
  const renderNotificationFixedPanel = () => {
    if (totalNotifCount === 0) {
      return (
        <div className="bg-white px-3.5 py-2 rounded-2xl border border-surface-border shadow-2xs flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-[11px]">Trực Tuyến</span>
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium">✓ 0 yêu cầu chờ xử lý</span>
        </div>
      );
    }

    return (
      <StaffOrderNotificationFeed
        pendingOrders={pendingOrders}
        serviceRequests={serviceRequests}
        pendingRequests={pendingRequests}
        notifTab={notifTab}
        setNotifTab={setNotifTab}
        isProcessingOrderId={isProcessingOrderId}
        isApprovingId={isApprovingId}
        onRejectOrder={handleRejectOrder}
        onApproveOrder={handleApproveOrder}
        onRemoveServiceRequest={(idx) => setServiceRequests((prev) => prev.filter((_, i) => i !== idx))}
        onRejectSession={handleRejectSession}
        onApproveSession={handleApproveSession}
        formatTableName={formatTableName}
      />
    );
  };

  // Component UI: Sơ đồ chọn bàn
  const renderTableGrid = () => (
    <div className="bg-white p-3 sm:p-3.5 rounded-3xl border border-surface-border shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      <div className="flex items-center justify-between gap-1.5 border-b border-surface-border pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon name="table" className="w-4 h-4 text-brand-900" />
          <span className="text-xs font-black uppercase tracking-wider text-ink-primary">
            Bàn Phục Vụ
          </span>
          <span className="text-xs text-ink-muted">({tables.length})</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab?.("tables")}
          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline shrink-0 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
          title="Mở sơ đồ phòng bàn để Mở bàn / Đóng bàn"
        >
          <span>Quản Lý Bàn</span>
          <Icon name="arrowRight" size={10} />
        </button>
      </div>

      {/* Filter Khu Vực */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar shrink-0 py-1.5">
        {zones.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setSelectedZone(z)}
            className={`px-2.5 py-1 rounded-full transition-all shrink-0 text-[10.5px] ${
              selectedZone === z
                ? "bg-brand-900 text-white shadow-xs font-black"
                : "bg-surface-canvas border border-surface-border text-ink-muted hover:text-ink-primary"
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Danh sách thẻ bàn: 1 cột rộng rãi, dễ đọc, không bị bóp méo chữ */}
      <div className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-2">
        {filteredTables.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-surface-canvas/50">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-2">
              <Icon name="table" className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-primary">Chưa có bàn nào</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Vui lòng thiết lập danh sách bàn ở mục Sơ Đồ Bàn</p>
          </div>
        ) : (
          filteredTables.map((t) => {
            const isSelected = t.tableId === activeTable.tableId;
            const pendingReq = pendingRequests.find((r) => r.tableId === t.tableId);
            return (
              <button
                key={t.tableId}
                type="button"
                onClick={() => {
                  setActiveTableId(t.tableId);
                  setMobileStep("MENU");
                }}
                className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between active:scale-98 ${
                  pendingReq
                    ? "border-amber-500 ring-2 ring-amber-400 bg-amber-50/90 shadow-md animate-pulse"
                    : isSelected
                    ? "border-brand-900 ring-2 ring-brand-900/20 shadow-md bg-brand-50/40"
                    : t.status === "EMPTY"
                    ? "border-surface-border bg-white hover:border-brand-200"
                    : t.status === "OCCUPIED"
                    ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                    : t.status === "WAITING_FOOD"
                    ? "border-purple-300 bg-purple-50/50 hover:border-purple-400"
                    : "border-rose-400 bg-rose-50/60 hover:border-rose-500 animate-pulse"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-ink-primary block truncate">{t.tableName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mt-0.5">
                      <span>{t.zoneName}</span>
                      {t.pin && (
                        <span className="font-mono font-bold text-[9px] px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          PIN: {t.pin}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[9.5px] font-black shrink-0 ${
                      t.status === "EMPTY"
                        ? "bg-slate-100 text-slate-500"
                        : t.status === "OCCUPIED"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : t.status === "WAITING_FOOD"
                        ? "bg-purple-100 text-purple-900 border border-purple-200"
                        : "bg-rose-100 text-rose-900 border border-rose-200 animate-pulse"
                    }`}
                  >
                    {t.status === "EMPTY" ? "Trống" : t.status === "OCCUPIED" ? "Có khách" : t.status === "WAITING_FOOD" ? "Chờ món" : "Tính tiền"}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-surface-border/40 flex items-center justify-between text-[11px]">
                  {pendingReq ? (
                    <span className="text-[10.5px] font-black text-amber-900">🔔 Chờ duyệt mở bàn</span>
                  ) : t.status !== "EMPTY" && t.items.length > 0 ? (
                    <>
                      <span className="font-black text-brand-950">{t.totalAmount.toLocaleString("vi-VN")} đ</span>
                      <span className="text-[10px] text-ink-muted">{t.items.length} món</span>
                    </>
                  ) : t.status !== "EMPTY" ? (
                    <>
                      <span className="font-bold text-emerald-800 text-[10.5px]">👥 {t.guestCount || 2} khách</span>
                      <span className="text-[10px] text-ink-muted">Vào {t.openedAt || "--:--"}</span>
                    </>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic">Bàn trống</span>
                  )}
                </div>

                {pendingReq && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveSession(pendingReq);
                    }}
                    disabled={isApprovingId === pendingReq.tableId}
                    className="w-full mt-2 py-1 px-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-xs transition disabled:opacity-50"
                  >
                    <Icon name="check" size={11} />
                    <span>Duyệt Mở Bàn</span>
                  </button>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // Component UI: Menu gọi món
  const renderMenuSection = () => (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden h-full">
      {/* Banner thông tin bàn hiện tại trên mobile */}
      <div className="lg:hidden flex items-center justify-between p-2.5 bg-brand-50 border border-brand-200/60 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileStep("TABLES")}
          className="flex items-center gap-1 text-xs font-black text-brand-900"
        >
          <Icon name="arrowRight" size={12} className="rotate-180" />
          <span>Đổi Bàn</span>
        </button>

        <div className="text-center">
          <span className="font-black text-sm text-brand-950 block leading-tight">
            {activeTable.tableName}
          </span>
          <span className="text-[10px] text-brand-700 font-semibold">
            {activeTable.zoneName} • {activeTable.status === "EMPTY" ? "Bàn Trống" : `Có ${activeTable.items.length} món`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileStep("CART")}
          className="text-xs font-black text-brand-900 bg-white px-2.5 py-1 rounded-xl border border-brand-200 shadow-2xs flex items-center gap-1"
        >
          <Icon name="cart" size={13} />
          <span>Phiếu ({activeTable.items.length + newOrderCart.length})</span>
        </button>
      </div>

      {/* Thanh tìm kiếm & lọc category */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh món ăn, nước uống..."
            className="w-full h-10 pl-9 pr-3 rounded-2xl border border-surface-border text-xs font-bold focus:outline-none focus:border-brand-800 bg-surface-canvas"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-2 rounded-xl transition-all shrink-0 ${
                selectedCategory === c
                  ? "bg-brand-900 text-white"
                  : "bg-surface-canvas text-ink-muted hover:text-ink-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách món ăn */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0 pr-1 ${
        mobileStep === "MENU" && (newOrderCart.length > 0 || activeTable.items.length > 0) ? "pb-16" : ""
      }`}>
        {filteredDishes.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center rounded-2xl border border-dashed border-surface-border bg-surface-canvas/50">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 mx-auto mb-2">
              <Icon name="coffee" className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-primary">Chưa có món ăn nào trong thực đơn</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Vui lòng thiết lập thực đơn tại mục Thực Đơn</p>
          </div>
        ) : (
          filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="p-3 rounded-2xl border border-surface-border bg-white hover:border-brand-300 hover:shadow-xs transition-all flex gap-3 group"
            >
              <img
                src={dish.image}
                alt={dish.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-ink-primary leading-snug">
                      {dish.name}
                    </h4>
                    {dish.isPopular && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black shrink-0">
                        HOT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-muted line-clamp-1 mt-0.5">
                    {dish.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-border/40">
                  <span className="text-xs font-black text-brand-950">
                    {dish.price.toLocaleString("vi-VN")} đ
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCustomize(dish)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-ink-muted bg-surface-canvas hover:bg-surface-muted border border-surface-border"
                      title="Ghi chú khẩu vị"
                    >
                      Ghi chú
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAddDish(dish)}
                      className="w-7 h-7 rounded-xl bg-brand-900 text-white flex items-center justify-center hover:bg-brand-950 shadow-xs active:scale-90 transition-transform"
                      title="Thêm nhanh"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Component UI: Phiếu gọi món & giỏ hàng
  const renderCartSection = () => (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-surface-border shadow-xs flex flex-col flex-1 min-h-0 overflow-hidden h-full">
      {/* Header bàn đang chọn */}
      <div className="border-b border-surface-border pb-3 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-ink-primary">
              {activeTable.tableName}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTable.status === "EMPTY"
                  ? "bg-slate-100 text-slate-700"
                  : activeTable.status === "OCCUPIED"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : activeTable.status === "WAITING_FOOD"
                  ? "bg-purple-100 text-purple-900 border border-purple-300"
                  : "bg-rose-100 text-rose-900 border border-rose-300"
              }`}
            >
              {activeTable.status === "EMPTY"
                ? "Bàn trống"
                : activeTable.status === "OCCUPIED"
                ? "Có khách"
                : activeTable.status === "WAITING_FOOD"
                ? "Chờ món"
                : "Chờ thanh toán"}
            </span>
          </div>

          {/* Cụm nút hành động Bàn: Đóng Bàn / Đổi PIN / Mở Bàn */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTable.status === "EMPTY" && activeTable.tableId ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("tables")}
                  className="py-1 px-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1"
                  title="Chuyển sang màn hình Quản Lý Bàn"
                >
                  <Icon name="table" size={11} />
                  <span>Quản Lý Bàn</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setOpenTableGuestCount(2); setOpenTableModal({ tableId: activeTable.tableId, tableName: activeTable.tableName }); }}
                  className="py-1 px-3 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Icon name="plus" size={12} />
                  <span>Mở Bàn</span>
                </button>
              </div>
            ) : activeTable.status !== "EMPTY" ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRotateTablePin(activeTable.tableId, activeTable.tableName)}
                  className="py-1 px-2 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1"
                  title="Đổi mã PIN mở bàn"
                >
                  <Icon name="refresh" size={11} />
                  <span>PIN: {activeTable.pin || "---"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseTableSession(activeTable.tableId, activeTable.tableName)}
                  className="py-1 px-3 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  title="Đóng phiên phục vụ của bàn này và dọn bàn"
                >
                  <Icon name="x" size={12} />
                  <span>Đóng Bàn</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Dòng chi tiết & Tab Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-ink-muted flex items-center gap-1.5 flex-wrap">
            <span>Số khách: <strong className="text-ink-primary">{activeTable.guestCount || 0} người</strong></span>
            <span>•</span>
            {activeTable.status !== "EMPTY" && activeTable.openedAt ? (
              <>
                <span>Vào lúc: <strong className="text-ink-primary">{activeTable.openedAt}</strong></span>
                {(activeTable as any).openedAtMs && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">⏱ {formatElapsed((activeTable as any).openedAtMs)}</span>
                  </>
                )}
              </>
            ) : (
              <span className="italic text-slate-400">Chưa mở phiên</span>
            )}
            {activeTable.mergedTables && activeTable.mergedTables.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[9px] font-black border border-purple-200">
                Đã gộp: {activeTable.mergedTables.join(", ")}
              </span>
            )}
          </div>

          {/* Toggle 2 Tab */}
          <div className="p-1 bg-surface-canvas rounded-xl border border-surface-border flex text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "MENU"
                  ? "bg-brand-900 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              Món Mới ({newOrderCart.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SERVED_ITEMS")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "SERVED_ITEMS"
                  ? "bg-brand-900 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              Đã Gọi ({activeTable.items.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: GIỎ MÓN MỚI SẮP GỬI BẾP */}
      {activeTab === "MENU" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {newOrderCart.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted space-y-2">
                <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto text-ink-subtle">
                  <Icon name="cart" className="w-6 h-6" />
                </div>
                <p className="font-bold">Chưa chọn món mới nào</p>
                <p className="text-[11px]">Bấm dấu (+) trên menu để thêm món vào order</p>
                <button
                  type="button"
                  onClick={() => setMobileStep("MENU")}
                  className="lg:hidden mt-2 px-3 py-1.5 rounded-xl bg-brand-900 text-white text-xs font-bold"
                >
                  ← Mở Menu Chọn Món
                </button>
              </div>
            ) : (
              newOrderCart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink-primary truncate">{item.name}</div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-700 italic truncate font-semibold">
                        Ghi chú: {item.notes}
                      </div>
                    )}
                    <div className="text-[11px] font-black text-brand-900 mt-0.5">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  {/* Bộ điều khiển số lượng */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-surface-border">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(idx, -1)}
                      className="w-6 h-6 rounded-lg text-ink-subtle hover:bg-surface-muted flex items-center justify-center font-bold"
                    >
                      <Icon name="minus" className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-black text-xs text-ink-primary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(idx, 1)}
                      className="w-6 h-6 rounded-lg text-ink-subtle hover:bg-surface-muted flex items-center justify-center font-bold"
                    >
                      <Icon name="plus" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Giỏ hàng & Nút Gửi Bếp */}
          <div className="pt-3 border-t border-surface-border mt-3 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Tạm tính món mới:</span>
              <span className="font-black text-sm text-brand-950">
                {cartTotalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={newOrderCart.length === 0}
                onClick={() => setNewOrderCart([])}
                className="rounded-2xl text-xs font-bold"
              >
                Xóa Giỏ
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={newOrderCart.length === 0}
                onClick={handleSendToKitchen}
                className="rounded-2xl bg-brand-900 text-white text-xs font-black shadow-sm gap-1.5"
              >
                <Icon name="kitchen" className="w-3.5 h-3.5" />
                <span>Gửi Bếp Ngay 🔥</span>
              </Button>
            </div>

            {/* Nút đóng bàn nhanh nếu bàn đang mở nhưng chưa gọi món */}
            {activeTable.status !== "EMPTY" && newOrderCart.length === 0 && (
              <button
                type="button"
                onClick={() => handleCloseTableSession(activeTable.tableId, activeTable.tableName)}
                className="w-full py-2 rounded-xl text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
                <span>Đóng Bàn & Trả Về Bàn Trống</span>
              </button>
            )}

            {/* Nút quay lại menu chọn thêm trên mobile */}
            <button
              type="button"
              onClick={() => setMobileStep("MENU")}
              className="lg:hidden w-full py-2 rounded-xl text-xs font-bold text-brand-900 hover:bg-brand-50 border border-brand-200 transition-colors mt-1"
            >
              + Gọi Thêm Món Khác
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CÁC MÓN BÀN NÀY ĐÃ GỌI TRƯỚC ĐÓ */}
      {activeTab === "SERVED_ITEMS" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {activeTable.items.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                Bàn này chưa có món nào được gửi vào bếp.
              </div>
            ) : (
              activeTable.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-brand-950">{item.quantity}x</span>
                      <span className="font-bold text-ink-primary truncate">{item.name}</span>
                      {item.round && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 text-[9px] font-black border border-emerald-200">
                          Đợt {item.round}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-800 italic truncate font-semibold">
                        {item.notes}
                      </div>
                    )}
                    <div className="text-[10px] text-ink-subtle mt-0.5">
                      Gọi lúc: {item.orderedAt || "Trước đó"} • {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Badge trạng thái */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.status === "SERVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "COOKING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.status === "SERVED"
                        ? "Đã lên bàn"
                        : item.status === "COOKING"
                        ? "Bếp đang nấu"
                        : "Chờ bếp"}
                    </span>

                    {/* Nút hành động tương ứng với trạng thái món */}
                    {item.status === "WAITING" && (
                      <button
                        type="button"
                        onClick={() => handleCancelWaitingItem(idx)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                        title="Hủy món chưa nấu"
                      >
                        <Icon name="trash" className="w-3 h-3" />
                        <span>Hủy</span>
                      </button>
                    )}

                    {item.status === "COOKING" && (
                      <button
                        type="button"
                        onClick={() => handleOpenVoidCooking(idx)}
                        className="px-2 py-1 rounded-lg text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 transition-colors flex items-center gap-1"
                        title="Báo bếp dừng nấu & hủy món"
                      >
                        <Icon name="alert" className="w-3 h-3 text-rose-600" />
                        <span>Hủy nấu</span>
                      </button>
                    )}

                    {item.status === "SERVED" && (
                      <button
                        type="button"
                        onClick={() => handleOpenServedAction(idx)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1"
                        title="Khách khiếu nại làm lại hoặc trả món"
                      >
                        <Icon name="refresh" className="w-3 h-3" />
                        <span>Đổi / Trả</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-surface-border mt-3 space-y-2.5 shrink-0">
            {/* Chi tiết tài chính bàn: Tiền món + Phụ phí - Giảm giá */}
            <div className="space-y-1.5 text-xs bg-surface-canvas/60 p-2.5 rounded-2xl border border-surface-border/70">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Tiền món ăn ({activeTable.items.length} món):</span>
                <span className="font-bold text-ink-primary">
                  {foodTotalAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {surchargesTotalAmount > 0 && (
                <div className="flex items-center justify-between text-amber-900 font-medium">
                  <span>+ Phụ thu ({activeTable.surcharges?.length} khoản):</span>
                  <span className="font-bold">+{surchargesTotalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}

              {discountTotalAmount > 0 && (
                <div className="flex items-center justify-between text-rose-700 font-medium">
                  <span>- Giảm giá ({activeTable.discount?.reason}):</span>
                  <span className="font-bold">-{discountTotalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}

              <div className="pt-1.5 border-t border-surface-border/70 flex items-center justify-between">
                <span className="font-black text-ink-primary">Tổng cộng thanh toán:</span>
                <span className="font-black text-base text-brand-950">
                  {finalPayableAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {activeTable.offlinePaid && (
                <div className="mt-1 px-2 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-[10px] font-black flex items-center gap-1">
                  <Icon name="checkCircle" size={12} className="text-emerald-700" />
                  <span>Đã thanh toán ngoại tuyến lúc {activeTable.offlinePaidAt}</span>
                </div>
              )}
            </div>

            {/* Cụm 4 nút tác vụ chuyên nghiệp */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                disabled={activeTable.items.length === 0}
                className="py-2.5 px-2 rounded-2xl border border-surface-border bg-white hover:bg-surface-canvas text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              >
                <Icon name="refresh" className="w-3.5 h-3.5 text-brand-900" />
                <span>Chuyển / Gộp</span>
              </button>

              <button
                type="button"
                onClick={handleOpenSplitBill}
                disabled={activeTable.items.length === 0}
                className="py-2.5 px-2 rounded-2xl border border-surface-border bg-white hover:bg-surface-canvas text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              >
                <Icon name="table" className="w-3.5 h-3.5 text-brand-900" />
                <span>Tách Hóa Đơn</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSurchargeModalOpen(true)}
                disabled={activeTable.items.length === 0}
                className="py-2.5 px-2 rounded-2xl border border-surface-border bg-white hover:bg-surface-canvas text-ink-primary text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              >
                <Icon name="tag" className="w-3.5 h-3.5 text-brand-900" />
                <span>Phụ Thu / Giảm</span>
              </button>

              <Button
                type="button"
                size="sm"
                onClick={handleRequestBill}
                disabled={activeTable.items.length === 0}
                className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs gap-1.5 disabled:opacity-40"
              >
                <Icon name={isCashier ? "cashier" : "print"} className="w-3.5 h-3.5" />
                <span>{isCashier ? "Thanh Toán" : "In Tạm Tính"}</span>
              </Button>
            </div>

            {/* Nút 1-chạm cứu hộ khi Mất Điện / Rớt Mạng (Offline Emergency Mode) */}
            <button
              type="button"
              onClick={handleOpenOfflineModal}
              disabled={activeTable.items.length === 0}
              className="w-full py-2 px-3 rounded-xl text-xs font-extrabold text-amber-950 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-2xs"
              title="Thanh toán khẩn cấp bằng VietQR tĩnh hoặc tiền mặt khi rớt mạng / mất điện"
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>⚡ Mất Điện / Offline VietQR</span>
            </button>

            {activeTable.status !== "EMPTY" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRotateTablePin(activeTable.tableId, activeTable.tableName)}
                  className="py-2 px-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Tạo mã PIN 4 số bảo mật mới cho bàn (Mã PIN động)"
                >
                  <Icon name="refresh" className="w-3.5 h-3.5 text-slate-600" />
                  <span>Đổi PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCloseTableSession(activeTable.tableId, activeTable.tableName)}
                  className="py-2 px-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Đóng phiên phục vụ của bàn này và giải phóng bàn về trạng thái Bàn Trống"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                  <span>Đóng Bàn</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileStep("MENU")}
              className="lg:hidden w-full py-2 rounded-xl text-xs font-bold text-brand-900 hover:bg-brand-50 border border-brand-200 transition-colors mt-1"
            >
              + Gọi Thêm Món
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full max-h-full flex-1 flex flex-col min-h-0 overflow-hidden space-y-2.5 animate-fadeIn">
      {/* Top Header thanh điều hành Gọi Món */}
      <div className="hidden lg:flex items-center justify-between gap-3 pb-1 shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              {isCashier ? "Thu Ngân & Thanh Toán" : "Gọi Món"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {isCashier ? "Két Đang Mở" : "Trực Tuyến"}
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            {isCashier
              ? "Tạo đơn và thanh toán hóa đơn cho khách"
              : "Chọn bàn, tạo đơn gọi món và gửi bếp chế biến"}
          </p>
        </div>

        {/* Nút tác vụ nhanh */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {!isCashier && (
            <button
              type="button"
              onClick={() => handleCallStaffService("Thêm đá & khăn lạnh")}
              className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold bg-surface-canvas hover:bg-brand-50 hover:text-brand-900 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Icon name="bell" className="w-3.5 h-3.5 text-brand-900" />
              <span>Xin Đá / Khăn</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            disabled={activeTable.items.length === 0}
            className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold bg-white hover:border-brand-300 hover:text-brand-900 transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          >
            <Icon name="refresh" className="w-3.5 h-3.5" />
            <span>Chuyển / Ghép Bàn</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSplitBill}
            disabled={activeTable.items.length === 0}
            className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold bg-white hover:border-brand-300 hover:text-brand-900 transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          >
            <Icon name="table" className="w-3.5 h-3.5" />
            <span>Tách Bill</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSurchargeModalOpen(true)}
            disabled={activeTable.items.length === 0}
            className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold bg-white hover:border-brand-300 hover:text-brand-900 transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0"
          >
            <Icon name="tag" className="w-3.5 h-3.5" />
            <span>Phụ Thu / Giảm</span>
          </button>

          <button
            type="button"
            onClick={handleOpenOfflineModal}
            disabled={activeTable.items.length === 0}
            className="px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0"
            title="Chế độ ngoại tuyến / rớt mạng / mất điện"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>⚡ Offline QR</span>
          </button>

          <button
            type="button"
            onClick={handleRequestBill}
            disabled={activeTable.items.length === 0}
            className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-40 shrink-0 ${
              isCashier
                ? "bg-emerald-700 hover:bg-emerald-800"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            <Icon name={isCashier ? "cashier" : "print"} className="w-3.5 h-3.5" />
            <span>{isCashier ? "Thanh Toán & In Bill" : "In Tạm Tính"}</span>
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG 3 BƯỚC THÔNG MINH CHO MOBILE (STEP-BY-STEP) */}
      <div className="lg:hidden p-1 bg-white rounded-2xl border border-surface-border shadow-xs flex items-center gap-1 text-xs font-bold shrink-0">
        <button
          type="button"
          onClick={() => setMobileStep("TABLES")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileStep === "TABLES"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "text-ink-muted hover:text-ink-primary bg-surface-canvas"
          }`}
        >
          <Icon name="table" size={13} />
          <span>1. Chọn Bàn</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileStep("MENU")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileStep === "MENU"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "text-ink-muted hover:text-ink-primary bg-surface-canvas"
          }`}
        >
          <Icon name="menu" size={13} />
          <span>2. Gọi Món</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileStep("CART")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
            mobileStep === "CART"
              ? "bg-brand-900 text-white shadow-xs font-black"
              : "text-ink-muted hover:text-ink-primary bg-surface-canvas"
          }`}
        >
          <Icon name="cart" size={13} />
          <span>3. Phiếu Bàn</span>
          {totalNotifCount > 0 ? (
            <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center absolute -top-1 -right-1">
              {totalNotifCount}
            </span>
          ) : (newOrderCart.length > 0 || activeTable.items.length > 0) ? (
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-2" />
          ) : null}
        </button>
      </div>

      {/* HIỂN THỊ TRÊN MOBILE: CHỈ HIỆN BƯỚC ĐANG CHỌN */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        {mobileStep === "TABLES" && renderTableGrid()}
        {mobileStep === "MENU" && renderMenuSection()}
        {mobileStep === "CART" && (
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {renderNotificationFixedPanel()}
            {renderCartSection()}
          </div>
        )}
      </div>

      {/* HIỂN THỊ TRÊN DESKTOP: BẢNG ĐIỀU KHIỂN 3 CỘT CHUYÊN NGHIỆP */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-hidden">
        {/* CỘT 1 (3 cols): Sơ đồ Bàn phục vụ */}
        <div className="col-span-3 h-full flex flex-col min-h-0 overflow-hidden">
          {renderTableGrid()}
        </div>

        {/* CỘT 2 (5 cols): Thực đơn chọn món */}
        <div className="col-span-5 h-full flex flex-col min-h-0 overflow-hidden">
          {renderMenuSection()}
        </div>

        {/* CỘT 3 (4 cols): Khung Thông Báo Cố Định + Phiếu Bàn & Giỏ Hàng */}
        <div className="col-span-4 h-full flex flex-col min-h-0 space-y-2.5 overflow-hidden">
          {renderNotificationFixedPanel()}
          {renderCartSection()}
        </div>
      </div>

      {/* Mobile Floating Sticky Cart Bar (Giỏ hàng nổi khi đang ở bước chọn món) */}
      {mobileStep === "MENU" && (newOrderCart.length > 0 || activeTable.items.length > 0) && (
        <aside aria-label="Giỏ hàng di động" className="lg:hidden fixed bottom-18 left-3 right-3 z-40 animate-slideUp">
          <div className="bg-brand-950 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-brand-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {cartTotalQuantity || activeTable.items.length}
              </div>
              <div>
                <div className="text-xs font-black">
                  {activeTable.tableName} • {newOrderCart.length > 0 ? "Món mới chờ gửi" : "Đang phục vụ"}
                </div>
                <div className="text-[11px] text-brand-200 font-bold">
                  {(cartTotalAmount || activeTable.totalAmount).toLocaleString("vi-VN")} đ
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setMobileStep("CART")}
              className="rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-black shadow-md px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <span>Xem Phiếu ➔</span>
            </Button>
          </div>
        </aside>
      )}

      <ModifyingDishModal
        dish={modifyingDish}
        modifiers={dishModifiers}
        customNote={dishCustomNote}
        onModifiersChange={setDishModifiers}
        onCustomNoteChange={setDishCustomNote}
        onConfirm={handleAddToCart}
        onClose={() => setModifyingDish(null)}
      />

      <TransferTableModal
        isOpen={isTransferModalOpen}
        activeTable={activeTable}
        tables={tables}
        transferMode={transferMode}
        onTransferModeChange={setTransferMode}
        targetTransferTableId={targetTransferTableId}
        onTargetTransferTableIdChange={setTargetTransferTableId}
        onConfirm={handleExecuteTransfer}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <VoidCookingModal
        isOpen={voidCookingModal.isOpen}
        item={voidCookingModal.item}
        tableName={activeTable.tableName}
        reason={voidCookingModal.reason}
        onReasonChange={(reason) => setVoidCookingModal((prev) => ({ ...prev, reason }))}
        onConfirm={handleConfirmVoidCooking}
        onClose={() => setVoidCookingModal({ isOpen: false, item: null, itemIndex: -1, reason: "" })}
      />

      <ServedActionModal
        isOpen={servedActionModal.isOpen}
        item={servedActionModal.item}
        tableName={activeTable.tableName}
        mode={servedActionModal.mode}
        reason={servedActionModal.reason}
        onModeChange={(mode) => setServedActionModal((prev) => ({ ...prev, mode }))}
        onReasonChange={(reason) => setServedActionModal((prev) => ({ ...prev, reason }))}
        onConfirmRemake={handleConfirmRemake}
        onConfirmReturn={handleConfirmReturn}
        onClose={() => setServedActionModal({ isOpen: false, item: null, itemIndex: -1, mode: "CHOICE", reason: "" })}
      />

      <SplitBillModal
        isOpen={isSplitBillModalOpen}
        activeTable={activeTable}
        finalPayableAmount={finalPayableAmount}
        splitBillTab={splitBillTab}
        onSplitBillTabChange={setSplitBillTab}
        splitItemCounts={splitItemCounts}
        setSplitItemCounts={setSplitItemCounts}
        equalSplitGuests={equalSplitGuests}
        setEqualSplitGuests={setEqualSplitGuests}
        equalSplitPaid={equalSplitPaid}
        setEqualSplitPaid={setEqualSplitPaid}
        activePersonQr={activePersonQr}
        setActivePersonQr={setActivePersonQr}
        onExecuteItemizedSplit={handleExecuteItemizedSplit}
        onClose={() => setIsSplitBillModalOpen(false)}
      />

      <SurchargeModal
        isOpen={isSurchargeModalOpen}
        activeTable={activeTable}
        foodTotalAmount={foodTotalAmount}
        finalPayableAmount={finalPayableAmount}
        surchargeTab={surchargeTab}
        onSurchargeTabChange={setSurchargeTab}
        customSurchargeName={customSurchargeName}
        onCustomSurchargeNameChange={setCustomSurchargeName}
        customSurchargeAmount={customSurchargeAmount}
        onCustomSurchargeAmountChange={setCustomSurchargeAmount}
        onAddSurcharge={handleAddSurcharge}
        onRemoveSurcharge={handleRemoveSurcharge}
        discountType={discountType}
        onDiscountTypeChange={setDiscountType}
        discountValue={discountValue}
        onDiscountValueChange={setDiscountValue}
        discountReason={discountReason}
        onDiscountReasonChange={setDiscountReason}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
        onClose={() => setIsSurchargeModalOpen(false)}
      />

      <OfflineEmergencyModal
        isOpen={isOfflineModalOpen}
        activeTable={activeTable}
        finalPayableAmount={finalPayableAmount}
        cashGivenAmount={cashGivenAmount}
        onCashGivenAmountChange={setCashGivenAmount}
        onConfirmOfflinePaid={handleConfirmOfflinePaid}
        onClose={() => setIsOfflineModalOpen(false)}
      />

      <ManualOpenTableModal
        openTableModal={openTableModal}
        guestCount={openTableGuestCount}
        onGuestCountChange={setOpenTableGuestCount}
        isOpeningTable={isOpeningTable}
        onConfirm={handleOpenTableManually}
        onClose={() => setOpenTableModal(null)}
      />
    </div>

  );
};
