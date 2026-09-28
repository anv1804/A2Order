import { z } from "zod";

// Đăng nhập Chủ quán / Super Admin bằng Email & Password
export const OwnerLoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type OwnerLoginDto = z.infer<typeof OwnerLoginSchema>;

// Đăng nhập Nhân viên phục vụ / Thu ngân / Bếp bằng Mã Fast-PIN 4 số
export const PinLoginSchema = z.object({
  storeId: z.string().min(1, "Mã quán không được để trống"),
  staffId: z.string().min(1, "Mã nhân viên không được để trống"),
  pinCode: z.string().regex(/^\d{4}$/, "Mã PIN phải gồm đúng 4 chữ số"),
});

export type PinLoginDto = z.infer<typeof PinLoginSchema>;
