import { ChannelAlertItem } from "@/types";


export const CHANNEL_ALERTS: Record<string, ChannelAlertItem[]> = {
  ALL: [
    { text: "Cần hỗ trợ gấp!", icon: "alert", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { text: "Hết đá & khăn", icon: "alertCircle", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { text: "Xin dọn bàn", icon: "table", color: "text-purple-700 bg-purple-50 border-purple-200" },
  ],
  KITCHEN: [
    { text: "Bàn giục món!", icon: "flame", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { text: "Xin hủy món", icon: "x", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { text: "Món nào sắp ra?", icon: "help", color: "text-blue-700 bg-blue-50 border-blue-200" },
  ],
  CASHIER: [
    { text: "In phiếu tạm tính", icon: "banknote", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { text: "Xuất VAT", icon: "fileText", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { text: "Khách giục TT", icon: "clock", color: "text-amber-700 bg-amber-50 border-amber-200" },
  ],
  WAITER: [
    { text: "Tiếp khách bàn mới", icon: "users", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { text: "Bàn gọi phục vụ", icon: "bell", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { text: "Đổi bàn / gộp bàn", icon: "refresh", color: "text-brand-800 bg-brand-50 border-brand-200" },
  ],
};
