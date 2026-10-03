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
  const baseClasses = "inline-flex items-center justify-center font-bold rounded-full select-none whitespace-nowrap";

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  const variantClasses = {
    default: "bg-surface-muted text-ink-muted border border-surface-border",
    brand: "bg-brand-100 text-brand-800 border border-brand-200",
    success: "bg-status-success-bg text-status-success-text border border-status-success-border",
    warning: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
    danger: "bg-status-danger-bg text-status-danger-text border border-status-danger-border",
    info: "bg-status-info-bg text-status-info-text border border-status-info-border",
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
