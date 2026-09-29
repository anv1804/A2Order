import React, { useRef, useEffect } from "react";
import { Icon } from "@/components/ui";

export interface ChatInputBarProps {
  activeChannel: "ALL" | "KITCHEN" | "CASHIER" | "WAITER";
  isTalkingPTT: boolean;
  pttSeconds: number;
  onStartPTT: (e: React.MouseEvent | React.TouchEvent) => void;
  onStopPTT: (e: React.MouseEvent | React.TouchEvent) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  variant?: "full" | "compact";
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  activeChannel,
  isTalkingPTT,
  pttSeconds,
  onStartPTT,
  onStopPTT,
  inputText,
  setInputText,
  onSendMessage,
  variant = "full",
}) => {
  const isFull = variant === "full";
  const channelName = activeChannel === "ALL" ? "Toàn Quán" : activeChannel;
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when it starts with [ (from quick alert)
  useEffect(() => {
    if (inputText.startsWith("[")) {
      inputRef.current?.focus();
    }
  }, [inputText]);

  return (
    <form
      onSubmit={onSendMessage}
      className={`${isFull ? "p-3 shrink-0" : "p-2 shrink-0"} bg-white flex items-center gap-2 relative border-t border-surface-border`}
    >
      {/* Overlay PTT Recording State */}
      {isTalkingPTT && (
        <div className="absolute inset-0 bg-rose-600 text-white flex items-center justify-center font-black animate-pulse z-10 text-xs sm:text-sm">
          <Icon name="mic" className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-bounce" />
          ĐANG NÓI BỘ ĐÀM... ({pttSeconds}s)
        </div>
      )}

      {/* Mic Button on the Left */}
      <button
        type="button"
        onMouseDown={onStartPTT}
        onMouseUp={onStopPTT}
        onTouchStart={onStartPTT}
        onTouchEnd={onStopPTT}
        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all shrink-0 active:scale-95"
      >
        <Icon name="mic" className="w-5 h-5" />
      </button>

      <input
        ref={inputRef}
        type="text"
        placeholder={`Nhắn tới ${channelName}...`}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className={`flex-1 ${isFull ? "h-10 px-4 sm:text-sm" : "h-10 px-3"} bg-surface-canvas rounded-full border border-surface-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-700`}
      />
      
      <button
        type="submit"
        disabled={!inputText.trim()}
        className={`w-10 h-10 rounded-full bg-brand-900 text-white flex items-center justify-center hover:bg-black transition-all shrink-0 disabled:opacity-30`}
      >
        <Icon name="send" className="w-4 h-4 pr-0.5" />
      </button>
    </form>
  );
};
