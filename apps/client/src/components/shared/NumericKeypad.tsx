import React from "react";
import { Icon } from "@/components/ui";
import { NumericKeypadProps } from "@/types";

interface KeyItem {
  key: string;
  sub?: string;
  type: "digit" | "clear" | "delete";
}

const GLASS_KEYS: KeyItem[] = [
  { key: "1", type: "digit" },
  { key: "2", sub: "ABC", type: "digit" },
  { key: "3", sub: "DEF", type: "digit" },
  { key: "4", sub: "GHI", type: "digit" },
  { key: "5", sub: "JKL", type: "digit" },
  { key: "6", sub: "MNO", type: "digit" },
  { key: "7", sub: "PQRS", type: "digit" },
  { key: "8", sub: "TUV", type: "digit" },
  { key: "9", sub: "WXYZ", type: "digit" },
  { key: "C", type: "clear" },
  { key: "0", sub: "+", type: "digit" },
  { key: "DEL", type: "delete" },
];

const CLASSIC_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"];

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitPress,
  onDeletePress,
  onClearPress,
  variant = "glass",
}) => {
  if (variant === "classic") {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-[280px] mx-auto select-none">
        {CLASSIC_KEYS.map((item) => {
          if (item === "DEL") {
            return (
              <button
                key={item}
                type="button"
                onClick={onDeletePress}
                className="h-12 rounded-2xl bg-surface-canvas/60 hover:bg-surface-canvas active:bg-surface-border/60 flex items-center justify-center text-ink-muted active:scale-95 transition-all cursor-pointer"
                title="Xóa 1 số"
                aria-label="Xóa 1 số"
              >
                <Icon name="backspace" className="w-5 h-5 text-ink-muted" />
              </button>
            );
          }

          if (item === "C") {
            return (
              <button
                key={item}
                type="button"
                onClick={() => onClearPress?.()}
                className="h-12 rounded-2xl bg-surface-canvas/60 hover:bg-surface-canvas active:bg-surface-border/60 flex items-center justify-center text-ink-muted active:scale-95 transition-all text-base font-semibold cursor-pointer"
                title="Xóa hết"
                aria-label="Xóa toàn bộ"
              >
                C
              </button>
            );
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => onDigitPress(item)}
              className="h-12 rounded-2xl bg-surface-canvas/60 hover:bg-surface-canvas active:bg-brand-50 active:scale-95 active:text-brand-900 border border-transparent hover:border-surface-border flex items-center justify-center text-xl font-bold text-ink-primary transition-all cursor-pointer"
              aria-label={`Số ${item}`}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-fit mx-auto select-none justify-items-center items-center">
      {GLASS_KEYS.map((item) => {
        if (item.type === "delete") {
          return (
            <button
              key={item.key}
              type="button"
              onClick={onDeletePress}
              className="w-[72px] h-[72px] min-w-[72px] min-h-[72px] aspect-square rounded-full flex-shrink-0 bg-white/10 hover:bg-white/20 active:bg-white/35 active:scale-90 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 transition-all cursor-pointer shadow-sm"
              title="Xóa 1 số"
              aria-label="Xóa 1 số"
            >
              <Icon name="backspace" className="w-6 h-6 text-white" />
            </button>
          );
        }

        if (item.type === "clear") {
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onClearPress?.()}
              className="w-[72px] h-[72px] min-w-[72px] min-h-[72px] aspect-square rounded-full flex-shrink-0 bg-white/10 hover:bg-white/20 active:bg-white/35 active:scale-90 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 text-base font-semibold transition-all cursor-pointer shadow-sm"
              title="Xóa toàn bộ"
              aria-label="Xóa toàn bộ"
            >
              C
            </button>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onDigitPress(item.key)}
            className="w-[72px] h-[72px] min-w-[72px] min-h-[72px] aspect-square rounded-full flex-shrink-0 bg-white/15 hover:bg-white/25 active:bg-white/45 active:scale-90 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm text-white group"
            aria-label={`Số ${item.key}`}
          >
            <span className="text-[28px] font-light leading-none tracking-tight text-white group-active:scale-105 transition-transform">
              {item.key}
            </span>
            {item.sub ? (
              <span className="text-[9px] font-semibold tracking-widest text-white/70 uppercase leading-none mt-1">
                {item.sub}
              </span>
            ) : (
              <span className="text-[9px] opacity-0 leading-none mt-1">•</span>
            )}
          </button>
        );
      })}
    </div>
  );
};


