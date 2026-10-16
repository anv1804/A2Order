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
      {label && <label className="text-sm font-semibold text-ink-primary">{label}</label>}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-ink-muted pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          disabled={disabled}
          className={twMerge(
            clsx(
              "w-full min-h-12 rounded-2xl bg-white border border-surface-border px-3.5 text-base font-medium text-ink-primary transition-all",
              "focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800",
              "disabled:bg-surface-canvas disabled:text-ink-subtle disabled:cursor-not-allowed",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              error ? "border-rose-500 focus:ring-rose-500" : "",
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-ink-muted pointer-events-none flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
};
