import { z } from "zod";

// Đăng nhập Chủ quán / Super Admin bằng Email & Password
export const OwnerLoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
});

export type OwnerLoginDto = z.infer<typeof OwnerLoginSchema>;

/**
 * Quy ước tiền tố 2 số đầu cho Mã PIN 6 số:
 * - 10: Phục vụ (WAITER)
 * - 20: Thu ngân (CASHIER)
 * - 30: Đầu bếp / Pha chế (CHEF)
 * - 40: Kế toán (ACCOUNTANT)
 * - 80: Quản lý ca (STORE_MANAGER)
 * - 90: Chủ quán (STORE_OWNER)
 */
export const STAFF_PIN_PREFIX = {
  WAITER: "10",
  CASHIER: "20",
  CHEF: "30",
  ACCOUNTANT: "40",
  STORE_MANAGER: "80",
  STORE_OWNER: "90",
} as const;

export const staffPinRole = (pinCode: string) =>
  (Object.entries(STAFF_PIN_PREFIX).find(([, prefix]) => pinCode.startsWith(prefix))?.[0] ?? null) as keyof typeof STAFF_PIN_PREFIX | null;

export const generateStaffPin = (role: string) => {
  const prefix = STAFF_PIN_PREFIX[role as keyof typeof STAFF_PIN_PREFIX] || "10";
  const random4 = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${random4}`;
};

// Hai số đầu định tuyến vai trò; toàn bộ sáu số xác thực nhân sự POS.
export const PinLoginSchema = z.object({
  storeId: z.string().min(1, "Mã quán không được để trống"),
  pinCode: z.string().regex(/^(10|20|30|40|80|90|99)\d{4}$/, "Mã PIN phải gồm đúng 6 số và 2 số đầu là mã vai trò"),
});

export type PinLoginDto = z.infer<typeof PinLoginSchema>;
