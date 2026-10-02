/**
 * TÊN CÁC SỰ KIỆN WEBSOCKET REAL-TIME GIỮA CLIENT VÀ SERVER
 */
export const SocketEvents = {
  // Kết nối & Phòng
  JOIN_STORE: "join_store",           // Client tham gia vào phòng của quán: room:store_${storeId}
  LEAVE_STORE: "leave_store",

  // Cấu hình & Phiên bản (Cache isolation per store)
  CONFIG_UPDATED: "store:config_updated", // Bắn khi chủ quán nhấn "Áp dụng thay đổi" (Publish)

  // Hạ tầng & Giám sát (Super Admin Telemetry)
  PING: "telemetry:ping",
  PONG: "telemetry:pong",
  TELEMETRY_STAT: "telemetry:stat",

  // Bàn & Sơ đồ bàn
  TABLE_STATUS_UPDATED: "table:status_updated",
  TABLE_TRANSFERRED: "table:transferred",
  TABLE_MERGED: "table:merged",

  // Đơn hàng & Gọi món
  ORDER_SUBMITTED: "order:submitted",          // Có đơn mới từ phục vụ hoặc khách QR
  ORDER_BATCH_ADDED: "order:batch_added",      // Khách gọi thêm đợt 2, đợt 3
  ORDER_ITEM_STATUS_CHANGED: "order:item_status_changed", // Bếp đổi Đang nấu -> Xong
  ORDER_APPROVAL_REQUESTED: "order:approval_requested", // Đơn hàng chờ quán duyệt trước khi vào bếp
  ORDER_APPROVED: "order:approved",            // Quán duyệt đơn vào bếp
  ORDER_REJECTED: "order:rejected",            // Quán từ chối đơn
  ORDER_ITEM_CANCELLED: "order:item_cancelled", // Khách hủy món khi chưa làm

  // Hỗ trợ nhanh tại bàn (Quick Assistance)
  SERVICE_REQUESTED: "service:requested",      // Khách gọi đá, giấy, dọn bàn, gọi phục vụ...

  // Bếp KDS
  KITCHEN_ALERT: "kitchen:alert",              // Chuông báo KDS
  ITEM_86_TOGGLED: "menu:item_86_toggled",    // Bếp bật/tắt hết món

  // Thu ngân & Thanh toán
  BILL_REQUESTED: "billing:requested",        // Khách gọi tính tiền
  PAYMENT_CONFIRMED: "billing:payment_confirmed", // Đã nhận tiền (qua Webhook VietQR hoặc Tiền mặt)

  // Phiên bàn & Xác nhận mở bàn QR (Session-based Table Security)
  SESSION_REQUESTED: "table:session_requested", // Khách quét QR yêu cầu mở bàn
  SESSION_APPROVED: "table:session_approved",   // Nhân viên bấm duyệt mở bàn
  SESSION_REJECTED: "table:session_rejected",   // Nhân viên từ chối
  SESSION_CLOSED: "table:session_closed",       // Thanh toán / Đóng phiên bàn
} as const;

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
