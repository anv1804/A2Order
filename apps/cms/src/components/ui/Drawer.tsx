import React from "react";
import { Icon } from "./Icon";
import { DrawerProps } from "@/types";

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5" />

        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">{children}</div>

        {footer && <div className="p-4 border-t border-slate-100 bg-slate-50">{footer}</div>}
      </div>
    </div>
  );
};
