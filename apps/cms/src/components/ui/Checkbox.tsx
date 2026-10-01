import React from "react";
import { Check, Minus } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
  label?: React.ReactNode;
  size?: "sm" | "md";
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  className,
  id,
  title,
  label,
  size = "md",
}) => {
  const isCheckedOrIndeterminate = checked || indeterminate;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !disabled) {
      e.preventDefault();
      e.stopPropagation();
      onChange(!checked);
    }
  };

  const boxSizeClass = size === "sm" ? "w-3.5 h-3.5 rounded" : "w-4 h-4 rounded-[5px]";
  const iconSize = size === "sm" ? 10 : 11;

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-disabled={disabled}
      disabled={disabled}
      title={title}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={twMerge(
        clsx(
          "inline-flex items-center gap-2 select-none cursor-pointer group text-left p-0.5 -m-0.5 rounded focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          className
        )
      )}
    >
      <div
        className={twMerge(
          clsx(
            boxSizeClass,
            "flex items-center justify-center transition-all duration-150 shrink-0",
            isCheckedOrIndeterminate
              ? "bg-emerald-600 border border-emerald-600 text-white shadow-xs group-hover:bg-emerald-700 group-hover:border-emerald-700"
              : "bg-white border-[1.5px] border-slate-300 text-transparent group-hover:border-emerald-500 shadow-2xs",
            "group-focus-visible:ring-2 group-focus-visible:ring-emerald-500/40 group-focus-visible:ring-offset-1"
          )
        )}
      >
        {indeterminate ? (
          <Minus size={iconSize} strokeWidth={3.5} className="text-white shrink-0" />
        ) : (
          <Check
            size={iconSize}
            strokeWidth={3.5}
            className={clsx(
              "transition-transform duration-100 shrink-0",
              checked ? "scale-100 opacity-100 text-white" : "scale-50 opacity-0"
            )}
          />
        )}
      </div>
      {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
    </button>
  );
};

