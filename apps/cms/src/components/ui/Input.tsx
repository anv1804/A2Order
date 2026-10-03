import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { InputProps } from "@/types";
import { Icon } from "./Icon";

export interface ExtendedInputProps extends Omit<InputProps, "size"> {
  size?: "sm" | "md" | "lg";
  inputSize?: "sm" | "md" | "lg";
}

export const Input: React.FC<ExtendedInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  disabled,
  size = "md",
  inputSize,
  ...props
}) => {
  const inputId = props.id || useId();
  const effectiveSize = inputSize || size;
  const heightClasses = {
    sm: "h-8 sm:h-9 text-xs px-3",
    md: "h-9 sm:h-10 text-xs sm:text-sm px-3.5",
    lg: "h-11 text-sm px-4",
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={twMerge(
            clsx(
              "w-full rounded-xl bg-white border border-slate-200 font-semibold text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 placeholder:font-normal",
              "focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600",
              "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
              heightClasses[effectiveSize],
              leftIcon ? (effectiveSize === "sm" ? "pl-8" : "pl-9") : "",
              rightIcon ? (effectiveSize === "sm" ? "pr-8" : "pr-9") : "",
              error ? "border-rose-500 focus:ring-rose-500/10 focus:border-rose-500" : "",
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-slate-400 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
};

export interface SearchInputProps extends Omit<ExtendedInputProps, "leftIcon"> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Tìm kiếm...",
  value,
  onClear,
  className,
  size = "md",
  inputSize,
  ...props
}) => {
  return (
    <Input
      leftIcon={<Icon name="search" size={14} className="text-slate-400" />}
      rightIcon={
        value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded-md hover:bg-slate-100 transition"
            title="Xóa tìm kiếm"
            aria-label="Xóa tìm kiếm"
          >
            <Icon name="x" size={13} />
          </button>
        ) : undefined
      }
      placeholder={placeholder}
      value={value}
      size={size}
      inputSize={inputSize}
      className={className}
      {...props}
    />
  );
};
