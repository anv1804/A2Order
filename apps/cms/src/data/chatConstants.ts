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
  ALL: [
    {
      id: "all-1",
      senderName: "Nguyễn Văn Chiến",
      senderRole: "Chủ Quán",
      text: "Chào cả ca sáng! Hôm nay thời tiết đẹp dự kiến khách đông, các bạn chuẩn bị sẵn nguyên liệu và két tiền nhé.",
      time: "06:30",
    },
    {
      id: "all-2",
      senderName: "Trần Thu Hà",
      senderRole: "Thu Ngân",
      text: "Dạ két tiền sáng nay đã kiểm đếm xong và sẵn sàng tiền lẻ thối lại rồi ạ!",
      time: "06:45",
    },
  ],
  CASHIER_BAR: [
    {
      id: "bar-1",
      senderName: "Lê Hoàng Long",
      senderRole: "Pha Chế",
      text: "Cam tươi hôm nay nhập ít hơn dự kiến, thu ngân để ý tư vấn khách sang Trà Sữa hoặc Trà Đào nhé.",
      time: "07:10",
    },
    {
      id: "bar-2",
      senderName: "Trần Thu Hà",
      senderRole: "Thu Ngân",
      text: "Đã rõ anh Long ơi, em sẽ chủ động tư vấn khách.",
      time: "07:15",
    },
  ],
  KITCHEN: [
    {
      id: "kit-1",
      senderName: "Phạm Minh Tuấn",
      senderRole: "Bếp Trưởng",
      text: "Bếp vừa hoàn thành xong 2 phần Mì Cay bàn 02, phục vụ qua bưng ra giúp nhé.",
      time: "07:30",
    },
    {
      id: "kit-2",
      senderName: "Vũ Thị Mai",
      senderRole: "Phục Vụ",
      text: "Em bưng ra bàn cho khách ngay đây ạ!",
      time: "07:31",
    },
  ],
  SERVICE: [
    {
      id: "srv-1",
      senderName: "Vũ Thị Mai",
      senderRole: "Phục Vụ",
      text: "Bàn 06 khách vừa vào có 4 người, em đã chuyển order vào POS rồi ạ.",
      time: "07:40",
    },
  ],
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

