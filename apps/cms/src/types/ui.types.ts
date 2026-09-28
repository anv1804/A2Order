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

