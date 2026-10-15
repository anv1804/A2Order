import React, { useState, useEffect, useMemo } from "react";
import { Icon, Portal } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { tableApi } from "@/services/api/tableApi";
import { orderApi } from "@/services/api/orderApi";
import { getSocketClient, joinStoreRoom } from "@/lib/socket";
import { SocketEvents } from "@a2order/shared";
import { sound } from "@/lib/sound";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface CustomerOrderedItem {
  id: string;
  dishId?: string;
  name: string;
  price: number;
  quantity: number;
  status: "PENDING_APPROVAL" | "COOKING" | "SERVED" | "CANCELLED";
  orderId?: string;
  orderedAt: string;
  notes?: string;
}

interface Voucher {
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  description: string;
  minOrder?: number;
}

const SAMPLE_VOUCHERS: Voucher[] = [
  { code: "A2GIAM10", discountType: "PERCENT", value: 10, description: "Giảm 10% tổng hóa đơn gọi món" },
  { code: "A2GIAM20K", discountType: "FIXED", value: 20000, description: "Giảm trực tiếp 20.000 đ cho đơn từ 80k", minOrder: 80000 },
  { code: "VIP15", discountType: "PERCENT", value: 15, description: "Ưu đãi 15% cho thành viên thân thiết" },
  { code: "FREESHIP", discountType: "FIXED", value: 15000, description: "Tặng voucher 15.000 đ trải nghiệm tại bàn" },
];

