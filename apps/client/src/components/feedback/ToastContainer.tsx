import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import { ToastType } from "@/types";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
          bg: "bg-emerald-950/90 border-emerald-800 text-white",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
          bg: "bg-rose-950/90 border-rose-800 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
          bg: "bg-amber-950/90 border-amber-800 text-white",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
          bg: "bg-slate-900/90 border-slate-700 text-white",
        };
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md animate-in slide-in-from-top-2 duration-150 ${config.bg}`}
          >
            {config.icon}
            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="font-bold text-xs">{toast.title}</h5>}
              <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
