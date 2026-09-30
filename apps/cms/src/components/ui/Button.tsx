import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ButtonProps } from "@/types";

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-150 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

  const sizeClasses = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-10 px-4 text-sm",
    lg: "min-h-11 px-5 text-sm",
    xl: "min-h-12 px-6 text-base font-extrabold",
  };

  const variantClasses = {
    primary: "bg-brand-800 hover:bg-brand-900 text-white shadow-sm hover:shadow-md",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-300",
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
