import React from "react";
import { Icon, IconName } from "@/components/ui/Icon";

export interface HeroChip {
  icon?: IconName;
  label: React.ReactNode;
  variant?: "default" | "amber" | "teal" | "emerald" | "rose" | "blue";
  highlight?: boolean;
}

export interface HeroBannerProps {
  badge?: {
    label: string;
    dot?: boolean;
    variant?: "default" | "amber" | "teal";
  } | string;
  tagline?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  chips?: HeroChip[];
  actions?: React.ReactNode;
  className?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  badge,
  tagline,
  title,
  description,
  chips,
  actions,
  className = "",
}) => {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#061F17] bg-brand-gradient p-4 sm:p-6 lg:p-7 text-white shadow-xl border border-white/10 ${className}`}
    >
      {/* Soft glowing ambient orb */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        {/* Left: Titles, Badge, Tagline, Quick Chips */}
        <div className="min-w-0 flex-1">
          {(badge || tagline) && (
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              {badge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-2xs">
                  {typeof badge === "object" && badge.dot !== false && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {typeof badge === "string" ? badge : badge.label}
                </span>
              )}
              {tagline && (
                <span className="text-xs text-emerald-200/90 font-bold tracking-wide font-mono">
                  {tagline}
                </span>
              )}
            </div>
          )}

          <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
            {title}
          </h2>

          {description && (
            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}

          {/* Quick Live Stats Chips */}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-3.5">
              {chips.map((chip, index) => {
                const isHighlight = chip.highlight;
                const baseChipClass =
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-colors shadow-2xs";

                let variantStyle = "bg-white/10 border border-white/15 text-emerald-100 hover:bg-white/15";
                let iconColor = "text-emerald-300";

                if (chip.variant === "amber" || isHighlight) {
                  variantStyle = "bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold";
                  iconColor = "text-amber-300";
                } else if (chip.variant === "teal") {
                  variantStyle = "bg-teal-500/20 border border-teal-400/40 text-teal-200 font-bold";
                  iconColor = "text-teal-300";
                } else if (chip.variant === "blue") {
                  variantStyle = "bg-blue-500/20 border border-blue-400/40 text-blue-200 font-bold";
                  iconColor = "text-blue-300";
                } else if (chip.variant === "rose") {
                  variantStyle = "bg-rose-500/20 border border-rose-400/40 text-rose-200 font-bold";
                  iconColor = "text-rose-300";
                }

                return (
                  <span key={index} className={`${baseChipClass} ${variantStyle}`}>
                    {chip.icon && <Icon name={chip.icon} size={13} className={iconColor} />}
                    <span>{chip.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        {actions && (
          <div className="flex items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};
