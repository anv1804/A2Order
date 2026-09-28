import React from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import { Button, Modal, Icon } from "@/components/ui";

export const ConfirmDialog: React.FC = () => {
  const { confirmState, closeConfirm } = useNotificationStore();

  if (!confirmState.isOpen) return null;

  return (
    <Modal
      isOpen={confirmState.isOpen}
      onClose={() => closeConfirm(false)}
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <Icon name="alert" className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1.5">{confirmState.title}</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{confirmState.message}</p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            variant="secondary"
            onClick={() => closeConfirm(false)}
            className="w-full"
          >
            {confirmState.cancelText || "Hủy bỏ"}
          </Button>

          <Button
            variant={confirmState.variant === "danger" ? "danger" : "primary"}
            onClick={() => closeConfirm(true)}
            className="w-full"
          >
            {confirmState.confirmText || "Xác nhận"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
