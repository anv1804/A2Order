// Tự động quét và dọn sạch TOÀN BỘ dữ liệu mock / fake cũ còn sót lại trong localStorage của trình duyệt
export function runStorageCleanup(): void {
  if (typeof window === "undefined") return;

  const storeFakeKeys = [
    "a2order_customers_data",
    "a2order_delivery_orders",
    "a2order_einvoice_records",
    "a2order_tables_zones_data",
    "a2order_staff_order_tables_data",
    "a2order_staff_order_active_table",
    "a2order_kds_tickets_data",
    "a2order_reservations_data",
    "a2order_reservations_filter_date",
    "a2order_reservations_filter_status",
    "a2order_inventory_data",
    "a2order_inventory_ingredients",
    "a2order_inventory_receipts",
    "a2order_inventory_recipes",
    "a2order_staff_users_data",
    "a2order_staff_list",
    "a2order_attendance_logs",
    "a2order_staff_attendance_logs",
    "a2order_menu_dishes_data",
    "a2order_sales_bills_data",
    "a2order_analytics_bills",
    "a2order_void_audit_canceled_items",
    "a2order_analytics_canceled_items",
    "a2order_hardware_printers",
    "a2order_promotions_data",
    "a2order_promotions_list",
    "a2order_calendar_notes",
    "a2order_a2order_calendar_notes",
    "a2order_crm_campaigns",
    "a2order_notifications",
  ];

  const MOCK_PATTERNS = [
    "Khu Máy Lạnh",
    "Sân Vườn Thoáng Mát",
    "Phòng Tiệc VIP",
    "Bác Hùng",
    "Cô Hương Lan",
    "QUẨY BAR",
    "Quẩy Bar",
    "B12-004",
    "B03-005",
    "Coca Cola Tươi",
    "Bia Tiger Lon Bạc",
    "Sinh Tố Bơ Đắk Lắk",
    "Phở Bò Tái Nạm",
    "Bún Chả Hà Nội",
    "HD-2026",
    "Anh Hoàng Tuấn",
    "Chị Thảo Mai",
    "note-init-1",
    "Kiểm tra số lượng nguyên liệu",
    "Chúc Mừng Sinh Nhật Hội Viên (Tự Động)",
    "Kéo Khách Quen 30 Ngày Chưa Quay Lại",
    "INV-2026-0091",
    "Trà Sữa Topping Đô Đô",
    "Quán Cà Phê Muối Chú Long",
  ];

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("a2order_")) {
        const val = localStorage.getItem(key) || "";
        if (MOCK_PATTERNS.some((p) => val.includes(p))) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage iteration error
  }

  if (!localStorage.getItem("a2order_store_fake_cleared_v7")) {
    storeFakeKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem("a2order_store_fake_cleared_v7", "true");
  }
}
