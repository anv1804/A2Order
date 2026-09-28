import { z } from "zod";

// Schema gọi món (từ Phục vụ hoặc Khách quét QR)
export const SubmitOrderItemSchema = z.object({
  menuItemId: z.string().min(1, "Thiếu mã món"),
  quantity: z.number().int().min(1, "Số lượng tối thiểu là 1"),
  notes: z.string().max(200, "Ghi chú tối đa 200 ký tự").optional(),
});

export const SubmitOrderBatchSchema = z.object({
  tableId: z.string().min(1, "Thiếu mã bàn"),
  items: z.array(SubmitOrderItemSchema).min(1, "Đơn hàng phải có ít nhất 1 món"),
  isCustomerQr: z.boolean().default(false), // Xác định là khách tự quét hay phục vụ gửi
});

export type SubmitOrderBatchDto = z.infer<typeof SubmitOrderBatchSchema>;
