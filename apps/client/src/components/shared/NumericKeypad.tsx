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
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-xs mx-auto">
      {digits.map((item) => {
        if (item === "DEL") {
          return (
            <button
              key={item}
              type="button"
              onClick={onDeletePress}
              className="h-12 sm:h-14 rounded-2xl bg-surface-canvas hover:bg-surface-border/60 active:bg-surface-border border border-surface-border flex items-center justify-center text-ink-muted active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Xóa 1 ký tự"
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
              onClick={onClearPress}
              className="h-12 sm:h-14 rounded-2xl bg-surface-canvas hover:bg-surface-border/60 active:bg-surface-border border border-surface-border flex items-center justify-center text-red-600 active:scale-95 transition-all text-base font-extrabold cursor-pointer shadow-2xs"
              title="Xóa toàn bộ"
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
            className="h-12 sm:h-14 rounded-2xl bg-white shadow-2xs border border-surface-border hover:border-brand-300 hover:bg-brand-50/40 active:bg-brand-100/70 flex items-center justify-center text-ink-primary active:scale-95 transition-all text-xl font-black cursor-pointer"
          >
            {item}
          </button>
        );
      })}
    </div>
  );
};
