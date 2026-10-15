/**
 * 6 CẤP PHÂN QUYỀN HỆ THỐNG A2ORDER
 */
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN", // Quản trị viên nền tảng (Toàn hệ thống SaaS)
  STORE_OWNER = "STORE_OWNER", // Chủ nhà hàng (Toàn quyền 1 quán)
  ACCOUNTANT = "ACCOUNTANT",   // Kế toán (Tài chính, dòng tiền, báo cáo, VAT)
  CASHIER = "CASHIER",         // Thu ngân (POS, mở bàn, in bill, Dynamic VietQR)
  CHEF = "CHEF",               // Đầu bếp / Pha chế (Tablet KDS, SLA bếp, báo hết món)
  WAITER = "WAITER",           // Nhân viên phục vụ (PWA di động, gọi món T9, nhận đồ bếp)
}

/**
 * Tên hiển thị tiếng Việt thân thiện
 */
export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Quản trị viên nền tảng",
  [UserRole.STORE_OWNER]: "Chủ quán",
  [UserRole.ACCOUNTANT]: "Kế toán",
  [UserRole.CASHIER]: "Thu ngân",
  [UserRole.CHEF]: "Đầu bếp / Pha chế",
  [UserRole.WAITER]: "Phục vụ bàn",
};

/**
 * 1. Nhóm Quản trị (Back-Office / CMS Hub - Port 3001/3002)
 */
export const MANAGEMENT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.STORE_OWNER,
  UserRole.ACCOUNTANT,
];

/**
 * 2. Nhóm Vận hành tại chỗ (Operations Suite / POS - Port 3000)
 */
export const OPERATIONAL_ROLES: UserRole[] = [
  UserRole.CASHIER,
  UserRole.CHEF,
  UserRole.WAITER,
];

/**
 * Kiểm tra xem role thuộc nhóm quản trị hay vận hành
 */
export function isManagementRole(role: string): boolean {
  return MANAGEMENT_ROLES.includes(role as UserRole);
}

export function isOperationalRole(role: string): boolean {
  return OPERATIONAL_ROLES.includes(role as UserRole);
}

/**
 * Ứng dụng mặc định cho từng role
 */
export function getRoleTargetApp(role: string): { app: "cms" | "pos"; port: number; defaultPath: string } {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return { app: "cms", port: 3001, defaultPath: "/admin" };
    case UserRole.STORE_OWNER:
      return { app: "cms", port: 3001, defaultPath: "/dashboard" };
    case UserRole.ACCOUNTANT:
      return { app: "cms", port: 3001, defaultPath: "/analytics" };
    case UserRole.CASHIER:
      return { app: "pos", port: 3000, defaultPath: "/pos" };
    case UserRole.CHEF:
      return { app: "pos", port: 3000, defaultPath: "/kds" };
    case UserRole.WAITER:
      return { app: "pos", port: 3000, defaultPath: "/waiter" };
    default:
      return { app: "pos", port: 3000, defaultPath: "/" };
  }
}
