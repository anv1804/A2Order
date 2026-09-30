import { useEffect, useId, useRef, useState } from "react";
import { confirmDialog } from "@/stores/notificationStore";
import { useUnsavedChanges } from "@/stores/unsavedChangesStore";

export const useUnsavedEditor = (source: string, isOpen: boolean, signature: string, onClose: () => void) => {
  const id = useId();
  const latestSignature = useRef(signature);
  const baseline = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  latestSignature.current = signature;

  useEffect(() => {
    if (!isOpen) {
      baseline.current = null;
      setReady(false);
      return;
    }
    const frame = requestAnimationFrame(() => {
      baseline.current = latestSignature.current;
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const dirty = isOpen && ready && baseline.current !== null && signature !== baseline.current;
  useUnsavedChanges(`${source}:${id}`, dirty);

  const requestClose = async () => {
    if (dirty) {
      const discard = await confirmDialog({
        title: "Bỏ thay đổi chưa lưu?",
        message: "Những thông tin bạn vừa chỉnh sửa sẽ không được lưu.",
        confirmText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        variant: "warning",
      });
      if (!discard) return;
    }
    onClose();
  };

  return { dirty, requestClose };
};
