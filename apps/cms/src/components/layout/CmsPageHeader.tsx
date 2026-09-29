import React from "react";

export interface CmsPageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const CmsPageHeader: React.FC<CmsPageHeaderProps> = ({
  title,
  badge,
  description,
  actions,
  className = "",
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
            {title}
          </h2>
          {badge && (
            typeof badge === "string" ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs">
                {badge}
              </span>
            ) : (
              badge
            )
          )}
        </div>
        {description && (
          <p className="text-xs text-ink-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
