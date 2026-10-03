import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { Portal } from "./Portal";
import { toast } from "@/stores/notificationStore";

interface FloatingSupportGroupProps {
  storeName?: string;
  storeId?: string;
  currentUser?: any;
}

export type StoreChannelId = "ALL" | "CASHIER_BAR" | "KITCHEN" | "SERVICE";

export interface ChannelDef {
  id: StoreChannelId;
  name: string;
  tag: string;
  desc: string;
  quickChips: string[];
}

export interface StaffChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  time: string;
  isCurrentUser?: boolean;
}

const CHANNELS: ChannelDef[] = [
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

const INITIAL_MESSAGES: Record<StoreChannelId, StaffChatMessage[]> = {
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

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
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

export const FloatingSupportGroup: React.FC<FloatingSupportGroupProps> = ({
  storeName = "Tiệm Trà Sữa Đài Loan",
  storeId = "store-bubble-tea",
  currentUser,
}) => {
  // 1. Back to Top state
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const mainEl = document.getElementById("cms-main-scroll");

    const checkScroll = () => {
      const topOffset = mainEl ? mainEl.scrollTop : window.scrollY;
      if (topOffset > 200 || window.scrollY > 200) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", checkScroll, { passive: true, capture: true });
    if (mainEl) {
      mainEl.addEventListener("scroll", checkScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", checkScroll, { capture: true });
      if (mainEl) {
        mainEl.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    const mainEl = document.getElementById("cms-main-scroll");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 2. Chat Drawer State: Kênh Chat Nội Bộ Nhân Viên (KHÔNG BOT)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<StoreChannelId>("ALL");
  const [chatInput, setChatInput] = useState("");
  const [channelMessages, setChannelMessages] = useState<Record<StoreChannelId, StaffChatMessage[]>>(INITIAL_MESSAGES);

  const activeChannelDef = CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0];
  const currentMessages = channelMessages[activeChannel] || [];

  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userRole = currentUser?.role === "STORE_OWNER" ? "Chủ Quán" : (currentUser?.role || "Chủ Quán");
    const userName = currentUser?.name || "Chủ Quán";

    const newMsg: StaffChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: userName,
      senderRole: userRole,
      text: trimmed,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      isCurrentUser: true,
    };

    setChannelMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }));

    if (!customText) {
      setChatInput("");
    }
  };

  // 3. Admin Request Modal state (Nút cảnh báo Warning)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    category: "TECH_SUPPORT",
    priority: "NORMAL",
    contactPhone: "",
    content: "",
  });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const handleSubmitAdminRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.content.trim()) {
      toast.error("Vui lòng nhập nội dung yêu cầu gửi tới Admin");
      return;
    }

    setIsSubmittingAdmin(true);
    setTimeout(() => {
      setIsSubmittingAdmin(false);
      setIsAdminModalOpen(false);
      setAdminForm({
        category: "TECH_SUPPORT",
        priority: "NORMAL",
        contactPhone: "",
        content: "",
      });
      toast.success(
        "Đã gửi yêu cầu khẩn cấp tới Quản Trị Viên A2Order! Đội ngũ kỹ thuật trung tâm sẽ liên hệ xử lý ngay."
      );
    }, 700);
  };

  return (
    <>
      {/* KHỐI NÚT NỔI Ở GÓC DƯỚI BÊN PHẢI (FLOATING DOCK) */}
      <div className="fixed bottom-20 lg:bottom-6 right-3.5 sm:right-6 z-40 flex flex-col items-end gap-2.5">
        {/* Nút 1: Lên đầu trang (Back to top) */}
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            title="Lên đầu trang"
            aria-label="Lên đầu trang"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/90 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 animate-fadeIn"
          >
            <Icon name="chevronUp" size={20} />
          </button>
        )}

        {/* Nút 2: Nút Yêu Cầu Admin - CHỈ ICON WARNING THEO YÊU CẦU */}
        <button
          type="button"
          onClick={() => setIsAdminModalOpen(true)}
          title="Báo sự cố & Gửi yêu cầu trợ giúp tới Admin"
          aria-label="Gửi yêu cầu trợ giúp tới Admin"
          className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-amber-400/40"
        >
          <Icon name="alert" size={20} className="text-white" />
        </button>

        {/* Nút 3: Kênh chat nội bộ nhân viên quán (KHÔNG PHẢI VỚI BOT) */}
        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Kênh chat nội bộ nhân viên quán"
          aria-label="Kênh chat nội bộ nhân viên quán"
          className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#061F17] bg-brand-gradient text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-500/30"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <Icon name="chat" size={21} className="text-emerald-200" />
        </button>
      </div>

      {/* POPUP 1: KÊNH CHAT NỘI BỘ NHÂN VIÊN QUÁN */}
      {isChatOpen && (
        <Portal>
          <div className="fixed bottom-20 lg:bottom-20 right-3.5 sm:right-6 z-50 w-[94vw] sm:w-[410px] max-h-[580px] h-[540px] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden animate-scaleUp">
            {/* Header: Kênh chat nhân viên */}
            <div className="p-3.5 sm:p-4 bg-[#061F17] bg-brand-gradient text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-300">
                  <Icon name="chat" size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black truncate">Kênh Chat Nội Bộ Quán</h4>
                  <p className="text-[10px] text-emerald-200/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{storeName} • Các trạm trực tuyến</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Danh sách Channel Tabs (#toan-quan, #thu-ngan-bar, #bep-kds, #phuc-vu) */}
            <div className="flex items-center border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 overflow-x-auto no-scrollbar">
              {CHANNELS.map((ch) => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChannel(ch.id)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                      isActive
                        ? "bg-[#102d25] text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>{ch.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Channel Info Bar */}
            <div className="px-3.5 py-1.5 bg-slate-100/70 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold truncate">{activeChannelDef.name}: {activeChannelDef.desc}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                {currentMessages.length} tin
              </span>
            </div>

            {/* Quick Actions Chips for Staff */}
            <div className="px-3 py-1.5 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10.5px]">
              {activeChannelDef.quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(undefined, chip)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold whitespace-nowrap transition border border-emerald-100/80 shrink-0 active:scale-95"
                >
                  + {chip}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-slate-50/50 sidebar-scroll">
              {currentMessages.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Icon name="chat" size={24} className="mx-auto mb-1.5 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Chưa có tin nhắn trong {activeChannelDef.tag}</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Gửi tin nhắn đầu tiên để điều phối nhân sự ca</p>
                </div>
              ) : (
                currentMessages.map((m) => {
                  const isMe = m.isCurrentUser;
                  const roleBadge = ROLE_BADGES[m.senderRole] || { bg: "bg-slate-100", text: "text-slate-700" };

                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10.5px] font-black text-slate-700">
                          {isMe ? "Bạn (Chủ Quán)" : m.senderName}
                        </span>
                        {!isMe && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${roleBadge.bg} ${roleBadge.text}`}>
                            {m.senderRole}
                          </span>
                        )}
                        <span className="text-[9.5px] text-slate-400 font-mono">{m.time}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs break-words ${
                          isMe
                            ? "bg-emerald-800 text-white rounded-tr-xs font-medium"
                            : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Nhắn tin vào ${activeChannelDef.tag}...`}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                title="Gửi tin nhắn"
                className="h-8.5 px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
              >
                <Icon name="send" size={14} />
              </button>
            </form>
          </div>
        </Portal>
      )}

      {/* POPUP 2: MODAL GỬI YÊU CẦU TỚI ADMIN (KHI ẤN ICON WARNING) */}
      {isAdminModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3.5 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp">
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 text-white border border-white/20 flex items-center justify-center">
                    <Icon name="alert" size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black">Báo Sự Cố & Yêu Cầu Admin</h3>
                    <p className="text-[11px] text-amber-100">Kênh hỗ trợ khẩn cấp từ Ban Quản Trị Hệ Thống A2Order</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitAdminRequest} className="p-4 sm:p-6 space-y-4">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Cửa Hàng Yêu Cầu</span>
                    <strong className="text-slate-900">{storeName}</strong>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white text-slate-800 border border-amber-200 font-mono text-[10px] font-black">
                    {storeId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Loại sự cố / Chủ đề
                    </label>
                    <select
                      value={adminForm.category}
                      onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:border-amber-600 focus:outline-none"
                    >
                      <option value="INCIDENT">⚡ Báo sự cố gián đoạn ca bán</option>
                      <option value="TECH_SUPPORT">🛠️ Hỗ trợ kỹ thuật / Máy in bill</option>
                      <option value="LICENSE_UPGRADE">💳 Gia hạn gói phần mềm / Két</option>
                      <option value="FEATURE_REQUEST">💡 Đề xuất tính năng mới</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Mức độ khẩn cấp
                    </label>
                    <select
                      value={adminForm.priority}
                      onChange={(e) => setAdminForm({ ...adminForm, priority: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:border-amber-600 focus:outline-none"
                    >
                      <option value="CRITICAL">🚨 Khẩn cấp (Đang trong ca bán)</option>
                      <option value="URGENT">Cần hỗ trợ sớm trong ngày</option>
                      <option value="NORMAL">Bình thường</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Số điện thoại liên hệ trực tiếp
                  </label>
                  <input
                    type="tel"
                    value={adminForm.contactPhone}
                    onChange={(e) => setAdminForm({ ...adminForm, contactPhone: e.target.value })}
                    placeholder="Nhập số điện thoại chủ quán hoặc quản lý ca trực..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Chi tiết vấn đề cần Admin hỗ trợ *
                  </label>
                  <textarea
                    rows={4}
                    value={adminForm.content}
                    onChange={(e) => setAdminForm({ ...adminForm, content: e.target.value })}
                    placeholder="Mô tả cụ thể sự cố hoặc nội dung cần Admin xử lý..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-amber-600 focus:outline-none resize-none leading-relaxed"
                    required
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdmin || !adminForm.content.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Icon name="send" size={14} />
                    <span>{isSubmittingAdmin ? "Đang gửi..." : "Gửi Báo Cáo Sự Cố"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

