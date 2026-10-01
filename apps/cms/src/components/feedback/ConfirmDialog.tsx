import React from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import { Button, Modal, Icon } from "@/components/ui";

export const ConfirmDialog: React.FC = () => {
  const { confirmState, closeConfirm } = useNotificationStore();

  if (!confirmState.isOpen) return null;

  const isDanger = confirmState.variant === "danger";
  const isWarning = confirmState.variant === "warning";

  return (
    <Modal
      isOpen={confirmState.isOpen}
      onClose={() => closeConfirm(false)}
      maxWidth="sm"
      priority
    >
      <div className="flex flex-col items-center text-center py-1">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-2xs border ${
            isDanger
              ? "bg-rose-50 border-rose-200/80 text-rose-600"
              : isWarning
              ? "bg-amber-50 border-amber-200/80 text-amber-600"
              : "bg-emerald-50 border-emerald-200/80 text-emerald-600"
          }`}
        >
          <Icon name={isDanger ? "alert" : isWarning ? "alert" : "info"} className="w-7 h-7" />
        </div>

        <h3 className="text-base sm:text-lg font-black text-slate-950 mb-1.5 tracking-tight">
          {confirmState.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-[280px]">
          {confirmState.message}
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            variant="secondary"
            onClick={() => closeConfirm(false)}
            className="w-full py-2.5 rounded-xl font-bold"
          >
            {confirmState.cancelText || "Hủy bỏ"}
          </Button>

          <Button
            variant={isDanger ? "danger" : "primary"}
            onClick={() => closeConfirm(true)}
            className="w-full py-2.5 rounded-xl font-black shadow-sm"
          >
            {confirmState.confirmText || "Xác nhận"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
