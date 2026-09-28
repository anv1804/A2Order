import { create } from "zustand";
import { ToastItem, ToastType, ConfirmOptions, ConfirmState } from "@/types";

interface NotificationStore {
  toasts: ToastItem[];
  confirmState: ConfirmState;
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  toasts: [],
  confirmState: {
    isOpen: false,
    title: "",
    message: "",
  },

  addToast: (type, message, title, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, title, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  openConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmState: {
          ...options,
          isOpen: true,
          resolve,
        },
      });
    });
  },

  closeConfirm: (result) => {
    const { resolve } = get().confirmState;
    if (resolve) resolve(result);
    set({
      confirmState: {
        isOpen: false,
        title: "",
        message: "",
      },
    });
  },
}));

export const toast = {
  success: (message: string, title?: string) =>
    useNotificationStore.getState().addToast("success", message, title),
  error: (message: string, title?: string) =>
    useNotificationStore.getState().addToast("error", message, title),
  warning: (message: string, title?: string) =>
    useNotificationStore.getState().addToast("warning", message, title),
  info: (message: string, title?: string) =>
    useNotificationStore.getState().addToast("info", message, title),
};

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
  return useNotificationStore.getState().openConfirm(options);
};
