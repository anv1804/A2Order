import { VoucherItem, ServiceOptionItem } from "@/types";


/**
 * Danh sách Voucher mẫu chuẩn hóa
 */
export const SAMPLE_VOUCHERS: VoucherItem[] = [
  { code: "A2GIAM10", discountType: "PERCENT", value: 10, description: "Giảm 10% tổng hóa đơn gọi món" },
  { code: "A2GIAM20K", discountType: "FIXED", value: 20000, description: "Giảm trực tiếp 20.000 đ cho đơn từ 80k", minOrder: 80000 },
  { code: "VIP15", discountType: "PERCENT", value: 15, description: "Ưu đãi 15% cho thành viên thân thiết" },
  { code: "FREESHIP", discountType: "FIXED", value: 15000, description: "Tặng voucher 15.000 đ trải nghiệm tại bàn" },
];

/**
 * Các yêu cầu phục vụ nhanh tại bàn
 */
export const SERVICE_OPTIONS: ServiceOptionItem[] = [
  { id: "ice", emoji: "🧊", label: "Thêm đá lạnh", desc: "Đem thêm xô hoặc ly đá" },
  { id: "napkin", emoji: "🧻", label: "Thêm khăn giấy", desc: "Bổ sung hộp khăn giấy" },
  { id: "clean", emoji: "🧹", label: "Dọn dẹp bàn", desc: "Thu dọn vỏ chai, đĩa dư" },
  { id: "utensils", emoji: "🥢", label: "Thêm chén đũa", desc: "Thêm bát đĩa, muỗng đũa" },
  { id: "waiter", emoji: "🙋", label: "Gọi nhân viên", desc: "Nhân viên tới bàn hỗ trợ" },
  { id: "bill", emoji: "💳", label: "Yêu cầu tính tiền", desc: "In hóa đơn thanh toán" },
];
