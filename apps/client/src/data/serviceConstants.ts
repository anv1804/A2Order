import { VoucherItem, ServiceOptionItem } from "@/types";


/**
 * Danh sách Voucher hệ thống
 */
export const SAMPLE_VOUCHERS: VoucherItem[] = [];

/**
 * Các yêu cầu phục vụ nhanh tại bàn
 */
export const SERVICE_OPTIONS: ServiceOptionItem[] = [
  { id: "ICE", icon: "snowflake", label: "Thêm đá lạnh", desc: "Đem thêm xô hoặc ly đá" },
  { id: "TISSUE", icon: "fileText", label: "Thêm khăn giấy", desc: "Bổ sung hộp khăn giấy" },
  { id: "CLEAN", icon: "trash", label: "Dọn dẹp bàn", desc: "Thu dọn vỏ chai, đĩa dư" },
  { id: "UTENSILS", icon: "utensils", label: "Thêm chén đũa", desc: "Thêm bát đĩa, muỗng đũa" },
  { id: "WAITER", icon: "bell", label: "Gọi nhân viên", desc: "Nhân viên tới bàn hỗ trợ" },
  { id: "BILL", icon: "creditCard", label: "Yêu cầu tính tiền", desc: "In hóa đơn thanh toán" },
];
