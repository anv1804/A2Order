import React, { useEffect, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Icon } from "./Icon";
import { Portal } from "./Portal";
import { ModalProps } from "@/types";
import { confirmDialog } from "@/stores/notificationStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  priority = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const initialSnapshot = useRef("");
  const [hasEdited, setHasEdited] = useState(false);
  const dirtyId = useId();

  const captureSnapshot = () => JSON.stringify(Array.from(contentRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select") || [])
    .filter((field) => !(field instanceof HTMLInputElement && ["hidden", "button", "submit", "reset"].includes(field.type)))
    .map((field) => field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type) ? field.checked : field.value));

  const updateEdited = () => {
    const dirty = captureSnapshot() !== initialSnapshot.current;
    setHasEdited(dirty);
    useUnsavedChangesStore.getState().setDirty(dirtyId, dirty);
  };

  const requestClose = async () => {
    if (hasEdited) {
      const discard = await confirmDialog({
        title: "Bỏ thay đổi chưa lưu?",
        message: "Những thông tin bạn vừa chỉnh sửa sẽ không được lưu.",
        confirmText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        variant: "warning",
      });
      if (!discard) return;
    }
    useUnsavedChangesStore.getState().setDirty(dirtyId, false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const frame = requestAnimationFrame(() => { initialSnapshot.current = captureSnapshot(); setHasEdited(false); });
      return () => {
        cancelAnimationFrame(frame);
        document.body.style.overflow = "";
        useUnsavedChangesStore.getState().setDirty(dirtyId, false);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, dirtyId]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <Portal>
      <div className={`${priority ? "z-[10000]" : "z-[100]"} fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fadeIn`}>
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          onInputCapture={updateEdited}
          onChangeCapture={updateEdited}
          className={twMerge(
            clsx(
              "bg-white rounded-t-3xl sm:rounded-2xl w-full max-h-[92dvh] overflow-y-auto p-4 pt-7 sm:p-6 shadow-2xl relative animate-scaleUp border border-slate-200",
              maxWidthClasses[maxWidth]
            )
          )}
        >
          <button
            onClick={requestClose}
            aria-label="Đóng hộp thoại"
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
