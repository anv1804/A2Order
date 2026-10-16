import { browserRequest as requestApi, type BillView, type BillAdjustment, type OperationalTable } from "@a2order/shared";
import { useResource, useAntiSpamAction } from "@a2order/shared/react";
import { getAuthUser } from "@a2order/shared";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  WaiterOrderItem,
  WaiterTableOrder,
  CmsStaffOrderViewProps,
} from "@/types/cms.types";
import { tableApi } from "@/services/api/tableApi";
import { orderApi } from "@/services/api/orderApi";
import { sound } from "@/lib/sound";
import { PendingSessionRequest, StaffOrderDishItem as DishItem, PendingOrder, NewOrderItem } from "@/types";
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
import {
  StaffOrderNotificationFeed,
  StaffOrderTableList,
  StaffOrderMenuSection,
  StaffOrderCartSection,
} from "./components";

export const CmsStaffOrderView: React.FC<CmsStaffOrderViewProps> = ({
  currentRole = "STORE_OWNER",
  onNavigateTab,
}) => {
  const isCashier = currentRole === "CASHIER";
  const storeId = getAuthUser()?.storeId || "";
  const [zonesData] = useResource<any[]>(storeId ? `/tables/${storeId}` : null, []);
  const [snapshot, refreshTables] = useResource<OperationalTable[]>(storeId ? `/orders/${storeId}/snapshot` : null, []);
  const tables = snapshot.map(t => ({
    ...t,
    totalAmount: t.balanceAmount ?? t.totalAmount,
    pin: zonesData.flatMap(z => z.tables || []).find(table => table.id === t.tableId)?.pin,
    openedAt: t.openedAt ? new Date(t.openedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : undefined,
    items: t.items.map(i => ({ ...i, orderedAt: new Date(i.orderedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) })),
    status: t.status === "PAYMENT_PENDING" ? "BILL_REQUESTED" : t.status,
    surcharges: t.adjustment?.surchargeAmount ? [{ id: "server", name: "Phụ thu", amount: t.adjustment.surchargeAmount }] : [],
    discount: t.adjustment?.discountPercent || t.adjustment?.fixedDiscount
      ? { type: t.adjustment.fixedDiscount ? "AMOUNT" : "PERCENT", value: t.adjustment.fixedDiscount || t.adjustment.discountPercent, reason: t.adjustment.discountReason || "" }
      : undefined,
  })) as WaiterTableOrder[];

  const setTables = (_update: React.SetStateAction<WaiterTableOrder[]>) => { void refreshTables().catch(e => toast.error(e.message)); };

  const [menuDishes] = useResource<any[]>(storeId ? `/menu/${storeId}` : null, []);

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
        modifiers: [
          ...(d.variants || []).map((v: any) => "Phần: " + v.name),
          ...(d.customizationGroups || []).flatMap((g: any) => g.options.map((o: any) => o.name)),
        ],
      }));
    }
    return [];
  }, [menuDishes]);

  const [selectedZone, setSelectedZone] = useState<string>("TẤT CẢ");
  const [activeTableId, setActiveTableId] = usePersistentState<string>("staff_order_active_table", "");
  const [activeTab, setActiveTab] = useState<"MENU" | "SERVED_ITEMS">("MENU");

  const formatTableName = (name?: string) => {
    if (!name) return "Bàn";
    return name.trim().toLowerCase().startsWith("bàn") ? name.trim() : `Bàn ${name.trim()}`;
  };

  const [pendingRequests, refreshRequests] = useResource<PendingSessionRequest[]>(`/tables/${storeId}/pending-requests`, []);
  const setPendingRequests = (_update: React.SetStateAction<PendingSessionRequest[]>) => { void refreshRequests().catch(() => undefined); };
  const [pendingOrders, refreshOrders] = useResource<PendingOrder[]>(`/orders/${storeId}/pending`, []);
  const setPendingOrders = (_update: React.SetStateAction<PendingOrder[]>) => { void refreshOrders().catch(() => undefined); };
  const [serviceRequests, refreshServices] = useResource<any[]>(`/tables/${storeId}/service-requests`, []);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [isProcessingOrderId, setIsProcessingOrderId] = useState<string | null>(null);

  const [notifTab, setNotifTab] = useState<"ORDERS" | "SERVICE" | "OPEN_TABLE">("ORDERS");
  const totalNotifCount = pendingOrders.length + serviceRequests.length + pendingRequests.length;

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

  const handleRejectSession = async (req: PendingSessionRequest) => {
    try {
      await tableApi.rejectTableSession(storeId, req.tableId, "Nhân viên xác nhận bàn hiện chưa có khách ngồi thực tế");
      setPendingRequests((prev) => prev.filter((r) => r.tableId !== req.tableId));
      toast.info(`Đã từ chối yêu cầu mở ${formatTableName(req.tableName)}`);
    } catch (err: any) {
      toast.error("Lỗi khi từ chối yêu cầu: " + (err.message || "Lỗi kết nối"));
    }
  };

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

  const [mobileStep, setMobileStep] = useState<"TABLES" | "MENU" | "CART">("TABLES");
  const [newOrderCart, setNewOrderCart] = useState<NewOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TẤT CẢ");

  const [modifyingDish, setModifyingDish] = useState<DishItem | null>(null);
  const [dishModifiers, setDishModifiers] = useState<string[]>([]);
  const [dishCustomNote, setDishCustomNote] = useState("");

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState("");
  const [transferMode, setTransferMode] = useState<"MOVE" | "MERGE">("MOVE");

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

  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [splitBillTab, setSplitBillTab] = useState<"ITEMIZED" | "EQUAL">("ITEMIZED");
  const [splitItemCounts, setSplitItemCounts] = useState<Record<number, number>>({});
  const [equalSplitGuests, setEqualSplitGuests] = useState<number>(2);
  const [equalSplitPaid, setEqualSplitPaid] = useState<Record<number, boolean>>({});
  const [activePersonQr, setActivePersonQr] = useState<number | null>(null);

  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [surchargeTab, setSurchargeTab] = useState<"SURCHARGE" | "DISCOUNT">("SURCHARGE");
  const [customSurchargeName, setCustomSurchargeName] = useState("");
  const [customSurchargeAmount, setCustomSurchargeAmount] = useState<number>(50000);
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState<string>("Khách quen VIP");

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

  const activeTable = useMemo(
    () => tables.find((t) => t.tableId === activeTableId) || tables[0] || FALLBACK_EMPTY_TABLE,
    [tables, activeTableId, FALLBACK_EMPTY_TABLE]
  );

  const foodTotalAmount = useMemo(() => {
    return activeTable.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [activeTable.items]);

  const surchargesTotalAmount = useMemo(() => {
    return activeTable.surchargeAmount || 0;
  }, [activeTable.surchargeAmount]);

  const discountTotalAmount = useMemo(() => {
    return activeTable.discountAmount || 0;
  }, [activeTable.discountAmount]);

  const finalPayableAmount = useMemo(() => {
    return activeTable.totalAmount;
  }, [activeTable.totalAmount]);

  const [paymentBill, setPaymentBill] = useState<BillView | null>(null);
  const submitOrder = useAntiSpamAction("staff-order", (payload: unknown, key) =>
    requestApi("/orders/submit", { method: "POST", headers: { "x-idempotency-key": key }, body: JSON.stringify(payload) })
  );
  const cashPayment = useAntiSpamAction("cash-payment", (payload: unknown, key) =>
    requestApi<any>("/billing/checkout", { method: "POST", headers: { "x-idempotency-key": key }, body: JSON.stringify(payload) })
  );

  const openBill = async (extra: Record<string, unknown> = {}) => {
    try {
      const bill = await requestApi<BillView>("/billing/generate-vietqr", {
        method: "POST",
        body: JSON.stringify({ tableId: activeTable.tableId, ...extra }),
      });
      setPaymentBill(bill);
      setCashGivenAmount(0);
      setIsOfflineModalOpen(true);
      await refreshTables();
      return bill;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const saveAdjustment = async (adjustment: Partial<BillAdjustment>) => {
    try {
      await requestApi(`/orders/${storeId}/adjustment`, {
        method: "POST",
        body: JSON.stringify({ tableId: activeTable.tableId, adjustment }),
      });
      await refreshTables();
      toast.success("Đã lưu điều chỉnh");
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  };

  const cancelOperationalItem = async (itemId: string, reason: string) => {
    try {
      await requestApi(`/orders/${storeId}/cancel-item`, {
        method: "POST",
        body: JSON.stringify({ itemId, reason }),
      });
      await refreshTables();
      toast.success("Đã hủy món");
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  };

  useEffect(() => {
    if (!paymentBill || !isOfflineModalOpen) return;
    const timer = setInterval(async () => {
      try {
        const bill = await requestApi<BillView>(`/billing/bills/${paymentBill.id}`);
        setPaymentBill(bill);
        if (bill.paymentStatus === "PAID") {
          setIsOfflineModalOpen(false);
          toast.success("Ngân hàng đã xác nhận thanh toán");
          await refreshTables();
        }
      } catch {}
    }, 4000);
    return () => clearInterval(timer);
  }, [paymentBill?.id, isOfflineModalOpen, refreshTables]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(dishesList.map((d) => d.category)));
    return ["TẤT CẢ", ...list];
  }, [dishesList]);

  const handleQuickAddDish = (dish: DishItem) => {
    const source = menuDishes.find((d) => d.id === dish.id);
    if (source?.variants?.length || source?.customizationGroups?.length) {
      handleOpenCustomize(dish);
      return;
    }
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
        },
      ];
    });
    toast.success(`Đã thêm ${dish.name} vào đơn bàn ${activeTable.tableName}`);
  };

  const handleOpenCustomize = (dish: DishItem) => {
    setModifyingDish(dish);
    setDishModifiers([]);
    setDishCustomNote("");
  };

  const handleAddToCart = (dish: DishItem, modifiers: string[], customNote: string) => {
    const source = menuDishes.find((d) => d.id === dish.id);
    const variant = source?.variants?.find((v: any) => modifiers.includes("Phần: " + v.name));
    if (source?.variants?.length && source.variants.filter((v: any) => modifiers.includes("Phần: " + v.name)).length !== 1) {
      return toast.error("Vui lòng chọn một biến thể món");
    }
    const ids: string[] = modifiers
      .map((name) => (source?.customizationGroups || []).flatMap((g: any) => g.options).find((o: any) => o.name === name)?.id)
      .filter(Boolean);
    for (const group of source?.customizationGroups || []) {
      const count = group.options.filter((o: any) => ids.includes(o.id)).length;
      if (
        count < (group.minSelect ?? (group.required ? 1 : 0)) ||
        count > (group.maxSelect ?? (group.type === "SINGLE" ? 1 : group.options.length))
      ) {
        return toast.error("Chọn đúng tùy chọn " + group.name);
      }
    }
    setNewOrderCart((prev) => [
      ...prev,
      {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        notes: customNote,
        variantId: variant?.id,
        modifiers,
      },
    ]);
    toast.success(`Đã thêm ${dish.name} (có ghi chú)`);
  };

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

  const handleSendToKitchen = async () => {
    if (!newOrderCart.length || !activeTable.tableId) return;
    try {
      const result = await submitOrder.execute({
        storeId,
        tableId: activeTable.tableId,
        items: newOrderCart.map((i) => ({
          dishId: i.dishId,
          quantity: i.quantity,
          notes: i.notes,
          variantId: (i as any).variantId,
          customizationIds: (i as any).selectedModifiers || [],
        })),
      });
      if (!result) return;
      await refreshTables();
      setNewOrderCart([]);
      setActiveTab("SERVED_ITEMS");
      setMobileStep("CART");
      toast.success("Đã gửi đơn vào bếp");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRequestBill = async () => {
    if (currentRole === "WAITER") {
      try {
        await requestApi(`/tables/${storeId}/service-request`, {
          method: "POST",
          body: JSON.stringify({ tableId: activeTable.tableId, type: "BILL" }),
        });
        toast.success("Đã gửi yêu cầu tính tiền tới thu ngân");
      } catch (e: any) {
        toast.error(e.message);
      }
      return;
    }
    if (activeTable.pendingBillId) {
      if (
        !(await confirmDialog({
          title: "Hủy tạm tính?",
          message: "Chỉ hủy khi khách chưa chuyển khoản. Mã QR cũ sẽ hết hiệu lực và bàn có thể gọi thêm món.",
          confirmText: "Hủy tạm tính",
          variant: "danger",
        }))
      )
        return;
      try {
        await requestApi(`/billing/bills/${activeTable.pendingBillId}/cancel`, { method: "POST", body: "{}" });
        setPaymentBill(null);
        await refreshTables();
        toast.success("Đã hủy tạm tính");
      } catch (error: any) {
        toast.error(error.message);
      }
      return;
    }
    await openBill();
  };

  const handleExecuteTransfer = async () => {
    try {
      await requestApi(`/orders/${storeId}/transfer`, {
        method: "POST",
        body: JSON.stringify({ fromTableId: activeTable.tableId, toTableId: targetTransferTableId, mode: transferMode }),
      });
      await refreshTables();
      setActiveTableId(targetTransferTableId);
      setIsTransferModalOpen(false);
      toast.success("Đã cập nhật bàn");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleOpenSplitBill = () => {
    if (currentRole === "WAITER") {
      toast.info("Thu ngân hoặc chủ quán thực hiện tách bill");
      return;
    }
    setSplitItemCounts({});
    setEqualSplitGuests(activeTable.guestCount || 2);
    setEqualSplitPaid({});
    setActivePersonQr(null);
    setIsSplitBillModalOpen(true);
  };

  const handleExecuteItemizedSplit = async () => {
    const allocation = activeTable.items.flatMap((item, index) =>
      splitItemCounts[index] ? [{ itemId: item.id, quantity: splitItemCounts[index] }] : []
    );
    if (!allocation.length) return toast.error("Vui lòng chọn món cần tách");
    if (await openBill({ allocation })) setIsSplitBillModalOpen(false);
  };

  const handleAddSurcharge = async (name: string, amount: number) => {
    if (amount <= 0 || !name.trim()) return toast.error("Phụ thu không hợp lệ");
    await saveAdjustment({
      ...activeTable.adjustment,
      surchargeAmount: (activeTable.adjustment?.surchargeAmount || 0) + amount,
      discountReason: name,
    });
  };

  const handleRemoveSurcharge = async (_id: string) => {
    await saveAdjustment({ ...activeTable.adjustment, surchargeAmount: 0 });
  };

  const handleApplyDiscount = async () => {
    if (
      await saveAdjustment({
        ...activeTable.adjustment,
        discountPercent: discountType === "PERCENT" ? discountValue : 0,
        fixedDiscount: discountType === "AMOUNT" ? discountValue : 0,
        discountReason,
      })
    )
      setIsSurchargeModalOpen(false);
  };

  const handleRemoveDiscount = async () => {
    await saveAdjustment({ ...activeTable.adjustment, discountPercent: 0, fixedDiscount: 0 });
  };

  const handleOpenOfflineModal = async () => {
    if (currentRole === "WAITER") return toast.info("Thu ngân hoặc chủ quán thực hiện thanh toán");
    await openBill();
  };

  const handleConfirmOfflinePaid = async () => {
    if (!paymentBill || cashGivenAmount < paymentBill.finalAmount - (paymentBill.paidAmount || 0)) {
      return toast.error("Chọn đủ số tiền mặt khách đưa");
    }
    try {
      const result = await cashPayment.execute({ billId: paymentBill.id, method: "CASH", cashTendered: cashGivenAmount });
      if (!result) return;
      setPaymentBill(result.bill);
      await refreshTables();
      setIsOfflineModalOpen(false);
      toast.success("Đã ghi nhận tiền mặt trên máy chủ");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCancelWaitingItem = async (index: number) => {
    const item = activeTable.items[index];
    if (!item?.id) return;
    if (await confirmDialog({ title: "Hủy món?", message: item.name, confirmText: "Hủy món", variant: "danger" })) {
      await cancelOperationalItem(item.id, "Hủy món chưa chế biến");
    }
  };

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

  const handleConfirmVoidCooking = async (reason: string) => {
    if (voidCookingModal.item?.id && (await cancelOperationalItem(voidCookingModal.item.id, reason))) {
      setVoidCookingModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

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

  const handleConfirmRemake = async (reason: string) => {
    try {
      await requestApi(`/orders/${storeId}/remake`, {
        method: "POST",
        body: JSON.stringify({ itemId: servedActionModal.item?.id, reason }),
      });
      await refreshTables();
      setServedActionModal((prev) => ({ ...prev, isOpen: false }));
      toast.success("Đã gửi yêu cầu làm lại");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleConfirmReturn = async (reason: string) => {
    if (servedActionModal.item?.id && (await cancelOperationalItem(servedActionModal.item.id, reason))) {
      setServedActionModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const cartTotalAmount = newOrderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalQuantity = newOrderCart.reduce((sum, item) => sum + item.quantity, 0);

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
        onRemoveServiceRequest={async (idx) => {
          try {
            await requestApi(`/tables/${storeId}/service-requests/${serviceRequests[idx].id}/ack`, { method: "POST" });
            await refreshServices();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        onRejectSession={handleRejectSession}
        onApproveSession={handleApproveSession}
        formatTableName={formatTableName}
      />
    );
  };

  return (
    <div className="h-[calc(100vh-4.25rem)] flex flex-col gap-2.5 animate-fadeIn pb-16 lg:pb-0">
      {/* Mobile 3-step navigation */}
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
          <span>3. Phiếu Bàn</span>
          {totalNotifCount > 0 ? (
            <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center absolute -top-1 -right-1">
              {totalNotifCount}
            </span>
          ) : newOrderCart.length > 0 || activeTable.items.length > 0 ? (
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-2" />
          ) : null}
        </button>
      </div>

      {/* Mobile views */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        {mobileStep === "TABLES" && (
          <StaffOrderTableList
            tables={tables}
            activeTableId={activeTableId}
            setActiveTableId={setActiveTableId}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            pendingRequests={pendingRequests}
            isApprovingId={isApprovingId}
            onApproveSession={handleApproveSession}
            onNavigateTab={onNavigateTab}
            setMobileStep={setMobileStep}
            formatTableName={formatTableName}
          />
        )}
        {mobileStep === "MENU" && (
          <StaffOrderMenuSection
            activeTable={activeTable}
            dishes={dishesList}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            newOrderCart={newOrderCart}
            onQuickAddDish={handleQuickAddDish}
            onOpenCustomize={handleOpenCustomize}
            mobileStep={mobileStep}
            setMobileStep={setMobileStep}
          />
        )}
        {mobileStep === "CART" && (
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {renderNotificationFixedPanel()}
            <StaffOrderCartSection
              activeTable={activeTable}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              newOrderCart={newOrderCart}
              setNewOrderCart={setNewOrderCart}
              cartTotalAmount={cartTotalAmount}
              cartTotalQuantity={cartTotalQuantity}
              foodTotalAmount={foodTotalAmount}
              surchargesTotalAmount={surchargesTotalAmount}
              discountTotalAmount={discountTotalAmount}
              finalPayableAmount={finalPayableAmount}
              isSubmittingOrder={submitOrder.isSubmitting}
              onSendToKitchen={handleSendToKitchen}
              onUpdateCartQuantity={handleUpdateQuantity}
              onCloseTableSession={handleCloseTableSession}
              onRotateTablePin={handleRotateTablePin}
              onOpenManualTableModal={() => {
                setOpenTableGuestCount(2);
                setOpenTableModal({ tableId: activeTable.tableId, tableName: activeTable.tableName });
              }}
              onCancelWaitingItem={handleCancelWaitingItem}
              onOpenVoidCooking={handleOpenVoidCooking}
              onOpenServedAction={handleOpenServedAction}
              onOpenSplitBill={handleOpenSplitBill}
              onOpenTransferTable={() => setIsTransferModalOpen(true)}
              onOpenSurchargeModal={() => setIsSurchargeModalOpen(true)}
              onOpenOfflineModal={handleOpenOfflineModal}
              onRequestBill={handleRequestBill}
              onNavigateTab={onNavigateTab}
              setMobileStep={setMobileStep}
              formatElapsed={formatElapsed}
              currentRole={currentRole}
              isCashier={isCashier}
            />
          </div>
        )}
      </div>

      {/* Desktop 3-column layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-hidden">
        <div className="col-span-3 h-full flex flex-col min-h-0 overflow-hidden">
          <StaffOrderTableList
            tables={tables}
            activeTableId={activeTableId}
            setActiveTableId={setActiveTableId}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            pendingRequests={pendingRequests}
            isApprovingId={isApprovingId}
            onApproveSession={handleApproveSession}
            onNavigateTab={onNavigateTab}
            setMobileStep={setMobileStep}
            formatTableName={formatTableName}
          />
        </div>

        <div className="col-span-5 h-full flex flex-col min-h-0 overflow-hidden">
          <StaffOrderMenuSection
            activeTable={activeTable}
            dishes={dishesList}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            newOrderCart={newOrderCart}
            onQuickAddDish={handleQuickAddDish}
            onOpenCustomize={handleOpenCustomize}
            mobileStep={mobileStep}
            setMobileStep={setMobileStep}
          />
        </div>

        <div className="col-span-4 h-full flex flex-col min-h-0 space-y-2.5 overflow-hidden">
          {renderNotificationFixedPanel()}
          <StaffOrderCartSection
            activeTable={activeTable}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            newOrderCart={newOrderCart}
            setNewOrderCart={setNewOrderCart}
            cartTotalAmount={cartTotalAmount}
            cartTotalQuantity={cartTotalQuantity}
            foodTotalAmount={foodTotalAmount}
            surchargesTotalAmount={surchargesTotalAmount}
            discountTotalAmount={discountTotalAmount}
            finalPayableAmount={finalPayableAmount}
            isSubmittingOrder={submitOrder.isSubmitting}
            onSendToKitchen={handleSendToKitchen}
            onUpdateCartQuantity={handleUpdateQuantity}
            onCloseTableSession={handleCloseTableSession}
            onRotateTablePin={handleRotateTablePin}
            onOpenManualTableModal={() => {
              setOpenTableGuestCount(2);
              setOpenTableModal({ tableId: activeTable.tableId, tableName: activeTable.tableName });
            }}
            onCancelWaitingItem={handleCancelWaitingItem}
            onOpenVoidCooking={handleOpenVoidCooking}
            onOpenServedAction={handleOpenServedAction}
            onOpenSplitBill={handleOpenSplitBill}
            onOpenTransferTable={() => setIsTransferModalOpen(true)}
            onOpenSurchargeModal={() => setIsSurchargeModalOpen(true)}
            onOpenOfflineModal={handleOpenOfflineModal}
            onRequestBill={handleRequestBill}
            onNavigateTab={onNavigateTab}
            setMobileStep={setMobileStep}
            formatElapsed={formatElapsed}
            currentRole={currentRole}
            isCashier={isCashier}
          />
        </div>
      </div>

      {/* Floating mobile cart bar */}
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

      {/* All Modals */}
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
        storeId={storeId}
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
        bill={paymentBill}
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
