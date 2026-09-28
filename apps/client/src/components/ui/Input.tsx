import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { InputProps } from "@/types";

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          disabled={disabled}
          className={twMerge(
            clsx(
              "w-full h-11 rounded-xl bg-white border border-slate-300 px-3.5 text-sm font-medium text-slate-900 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              error ? "border-rose-500 focus:ring-rose-500" : "",
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-slate-400 pointer-events-none flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
};
