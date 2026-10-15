import React from "react";
import { TableStatus } from "@a2order/shared";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted" | "dark" | "featured";
  padding?: "none" | "sm" | "md" | "lg";
}

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "brand";
  size?: "sm" | "md";
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  onClearPress?: () => void;
}

export interface TableStatusBadgeProps {
  status: TableStatus;
  className?: string;
}

export interface AppShellProps {
  storeName: string;
  userName: string;
  userRole: string;
  activeTab: "tables" | "kds" | "billing" | "menu" | "settings";
  onTabChange: (tab: "tables" | "kds" | "billing" | "menu" | "settings") => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: any;
  badge?: string | number;
  description?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  labelPrefix?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  showSearch?: boolean;
  align?: "left" | "right" | "auto";
  id?: string;
}

export interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
  label?: React.ReactNode;
  size?: "sm" | "md";
}

export interface PortalProps {
  children: React.ReactNode;
}

export interface MobileInfiniteSentinelProps {
  hasMore: boolean;
  totalCount: number;
  visibleCount?: number;
  displayedCount?: number;
  isLoadingMore?: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  className?: string;
}

export interface CmsPageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface UseMobileInfiniteScrollProps<T> {
  items: T[];
  pageSize?: number;
  mobileBreakpoint?: number;
}

export interface UnsavedChangesState {
  dirtySources: Record<string, boolean>;
  setDirty: (source: string, dirty: boolean) => void;
  clearAll: () => void;
}