const SERVICE_OPTIONS = [
  { id: "ice", emoji: "🧊", label: "Thêm đá lạnh", desc: "Đem thêm xô hoặc ly đá" },
  { id: "napkin", emoji: "🧻", label: "Thêm khăn giấy", desc: "Bổ sung hộp khăn giấy" },
  { id: "clean", emoji: "🧹", label: "Dọn dẹp bàn", desc: "Thu dọn vỏ chai, đĩa dư" },
  { id: "utensils", emoji: "🥢", label: "Thêm chén đũa", desc: "Thêm bát đĩa, muỗng đũa" },
  { id: "waiter", emoji: "🙋", label: "Gọi nhân viên", desc: "Nhân viên tới bàn hỗ trợ" },
  { id: "bill", emoji: "💳", label: "Yêu cầu tính tiền", desc: "In hóa đơn thanh toán" },
];

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
  const [categories, setCategories] = useState<Category[]>([]);

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
  const [cart, setCart] = useState<CartItem[]>([]);
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
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("a2order_customer_phone") || "";
  });
  const [isPhoneSaved, setIsPhoneSaved] = useState(Boolean(customerPhone));

  // Quick Service Request modal states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceNote, setServiceNote] = useState("");
  const [isSendingService, setIsSendingService] = useState(false);

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

    // Nhân viên duyệt mở bàn
    const handleSessionApproved = (data: any) => {
      if (data.storeId === storeId && (data.tableId === tableInfo?.id || data.tableCode === tableCode)) {
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
      if (data.storeId === storeId && data.tableId === tableInfo?.id) {
        setIsPendingApproval(false);
        setIsSessionActive(false);
        toast.warning(data.reason || "Yêu cầu mở bàn chưa được nhân viên chấp thuận.");
      }
    };

    // Đóng phiên bàn (thanh toán xong / thu hồi phiên)
    const handleSessionClosed = (data: any) => {
      if (data.storeId === storeId && data.tableId === tableInfo?.id) {
        setIsSessionActive(false);
        setIsPendingApproval(false);
        setIsClosed(true);
        setCart([]);
        setOrderedItems([]);
        setSessionStartedAt(0);
        sessionStorage.removeItem(`session_started_${storeId}_${tableCode}`);
        localStorage.removeItem(`a2order_ordered_${storeId}_${tableCode}`);
        toast.info("Phiên gọi món của bàn đã được nhân viên hoàn tất và đóng bàn.");
      }
    };

    // Nhân viên quán DUYỆT ĐƠN VÀO BẾP!
    const handleOrderApproved = (data: any) => {
      const matchTable =
        !data.tableCode ||
        data.tableCode === tableCode ||
        (tableInfo?.id && data.tableId === tableInfo.id);
      if (data.storeId === storeId && matchTable) {
        sound.playKitchenChime();
        setOrderedItems((prev) =>
          prev.map((it) => (it.status === "PENDING_APPROVAL" ? { ...it, status: "COOKING" } : it))
        );
        toast.success("🍳 Quán đã duyệt đơn của bạn! Bếp đang tiến hành chế biến.");
      }
    };

    // Nhân viên quán TỪ CHỐI ĐƠN
    const handleOrderRejected = (data: any) => {
      if (data.storeId === storeId && (data.tableId === tableInfo?.id || data.tableCode === tableCode)) {
        setOrderedItems((prev) =>
          prev.map((it) => (it.status === "PENDING_APPROVAL" ? { ...it, status: "CANCELLED" } : it))
        );
        toast.warning(data.reason || "Đơn hàng của bàn bị từ chối phục vụ.");
      }
    };

    // Món bị hủy (từ khách hoặc nhân viên)
    const handleOrderItemCancelled = (data: any) => {
      if (data.storeId === storeId && (data.tableId === tableInfo?.id || data.tableCode === tableCode)) {
        setOrderedItems((prev) =>
          prev.map((it) => (it.id === data.itemId ? { ...it, status: "CANCELLED" } : it))
        );
      }
    };

    socket.on(SocketEvents.SESSION_APPROVED, handleSessionApproved);
    socket.on(SocketEvents.SESSION_REJECTED, handleSessionRejected);
    socket.on(SocketEvents.SESSION_CLOSED, handleSessionClosed);
    socket.on(SocketEvents.ORDER_APPROVED, handleOrderApproved);
    socket.on(SocketEvents.ORDER_REJECTED, handleOrderRejected);
    socket.on(SocketEvents.ORDER_ITEM_CANCELLED, handleOrderItemCancelled);

    return () => {
      socket.off(SocketEvents.SESSION_APPROVED, handleSessionApproved);
      socket.off(SocketEvents.SESSION_REJECTED, handleSessionRejected);
      socket.off(SocketEvents.SESSION_CLOSED, handleSessionClosed);
      socket.off(SocketEvents.ORDER_APPROVED, handleOrderApproved);
      socket.off(SocketEvents.ORDER_REJECTED, handleOrderRejected);
      socket.off(SocketEvents.ORDER_ITEM_CANCELLED, handleOrderItemCancelled);
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
          toast.error("🔒 Nhập sai quá 10 lần! Tạm khóa 30 giây.");
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
  const addToCart = (item: MenuItem) => {
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
        .filter(Boolean) as CartItem[]
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

  // Gửi yêu cầu hỗ trợ nhanh (đá, giấy, dọn bàn...)
  const handleSendService = async (service: (typeof SERVICE_OPTIONS)[0]) => {
    try {
      setIsSendingService(true);
      await tableApi.sendServiceRequest(storeId, {
        tableId: tableInfo?.id,
        tableCode,
        tableName: tableInfo?.name,
        type: service.label,
        note: serviceNote.trim() || undefined,
      });
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
      (categories.find((c) => c.id === selectedCategory)?.menuItems || []).some((m) => m.id === dish.id);
    const matchesSearch = !searchQuery || dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });


  // Màn hình lỗi URL không hợp lệ (thiếu ?store= hoặc ?table=)
  if (isInvalidUrl) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-900 text-rose-300 flex items-center justify-center text-3xl mb-4">
          ⚠️
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
                <span>⚡</span>
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
          <div className="animate-fadeIn space-y-4">
            {/* Hero card */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 text-center shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px"}} />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icon name="vietqr" size={32} />
                </div>
                <h2 className="text-xl font-black mb-1.5">
                  Chào mừng quý khách!
                </h2>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  {tableInfo?.name || "Bàn ăn"} · {tableInfo?.zoneName || ""}
                </p>
                <p className="text-emerald-200/80 text-xs mt-2 leading-relaxed">
                  Để bắt đầu gọi món, vui lòng yêu cầu nhân viên mở bàn hoặc nhập mã PIN trên thẻ bàn.
                </p>
              </div>
            </div>

            {/* Chọn số khách */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <label className="text-xs font-bold text-gray-600 block mb-2.5">👥 Số người tại bàn:</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      guestCount === num
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Nút yêu cầu mở bàn */}
            <button
              type="button"
              onClick={handleRequestSession}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition"
            >
              <Icon name="bell" size={20} />
              <span>Gọi Nhân Viên Mở Bàn</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">hoặc</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Nút PIN */}
            <button
              type="button"
              onClick={() => { setPinError(null); setPinInput(""); setShowPinModal(true); }}
              className="w-full py-3.5 rounded-2xl bg-white border-2 border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50/50 text-emerald-800 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Icon name="key" size={16} />
              <span>Nhập Mã PIN Thẻ Bàn</span>
            </button>

            <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-200/60 flex items-start gap-2.5">
              <span className="text-amber-500 text-base shrink-0 mt-0.5">🔒</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Mã PIN động:</strong> Mã thay đổi sau mỗi lượt khách để bảo vệ bàn của bạn. Không lưu mã cho lần sau.
              </p>
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 2: ĐANG CHỜ NHÂN VIÊN DUYỆT (RADAR WAITING ANIMATION) */}
        {isPendingApproval && !isSessionActive && (
          <div className="my-auto py-10 text-center space-y-6 animate-fadeIn">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg relative z-10">
                <Icon name="clock" size={32} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900">
                Đang đợi nhân viên quán xác nhận...
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Yêu cầu mở <strong className="text-emerald-800 font-extrabold">{tableInfo?.name}</strong> đã được gửi tới quầy POS của nhân viên.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-left flex items-start gap-2.5">
              <Icon name="alert" size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Nhân viên tại quầy sẽ bấm <strong>"Duyệt Mở Bàn"</strong>. Màn hình điện thoại này sẽ tự động mở khóa thực đơn ngay lập tức.
              </p>
            </div>

            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setPinError(null);
                  setPinInput("");
                  setShowPinModal(true);
                }}
                className="w-full py-2.5 rounded-2xl bg-white border border-emerald-600/40 text-emerald-800 hover:bg-emerald-50 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition"
              >
                <Icon name="key" size={14} />
                <span>Có mã PIN thẻ bàn? Nhập mở ngay</span>
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setIsPendingApproval(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 py-1 transition"
                >
                  Hủy yêu cầu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 3: PHIÊN BÀN ĐÃ ĐƯỢC DUYỆT (ACTIVE MENU & ORDERING & TABS) */}
        {isSessionActive && (
          <div className="space-y-3 pb-28 animate-fadeIn">
            {/* Banner trạng thái phiên đang hoạt động */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-emerald-300">
                  <Icon name="table" size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                      {tableInfo?.name || "Bàn Phục Vụ"}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    {tableInfo?.zoneName || "Khu vực chính"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black bg-white/20 px-2.5 py-1 rounded-xl text-white inline-block">
                  {tableInfo?.code || tableCode}
                </span>
                {sessionElapsedLabel && (
                  <p className="text-[10px] font-bold text-emerald-300 mt-1">
                    ⏱ {sessionElapsedLabel}
                  </p>
                )}
              </div>
            </div>

            {/* TAB 1: THỰC ĐƠN (MENU) */}
            {activeTab === "MENU" && (
              <div className="space-y-3 animate-fadeIn">
                {/* Tìm kiếm món */}
                <div className="relative">
                  <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm món đồ uống, đồ ăn vặt..."
                    className="w-full h-11 pl-11 pr-10 rounded-2xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 shadow-xs transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>

                {/* Bộ lọc danh mục */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === "ALL"
                        ? "bg-emerald-700 text-white shadow-sm shadow-emerald-700/25 font-black"
                        : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50"
                    }`}
                  >
                    Tất Cả ({allDishes.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? "bg-emerald-700 text-white shadow-sm shadow-emerald-700/25 font-black"
                          : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50"
                      }`}
                    >
                      {cat.name} ({cat.menuItems.length})
                    </button>
                  ))}
                </div>

                {/* Danh sách món ăn */}
                <div className="space-y-3">
                  {filteredDishes.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400 font-bold bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                      Không tìm thấy món phù hợp
                    </div>
                  ) : (
                    filteredDishes.map((dish) => {
                      const cartItem = cart.find((c) => c.menuItem.id === dish.id);
                      return (
                        <div
                          key={dish.id}
                          className="p-3.5 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-200 hover:shadow-sm transition"
                        >
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100/80 shadow-2xs relative">
                            {dish.image ? (
                              <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-emerald-800/40 bg-emerald-50/50">
                                <Icon name="vietqr" size={24} />
                                <span className="text-[9px] font-black mt-1">A2Order</span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-sm text-slate-900 truncate leading-snug">{dish.name}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{dish.categoryName}</p>
                            <p className="text-sm font-black text-emerald-700 mt-1.5">
                              {dish.price.toLocaleString("vi-VN")} đ
                            </p>
                          </div>

                          {/* Nút Thêm / Tăng giảm số lượng */}
                          <div className="shrink-0">
                            {cartItem ? (
                              <div className="flex items-center gap-2 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-200">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(dish.id, -1)}
                                  className="w-7 h-7 rounded-xl bg-white text-emerald-900 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-90 transition border border-emerald-200"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-black text-xs text-emerald-950">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(dish.id, 1)}
                                  className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs active:scale-90 transition"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(dish)}
                                className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white font-extrabold text-xs border border-emerald-200 hover:border-emerald-700 transition active:scale-95 shadow-2xs flex items-center gap-1"
                              >
                                <span>+</span>
                                <span>Thêm</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ĐỒ ĐÃ ĐẶT (ORDERED ITEMS HISTORY & CANCELLATION) */}
            {activeTab === "ORDERED" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Món Đã Đặt Tại Bàn</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {orderedItems.length} món trong phiên này
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      {orderedItems
                        .filter((it) => it.status !== "CANCELLED")
                        .reduce((s, it) => s + it.price * it.quantity, 0)
                        .toLocaleString("vi-VN")}{" "}
                      đ
                    </span>
                  </div>
                </div>

                {orderedItems.length === 0 ? (
                  <div className="py-16 bg-white rounded-3xl border border-slate-100 text-center space-y-3 p-6 shadow-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon name="clipboard" size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Bàn chưa gửi món nào vào bếp</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Chọn các món yêu thích trong thực đơn và gửi vào bếp nhé!</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("MENU")}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition active:scale-95"
                    >
                      Xem Thực Đơn Để Chọn Món
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orderedItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 bg-white rounded-3xl border shadow-xs space-y-2.5 transition-all ${
                          item.status === "CANCELLED"
                            ? "opacity-50 border-slate-200 bg-slate-50/50"
                            : item.status === "PENDING_APPROVAL"
                            ? "border-amber-300 ring-1 ring-amber-200"
                            : "border-slate-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 truncate">
                                {item.quantity}x {item.name}
                              </span>
                              {item.orderedAt && (
                                <span className="text-[10px] text-slate-400 font-medium">({item.orderedAt})</span>
                              )}
                            </div>
                            <p className="text-xs font-black text-emerald-700 mt-0.5">
                              {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                            </p>
                            {item.notes && (
                              <p className="text-[11px] text-amber-800 italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                                Ghi chú: {item.notes}
                              </p>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {item.status === "PENDING_APPROVAL" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-black animate-pulse">
                                ⏳ Chờ Quán Duyệt
                              </span>
                            )}
                            {item.status === "COOKING" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-black">
                                🍳 Bếp Đang Nấu
                              </span>
                            )}
                            {item.status === "SERVED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black">
                                🍽️ Đã Phục Vụ
                              </span>
                            )}
                            {item.status === "CANCELLED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-500 text-[11px] font-bold line-through">
                                Đã Hủy
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nút Hủy Món nếu quán chưa duyệt */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                          {item.status === "PENDING_APPROVAL" ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] text-amber-800 font-semibold">
                                Quán chưa duyệt, bạn có thể hủy:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCancelOrderItem(item)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                              >
                                <Icon name="trash" size={12} />
                                <span>Hủy Món</span>
                              </button>
                            </div>
                          ) : item.status === "COOKING" ? (
                            <span className="text-[11px] text-slate-400 italic">
                              🔒 Bếp đã nấu món này, không thể hủy
                            </span>
                          ) : item.status === "SERVED" ? (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              ✓ Chúc quý khách ngon miệng!
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ƯU ĐÃI & TÍCH ĐIỂM (VOUCHER & LOYALTY) */}
            {activeTab === "OFFERS" && (
              <div className="space-y-3 animate-fadeIn">
                {/* 1. Nhập Voucher */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                      <Icon name="tag" size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Voucher & Mã Giảm Giá</h3>
                      <p className="text-[11px] text-slate-400">Áp dụng trực tiếp vào tổng hóa đơn</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã voucher (VD: A2GIAM10)"
                      className="flex-1 h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyVoucher()}
                      className="px-5 rounded-2xl bg-emerald-700 text-white font-black text-xs hover:bg-emerald-800 transition active:scale-95 shadow-sm"
                    >
                      Áp Dụng
                    </button>
                  </div>

                  {appliedVoucher && (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-emerald-900">
                          🎟️ Mã {appliedVoucher.code} đã áp dụng
                        </span>
                        <p className="text-[10px] text-emerald-700">{appliedVoucher.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedVoucher(null);
                          toast.info("Đã bỏ áp dụng voucher");
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}

                  {/* Danh sách voucher gợi ý */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mã ưu đãi đang có:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {SAMPLE_VOUCHERS.map((v) => (
                        <div
                          key={v.code}
                          onClick={() => handleApplyVoucher(v.code)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            appliedVoucher?.code === v.code
                              ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200"
                              : "bg-slate-50/70 hover:bg-emerald-50/40 border-slate-200/80"
                          }`}
                        >
                          <div>
                            <span className="text-xs font-black font-mono text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                              {v.code}
                            </span>
                            <p className="text-xs text-slate-700 font-semibold mt-1">{v.description}</p>
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-xl transition ${
                            appliedVoucher?.code === v.code
                              ? "bg-emerald-700 text-white"
                              : "bg-white text-emerald-800 border border-emerald-200"
                          }`}>
                            {appliedVoucher?.code === v.code ? "✓ Đã chọn" : "+ Dùng"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Nhập SĐT Tích Điểm */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center shadow-2xs">
                      <Icon name="phone" size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Tích Điểm Thành Viên</h3>
                      <p className="text-[11px] text-slate-400">10.000 đ = 1 điểm thưởng đổi quà</p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePhone} className="flex gap-2">
                    <input
                      type="tel"
                      maxLength={11}
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""));
                        setIsPhoneSaved(false);
                      }}
                      placeholder="Nhập số điện thoại (10 số)"
                      className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 rounded-xl bg-cyan-700 text-white font-black text-xs hover:bg-cyan-800 transition active:scale-95"
                    >
                      {isPhoneSaved ? "Đã Lưu" : "Lưu SĐT"}
                    </button>
                  </form>

                  {isPhoneSaved && customerPhone && (
                    <div className="p-3 bg-gradient-to-r from-cyan-900 to-slate-900 text-white rounded-xl shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase">Thẻ Thành Viên A2</span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">Standard</span>
                      </div>
                      <p className="text-sm font-black tracking-wider font-mono">{customerPhone}</p>
                      <p className="text-[10px] text-cyan-200">
                        Số điểm tích lũy dự kiến: +
                        {Math.floor(
                          orderedItems
                            .filter((it) => it.status !== "CANCELLED")
                            .reduce((s, it) => s + it.price * it.quantity, 0) / 10000
                        )}{" "}
                        điểm
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRƯỜNG HỢP 4: PHIÊN BÀN ĐÃ ĐÓNG (THANH TOÁN XONG / LINK CŨ) */}
        {isClosed && (
          <div className="my-auto py-10 text-center space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-200 text-slate-600 flex items-center justify-center shadow-xs">
              <Icon name="check" size={32} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">
                Phiên Gọi Món Đã Kết Thúc
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Cảm ơn quý khách đã dùng bữa tại {storeInfo?.name}! Bàn này đã hoàn tất thanh toán và trả bàn.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsClosed(false);
                setIsPendingApproval(false);
                setIsSessionActive(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs shadow-xs hover:bg-black transition"
            >
              Mở Phiên Gọi Món Mới
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Khi phiên đang mở & có món trong giỏ) */}
      {isSessionActive && totalCartCount > 0 && activeTab === "MENU" && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto animate-slideUp">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-3xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="relative w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="cart" size={18} />
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Giỏ Hàng</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-emerald-400">
                    {finalCartTotal.toLocaleString("vi-VN")} đ
                  </span>
                  {voucherDiscount > 0 && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {totalCartRawAmount.toLocaleString("vi-VN")} đ
                    </span>
                  )}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition active:scale-95"
            >
              <span>Xem Giỏ</span>
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Tabs (Khi phiên mở) */}
      {isSessionActive && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg py-2 px-4">
          <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === "MENU"
                  ? "bg-emerald-50 text-emerald-700 font-black shadow-2xs"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative">
                <Icon name="menu" size={20} />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px]">Thực Đơn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ORDERED")}
              className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === "ORDERED"
                  ? "bg-emerald-50 text-emerald-700 font-black shadow-2xs"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative">
                <Icon name="clipboard" size={20} />
                {orderedItems.some((i) => i.status === "PENDING_APPROVAL") && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <span className="text-[11px]">Đã Đặt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("OFFERS")}
              className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === "OFFERS"
                  ? "bg-emerald-50 text-emerald-700 font-black shadow-2xs"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative">
                <Icon name="tag" size={20} />
                {appliedVoucher && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-[11px]">Ưu Đãi & Điểm</span>
            </button>
          </div>
        </nav>
      )}

      {/* Modal 1: Nhập Mã PIN Mở Bàn Thủ Công (Kèm Brute-Force Lockout 30s) */}
      {showPinModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                    <Icon name="key" size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Mở Bàn Bằng Mã PIN</h3>
                    <p className="text-[10.5px] text-slate-400 font-bold">{tableInfo?.name || "Bàn ăn"} ({tableCode})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-left space-y-1">
                <p className="text-xs font-bold text-emerald-950">
                  Nhập mã PIN 4 chữ số trên thẻ bàn:
                </p>
                <p className="text-[10.5px] text-emerald-800/80 leading-relaxed">
                  Mã PIN được in kèm thẻ để bàn hoặc do nhân viên phục vụ gửi. Nhập đúng mã sẽ mở khóa menu ngay tức thì.
                </p>
              </div>

              {/* Thông báo khóa tạm thời nếu nhập sai quá 10 lần */}
              {lockoutRemaining > 0 ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-2 animate-shake">
                  <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Icon name="lock" size={20} />
                  </div>
                  <h4 className="text-xs font-black text-rose-900">Tạm Khóa Bảo Mật Bàn</h4>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Bạn đã nhập sai mã PIN quá 10 lần. Vui lòng đợi hết thời gian khóa hoặc nhờ nhân viên quầy mở bàn:
                  </p>
                  <div className="text-2xl font-black font-mono text-rose-600 tracking-wider">
                    00:{String(lockoutRemaining).padStart(2, "0")}s
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUnlockWithPin} className="space-y-4">
                  <div>
                    <input
                      type="tel"
                      maxLength={6}
                      autoFocus
                      disabled={lockoutRemaining > 0}
                      value={pinInput}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setPinInput(v);
                        setPinError(null);
                        if (v.length === 4) {
                          handleUnlockWithPin(undefined, v);
                        }
                      }}
                      placeholder="• • • •"
                      className="w-full text-center tracking-[0.5em] font-mono font-black text-2xl h-14 rounded-2xl border-2 border-emerald-600/30 focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none transition shadow-inner disabled:opacity-50"
                    />
                    {pinError && (
                      <div className="p-2.5 mt-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold text-center flex items-center justify-center gap-1.5 animate-shake">
                        <Icon name="alert" size={14} className="shrink-0" />
                        <span>{pinError}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    * Mã PIN bàn là mã động bảo mật, tự động thay đổi sau mỗi lượt khách để chống lưu mã từ xa.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPinModal(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPin || !pinInput.trim() || lockoutRemaining > 0}
                      className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95 transition disabled:opacity-50"
                    >
                      {isSubmittingPin ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Icon name="key" size={14} />
                          <span>Mở Bàn Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Modal 2: Xác Nhận Đặt Món Trước Khi Gửi Bếp (Order Confirmation Gate) */}
      {showConfirmModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Icon name="clipboard" size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Xác Nhận Đặt Món</h3>
                    <p className="text-[10.5px] text-slate-400">{tableInfo?.name || "Bàn"} • {totalCartCount} món</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <Icon name="x" size={15} />
                </button>
              </div>

              {/* Danh sách món trong giỏ */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.map((c) => (
                  <div
                    key={c.menuItem.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-slate-900 truncate block">
                        {c.quantity}x {c.menuItem.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.menuItem.price.toLocaleString("vi-VN")} đ / phần
                      </span>
                    </div>
                    <span className="font-black text-emerald-800 shrink-0">
                      {(c.menuItem.price * c.quantity).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                ))}

                {/* Ghi chú đơn hàng */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Ghi chú cho bếp / pha chế (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="VD: Ít đường, không đá, mang cùng lúc..."
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Tóm tắt thanh toán */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tạm tính ({totalCartCount} món):</span>
                    <span>{totalCartRawAmount.toLocaleString("vi-VN")} đ</span>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="flex items-center justify-between text-rose-600 font-bold">
                      <span>Voucher ({appliedVoucher?.code}):</span>
                      <span>-{voucherDiscount.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}

                  {customerPhone && (
                    <div className="flex items-center justify-between text-cyan-700 font-bold text-[11px]">
                      <span>Tích điểm SĐT {customerPhone}:</span>
                      <span>+{Math.floor(finalCartTotal / 10000)} điểm</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between font-black text-sm text-slate-900">
                    <span>Tổng thanh toán:</span>
                    <span className="text-emerald-800">{finalCartTotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[10.5px] leading-relaxed">
                  ⏳ <strong>Lưu ý:</strong> Khi bạn bấm gửi, đơn hàng sẽ chuyển tới quầy quán để nhân viên xác nhận duyệt trước khi bếp chế biến.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Chọn Thêm
                </button>
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handleConfirmAndSubmitOrder}
                  className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmittingOrder ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Icon name="check" size={14} />
                      <span>Xác Nhận Đặt Món 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal 3: Hỗ Trợ Nhanh Tại Bàn (Quick Service Bottom Sheet) */}
      {showServiceModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <span className="text-base">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Hỗ Trợ Nhanh Tại Bàn</h3>
                    <p className="text-[10.5px] text-slate-400">Yêu cầu phục vụ tới nhân viên quầy</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <Icon name="x" size={15} />
                </button>
              </div>

              {/* Grid 6 nút hỗ trợ nhanh */}
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_OPTIONS.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    disabled={isSendingService}
                    onClick={() => handleSendService(srv)}
                    className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition active:scale-95 space-y-1 shadow-2xs group"
                  >
                    <span className="text-xl block">{srv.emoji}</span>
                    <span className="font-black text-xs text-slate-900 group-hover:text-emerald-900 block truncate">
                      {srv.label}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate">{srv.desc}</span>
                  </button>
                ))}
              </div>

              {/* Ghi chú thêm nếu cần */}
              <div>
                <input
                  type="text"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="Ghi chú thêm nếu cần (VD: 2 ly đá, ít ngọt...)"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Nhân viên sẽ nhận thông báo chuông tức thì và phục vụ trong ít phút.
              </p>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
