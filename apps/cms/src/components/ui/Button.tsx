import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ButtonProps } from "@/types";

export interface ExtendedButtonProps extends Omit<ButtonProps, "variant" | "size"> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "emerald";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ExtendedButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  isLoading = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all duration-150 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 shrink-0";

  const sizeClasses = {
    xs: "min-h-7 h-7 px-2.5 text-[11px] rounded-lg",
    sm: "min-h-8 sm:min-h-9 h-8 sm:h-9 px-3 text-xs",
    md: "min-h-9 sm:min-h-10 h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm",
    lg: "min-h-11 h-11 px-5 text-sm",
    xl: "min-h-12 h-12 px-6 text-base font-extrabold",
  };

  const variantClasses = {
    primary: "bg-brand-900 hover:bg-brand-950 text-white shadow-2xs hover:shadow-xs",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800",
    emerald: "bg-brand-400 hover:bg-brand-300 text-brand-950 font-black shadow-2xs hover:shadow-xs",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs hover:shadow-xs",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    outline: "border border-slate-200/90 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300",
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
