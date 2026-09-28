import React from "react";
import { Delete } from "lucide-react";
import { NumericKeypadProps } from "@/types";

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitPress,
  onDeletePress,
  onClearPress,
}) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {digits.map((item) => {
        if (item === "DEL") {
          return (
            <button
              key={item}
              type="button"
              onClick={onDeletePress}
              className="h-16 rounded-2xl bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-700 active:scale-95 transition-all text-xl font-semibold"
            >
              <Delete className="w-6 h-6" />
            </button>
          );
        }

        if (item === "C") {
          return (
            <button
              key={item}
              type="button"
              onClick={onClearPress}
              className="h-16 rounded-2xl bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-500 active:scale-95 transition-all text-xl font-bold"
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
            className="h-16 rounded-2xl bg-white shadow-sm border border-slate-200 active:bg-blue-50 flex items-center justify-center text-slate-900 active:scale-95 transition-all text-2xl font-bold"
          >
            {item}
          </button>
        );
      })}
    </div>
  );
};
