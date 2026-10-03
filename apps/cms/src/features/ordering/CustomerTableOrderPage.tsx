import React, { useState, useEffect, useMemo } from "react";
import { Icon, Portal } from "@/components/ui";
import { IconName } from "@/types/icon.types";
import { toast } from "@/stores/notificationStore";
import { tableApi } from "@/services/api/tableApi";
import { orderApi } from "@/services/api/orderApi";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";
import { SocketEvents } from "@a2order/shared";
import { sound } from "@/lib/sound";

import {
  CustomerMenuItem,
  CustomerCategory,
  CustomerCartItem,
  CustomerOrderedItem,
  CustomerVoucher,
} from "@/types";
import {
  CustomerPinModal,
  CustomerOrderConfirmModal,
  CustomerServiceRequestModal,
  CustomerTableWelcome,
  CustomerWaitingApproval,
  CustomerMenuTab,
  CustomerOrderedTab,
  CustomerOffersTab,
  CustomerSessionClosed,
  CustomerFloatingCartBar,
  CustomerBottomNav,
  CustomerServiceOption,
  SAMPLE_VOUCHERS,
} from "./components";

export type { CustomerOrderedItem } from "@/types";

export const CustomerTableOrderPage: React.FC = () => {
  // 1. Phân tích tham số URL: ?store=store-bubble-tea&table=TB-01
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const storeId = searchParams.get("store") || "";
  const tableCode = searchParams.get("table") || "";

  // Kiểm tra URL có hợp lệ không (phải có cả store và table)
  const isInvalidUrl = !storeId || !tableCode;

  // Data states
  const [loading, setLoading] = useState(!isInvalidUrl);
  const [tableInfo, setTableInfo] = useState<{
    id: string;
    name: string;
    code: string;
    zoneName: string;
    status: string;
    currentSessionId?: string | null;
  } | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ id: string; name: string; address?: string } | null>(null);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<"MENU" | "ORDERED" | "OFFERS">("MENU");

  // Session & Security states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [guestCount, setGuestCount] = useState(2);

  // Live session timer — lưu thời điểm mở bàn để hiển thị "Đã mở: 23 phút"
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(sessionStorage.getItem(`session_started_${storeId}_${tableCode}`) || 0);
  });
  const [sessionElapsedLabel, setSessionElapsedLabel] = useState("");

  useEffect(() => {
    if (!isSessionActive || !sessionStartedAt) { setSessionElapsedLabel(""); return; }
    const calc = () => {
      const mins = Math.floor((Date.now() - sessionStartedAt) / 60000);
      if (mins < 1) setSessionElapsedLabel("vừa mở");
      else if (mins < 60) setSessionElapsedLabel(`${mins} phút`);
      else {
        const h = Math.floor(mins / 60), m = mins % 60;
        setSessionElapsedLabel(m > 0 ? `${h}g ${m}p` : `${h} giờ`);
      }
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartedAt]);



  // PIN unlock states & Brute-force Lockout
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [failedPinAttempts, setFailedPinAttempts] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(sessionStorage.getItem(`failed_pin_${storeId}_${tableCode}`) || 0);
  });

  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const lockUntil = Number(sessionStorage.getItem(`lockout_until_${storeId}_${tableCode}`) || 0);
    const diff = Math.ceil((lockUntil - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  // Countdown timer cho Lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem(`lockout_until_${storeId}_${tableCode}`);
          sessionStorage.removeItem(`failed_pin_${storeId}_${tableCode}`);
          setFailedPinAttempts(0);
          setPinError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining, storeId, tableCode]);

  // Ordering & Cart states
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order Confirmation Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Ordered items history of this session
  const [orderedItems, setOrderedItems] = useState<CustomerOrderedItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`a2order_ordered_${storeId}_${tableCode}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync ordered items to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`a2order_ordered_${storeId}_${tableCode}`, JSON.stringify(orderedItems));
    }
  }, [orderedItems, storeId, tableCode]);

  // Voucher & Loyalty states
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<CustomerVoucher | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("a2order_customer_phone") || "";
  });
  const [isPhoneSaved, setIsPhoneSaved] = useState(Boolean(customerPhone));

  // Quick Service Request modal states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceNote, setServiceNote] = useState("");
  const [isSendingService, setIsSendingService] = useState(false);
  const [isBillRequested, setIsBillRequested] = useState(false);

  // Tải dữ liệu ban đầu từ Server
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const res = await tableApi.checkTableSession(storeId, tableCode);
      const payload = res && (res as any).data !== undefined ? (res as any).data : res;
      if (payload && payload.table) {
        setTableInfo(payload.table);
        setStoreInfo(payload.store);
        setCategories(payload.categories || []);
        setIsSessionActive(Boolean(payload.isSessionActive));
        setIsPendingApproval(Boolean(payload.isPendingApproval));

        // Tải các món đang phục vụ tại bàn từ máy chủ (Đồng bộ đa thiết bị & sau khi F5)
        try {
          const ordRes = await orderApi.getTableOrders(storeId, payload.table.id, tableCode);
          if (ordRes && Array.isArray(ordRes.items) && ordRes.items.length > 0) {
            setOrderedItems(ordRes.items as CustomerOrderedItem[]);
          }
        } catch (e) {
          console.warn("Lỗi tải món đang phục vụ:", e);
        }
      }
    } catch (err: any) {
      console.warn("Lỗi kiểm tra phiên bàn:", err);
      toast.error("Không thể kết nối đến máy chủ quán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();

    // 2. Kết nối WebSocket thời gian thực theo Store Room
    joinStoreRoom(storeId);
    const socket = getSocketClient();

    const isMatchingTable = (data: any) => {
      if (!data) return false;
      if (data.storeId && storeId && data.storeId !== storeId) return false;
      if (tableInfo?.id && data.tableId && data.tableId === tableInfo.id) return true;
      if (
        data.tableCode &&
        tableCode &&
        String(data.tableCode).trim().toUpperCase() === String(tableCode).trim().toUpperCase()
      )
        return true;
      return false;
    };

    // Nhân viên duyệt mở bàn
    const handleSessionApproved = (data: any) => {
      if (isMatchingTable(data)) {
        const now = Date.now();
        setIsSessionActive(true);
        setIsPendingApproval(false);
        setIsClosed(false);
        setShowPinModal(false);
        setSessionStartedAt(now);
        sessionStorage.setItem(`session_started_${storeId}_${tableCode}`, String(now));
        sound.playKitchenChime();
        toast.success(`Nhân viên đã duyệt mở ${data.tableName || "bàn"}! Quý khách có thể bắt đầu gọi món.`);
      }
    };

    // Nhân viên từ chối mở bàn
    const handleSessionRejected = (data: any) => {
      if (isMatchingTable(data)) {
        setIsPendingApproval(false);
        setIsSessionActive(false);
        toast.warning(data.reason || "Yêu cầu mở bàn chưa được nhân viên chấp thuận.");
      }
    };

    // Đóng phiên bàn (thanh toán xong / thu hồi phiên)
    const handleSessionClosed = (data: any) => {
      if (isMatchingTable(data)) {
        setIsSessionActive(false);
        setIsPendingApproval(false);
        setIsClosed(true);
        setCart([]);
        setOrderedItems([]);
        setSessionStartedAt(0);
        sessionStorage.removeItem(`session_started_${storeId}_${tableCode}`);
        localStorage.removeItem(`a2order_ordered_${storeId}_${tableCode}`);
        sound.playAlertTone();
        toast.info("Phiên gọi món của bàn đã được nhân viên hoàn tất và đóng bàn.");
      }
    };

    // Nhân viên quán DUYỆT ĐƠN VÀO BẾP!
    const handleOrderApproved = (data: any) => {
      if (isMatchingTable(data)) {
        sound.playKitchenChime();
        setOrderedItems((prev) =>
          prev.map((it) => (it.status === "PENDING_APPROVAL" ? { ...it, status: "COOKING" } : it))
        );
        toast.success("Quán đã duyệt đơn của bạn! Bếp đang tiến hành chế biến.");
      }
    };

    // Nhân viên quán TỪ CHỐI ĐƠN
    const handleOrderRejected = (data: any) => {
      if (isMatchingTable(data)) {
        setOrderedItems((prev) =>
          prev.map((it) => (it.status === "PENDING_APPROVAL" ? { ...it, status: "CANCELLED" } : it))
        );
        toast.warning(data.reason || "Đơn hàng của bàn bị từ chối phục vụ.");
      }
    };

    // Món bị hủy (từ khách hoặc nhân viên)
    const handleOrderItemCancelled = (data: any) => {
      if (isMatchingTable(data)) {
        setOrderedItems((prev) =>
          prev.map((it) =>
            it.id === data.itemId || it.name === data.dishName ? { ...it, status: "CANCELLED" } : it
          )
        );
      }
    };

    // Bếp hoặc POS cập nhật trạng thái món (COOKING -> SERVED)
    const handleOrderItemStatusChanged = (data: any) => {
      if (isMatchingTable(data)) {
        setOrderedItems((prev) =>
          prev.map((it) => {
            if (it.id === data.itemId || it.name === data.dishName) {
              return { ...it, status: data.status };
            }
            return it;
          })
        );
        if (data.status === "SERVED") {
          sound.playKitchenChime();
          toast.success(`Món "${data.dishName || "của bạn"}" đã được phục vụ lên bàn! Chúc bạn ngon miệng.`);
        }
      }
    };

    // Đã nhận yêu cầu tính tiền
    const handleBillRequested = (data: any) => {
      if (isMatchingTable(data)) {
        setIsBillRequested(true);
        toast.info("Nhân viên quầy đã nhận thông báo tính tiền và đang chuẩn bị hóa đơn.");
      }
    };

    // Xác nhận đã thanh toán
    const handlePaymentConfirmed = (data: any) => {
      if (isMatchingTable(data)) {
        sound.playPaymentChime();
        setIsClosed(true);
        setIsSessionActive(false);
        toast.success("Quán đã xác nhận thanh toán thành công! Cảm ơn quý khách.");
      }
    };

    socket.on(SocketEvents.SESSION_APPROVED, handleSessionApproved);
    socket.on(SocketEvents.SESSION_REJECTED, handleSessionRejected);
    socket.on(SocketEvents.SESSION_CLOSED, handleSessionClosed);
    socket.on(SocketEvents.ORDER_APPROVED, handleOrderApproved);
    socket.on(SocketEvents.ORDER_REJECTED, handleOrderRejected);
    socket.on(SocketEvents.ORDER_ITEM_CANCELLED, handleOrderItemCancelled);
    socket.on(SocketEvents.ORDER_ITEM_STATUS_CHANGED, handleOrderItemStatusChanged);
    socket.on(SocketEvents.BILL_REQUESTED, handleBillRequested);
    socket.on(SocketEvents.PAYMENT_CONFIRMED, handlePaymentConfirmed);

    return () => {
      socket.off(SocketEvents.SESSION_APPROVED, handleSessionApproved);
      socket.off(SocketEvents.SESSION_REJECTED, handleSessionRejected);
      socket.off(SocketEvents.SESSION_CLOSED, handleSessionClosed);
      socket.off(SocketEvents.ORDER_APPROVED, handleOrderApproved);
      socket.off(SocketEvents.ORDER_REJECTED, handleOrderRejected);
      socket.off(SocketEvents.ORDER_ITEM_CANCELLED, handleOrderItemCancelled);
      socket.off(SocketEvents.ORDER_ITEM_STATUS_CHANGED, handleOrderItemStatusChanged);
      socket.off(SocketEvents.BILL_REQUESTED, handleBillRequested);
      socket.off(SocketEvents.PAYMENT_CONFIRMED, handlePaymentConfirmed);
    };
  }, [storeId, tableCode, tableInfo?.id]);

  // Hành động khách bấm "Yêu Cầu Mở Bàn"
  const handleRequestSession = async () => {
    try {
      setIsPendingApproval(true);
      const res = await tableApi.requestTableSession(storeId, {
        tableId: tableInfo?.id,
        tableCode,
        guestCount,
      });

      if (res && res.isSessionActive) {
        setIsSessionActive(true);
        setIsPendingApproval(false);
        toast.success("Bàn đã sẵn sàng! Chúc quý khách dùng bữa ngon miệng.");
      } else {
        toast.success("Đã gửi yêu cầu mở bàn tới quầy nhân viên!");
      }
    } catch (err: any) {
      setIsPendingApproval(false);
      toast.error(err.message || "Không thể gửi yêu cầu. Vui lòng gọi trực tiếp nhân viên.");
    }
  };

  // Khách tự mở bàn bằng mã PIN bảo mật (Kèm chống brute-force)
  const handleUnlockWithPin = async (e?: React.FormEvent, customPin?: string) => {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0) {
      toast.warning(`Bạn đang bị tạm khóa. Vui lòng đợi ${lockoutRemaining}s!`);
      return;
    }

    const pin = (customPin !== undefined ? customPin : pinInput).trim();
    if (!pin) {
      setPinError("Vui lòng nhập mã PIN 4 chữ số");
      return;
    }
    setIsSubmittingPin(true);
    setPinError(null);

    try {
      const res = await tableApi.unlockWithPin(storeId, {
        tableId: tableInfo?.id,
        tableCode,
        pin,
        guestCount,
      });

      if (res && (res.success || res.sessionId || res.tableId || res.unlockedVia)) {
        const now = Date.now();
        setIsSessionActive(true);
        setIsPendingApproval(false);
        setShowPinModal(false);
        setPinInput("");
        setFailedPinAttempts(0);
        setSessionStartedAt(now);
        sessionStorage.removeItem(`failed_pin_${storeId}_${tableCode}`);
        sessionStorage.setItem(`session_started_${storeId}_${tableCode}`, String(now));
        sound.playPaymentChime();
        toast.success("Mở bàn thành công! Chúc quý khách dùng bữa ngon miệng.");
      }
    } catch (err: any) {
      setFailedPinAttempts((prev) => {
        const nextCount = prev + 1;
        sessionStorage.setItem(`failed_pin_${storeId}_${tableCode}`, String(nextCount));

        if (nextCount >= 10) {
          const lockUntil = Date.now() + 30000;
          sessionStorage.setItem(`lockout_until_${storeId}_${tableCode}`, String(lockUntil));
          setLockoutRemaining(30);
          setPinError("Nhập sai quá 10 lần! Hệ thống tạm khóa 30 giây để bảo vệ bảo mật bàn.");
          toast.error("Nhập sai quá 10 lần! Tạm khóa 30 giây.");
        } else {
          const remaining = 10 - nextCount;
          setPinError(`Mã PIN không đúng. Bạn còn ${remaining} lần thử trước khi bị tạm khóa 30s.`);
        }
        return nextCount;
      });
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Cart Helpers
  const addToCart = (item: CustomerMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    toast.success(`Đã thêm ${item.name}`);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const next = c.quantity + delta;
            return next > 0 ? { ...c, quantity: next } : null;
          }
          return c;
        })
        .filter(Boolean) as CustomerCartItem[]
    );
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartRawAmount = cart.reduce((sum, i) => sum + i.quantity * i.menuItem.price, 0);

  // Tính giảm giá Voucher
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.minOrder && totalCartRawAmount < appliedVoucher.minOrder) return 0;
    if (appliedVoucher.discountType === "PERCENT") {
      return Math.round((totalCartRawAmount * appliedVoucher.value) / 100);
    }
    return Math.min(totalCartRawAmount, appliedVoucher.value);
  }, [appliedVoucher, totalCartRawAmount]);

  const finalCartTotal = Math.max(0, totalCartRawAmount - voucherDiscount);

  // Áp dụng voucher
  const handleApplyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    if (!code) {
      toast.warning("Vui lòng nhập mã voucher!");
      return;
    }
    const found = SAMPLE_VOUCHERS.find((v) => v.code === code);
    if (!found) {
      toast.error(`Mã voucher "${code}" không hợp lệ hoặc đã hết hạn.`);
      return;
    }
    if (found.minOrder && totalCartRawAmount > 0 && totalCartRawAmount < found.minOrder) {
      toast.warning(`Voucher này áp dụng cho đơn từ ${found.minOrder.toLocaleString("vi-VN")} đ.`);
      return;
    }
    setAppliedVoucher(found);
    setVoucherInput("");
    toast.success(`Đã áp dụng voucher: ${found.code} (${found.description})`);
  };

  // Lưu số điện thoại tích điểm
  const handleSavePhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customerPhone.trim().replace(/[^0-9]/g, "");
    if (!clean || clean.length < 10) {
      toast.warning("Vui lòng nhập số điện thoại hợp lệ (10 số) để tích điểm!");
      return;
    }
    localStorage.setItem("a2order_customer_phone", clean);
    setCustomerPhone(clean);
    setIsPhoneSaved(true);
    toast.success(`Đã lưu SĐT ${clean}! Hệ thống sẽ tự động tích điểm cho mỗi đơn.`);
  };

  // Gửi yêu cầu tính tiền tại bàn
  const handleRequestBill = async () => {
    try {
      setIsSendingService(true);
      await tableApi.sendServiceRequest(storeId, {
        tableId: tableInfo?.id,
        tableCode,
        tableName: tableInfo?.name,
        type: "Yêu cầu tính tiền",
        note: "Khách gọi tính tiền tại bàn",
      });

      try {
        const socket = getSocketClient();
        socket.emit(SocketEvents.BILL_REQUESTED, {
          storeId,
          tableId: tableInfo?.id,
          tableCode,
          tableName: tableInfo?.name,
        });
      } catch (e) {
        console.warn("Lỗi emit BILL_REQUESTED:", e);
      }

      sound.playAlertTone();
      setIsBillRequested(true);
      setShowServiceModal(false);
      toast.success("Đã gửi yêu cầu tính tiền! Nhân viên quầy sẽ mang hóa đơn tới bàn ngay.");
    } catch (err: any) {
      toast.error("Không thể gửi yêu cầu tính tiền lúc này: " + (err.message || "Lỗi mạng"));
    } finally {
      setIsSendingService(false);
    }
  };

  // Gửi yêu cầu hỗ trợ nhanh (đá, giấy, dọn bàn...)
  const handleSendService = async (service: CustomerServiceOption) => {
    if (service.id === "bill") {
      return handleRequestBill();
    }

    try {
      setIsSendingService(true);
      await tableApi.sendServiceRequest(storeId, {
        tableId: tableInfo?.id,
        tableCode,
        tableName: tableInfo?.name,
        type: service.label,
        note: serviceNote.trim() || undefined,
      });

      try {
        const socket = getSocketClient();
        socket.emit(SocketEvents.SERVICE_REQUESTED, {
          storeId,
          tableId: tableInfo?.id,
          tableCode,
          tableName: tableInfo?.name,
          type: service.label,
          note: serviceNote.trim() || undefined,
        });
      } catch (e) {
        console.warn("Lỗi emit SERVICE_REQUESTED:", e);
      }

      sound.playAlertTone();
      setShowServiceModal(false);
      setServiceNote("");
      toast.success(`Đã gửi yêu cầu "${service.label}". Nhân viên sẽ đến ngay!`);
    } catch (err: any) {
      toast.error("Không thể gửi yêu cầu lúc này: " + (err.message || "Lỗi mạng"));
    } finally {
      setIsSendingService(false);
    }
  };

  // Khách bấm Hủy Món khi chưa chế biến (PENDING_APPROVAL)
  const handleCancelOrderItem = async (item: CustomerOrderedItem) => {
    if (item.status !== "PENDING_APPROVAL") {
      toast.warning("Bếp đã bắt đầu chế biến món này, không thể hủy. Vui lòng liên hệ nhân viên!");
      return;
    }

    try {
      await tableApi.cancelOrderItem(storeId, {
        orderId: item.orderId,
        itemId: item.id,
        tableId: tableInfo?.id || "",
      });

      setOrderedItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "CANCELLED" as const } : it))
      );
      toast.success(`Đã hủy món ${item.name}`);
    } catch (err: any) {
      toast.error(err.message || "Không thể hủy món vào lúc này");
    }
  };

  // Gửi Đơn Hàng vào POS quán (Chờ quán duyệt trước khi vào bếp)
  const handleConfirmAndSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmittingOrder(true);

    try {
      const formattedItems = cart.map((c, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        dishId: c.menuItem.id,
        name: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
        category: (c.menuItem as any).categoryName || "Món gọi",
        notes: c.notes || orderNotes || "",
      }));

      const res = await orderApi.submitOrder({
        storeId,
        tableId: tableInfo?.id || "",
        tableCode: tableInfo?.code || tableCode,
        tableName: tableInfo?.name || "Bàn",
        items: formattedItems,
        voucherCode: appliedVoucher?.code,
        discountAmount: voucherDiscount,
        customerPhone: customerPhone.trim() || undefined,
        totalAmount: totalCartRawAmount,
        notes: orderNotes.trim() || undefined,
      });

      const orderId = (res as any)?.orderId || (res as any)?.data?.orderId || `ord-${Date.now()}`;
      const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      const newOrderedItems: CustomerOrderedItem[] = formattedItems.map((f) => ({
        id: f.id,
        dishId: f.dishId,
        name: f.name,
        price: f.price,
        quantity: f.quantity,
        status: "PENDING_APPROVAL",
        orderId,
        orderedAt: timeNow,
        notes: f.notes,
      }));

      setOrderedItems((prev) => [...newOrderedItems, ...prev]);
      setCart([]);
      setShowConfirmModal(false);
      setIsCartOpen(false);
      setOrderNotes("");
      setActiveTab("ORDERED");

      sound.playKitchenChime();
      toast.info("Đã gửi đơn! Quán đang kiểm tra và duyệt đơn vào bếp ⏳");
    } catch (err: any) {
      toast.error("Lỗi khi gửi đơn: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Filter menu items
  const allDishes = (categories || []).flatMap((cat) =>
    (cat.menuItems || []).map((m) => ({ ...m, categoryName: cat.name }))
  );
  const filteredDishes = allDishes.filter((dish) => {
    const matchesCat =
      selectedCategory === "ALL" ||
      (categories.find((c) => c.id === selectedCategory)?.menuItems || []).some((m: CustomerMenuItem) => m.id === dish.id);
    const matchesSearch = !searchQuery || dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });


  // Màn hình lỗi URL không hợp lệ (thiếu ?store= hoặc ?table=)
  if (isInvalidUrl) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-900 text-rose-300 flex items-center justify-center mb-4">
          <Icon name="alert" size={32} />
        </div>
        <h1 className="text-lg font-black text-white mb-2">Link Không Hợp Lệ</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
          Đường dẫn này không chứa thông tin bàn hoặc cửa hàng. Vui lòng quét lại mã QR trên thẻ bàn.
        </p>
        <div className="mt-5 px-4 py-3 bg-slate-800 rounded-2xl text-xs text-slate-400 font-mono max-w-xs text-left break-all">
          <span className="text-slate-500">URL cần có dạng:</span><br />
          <span className="text-emerald-400">/order?store=ID_QUAN&table=MA_BAN</span>
        </div>
        <p className="mt-4 text-xs text-slate-600 font-bold">A2Order • Hệ thống gọi món thông minh</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Đang kiểm tra bảo mật bàn...</p>
        <span className="text-xs text-slate-500 mt-1">A2Order Session Protection</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col font-sans select-none antialiased">
      {/* 1. Header Quán & Bàn */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
              A2
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-extrabold text-gray-900 truncate leading-tight">
                {storeInfo?.name || "Tiệm Trà Sữa A2Order"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {tableInfo?.name || "Bàn"} · {tableInfo?.code || tableCode}
                </span>
                <span className="text-[10px] text-gray-400 truncate">{tableInfo?.zoneName || ""}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSessionActive ? (
              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm active:scale-95 transition"
              >
                <Icon name="bell" size={13} />
                <span>Hỗ Trợ</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">
                <Icon name="lock" size={10} />
                Đang khóa
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-3 py-4 flex flex-col justify-start">
        {/* TRƯỜNG HỢP 1: BÀN CHƯA MỞ PHIÊN */}
        {!isSessionActive && !isPendingApproval && !isClosed && (
          <CustomerTableWelcome
            tableName={tableInfo?.name}
            zoneName={tableInfo?.zoneName}
            guestCount={guestCount}
            onSelectGuestCount={setGuestCount}
            onRequestSession={handleRequestSession}
            onOpenPinModal={() => {
              setPinError(null);
              setPinInput("");
              setShowPinModal(true);
            }}
          />
        )}

        {/* TRƯỜNG HỢP 2: ĐANG CHỜ NHÂN VIÊN DUYỆT */}
        {isPendingApproval && !isSessionActive && (
          <CustomerWaitingApproval
            tableName={tableInfo?.name}
            onOpenPinModal={() => {
              setPinError(null);
              setPinInput("");
              setShowPinModal(true);
            }}
            onCancelRequest={() => setIsPendingApproval(false)}
          />
        )}

        {/* TRƯỜNG HỢP 3: PHIÊN BÀN ĐÃ ĐƯỢC DUYỆT (ACTIVE MENU & ORDERING & TABS) */}
        {isSessionActive && (
          <div className="space-y-3 pb-28 animate-fadeIn">
            {/* Banner trạng thái phiên đang hoạt động */}
            <div className="p-3.5 bg-brand-900 text-white rounded-3xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-brand-200">
                  <Icon name="table" size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-brand-100">
                      {tableInfo?.name || "Bàn Phục Vụ"}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-200/90 font-medium">
                    {tableInfo?.zoneName || "Khu vực chính"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black bg-white/20 px-2.5 py-1 rounded-xl text-white inline-block">
                  {tableInfo?.code || tableCode}
                </span>
                {sessionElapsedLabel && (
                  <p className="text-[10px] font-bold text-amber-300 mt-1">
                    ⏱ {sessionElapsedLabel}
                  </p>
                )}
              </div>
            </div>

            {/* TAB 1: THỰC ĐƠN (MENU) */}
            {activeTab === "MENU" && (
              <CustomerMenuTab
                searchQuery={searchQuery}
                onChangeSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categories={categories}
                allDishesCount={allDishes.length}
                filteredDishes={filteredDishes}
                cart={cart}
                onAddToCart={addToCart}
                onUpdateCartQty={updateCartQty}
              />
            )}

            {/* TAB 2: ĐỒ ĐÃ ĐẶT */}
            {activeTab === "ORDERED" && (
              <CustomerOrderedTab
                orderedItems={orderedItems}
                isBillRequested={isBillRequested}
                onNavigateToMenu={() => setActiveTab("MENU")}
                onCancelOrderItem={handleCancelOrderItem}
                onRequestBill={handleRequestBill}
              />
            )}

            {/* TAB 3: ƯU ĐÃI & TÍCH ĐIỂM */}
            {activeTab === "OFFERS" && (
              <CustomerOffersTab
                voucherInput={voucherInput}
                onChangeVoucherInput={setVoucherInput}
                appliedVoucher={appliedVoucher}
                onApplyVoucher={handleApplyVoucher}
                onRemoveVoucher={() => {
                  setAppliedVoucher(null);
                  toast.info("Đã bỏ áp dụng voucher");
                }}
                customerPhone={customerPhone}
                onChangeCustomerPhone={(phone: string) => {
                  setCustomerPhone(phone);
                  setIsPhoneSaved(false);
                }}
                isPhoneSaved={isPhoneSaved}
                onSavePhone={handleSavePhone}
                orderedItems={orderedItems}
              />
            )}
          </div>
        )}

        {/* TRƯỜNG HỢP 4: PHIÊN BÀN ĐÃ ĐÓNG */}
        {isClosed && (
          <CustomerSessionClosed
            storeName={storeInfo?.name}
            tableName={tableInfo?.name}
            tableCode={tableCode}
            onRestartSession={() => {
              setIsClosed(false);
              setIsPendingApproval(false);
              setIsSessionActive(false);
              fetchSessionData();
            }}
          />
        )}
      </main>

      {/* Floating Sticky Cart Bar */}
      {isSessionActive && totalCartCount > 0 && activeTab === "MENU" && (
        <CustomerFloatingCartBar
          totalCartCount={totalCartCount}
          finalCartTotal={finalCartTotal}
          totalCartRawAmount={totalCartRawAmount}
          voucherDiscount={voucherDiscount}
          onOpenConfirmModal={() => setShowConfirmModal(true)}
        />
      )}

      {/* Bottom Navigation */}
      {isSessionActive && (
        <CustomerBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          totalCartCount={totalCartCount}
          orderedItems={orderedItems}
          appliedVoucher={appliedVoucher}
        />
      )}

      {/* MODALS */}
      <CustomerPinModal
        isOpen={showPinModal}
        tableName={tableInfo?.name}
        tableCode={tableCode}
        pinInput={pinInput}
        onChangePinInput={setPinInput}
        pinError={pinError}
        lockoutRemaining={lockoutRemaining}
        isSubmittingPin={isSubmittingPin}
        onClose={() => setShowPinModal(false)}
        onSubmit={handleUnlockWithPin}
      />

      <CustomerOrderConfirmModal
        isOpen={showConfirmModal}
        tableName={tableInfo?.name}
        totalCartCount={totalCartCount}
        cart={cart}
        orderNotes={orderNotes}
        onChangeOrderNotes={setOrderNotes}
        totalCartRawAmount={totalCartRawAmount}
        voucherDiscount={voucherDiscount}
        appliedVoucher={appliedVoucher}
        customerPhone={customerPhone}
        finalCartTotal={finalCartTotal}
        isSubmittingOrder={isSubmittingOrder}
        onClose={() => setShowConfirmModal(false)}
        onConfirmAndSubmit={handleConfirmAndSubmitOrder}
      />

      <CustomerServiceRequestModal
        isOpen={showServiceModal}
        serviceNote={serviceNote}
        onChangeServiceNote={setServiceNote}
        isSendingService={isSendingService}
        onSendService={handleSendService}
        onClose={() => setShowServiceModal(false)}
      />
    </div>
  );
};
