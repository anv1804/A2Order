import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BadgeProps } from "@/types";

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-bold rounded-full select-none";

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  const variantClasses = {
    default: "bg-surface-muted text-ink-muted border border-surface-border",
    brand: "bg-brand-100 text-brand-800 border border-brand-200",
    success: "bg-[#E8F5EE] text-[#194B3A] border border-[#A3DBCE]",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-rose-50 text-rose-800 border border-rose-200",
    info: "bg-blue-50 text-blue-800 border border-blue-200",
    outline: "bg-transparent text-ink-muted border border-surface-border",
  };

  return (
    <span
      className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
};
