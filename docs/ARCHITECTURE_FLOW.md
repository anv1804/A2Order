# 🏗️ KIẾN TRÚC VÀ LUỒNG DỮ LIỆU TOÀN HỆ THỐNG (ARCHITECTURE & DATA FLOW v7.0.0)

> **Dự án**: A2Order Platform (B2B SaaS F&B Ecosystem)  
> **Kiến trúc**: Monorepo (npm workspaces) • Fastify 4 • React 18 / Vite 5 • Prisma ORM • Socket.io

Tài liệu này chuẩn hóa kiến trúc tổng thể, luồng điều phối dữ liệu và phân chia ranh giới giữa các gói trong monorepo A2Order.

---

## 1. CẤU TRÚC MONOREPO (`npm workspaces`)

Hệ thống được tổ chức thành 3 ứng dụng chính (`apps/`) và 1 thư viện dùng chung (`packages/`):

* **`apps/client`** (`http://localhost:3000`):
  * Phân hệ Khách hàng gọi món tại bàn qua QR code (`/order?table=...`).
  * Trạm làm việc Thu ngân POS (`CashierWorkstation`), sơ đồ bàn phục vụ (`TablesDashboard`).
  * Màn hình Bếp KDS (`KdsTicketCard`), ứng dụng Phục vụ PWA T9 tìm món một tay (`Waiter`).
  * Tách module động (`React.lazy` & code-splitting), dung lượng tải trang khách chỉ 92 kB (26 kB gzip).
* **`apps/cms`** (`http://localhost:3001` và `http://localhost:3002`):
  * Phân hệ Chủ quán (`STORE_OWNER`): Cài đặt menu, sơ đồ bàn, đặt bàn, kho nguyên liệu, nhân sự, hóa đơn bán hàng.
  * Phân hệ Quản trị SaaS (`SUPER_ADMIN`): Quản lý danh sách nhà hàng thuê (Tenants), cấp phát bản quyền (Licenses), hóa đơn SaaS, doanh thu nền tảng MRR/ARR.
  * Hơn 20 module được đóng gói độc lập với cơ chế tự phục hồi `safeLazy`.
* **`apps/server`** (`http://localhost:4000`):
  * API Engine trên nền Fastify 4, Socket.io thời gian thực.
  * Kiến trúc Dual-Database Repository (In-Memory Stateful Store vs Prisma PostgreSQL).
  * Kiểm soát phân quyền RBAC và cách ly đa thuê theo `storeId`.
* **`packages/shared`**:
  * Hợp đồng giao tiếp chung: DTOs, Enums (`TableStatus`, `OrderItemStatus`, `SocketEvents`), Zod Schemas.

---

## 2. PHÂN QUYỀN VAI TRÒ (ROLE & AUTH FLOW)

Hệ thống phân định rạch ròi giữa 2 cấp độ:

1. **Cấp Nền tảng (Platform Level)**:
   * **`SUPER_ADMIN`**: Quản lý toàn bộ hệ thống SaaS A2Order.
   * Mã nguồn tại `apps/cms/src/features/super-admin/`.
   * Chức năng: Quản lý Quán thuê (TenantManager), Gói bản quyền (LicenseManager), Hóa đơn thuê (InvoiceManager), Bảng giá (CmsAdminPricingManager), Giám sát đường truyền (Telemetry).
2. **Cấp Cửa hàng (Store Level)**:
   * **`STORE_OWNER` (Chủ quán)**: Quản trị thực đơn (`menu`), sơ đồ bàn (`tables`), đặt bàn (`reservations`), nguyên liệu (`inventory`), cấu hình máy in & landing page (`settings`).
   * **`CASHIER` (Thu ngân)**: Thu tiền, xuất Dynamic VietQR, in hóa đơn, chốt ca Z-Report.
   * **`CHEF` (Bếp trưởng / Pha chế)**: Nhận vé món KDS theo thời gian thực, đổi trạng thái món, báo hết món (86).
   * **`WAITER` (Nhân viên phục vụ)**: Gọi món nhanh T9, nhận thông báo món hoàn tất, hỗ trợ tại bàn.

---

## 3. QUẢN LÝ DỮ LIỆU & BẢO MẬT ĐA THUÊ (DATA & SECURITY)

1. **Xóa sạch 100% Mock Data ở Frontend**:
   * Toàn bộ dữ liệu hiển thị trên Client và CMS đều là dữ liệu thực tế lấy từ API Server hoặc phiên làm việc hiện hành.
   * Khi chưa có dữ liệu: Hiển thị Empty State chuẩn Donezo Forest Green (`#12372A`, `#F4F5F6`, `#FFFFFF`) hướng dẫn người dùng thao tác.
2. **Dual-Database Layer (Hexagonal Repository)**:
   * Server hỗ trợ 2 chế độ cơ sở dữ liệu qua biến môi trường `USE_MOCK_DB`:
     * `USE_MOCK_DB=true`: Lưu RAM in-memory stateful, đáp ứng cực nhanh khi code giao diện hoặc demo.
     * `USE_MOCK_DB=false`: Kết nối Prisma PostgreSQL chuẩn cho Production/Staging.
   * Cả hai chế độ đều tuân thủ chung interface `IRepository`, client gọi API không cần biết server đang dùng DB nào.
3. **Bảo mật Đa thuê (Multi-Tenancy Invariant)**:
   * 100% API queries, updates, deletes và Socket room đều bắt buộc lọc theo `storeId`.
   * Client chỉ tham gia vào Room riêng của nhà hàng: `socket.join('store:' + storeId)`.
4. **Idempotency & Anti-Spam**:
   * Mọi thao tác submit đơn gọi món và xác nhận thanh toán bắt buộc dùng hook `useAntiSpamAction` đính kèm header `x-idempotency-key` để triệt tiêu nguy cơ gửi trùng do click nhiều lần.

---

## 4. QUY CHUẨN ĐÓNG GÓI COMPONENT

* **Quy tắc < 300 Dòng**: Bất kỳ tệp Component nào dài vượt quá 300-400 dòng đều phải được cắt nhỏ thành các component con (Sub-components) đưa vào thư mục tương ứng (`components/`, `modals/`).
* **Tách biệt Logic và UI**: Các logic tính toán tiền bạc, lọc dữ liệu lớn đều phải đưa vào `useMemo` hoặc Custom Hook chuyên trách.
* **Tách biệt Types**: Cấm inline `interface` / `type` trong JSX. Khai báo tập trung trong `types/` hoặc `packages/shared`.
