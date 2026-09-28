/**
 * TRẠNG THÁI CỦA PHIÊN ĂN, ĐỢT GỌI VÀ TỪNG MÓN ĂN
 */

// Trạng thái phiên ăn của bàn
export enum SessionStatus {
  ACTIVE = "ACTIVE",       // Đang diễn ra
  COMPLETED = "COMPLETED", // Đã thanh toán xong
  CANCELLED = "CANCELLED", // Hủy bàn
}

// Trạng thái từng món ăn trên màn hình KDS Bếp
export enum OrderItemStatus {
  QUEUED = "QUEUED",       // Đang chờ bếp nhận (mới gửi)
  COOKING = "COOKING",     // Bếp đang chế biến
  DONE = "DONE",           // Bếp đã nấu xong, chờ bưng
  SERVED = "SERVED",       // Nhân viên đã bưng ra bàn
  CANCELLED = "CANCELLED", // Đã hủy (cần mã PIN quản lý)
}

// Phân trạm chế biến
export enum StationType {
  KITCHEN = "KITCHEN", // Bếp nấu
  BAR = "BAR",         // Quầy pha chế đồ uống
}
