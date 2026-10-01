import React, { useEffect, useState } from "react";
import { Portal } from "./Portal";
import { Icon } from "./Icon";

export interface NotificationItem {
  id: number;
  type: "alert" | "payment" | "expire" | "system";
  tag: string;
  title: string;
  desc: string;
  time: string;
  icon: string;
  color: string;
  bg: string;
  isRead?: boolean;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "alert",
    tag: "Hạ Tầng",
    title: "Cảnh báo tải CPU Gateway",
    desc: "Tải CPU của Node.js Gateway vượt quá 85%. Tự động cân bằng tải đã kích hoạt bảo vệ hệ thống.",
    time: "2 phút trước",
    icon: "server",
    color: "text-amber-600",
    bg: "bg-amber-500/10 text-amber-700 border-amber-200",
    isRead: false,
  },
  {
    id: 2,
    type: "payment",
    tag: "Giao Dịch VietQR",
    title: "Thanh toán gói Pro thành công",
    desc: "Quán The Coffee House - Chi nhánh 1 vừa thanh toán hóa đơn 5,990,000đ qua mã VietQR động.",
    time: "1 giờ trước",
    icon: "dollar",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    isRead: false,
  },
  {
    id: 3,
    type: "expire",
    tag: "Bản Quyền",
    title: "Giấy phép sắp đến hạn",
    desc: "Quán Phở Lý Quốc Sư còn 3 ngày sử dụng gói Standard. Vui lòng kiểm tra liên hệ gia hạn.",
    time: "2 giờ trước",
    icon: "clock",
    color: "text-rose-600",
    bg: "bg-rose-500/10 text-rose-700 border-rose-200",
    isRead: false,
  },
  {
    id: 4,
    type: "system",
    tag: "Nâng Cấp",
    title: "Cập nhật nền tảng v2.4.0",
    desc: "Đã tối ưu hóa thanh dock điều hướng đáy, bổ sung tìm kiếm Spotlight đa tầng và giao diện mới.",
    time: "Hôm nay",
    icon: "sparkles",
    color: "text-blue-600",
    bg: "bg-blue-500/10 text-blue-700 border-blue-200",
    isRead: true,
  },
];

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onNotificationsChange?: (items: NotificationItem[]) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications: propNotifications,
  onNotificationsChange,
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

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "ALERT">("ALL");

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
    if (activeTab === "ALERT") return n.type === "alert" || n.type === "expire";
    return true;
  });

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    updateNotifications(updated);
  };

  const toggleItemRead = (id: number) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
    updateNotifications(updated);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop mờ sang trọng */}
      <div
        className="fixed inset-0 z-[10000] bg-slate-950/50 backdrop-blur-sm flex items-center sm:items-start justify-center sm:justify-end p-3 sm:p-4 sm:pt-16 animate-in fade-in duration-150"
        onClick={onClose}
      >
        {/* Floating Modal Panel */}
        <div
          className="relative w-full max-w-sm sm:max-w-[400px] sm:mr-3 bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_24px_50px_rgba(0,0,0,0.22)] border border-slate-200/80 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header Luxury Forest Green Gradient */}
          <div className="relative p-3.5 sm:p-4 bg-gradient-to-br from-[#0c2a20] via-[#103529] to-[#0a231b] text-white overflow-hidden shrink-0">
            {/* Vòng sáng phát quang thẩm mỹ */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                  <Icon name="bell" size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
                      Trung Tâm Thông Báo
                    </h3>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full leading-none shadow-sm animate-pulse">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-emerald-100/70 mt-0.5">
                    Hệ thống vận hành A2Order Cloud
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10.5px] font-bold backdrop-blur-md transition active:scale-95"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    Đọc hết
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition active:scale-95"
                  aria-label="Đóng thông báo"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Segmented Pill Filter Tabs */}
          <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200/60 shrink-0">
            <div className="grid grid-cols-3 gap-1 w-full bg-slate-200/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold text-center transition-all ${
                  activeTab === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UNREAD")}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === "UNREAD"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Chưa đọc</span>
                {unreadCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ALERT")}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold text-center transition-all ${
                  activeTab === "ALERT"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cảnh báo
              </button>
            </div>
          </div>

          {/* 3. Notification Card List */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 bg-[#f8faf9]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm mb-2">
                  <Icon name="checkCircle" size={22} className="text-emerald-500" />
                </div>
                <h4 className="text-xs font-black text-slate-800">Không có thông báo mới</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Tất cả phân hệ đều đang hoạt động ổn định
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => toggleItemRead(n.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative group ${
                    n.isRead
                      ? "bg-white hover:bg-slate-50 border-slate-200/60"
                      : "bg-emerald-50/40 hover:bg-emerald-50/80 border-emerald-200/90 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 ${n.bg} ${n.color}`}
                    >
                      <Icon name={n.icon as any} size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              n.type === "alert" || n.type === "expire"
                                ? "bg-rose-100 text-rose-800"
                                : n.type === "payment"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {n.tag}
                          </span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200 shrink-0" />
                          )}
                        </div>

                        <span className="text-[9.5px] font-semibold text-slate-400 shrink-0">
                          {n.time}
                        </span>
                      </div>

                      <h4
                        className={`text-xs mt-1 leading-snug truncate ${
                          n.isRead ? "font-bold text-slate-800" : "font-black text-slate-950"
                        }`}
                      >
                        {n.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Footer System Live Health */}
          <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse" />
              <span className="font-bold text-slate-700">Máy chủ Gateway: Trực tuyến</span>
            </div>
            <span className="font-black text-emerald-800">99.98% Uptime</span>
          </div>
        </div>
      </div>
    </Portal>
  );
};

