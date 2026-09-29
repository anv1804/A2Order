import { IntercomMessage } from "@/types";

export const INITIAL_MESSAGES: IntercomMessage[] = [
  {
    id: "m-1",
    senderName: "Bác Ba (Bếp trưởng)",
    senderRole: "Đầu bếp",
    targetRole: "ALL",
    content: "Bếp bắt đầu ra mẻ phở bò tái lăn bàn 02, phục vụ chú ý bưng nóng nhé!",
    timestamp: "09:15",
    type: "TEXT",
  },
  {
    id: "m-2",
    senderName: "Em Hùng",
    senderRole: "Phục vụ",
    targetRole: "KITCHEN",
    content: "Bàn 07 (VIP 1) giục nồi lẩu đuôi bò thêm lửa với rau muống ạ!",
    timestamp: "09:20",
    type: "QUICK_ALERT",
  },
  {
    id: "m-3",
    senderName: "Chị Lan",
    senderRole: "Thu ngân",
    targetRole: "WAITER",
    content: "Bàn 05 khách đã chuyển khoản VietQR thành công, bạn dọn bàn giúp chị",
    timestamp: "09:24",
    type: "TEXT",
  },
];

export const QUICK_ALERTS = [
  { text: "Bàn giục món gấp!", target: "KITCHEN" as const, icon: "flame" as const, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { text: "Hết đá & khăn lạnh", target: "WAITER" as const, icon: "alert" as const, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { text: "Xin in phiếu tạm tính", target: "CASHIER" as const, icon: "cashier" as const, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { text: "Bếp đã lên đủ món!", target: "WAITER" as const, icon: "kitchen" as const, color: "text-brand-900 bg-brand-50 border-brand-200" },
  { text: "Cần dọn bàn trống", target: "WAITER" as const, icon: "table" as const, color: "text-purple-700 bg-purple-50 border-purple-200" },
];
