import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Icon } from "./Icon";
import { ModalProps } from "@/types";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={twMerge(
          clsx(
            "bg-white rounded-3xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 border border-slate-100",
            maxWidthClasses[maxWidth]
          )
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
        >
          <Icon name="x" className="w-4 h-4" />
        </button>

        {title && (
          <div className="mb-4 pr-8">
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};
