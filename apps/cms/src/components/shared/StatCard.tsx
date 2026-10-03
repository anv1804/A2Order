import React from "react";
import { Icon, IconName } from "@/components/ui/Icon";
import { clsx } from "clsx";

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: IconName;
  badge?: {
    text: string;
    variant?: "success" | "warning" | "info" | "danger" | "neutral";
  } | string;
  variant?: "default" | "featured" | "success" | "info" | "warning" | "danger";
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtext,
  icon,
  badge,
  variant = "default",
  onClick,
  className = "",
}) => {
  const isClickable = Boolean(onClick);

  // Variant themes
  const iconThemeMap: Record<string, { iconBg: string; iconColor: string; iconBorder: string; badgeClass: string }> = {
    default: {
      iconBg: "bg-emerald-50 stat-icon-default",
      iconColor: "text-emerald-800",
      iconBorder: "border-emerald-200",
      badgeClass: "bg-surface-muted text-ink-muted border-surface-border",
    },
    success: {
      iconBg: "bg-emerald-50 stat-icon-success",
      iconColor: "text-emerald-800",
      iconBorder: "border-emerald-200",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    info: {
      iconBg: "bg-blue-50 stat-icon-info",
      iconColor: "text-blue-800",
      iconBorder: "border-blue-200",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    },
    warning: {
      iconBg: "bg-amber-50 stat-icon-warning",
      iconColor: "text-amber-800",
      iconBorder: "border-amber-200",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    },
    danger: {
      iconBg: "bg-rose-50 stat-icon-danger",
      iconColor: "text-rose-800",
      iconBorder: "border-rose-200",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    },
    featured: {
      iconBg: "bg-white/10",
      iconColor: "text-white",
      iconBorder: "border-white/20",
      badgeClass: "bg-white/15 text-white border-white/20",
    },
  };

  const currentTheme = iconThemeMap[variant] || iconThemeMap.default;

  if (variant === "featured") {
    return (
      <article
        onClick={onClick}
        className={clsx(
          "group overflow-hidden rounded-2xl bg-[#061F17] bg-brand-gradient border border-brand-800 p-3.5 sm:p-4 text-white shadow-elevated transition hover:scale-[1.01] flex flex-col justify-between min-h-[125px] sm:min-h-[135px]",
          isClickable && "cursor-pointer",
          className
        )}
      >
        <div className="flex justify-between items-start mb-2">
          {icon && (
            <span
              className={clsx(
                "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border",
                currentTheme.iconBg,
                currentTheme.iconColor,
                currentTheme.iconBorder
              )}
            >
              <Icon name={icon} size={16} />
            </span>
          )}
          {badge && (
            <span
              className={clsx(
                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                currentTheme.badgeClass
              )}
            >
              {typeof badge === "string" ? badge : badge.text}
            </span>
          )}
        </div>
        <div>
          <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-200 mb-0.5 truncate">
            {title}
          </h4>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
            {value}
          </p>
          {subtext && (
            <p className="text-[11px] font-semibold text-emerald-200/80 mt-1 truncate">
              {subtext}
            </p>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      className={clsx(
        "group overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-3.5 sm:p-4 shadow-card transition hover:shadow-md hover:border-brand-400/40 flex flex-col justify-between min-h-[125px] sm:min-h-[135px]",
        isClickable && "cursor-pointer",
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        {icon && (
          <span
            className={clsx(
              "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition-colors group-hover:scale-105",
              currentTheme.iconBg,
              currentTheme.iconColor,
              currentTheme.iconBorder
            )}
          >
            <Icon name={icon} size={16} />
          </span>
        )}
        {badge && (
          <span
            className={clsx(
              "text-[10px] font-bold px-2 py-0.5 rounded-md border",
              typeof badge === "object" && badge.variant
                ? iconThemeMap[badge.variant]?.badgeClass || currentTheme.badgeClass
                : currentTheme.badgeClass
            )}
          >
            {typeof badge === "string" ? badge : badge.text}
          </span>
        )}
      </div>

      <div>
        <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-ink-muted mb-0.5 truncate">
          {title}
        </h4>
        <p className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight leading-tight truncate">
          {value}
          {unit && <span className="text-xs font-bold text-ink-muted ml-1">{unit}</span>}
        </p>
        {subtext && (
          <p className="text-[11px] font-semibold text-ink-muted mt-1 truncate">
            {subtext}
          </p>
        )}
      </div>
    </article>
  );
};
