import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <aside
      aria-label="Trạng thái mạng"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto pointer-events-none animate-fadeIn"
    >
      {!isOnline ? (
        <div className="bg-amber-950/95 text-amber-100 border border-amber-600/50 shadow-2xl backdrop-blur-md rounded-2xl px-4 py-2 flex items-center justify-between sm:justify-start gap-2.5 text-xs font-bold pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
              <Icon name="wifi" className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span>Mất kết nối Internet — Đang chờ tự động kết nối lại...</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        </div>
      ) : showReconnected ? (
        <div className="bg-brand-950/95 text-emerald-100 border border-emerald-500/50 shadow-2xl backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-2.5 text-xs font-bold pointer-events-auto">
          <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Icon name="checkCircle" className="w-3.5 h-3.5" />
          </span>
          <span>Đã khôi phục kết nối mạng Internet thành công.</span>
        </div>
      ) : null}
    </aside>
  );
};
