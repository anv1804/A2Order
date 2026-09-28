import React from "react";
import { Icon } from "./Icon";
import { LoadingScreenProps, LoadingSpinnerProps } from "@/types";

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Đang khởi tạo A2Order OS...",
  subMessage = "Đồng bộ dữ liệu thời gian thực và cấu hình quán",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-canvas p-6 select-none animate-fadeIn">
      {/* Background soft ambient blur */}
      <div className="absolute w-72 h-72 rounded-full bg-brand-200/40 blur-3xl -top-10 -right-10 pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-brand-500/10 blur-3xl -bottom-10 -left-10 pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm text-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-brand-900 shadow-elevated flex items-center justify-center p-3 relative overflow-hidden ring-4 ring-white shadow-2xl">
            <img
              src="/logo-symbol.jpg"
              alt="A2Order"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          {/* Orbiting spinner ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-brand-500/30 border-t-brand-700 animate-spin" />
        </div>

        {/* Brand Text */}
        <h2 className="text-xl font-black text-ink-primary tracking-tight">
          A2Order <span className="text-brand-700">OS</span>
        </h2>
        <p className="text-xs font-bold text-brand-800 mt-2 flex items-center gap-1.5">
          <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
          <span>{message}</span>
        </p>

        <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
          {subMessage}
        </p>

        {/* Progress indicator bar */}
        <div className="w-48 h-1.5 bg-surface-border rounded-full overflow-hidden mt-6">
          <div className="h-full bg-gradient-to-r from-brand-600 to-brand-800 rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  label,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div className="flex items-center justify-center gap-2 text-ink-muted">
      <div
        className={`${sizeClasses[size]} rounded-full border-brand-200 border-t-brand-800 animate-spin`}
      />
      {label && <span className="text-xs font-semibold">{label}</span>}
    </div>
  );
};
