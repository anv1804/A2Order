export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

export interface NotificationItem {
  id: string | number;
  type: "payment" | "license" | "alert" | "kds" | "security" | "system" | "inventory";
  tag: string;
  title: string;
  desc: string;
  time: string;
  icon: string;
  color: string;
  bg: string;
  isRead?: boolean;
  actionText?: string;
  actionType?: "tenants" | "invoices" | "licenses" | "kds" | "inventory";
}

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onNotificationsChange?: (items: NotificationItem[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export interface NotificationStore {
  toasts: ToastItem[];
  confirmState: ConfirmState;
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}


