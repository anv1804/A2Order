import React, { useState, useRef, useEffect } from "react";
import { Icon, Button, Badge } from "@/components/ui";
import { sound } from "@/lib/sound";
import { toast } from "@/stores/notificationStore";
import { IntercomMessage, StaffIntercomWidgetProps } from "@/types";
import { INITIAL_MESSAGES } from "@/data";

import { ChatMessageList } from "./chat/ChatMessageList";
import { ChatChannelTabs } from "./chat/ChatChannelTabs";
import { QuickAlertBar } from "./chat/QuickAlertBar";
import { ChatInputBar } from "./chat/ChatInputBar";

export const StaffIntercomWidget: React.FC<StaffIntercomWidgetProps> = ({
  currentStaffName,
  currentStaffRole,
  fullScreenMode = false,
  tables = [],
}) => {
  const [isOpen, setIsOpen] = useState(fullScreenMode);
  const [activeChannel, setActiveChannel] = useState<"ALL" | "KITCHEN" | "CASHIER" | "WAITER">("ALL");
  const [inputText, setInputText] = useState("");
  const [isTalkingPTT, setIsTalkingPTT] = useState(false);
  const [pttSeconds, setPttSeconds] = useState(0);
  const pttTimerRef = useRef<any>(null);

  const [messages, setMessages] = useState<IntercomMessage[]>(INITIAL_MESSAGES);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  // Push to talk start
  const handleStartPTT = () => {
    setIsTalkingPTT(true);
    setPttSeconds(0);
    sound.playWalkieBeep("press");
    pttTimerRef.current = setInterval(() => {
      setPttSeconds((s) => s + 1);
    }, 1000);
  };

  // Push to talk end
  const handleStopPTT = () => {
    if (!isTalkingPTT) return;
    setIsTalkingPTT(false);
    if (pttTimerRef.current) {
      clearInterval(pttTimerRef.current);
      pttTimerRef.current = null;
    }
    sound.playWalkieBeep("release");

    const duration = Math.max(1, pttSeconds);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newVoiceMsg: IntercomMessage = {
      id: `v-${Date.now()}`,
      senderName: currentStaffName,
      senderRole: currentStaffRole,
      targetRole: activeChannel,
      content: `[Tin nhắn thoại đàm thoại bộ đàm: ${duration}s]`,
      timestamp: timeStr,
      type: "VOICE_NOTE",
      audioDurationSec: duration,
    };

    setMessages((prev) => [...prev, newVoiceMsg]);
    toast.success(`Đã phát bộ đàm (${duration}s) đến kênh ${activeChannel === "ALL" ? "Toàn Bộ" : activeChannel}!`);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newMsg: IntercomMessage = {
      id: `m-${Date.now()}`,
      senderName: currentStaffName,
      senderRole: currentStaffRole,
      targetRole: activeChannel,
      content: inputText.trim(),
      timestamp: timeStr,
      type: inputText.trim().startsWith("[") ? "QUICK_ALERT" : "TEXT",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    sound.playKitchenChime();
  };

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<{text: string, target: string} | null>(null);

  const handleSendQuickAlert = (alertText: string, target: "ALL" | "KITCHEN" | "WAITER" | "CASHIER") => {
    setPendingAlert({ text: alertText, target });
    setIsTableModalOpen(true);
  };

  const handleSelectTableForAlert = (tableName: string) => {
    if (!pendingAlert) return;
    
    const finalAlertText = tableName === "Không xác định" 
      ? `[${pendingAlert.text}]` 
      : `[${pendingAlert.text}] - ${tableName}`;
      
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newMsg: IntercomMessage = {
      id: `qa-${Date.now()}`,
      senderName: currentStaffName,
      senderRole: currentStaffRole,
      targetRole: pendingAlert.target as any,
      content: finalAlertText,
      timestamp: timeStr,
      type: "QUICK_ALERT",
    };

    setMessages((prev) => [...prev, newMsg]);
    sound.playIntercomRing();
    toast.info(`Đã phát tín hiệu khẩn: "${finalAlertText}"`);
    
    setIsTableModalOpen(false);
    setPendingAlert(null);
  };

  const filteredMessages = messages.filter((m) => {
    if (activeChannel === "ALL") return true;
    return m.targetRole === "ALL" || m.targetRole === activeChannel;
  });

  const variant = fullScreenMode ? "full" : "compact";

  const renderSharedComponents = () => (
    <>
      <ChatChannelTabs 
        activeChannel={activeChannel} 
        setActiveChannel={setActiveChannel} 
        variant={variant} 
      />
      <ChatMessageList 
        messages={filteredMessages} 
        currentStaffName={currentStaffName} 
        messagesEndRef={messagesEndRef} 
        variant={variant} 
      />
      <QuickAlertBar 
        activeChannel={activeChannel} 
        onSendAlert={handleSendQuickAlert} 
        variant={variant} 
      />
      <ChatInputBar 
        activeChannel={activeChannel}
        isTalkingPTT={isTalkingPTT}
        pttSeconds={pttSeconds}
        onStartPTT={handleStartPTT}
        onStopPTT={handleStopPTT}
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={handleSendMessage}
        variant={variant}
      />

      {isTableModalOpen && pendingAlert && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[80vh]">
            <div className="bg-brand-950 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <h3 className="font-black text-sm">Chọn bàn gắn với cảnh báo</h3>
              <button onClick={() => setIsTableModalOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 bg-brand-50 shrink-0 border-b border-brand-100">
              <p className="text-sm font-bold text-brand-900 mb-1">
                Cảnh báo: <span className="text-rose-600">[{pendingAlert.text}]</span>
              </p>
              <p className="text-[11px] font-semibold text-brand-700/80">
                Hệ thống đang tự động lọc các bàn phù hợp. Chọn một bàn bên dưới để gửi lệnh ngay lập tức!
              </p>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-2.5">
              {(!tables || tables.length === 0 || tables.filter((t: any) => t.status !== "EMPTY").length === 0) ? (
                <div className="col-span-2 text-center text-ink-muted text-xs py-8">
                  Không tìm thấy bàn nào đang hoạt động
                </div>
              ) : (
                tables.filter((t: any) => t.status !== "EMPTY").map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTableForAlert(t.name)}
                    className="p-3 rounded-2xl border-2 border-surface-border bg-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:border-brand-300 hover:shadow-md"
                  >
                    <span className="font-black text-ink-primary">{t.name}</span>
                    <span className="text-[10px] text-ink-muted font-semibold">{t.zoneName || t.zone}</span>
                  </button>
                ))
              )}
              
              <div className="col-span-2 mt-2 pt-4 border-t border-surface-border">
                <button
                  onClick={() => handleSelectTableForAlert("Không xác định")}
                  className="w-full py-3 rounded-xl bg-surface-canvas text-ink-subtle text-xs font-bold hover:bg-surface-hover hover:text-ink-primary transition-colors"
                >
                  Gửi chung chung (Không gắn với bàn)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (fullScreenMode) {
    return (
      <div className="w-full flex-1 bg-white flex flex-col overflow-hidden animate-fadeIn">
        {renderSharedComponents()}
      </div>
    );
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2 px-4 py-3 rounded-full bg-brand-950 text-white hover:bg-black shadow-xl ring-2 ring-white/20 active:scale-95 transition-all"
        >
          <div className="relative">
            <Icon name="messageSquare" className="w-5 h-5 text-brand-300" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
          </div>
          <span className="text-xs font-black tracking-tight hidden sm:inline">Bộ Đàm & Chat Nội Bộ</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat / Walkie-Talkie Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-surface-border flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="bg-brand-950 text-white p-4 pb-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-800 text-brand-300 flex items-center justify-center">
                <Icon name="volume2" className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  Intercom Bộ Đàm Nội Bộ
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                    Trực Tuyến
                  </span>
                </h4>
                <p className="text-[10px] text-brand-200/80">
                  {currentStaffName} ({currentStaffRole})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  sound.playIntercomRing();
                  toast.info("Đã phát chuông gọi loa toàn quán!");
                }}
                title="Bấm chuông gọi loa"
                className="w-7 h-7 rounded-full flex items-center justify-center text-brand-200 hover:text-white hover:bg-white/10"
              >
                <Icon name="bell" className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-brand-200 hover:text-white hover:bg-white/10"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {renderSharedComponents()}
        </div>
      )}
    </>
  );
};
