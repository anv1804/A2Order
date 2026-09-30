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
  const baseClasses = "rounded-2xl border transition-all duration-200";

  const variantClasses = {
    default: "bg-white border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,.035)]",
    muted: "bg-slate-50 border-slate-200/80",
    featured: "bg-brand-900 border-brand-950 text-white shadow-elevated",
    dark: "bg-brand-950 border-brand-900 text-white shadow-xl",
  };

  const paddingClasses = {
    none: "p-0",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5",
    lg: "p-4 sm:p-6",
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
    <div className={twMerge("flex flex-col gap-3 border-b border-slate-100 pb-4 mb-4 sm:flex-row sm:items-center sm:justify-between", className)} {...props}>
      <div>
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
