import React from "react";
import { Icon, IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?:
    | {
        label: string;
        onClick: () => void;
        icon?: IconName;
        variant?: "primary" | "secondary" | "outline";
      }
    | React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "search",
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-surface-border bg-surface-card/60 ${className}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700 mb-3.5 shadow-2xs">
        <Icon name={icon} size={28} />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-ink-primary mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-ink-muted max-w-sm leading-relaxed mb-4">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-1">
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button
              variant={(action as any).variant || "primary"}
              size="sm"
              onClick={(action as any).onClick}
              className="gap-1.5 shadow-xs"
            >
              {(action as any).icon && <Icon name={(action as any).icon} size={14} />}
              <span>{(action as any).label}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
