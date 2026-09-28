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
    "inline-flex items-center justify-center font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";

  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs rounded-xl",
    md: "h-11 px-5 text-sm rounded-2xl",
    lg: "h-13 px-6 text-base rounded-2xl",
    xl: "h-14 px-8 text-lg font-extrabold rounded-3xl",
  };

  const variantClasses = {
    primary: "bg-brand-800 hover:bg-brand-900 text-white shadow-card hover:shadow-elevated",
    secondary: "bg-surface-muted hover:bg-slate-200 text-ink-primary",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-card",
    ghost: "bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink-primary",
    outline: "border border-surface-border bg-white text-ink-primary hover:bg-surface-muted",
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
