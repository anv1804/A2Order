/**
 * 6 CẤP PHÂN QUYỀN HỆ THỐNG A2ORDER
 */
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN", // Quản trị viên nền tảng (Toàn hệ thống)
  STORE_OWNER = "STORE_OWNER", // Chủ nhà hàng (Toàn quyền 1 quán)
  ACCOUNTANT = "ACCOUNTANT",   // Kế toán (Tài chính, dòng tiền, báo cáo)
  CASHIER = "CASHIER",         // Thu ngân (Thanh toán, in bill, VietQR)
  CHEF = "CHEF",               // Đầu bếp / Pha chế (KDS Bếp/Bar, báo hết món)
  WAITER = "WAITER",           // Nhân viên phục vụ (Xem bàn, gọi món, duyệt món)
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
