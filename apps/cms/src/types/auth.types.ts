export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  role: "SUPER_ADMIN" | "STORE_OWNER" | "ACCOUNTANT" | "CASHIER" | "CHEF" | "WAITER" | string;
  storeId?: string;
  storeName?: string | null;
}

export interface PinPadModalProps {
  isOpen: boolean;
  staffList: StaffMember[];
  onPinSubmit: (staffId: string, pin: string) => void;
  onClose?: () => void;
}

export interface AdminLoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string, rememberMe: boolean) => void;
  onNavigateToOwner?: () => void;
}

