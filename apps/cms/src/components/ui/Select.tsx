import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  size?: "sm" | "md" | "lg";
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  leftIcon,
  options,
  children,
  className,
  size = "md",
  disabled,
  ...props
}) => {
  const selectId = props.id || useId();
  const heightClasses = {
    sm: "h-8 text-xs",
    md: "h-9 sm:h-10 text-xs sm:text-sm",
    lg: "h-11 text-sm",
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-bold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <select
          id={selectId}
          disabled={disabled}
          className={twMerge(
            clsx(
              "w-full appearance-none rounded-xl bg-white border border-slate-200 pl-3.5 pr-9 font-semibold text-slate-900 shadow-2xs transition-all",
              "focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600",
              "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
              heightClasses[size],
              leftIcon && "pl-9",
              error ? "border-rose-500 focus:ring-rose-500/10" : "",
              className
            )
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 text-slate-400 pointer-events-none"
        />
      </div>
      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
};
