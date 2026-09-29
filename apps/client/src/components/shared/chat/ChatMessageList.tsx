import React from "react";
import { Icon } from "@/components/ui";
import { sound } from "@/lib/sound";
import { IntercomMessage } from "@/types";

export interface ChatMessageListProps {
  messages: IntercomMessage[];
  currentStaffName: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  variant?: "full" | "compact";
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentStaffName,
  messagesEndRef,
  variant = "full",
}) => {
  const isFull = variant === "full";
  
  return (
    <div 
      className={`flex-1 overflow-y-auto bg-surface-canvas/30 ${
        isFull ? "p-4 space-y-3 min-h-0" : "p-3.5 space-y-2.5 max-h-[300px]"
      }`}
    >
      {messages.length === 0 ? (
        <div className={`text-center text-ink-muted text-xs ${isFull ? "py-12" : "py-8"}`}>
          Chưa có trao đổi nào ở kênh này
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.senderName === currentStaffName;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div className={`flex items-center gap-1 ${isFull ? "mb-1" : "mb-0.5"}`}>
                <span className={`font-black text-ink-secondary ${isFull ? "text-[11px]" : "text-[10px]"}`}>
                  {msg.senderName}
                </span>
                <span className={`text-ink-muted ${isFull ? "text-[10px]" : "text-[9px]"}`}>
                  ({msg.senderRole})
                </span>
                <span className={`text-ink-subtle ${isFull ? "text-[10px]" : "text-[9px]"}`}>
                  • {msg.timestamp}
                </span>
              </div>

              <div
                className={`${
                  isFull 
                    ? "max-w-[85%] sm:max-w-[70%] p-3 text-xs sm:text-sm" 
                    : "max-w-[85%] p-2.5 text-xs"
                } rounded-2xl leading-relaxed ${
                  msg.type === "QUICK_ALERT"
                    ? `bg-rose-100 text-rose-950 border border-rose-300 font-bold shadow-sm ${isMe ? "rounded-tr-xs" : "rounded-tl-xs"}`
                    : msg.type === "VOICE_NOTE"
                    ? `bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold ${isMe ? "rounded-tr-xs shadow-sm" : "rounded-tl-xs"}`
                    : isMe
                    ? `bg-brand-900 text-white ${isFull ? "rounded-tr-xs shadow-sm" : "rounded-tr-xs"}`
                    : "bg-white text-ink-primary border border-surface-border rounded-tl-xs shadow-2xs"
                }`}
              >
                {msg.type === "VOICE_NOTE" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => sound.playWalkieBeep("press")}
                      className={`${
                        isFull ? "w-7 h-7" : "w-6 h-6"
                      } rounded-full bg-emerald-600 text-white flex items-center justify-center`}
                    >
                      <Icon name="volume2" className={isFull ? "w-3.5 h-3.5" : "w-3 h-3"} />
                    </button>
                    <span>
                      {isFull ? "Ghi âm bộ đàm" : "Bộ đàm thoại"} ({msg.audioDurationSec}s)
                    </span>
                  </div>
                )}
                {msg.type !== "VOICE_NOTE" && <span>{msg.content}</span>}
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
