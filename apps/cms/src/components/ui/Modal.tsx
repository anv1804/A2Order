import React, { useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Icon } from "./Icon";
import { Portal } from "./Portal";
import { ModalProps } from "@/types";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] bg-ink-primary/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
        <div
          className={twMerge(
            clsx(
              "bg-white rounded-2xl sm:rounded-3xl w-full p-4 sm:p-6 shadow-2xl relative animate-scaleUp border border-surface-border",
              maxWidthClasses[maxWidth]
            )
          )}
        >
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 w-8 h-8 rounded-full bg-surface-muted hover:bg-surface-border text-ink-muted flex items-center justify-center transition-all"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>

          {title && (
            <div className="mb-3.5 sm:mb-4 pr-8">
              <h3 className="text-base sm:text-lg font-bold text-ink-primary leading-tight">{title}</h3>
              {description && <p className="text-xs text-ink-muted mt-1">{description}</p>}
            </div>
          )}

          <div>{children}</div>
        </div>
      </div>
    </Portal>
  );
};

