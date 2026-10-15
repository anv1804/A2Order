import { VoucherItem, ServiceOptionItem } from "@/types";


/**
 * Danh sách Voucher hệ thống
 */
export const SAMPLE_VOUCHERS: VoucherItem[] = [];

/**
 * Các yêu cầu phục vụ nhanh tại bàn
 */
export const SERVICE_OPTIONS: ServiceOptionItem[] = [
  { id: "ice", icon: "snowflake", label: "Thêm đá lạnh", desc: "Đem thêm xô hoặc ly đá" },
  { id: "napkin", icon: "fileText", label: "Thêm khăn giấy", desc: "Bổ sung hộp khăn giấy" },
  { id: "clean", icon: "trash", label: "Dọn dẹp bàn", desc: "Thu dọn vỏ chai, đĩa dư" },
  { id: "utensils", icon: "utensils", label: "Thêm chén đũa", desc: "Thêm bát đĩa, muỗng đũa" },
  { id: "waiter", icon: "bell", label: "Gọi nhân viên", desc: "Nhân viên tới bàn hỗ trợ" },
  { id: "bill", icon: "creditCard", label: "Yêu cầu tính tiền", desc: "In hóa đơn thanh toán" },
];
