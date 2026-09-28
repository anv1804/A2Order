export type IconName =
  | "table"
  | "kitchen"
  | "cashier"
  | "menu"
  | "cart"
  | "vietqr"
  | "print"
  | "check"
  | "alert"
  | "trash"
  | "clock"
  | "users"
  | "plus"
  | "minus"
  | "logout"
  | "search"
  | "lock"
  | "refresh";

export interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}
