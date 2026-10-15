import { StoreChannelId, ChannelDef, StaffChatMessage } from "../types/chat.types.js";

export const CHANNELS: ChannelDef[] = [
  {
    id: "ALL",
    name: "Toàn Quán",
    tag: "#toan-quan",
    desc: "Trao đổi & thông báo chung cả ca làm",
    quickChips: ["Bắt đầu ca làm", "Họp giao ca 5 phút", "Kiểm tra bàn giao két"],
  },
  {
    id: "CASHIER_BAR",
    name: "Thu Ngân - Bar",
    tag: "#thu-ngan-bar",
    desc: "Giao dịch, nạp két & pha chế",
    quickChips: ["Cần đổi tiền lẻ két", "Khách đã quét VietQR", "Tạm hết đá viên"],
  },
  {
    id: "KITCHEN",
    name: "Bếp Nấu (KDS)",
    tag: "#bep-kds",
    desc: "Tiến độ chế biến & ra món các bàn",
    quickChips: ["Bàn 02 giục món gấp", "Ra món bàn 04", "Nguyên liệu sắp hết"],
  },
  {
    id: "SERVICE",
    name: "Phục Vụ Bàn",
    tag: "#phuc-vu",
    desc: "Order tại bàn, dọn dẹp & tiếp khách",
    quickChips: ["Dọn bàn 03 cho khách mới", "Bàn 05 xin thêm đá", "Khách gọi tính tiền"],
  },
];

export const INITIAL_MESSAGES: Record<StoreChannelId, StaffChatMessage[]> = {
  ALL: [],
  CASHIER_BAR: [],
  KITCHEN: [],
  SERVICE: [],
};

export const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  "Chủ Quán": { bg: "bg-emerald-100", text: "text-emerald-800" },
  STORE_OWNER: { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Thu Ngân": { bg: "bg-blue-100", text: "text-blue-800" },
  CASHIER: { bg: "bg-blue-100", text: "text-blue-800" },
  "Bếp Trưởng": { bg: "bg-amber-100", text: "text-amber-800" },
  CHEF: { bg: "bg-amber-100", text: "text-amber-800" },
  "Phục Vụ": { bg: "bg-purple-100", text: "text-purple-800" },
  WAITER: { bg: "bg-purple-100", text: "text-purple-800" },
  "Pha Chế": { bg: "bg-teal-100", text: "text-teal-800" },
};

