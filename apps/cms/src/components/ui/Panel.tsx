import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PanelProps, PanelHeaderProps } from "@/types";

export const Panel: React.FC<PanelProps> = ({
  children,
  className,
  variant = "default",
  padding = "md",
  ...props
}) => {
  const baseClasses = "rounded-3xl border transition-all";

  const variantClasses = {
    default: "bg-surface-card border-surface-border shadow-card",
    muted: "bg-surface-muted border-surface-border",
    featured: "bg-brand-900 border-brand-950 text-white shadow-elevated",
    dark: "bg-brand-950 border-brand-900 text-white shadow-xl",
  };

  const paddingClasses = {
    none: "p-0",
    sm: "p-3.5",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={twMerge(clsx(baseClasses, variantClasses[variant], paddingClasses[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
  ...props
}) => {
  return (
    <div className={twMerge("flex items-center justify-between pb-3.5 mb-3.5 border-b border-surface-border/60", className)} {...props}>
      <div>
        <h3 className="text-base font-extrabold text-ink-primary leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
