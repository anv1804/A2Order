import React, { useEffect, useState } from "react";
import { Portal } from "./Portal";
import { Icon } from "./Icon";
import { sound } from "@/lib/sound";
import { toast } from "@/stores/notificationStore";

export interface NotificationItem {
  id: string | number;
  type: "payment" | "license" | "alert" | "kds" | "security" | "system" | "inventory";
  tag: string;
  title: string;
  desc: string;
  time: string;
  icon: string;
  color: string;
  bg: string;
  isRead?: boolean;
  actionText?: string;
  actionType?: "tenants" | "invoices" | "licenses" | "kds" | "inventory";
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "noti-1",
    type: "payment",
    tag: "VietQR Thu Phí",
    title: "Thanh toán gói Enterprise thành công",
    desc: "Trà Sữa Topping Đô Đô vừa đối soát hóa đơn INV-2026-0091 (13.000.000đ/12 tháng). Hệ thống đã gia hạn tự động.",
    time: "3 phút trước",
    icon: "banknote",
    color: "text-emerald-600",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    isRead: false,
    actionText: "Xem hóa đơn",
    actionType: "invoices",
  },
  {
    id: "noti-2",
    type: "license",
    tag: "Bản Quyền Quán",
    title: "Quán Cà Phê Muối Chú Long còn 4 ngày cước",
    desc: "Hợp đồng thuê gói Growth sắp hết hạn vào ngày 05/10/2026. Đã tự động phát hành hóa đơn gia hạn đối soát.",
    time: "15 phút trước",
    icon: "key",
    color: "text-amber-600",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    isRead: false,
    actionText: "Gia hạn ngay",
    actionType: "licenses",
  },
  {
    id: "noti-3",
    type: "alert",
    tag: "Mất Kết Nối POS",
    title: "Trạm POS Quầy Chính ngoại tuyến",
    desc: "Trạm POS tại Lẩu Nướng Phố Cổ mất tín hiệu heartbeat > 24 giờ. IP thiết bị 192.168.10.5 đang không phản hồi.",
    time: "1 giờ trước",
    icon: "alert",
    color: "text-rose-600",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    isRead: false,
    actionText: "Kiểm tra IP",
    actionType: "tenants",
  },
  {
    id: "noti-4",
    type: "kds",
    tag: "Nhịp Độ Bếp KDS",
    title: "Chi nhánh Hải Sản Biển Đông hoàn tất ca trưa",
    desc: "Bếp KDS vừa xuất 32 vé món thành công trong khung giờ cao điểm. SLA trung bình đạt 5.4 phút / món.",
    time: "2 giờ trước",
    icon: "kitchen",
    color: "text-blue-600",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    isRead: true,
  },
  {
    id: "noti-5",
    type: "inventory",
    tag: "Kho & Nguyên Liệu",
    title: "Cảnh báo tồn kho Bò Phi Lê Úc chạm đáy",
    desc: "Mức tồn kho hiện tại còn 4.5kg, dưới ngưỡng định mức an toàn tối thiểu 5.0kg. Cần duyệt phiếu nhập kho NCC.",
    time: "4 giờ trước",
    icon: "cart",
    color: "text-amber-600",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    isRead: true,
    actionText: "Nhập hàng",
    actionType: "inventory",
  },
  {
    id: "noti-6",
    type: "security",
    tag: "Bảo Mật Hệ Thống",
    title: "Đăng nhập Super Admin mới",
    desc: "Tài khoản superadmin@a2order.vn vừa đăng nhập thành công từ địa chỉ IP 14.225.24.12 qua giao thức HTTPS.",
    time: "Hôm nay 12:00",
    icon: "shield",
    color: "text-purple-600",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    isRead: true,
  },
  {
    id: "noti-7",
    type: "system",
    tag: "Phiên Bản Nền Tảng",
    title: "Xuất bản Snapshot v1.1.2 thành công",
    desc: "Đã hoàn tất đồng bộ cấu hình phân vùng sơ đồ bàn mới tới 10 quán toàn hệ thống.",
    time: "Hôm qua",
    icon: "sparkles",
    color: "text-teal-600",
    bg: "bg-teal-50 text-teal-700 border-teal-200",
    isRead: true,
  },
];

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onNotificationsChange?: (items: NotificationItem[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications: propNotifications,
  onNotificationsChange,
  onNavigateTab,
}) => {
  const [internalNotifications, setInternalNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const notifications = propNotifications ?? internalNotifications;

  const updateNotifications = (newItems: NotificationItem[]) => {
    if (onNotificationsChange) {
      onNotificationsChange(newItems);
    } else {
      setInternalNotifications(newItems);
    }
  };

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "FINANCE" | "ALERT">("ALL");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("a2order_noti_sound");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("a2order_noti_sound", JSON.stringify(next));
    } catch {}
    if (next) {
      sound.playPaymentChime();
      toast.info("Đã bật âm thanh chuông báo hệ thống");
    } else {
      toast.info("Đã tắt âm thanh chuông báo");
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.isRead;
    if (activeTab === "FINANCE") return n.type === "payment" || n.type === "license";
    if (activeTab === "ALERT") return n.type === "alert" || n.type === "security" || n.type === "inventory";
    return true;
  });

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    updateNotifications(updated);
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
  };

  const clearReadNotifications = () => {
    const updated = notifications.filter((n) => !n.isRead);
    updateNotifications(updated);
    toast.info("Đã dọn dẹp các thông báo đã đọc");
  };

  const toggleItemRead = (id: string | number) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
    updateNotifications(updated);
  };

  const deleteNotification = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    updateNotifications(updated);
  };

  const handleActionClick = (n: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.isRead) {
      toggleItemRead(n.id);
    }
    if (n.actionType && onNavigateTab) {
      let target: string = n.actionType;
      if (target === "invoices") target = "software_invoices";
      if (target === "licenses") target = "license_manager";
      onNavigateTab(target);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop mờ sang trọng */}
      <div
        className="fixed inset-0 z-[10000] bg-slate-950/40 backdrop-blur-sm flex items-center sm:items-start justify-center sm:justify-end p-3 sm:p-5 sm:pt-16 animate-fadeIn"
        onClick={onClose}
      >
        {/* Floating Modal Panel */}
        <div
          className="relative w-full max-w-sm sm:max-w-[430px] sm:mr-2 bg-white rounded-[26px] sm:rounded-[30px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/90 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header Luxury Deep Forest Green */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-br from-[#061e16] via-[#0c2921] to-[#143b2f] text-white overflow-hidden shrink-0 border-b border-white/10">
            {/* Vòng phát quang gradient */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                  <Icon name="bell" size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                      Thông Báo Hệ Thống
                    </h3>
                    {unreadCount > 0 ? (
                      <span className="bg-rose-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none shadow-sm animate-pulse">
                        {unreadCount} mới
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        Đã đọc hết
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-100/70 font-medium mt-0.5">
                    Trung tâm điều hành A2Order Platform
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold backdrop-blur-md transition active:scale-95 flex items-center gap-1"
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <Icon name="check" size={12} />
                    <span>Đọc hết</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition active:scale-95"
                  aria-label="Đóng cửa sổ thông báo"
                  title="Đóng (Escape)"
                >
                  <Icon name="x" size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Segmented Filter Tabs */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/70 shrink-0">
            <div className="grid grid-cols-4 gap-1 w-full bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`py-1.5 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold text-center transition-all ${
                  activeTab === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UNREAD")}
                className={`py-1.5 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === "UNREAD"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Chưa đọc</span>
                {unreadCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("FINANCE")}
                className={`py-1.5 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold text-center transition-all ${
                  activeTab === "FINANCE"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Thu Phí
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ALERT")}
                className={`py-1.5 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold text-center transition-all ${
                  activeTab === "ALERT"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cảnh Báo
              </button>
            </div>
          </div>

          {/* 3. Notification Items List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 bg-[#f8faf9] overscroll-contain scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-500 shadow-2xs mb-3">
                  <Icon name="checkCircle" size={24} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">Không có thông báo nào</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
                  Mọi phân hệ và kết nối trạm POS đều đang vận hành hoàn hảo.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => toggleItemRead(n.id)}
                  className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative group ${
                    n.isRead
                      ? "bg-white hover:bg-slate-50/80 border-slate-200/70"
                      : "bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-300/80 shadow-2xs ring-1 ring-emerald-200/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon container */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 transition-transform duration-200 group-hover:scale-105 ${n.bg} ${n.color}`}
                    >
                      <Icon name={n.icon as any} size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              n.type === "alert"
                                ? "bg-rose-100 text-rose-800"
                                : n.type === "payment"
                                ? "bg-emerald-100 text-emerald-800"
                                : n.type === "license"
                                ? "bg-amber-100 text-amber-800"
                                : n.type === "kds"
                                ? "bg-blue-100 text-blue-800"
                                : n.type === "security"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {n.tag}
                          </span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200 shrink-0" />
                          )}
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {n.time}
                        </span>
                      </div>

                      <h4
                        className={`text-xs leading-snug ${
                          n.isRead ? "font-bold text-slate-800" : "font-black text-slate-950"
                        }`}
                      >
                        {n.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {n.desc}
                      </p>

                      {/* Card Action Row */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/80">
                        {n.actionText ? (
                          <button
                            type="button"
                            onClick={(e) => handleActionClick(n, e)}
                            className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-700 hover:text-emerald-900 transition-colors"
                          >
                            <span>{n.actionText}</span>
                            <Icon name="arrowRight" size={11} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Đã ghi nhận</span>
                        )}

                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemRead(n.id);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition"
                          >
                            {n.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteNotification(n.id, e)}
                            className="text-slate-400 hover:text-rose-600 transition p-0.5"
                            title="Xóa thông báo này"
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Footer: Live Health & Sound Settings */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex items-center justify-between text-[10.5px] text-slate-600 shrink-0">
            {/* Sound toggle button */}
            <button
              type="button"
              onClick={handleToggleSound}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition active:scale-95"
              title={soundEnabled ? "Tắt chuông ting-ting" : "Bật chuông ting-ting"}
            >
              <span className={`w-2 h-2 rounded-full ${soundEnabled ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Chuông: {soundEnabled ? "Bật" : "Tắt"}</span>
            </button>

            {/* Clear read notifications */}
            {notifications.some((n) => n.isRead) && (
              <button
                type="button"
                onClick={clearReadNotifications}
                className="text-slate-400 hover:text-slate-700 font-medium transition"
              >
                Dọn đã đọc
              </button>
            )}

            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>WebSocket 1,420 kết nối</span>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default NotificationModal;
