# ⚡ TIÊU CHUẨN HIỆU NĂNG & TỐI ƯU HÓA HỆ THỐNG (PERFORMANCE & OPTIMIZATION)

> **Mục tiêu**: Đảm bảo toàn bộ ứng dụng chạy siêu tốc, phản hồi dưới $100\text{ms}$, tiết kiệm tối đa băng thông 4G/5G và không rò rỉ bộ nhớ (Zero Memory Leak) khi hoạt động liên tục 24/7.

---

## 1. PHÂN TÁCH BUNDLE & CODE-SPLITTING (`apps/client`)

### 1.1. Tách Rẽ Luồng Khách Gọi Món QR
* **Vấn đề trước đây**: Thực khách quét mã QR tại bàn phải tải toàn bộ bundle chứa cả POS Thu ngân, Màn hình Bếp KDS và Quản lý ca làm việc (dung lượng **489 kB**). Đồng thời phải đợi các API nhân viên nội bộ hoàn tất mới hiển thị.
* **Giải pháp kiến trúc**:
  1. Khi URL bắt đầu bằng `/order`, bỏ qua việc tải trước dữ liệu nhân viên trong `App.tsx`, hiển thị trang gọi món ngay lập tức.
  2. Áp dụng `React.lazy` kết hợp `React.Suspense` phân tách riêng các module:
     * `CustomerTableOrderPage`: **92.20 kB** (nén gzip: **26.11 kB**)
     * `CashierWorkstation`: **15.26 kB**
     * `StaffScheduleProfile`: **12.46 kB**
     * `MenuDashboard`: **5.44 kB**
  3. Chunking Vendor qua Rollup:
     * `vendor-react` (`react`, `react-dom`): **133.93 kB**
     * `vendor-icons` (`lucide-react`): **38.18 kB**
     * Bundle khởi động chính giảm **60%**, từ **489.01 kB** xuống **196.98 kB**.

---

## 2. QUẢN LÝ DỮ LIỆU ĐỘNG & LOẠI BỎ DATA CỨNG (ZERO MOCK DATA)

Tất cả các bộ lọc danh mục, khu vực bàn, chương trình khuyến mãi đều được tính động qua `useMemo` từ dữ liệu thực tế của cửa hàng thay vì import mảng tĩnh:

```typescript
// Trích xuất khu vực thực tế từ dữ liệu bàn hiện hữu của quán
const dynamicZones = React.useMemo(() => {
  const zoneMap = new Map<string, string>();
  tables.forEach((t: any) => {
    if (t.zone) zoneMap.set(t.zone, t.zoneName || t.zone);
  });
  return [
    { id: "ALL", label: "Tất Cả Khu Vực" },
    ...Array.from(zoneMap.entries()).map(([id, label]) => ({ id, label })),
  ];
}, [tables]);
```

Khi danh sách dữ liệu rỗng (quán mới mở), hệ thống hiển thị **Empty State Donezo Forest Green chuẩn hóa**, hướng dẫn người dùng tạo bàn hoặc thêm món thay vì hiển thị dữ liệu giả định.

---

## 3. CHỐNG RÒ RỈ BỘ NHỚ SERVER & CLIENT (LEAK RESILIENCE)

### 3.1. Dọn Dẹp Đơn Chờ Treo (TTL Garbage Collection trên Server)
* Các đơn hàng tạm thời chờ quán duyệt (`pendingOrders`) được dọn rác định kỳ mỗi giờ:
```typescript
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const ORDER_TTL_MS = 12 * 60 * 60 * 1000; // 12 tiếng

setInterval(() => {
  const now = Date.now();
  for (const [id, order] of pendingOrders.entries()) {
    if (now - order.submittedAt > ORDER_TTL_MS) {
      pendingOrders.delete(id);
    }
  }
}, CLEANUP_INTERVAL_MS).unref?.();
```
* Hàm `.unref()` bảo đảm timer không giữ Node.js event loop khi tiến trình server shutdown.

### 3.2. Dọn Dẹp Timer & Event Listener trên Client
* Mọi timer (như bộ đàm Push-to-Talk `pttTimerRef`, đếm ngược giờ bàn) đều có unmount cleanup trong `useEffect`:
```typescript
useEffect(() => {
  return () => {
    if (pttTimerRef.current) clearInterval(pttTimerRef.current);
  };
}, []);
```
* Mọi sự kiện DOM (`popstate`, `scroll`, `resize`, `keydown`) đều bắt buộc remove trong cleanup function của `useEffect`.

---

## 4. CHIẾN LƯỢC CACHING PWA & OFFLINE

1. **Vite PWA Plugin**:
   * Cấu hình `registerType: "autoUpdate"`.
   * Tự động sinh `sw.js` và `workbox` precache toàn bộ assets tĩnh (HTML, CSS, JS, Fonts, Icons).
   * Theme PWA: `#12372A` (Donezo Forest Green), nền `#F4F5F6`.
2. **Local Storage / Session Storage Cache**:
   * Lưu trữ mã PIN, ca làm việc, giỏ hàng bàn ăn, tự phục hồi trạng thái khi nhân viên lỡ tải lại trang.
