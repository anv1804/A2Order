import type React from "react";
import type { Reservation } from "./cms.types.js";

export type ReservationDateFilter = "ALL" | "TODAY" | "TOMORROW" | "THIS_WEEK";

export interface ReservationFormData {
  guestName: string;
  phone: string;
  guestCount: number;
  reservationTime: string;
  dateCategory: "TODAY" | "TOMORROW" | "THIS_WEEK";
  tableAssigned: string;
  occasion: "BIRTHDAY" | "BUSINESS" | "ANNIVERSARY" | "FAMILY" | "GENERAL";
  depositAmount: number;
  depositStatus: "UNPAID" | "PAID";
  notes: string;
  source: "LANDING_PAGE" | "PHONE_CALL" | "WALK_IN";
}

export interface ReservationKpiCardsProps {
  totalGuestsToday: number;
  pendingCount: number;
  confirmedCount: number;
  totalDeposits: number;
}

export interface ReservationFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterDate: ReservationDateFilter;
  onFilterDateChange: (date: ReservationDateFilter) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  pendingCount: number;
  confirmedCount: number;
  lateCount: number;
  arrivedCount: number;
  totalCount: number;
}

export interface ReservationCardItemProps {
  reservation: Reservation;
  onConfirm: (res: Reservation) => void;
  onArrive: (res: Reservation) => void;
  onExtend: (res: Reservation) => void;
  onMarkLate: (res: Reservation) => void;
  onOpenNoShow: (res: Reservation) => void;
  onOpenAssignTable: (res: Reservation) => void;
  onToggleDeposit: (res: Reservation) => void;
  onReject: (res: Reservation) => void;
}

export interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ReservationFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReservationFormData>>;
  availableTables: string[];
  onSubmit: (e: React.FormEvent) => void;
}

export interface AssignTableModalProps {
  target: Reservation | null;
  onClose: () => void;
  availableTables: string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
  onSave: () => void;
}

export interface NoShowResolutionModalProps {
  target: Reservation | null;
  onClose: () => void;
  depositResolution: "FORFEIT_PENALTY" | "VOUCHER_CREDIT" | "REFUNDED";
  onSelectResolution: (res: "FORFEIT_PENALTY" | "VOUCHER_CREDIT" | "REFUNDED") => void;
  onConfirm: () => void;
}
