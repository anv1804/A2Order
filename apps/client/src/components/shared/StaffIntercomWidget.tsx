import { browserRequest } from "@a2order/shared";
import { useResource, useAntiSpamAction } from "@a2order/shared/react";
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

  const [messages, refreshMessages] = useResource<IntercomMessage[]>("/workforce/intercom", []);
  const recorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const recordingStarted = useRef(0);
  const recordingRequested = useRef(false);
  const recordingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const send = useAntiSpamAction("intercom", (payload: unknown, key) => browserRequest("/workforce/intercom", { method: "POST", headers: { "x-idempotency-key": key }, body: JSON.stringify(payload) }));
  const transmit = async (payload: unknown) => { try { const result = await send.execute(payload); if (!result) return false; await refreshMessages(); return true; } catch (e: any) { toast.error(e.message); return false; } };
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      recordingRequested.current = false; if (recordingTimeout.current) clearTimeout(recordingTimeout.current); if (recorder.current) recorder.current.onstop = null; mediaStream.current?.getTracks().forEach(track => track.stop());
      if (pttTimerRef.current) {
        clearInterval(pttTimerRef.current);
      }
    };
  }, []);

  // Push to talk start
  const handleStartPTT = async () => {
 if (recordingRequested.current || recorder.current?.state === "recording") return;
 if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return toast.error("Trình duyệt cần HTTPS và hỗ trợ ghi âm");
 recordingRequested.current = true;
 try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  if (!recordingRequested.current) { stream.getTracks().forEach(t => t.stop()); return; }
  mediaStream.current = stream; const chunks: BlobPart[] = [];
  const type = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t));
  const device = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 24000 }); recorder.current = device;
  device.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  device.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); mediaStream.current = null;
    const duration = Math.max(1, Math.min(30, Math.round((Date.now() - recordingStarted.current) / 1000)));
    const blob = new Blob(chunks, { type: device.mimeType });
    if (!blob.size || blob.size > 220000) return toast.error("Bản ghi quá lớn hoặc không có âm thanh");
    const reader = new FileReader(); reader.onload = () => { void transmit({ targetRole: activeChannel, type: "VOICE_NOTE", content: "", audioUrl: String(reader.result), audioDurationSec: duration }).then(ok => { if (ok) toast.success("Đã gửi bản ghi âm"); }); }; reader.readAsDataURL(blob);
  };
  recordingStarted.current = Date.now(); setIsTalkingPTT(true); setPttSeconds(0); device.start();
  pttTimerRef.current = setInterval(() => setPttSeconds(Math.min(30, Math.round((Date.now() - recordingStarted.current) / 1000))), 1000);
  recordingTimeout.current = setTimeout(() => handleStopPTT(), 30000);
 } catch { recordingRequested.current = false; toast.error("Không thể truy cập micro"); }
};

  // Push to talk end
  const handleStopPTT = () => { recordingRequested.current = false; setIsTalkingPTT(false); if (pttTimerRef.current) clearInterval(pttTimerRef.current); if (recordingTimeout.current) clearTimeout(recordingTimeout.current); if (recorder.current?.state === "recording") recorder.current.stop(); };

  const handleSendMessage = async (e?: React.FormEvent) => { e?.preventDefault(); const content = inputText.trim(); if (!content) return; if (await transmit({ content, targetRole: activeChannel, type: content.startsWith("[") ? "QUICK_ALERT" : "TEXT" })) setInputText(value => value.trim() === content ? "" : value); };

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<{text: string, target: string} | null>(null);

  const handleSendQuickAlert = (alertText: string, target: "ALL" | "KITCHEN" | "WAITER" | "CASHIER") => {
    setPendingAlert({ text: alertText, target });
    setIsTableModalOpen(true);
  };

  const handleSelectTableForAlert = async (tableName: string) => { if (!pendingAlert) return; const content = "[" + pendingAlert.text + "]" + (tableName === "Không xác định" ? "" : " - " + tableName); if (await transmit({ content, targetRole: pendingAlert.target, type: "QUICK_ALERT" })) { setIsTableModalOpen(false); setPendingAlert(null); toast.success("Đã gửi tín hiệu"); } };

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
