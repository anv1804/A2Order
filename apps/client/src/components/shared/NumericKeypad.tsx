import React from "react";
import { Icon } from "@/components/ui";
import { NumericKeypadProps } from "@/types";

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitPress,
  onDeletePress,
  onClearPress,
}) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-[280px] mx-auto select-none">
      {digits.map((item) => {
        if (item === "DEL") {
          return (
            <button
              key={item}
              type="button"
              onClick={onDeletePress}
              className="h-12 rounded-2xl bg-surface-canvas/50 hover:bg-surface-canvas active:bg-surface-border/60 flex items-center justify-center text-ink-muted active:scale-95 transition-all cursor-pointer"
              title="Xóa 1 số"
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
              className="h-12 rounded-2xl bg-surface-canvas/50 hover:bg-surface-canvas active:bg-surface-border/60 flex items-center justify-center text-ink-muted active:scale-95 transition-all text-base font-semibold cursor-pointer"
              title="Xóa hết"
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
          >
            {item}
          </button>
        );
      })}
    </div>
  );
};
