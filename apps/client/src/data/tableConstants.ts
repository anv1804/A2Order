import { TableStatus } from "@a2order/shared";
import { ZoneFilterOption, StatusFilterOption } from "@/types";


/**
 * Danh sách khu vực chuẩn đồng bộ với Admin Platform
 */
export const DEFAULT_ZONES: ZoneFilterOption[] = [
  { id: "ALL", label: "Tất Cả Khu Vực" },
  { id: "T1", label: "Tầng 1 (Máy Lạnh)" },
  { id: "T2", label: "Tầng 2 (Sân Vườn)" },
  { id: "VIP", label: "Phòng VIP" },
  { id: "SAN_VUON", label: "Khu Ngoài Trời" },
];

/**
 * Bộ lọc trạng thái chuẩn hóa theo TableStatus của hệ thống
 */
export const TABLE_FILTER_STATUSES: StatusFilterOption[] = [
  { id: "ALL", label: "Tất Cả" },
  { id: TableStatus.EMPTY, label: "Trống" },
  { id: TableStatus.WAITING_FOOD, label: "Chờ Món" },
  { id: TableStatus.OCCUPIED, label: "Đang Dùng" },
  { id: TableStatus.PAYMENT_PENDING, label: "Chờ Tính Tiền" },
];
