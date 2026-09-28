import React from "react";
import {
  LayoutGrid,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  ShoppingCart,
  QrCode,
  Printer,
  Check,
  AlertTriangle,
  Trash2,
  Clock,
  Users,
  Plus,
  Minus,
  LogOut,
  Search,
  Lock,
  RotateCw,
  LucideIcon,
} from "lucide-react";
import { IconProps, IconName } from "@/types";

const iconMap: Record<IconName, LucideIcon> = {
  table: LayoutGrid,
  kitchen: ChefHat,
  cashier: Receipt,
  menu: UtensilsCrossed,
  cart: ShoppingCart,
  vietqr: QrCode,
  print: Printer,
  check: Check,
  alert: AlertTriangle,
  trash: Trash2,
  clock: Clock,
  users: Users,
  plus: Plus,
  minus: Minus,
  logout: LogOut,
  search: Search,
  lock: Lock,
  refresh: RotateCw,
};

export const Icon: React.FC<IconProps> = ({ name, className = "w-5 h-5", size = 20 }) => {
  const Component = iconMap[name] || AlertTriangle;
  return <Component className={className} size={size} strokeWidth={2} />;
};
