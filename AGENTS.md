# 🤖 A2ORDER - SỔ TAY NGUYÊN TẮC HOẠT ĐỘNG VÀ HƯỚNG DẪN DÀNH CHO AI AGENT

> **Dự án**: A2Order - Hệ sinh thái Quản lý Vận hành & Gọi món Thông minh F&B  
> **Phiên bản**: v7.0.0 Monorepo  
> **Tài liệu tham chiếu gốc**: [`docs/README.md`](./docs/README.md), [`docs/.agent-guidelines.md`](./docs/.agent-guidelines.md)

Tài liệu này được hệ thống Antigravity tự động nạp vào bộ nhớ ngữ cảnh của AI Agent trong mọi phiên làm việc. AI Agent **BẮT BUỘC** đọc kỹ và tuân thủ tuyệt đối các nguyên tắc, bảng màu, kiến trúc và quy trình dưới đây.

---

## 🧭 1. TỔNG QUAN HỆ THỐNG & BẢN ĐỒ MONOREPO

A2Order là nền tảng quản trị và vận hành toàn diện cho nhà hàng, quán ăn, quán cà phê. Hệ thống được tổ chức dạng Monorepo chuẩn:

| Thư mục | Vai trò | Công nghệ | Cổng Dev |
| :--- | :--- | :--- | :--- |
| **`apps/client`** | POS Thu ngân, Waiter PWA T9, Bếp KDS, Khách gọi món QR | React 18, Vite, TailwindCSS, Zustand, Socket.io | `http://localhost:3000` |
| **`apps/cms`** | CMS Chủ quán (vận hành) & Super Admin (quản trị SaaS) | React 18, Vite, TailwindCSS, Zustand | `http://localhost:3001` (Store)<br>`http://localhost:3002` (Admin) |
| **`apps/server`** | API Backend, WebSocket realtime, Dual-DB Repository, Auth JWT | Fastify, Socket.io, Prisma, TypeScript | `http://localhost:4000` |
| **`packages/shared`** | Hợp đồng dữ liệu chung: DTOs, Enums, Zod Schemas, Domain types | TypeScript | Đóng gói dùng chung |
| **`docs/`** | Toàn bộ tài liệu đặc tả kiến trúc, bảng màu, bảo mật, specs chức năng | Markdown | Tra cứu trực tiếp |
| **`.agents/`** | Antigravity Rules & Skills tự kích hoạt cho AI Agent | Markdown, YAML | Tự động hóa |

---

## 🛑 2. BỘ 10 QUY TẮC BẤT BIẾN (NON-NEGOTIABLE INVARIANTS)

Bất kỳ thay đổi mã nguồn nào vi phạm một trong các quy tắc sau đều bị coi là **LỖI NGHIÊM TRỌNG**:

1. **Bảng màu Bất biến (Donezo Forest Green Style)**:
   * **TUYỆT ĐỐI CẤM** tự ý bịa màu lạ, cấm dùng màu xanh dương công nghệ đại trà (`bg-blue-600`), cấm màu cam/đỏ chói.
   * Toàn bộ UI bắt buộc dùng các token chuẩn trong `docs/01-technical-specs/design-tokens-palette.md`:
     * Nền tổng thể: `bg-surface-canvas` (`#F4F5F6`)
     * Thẻ/Panel: `bg-surface-card` (`#FFFFFF`), `rounded-3xl`, viền `border-surface-border` (`#E3E5E5`)
     * Màu chính/Nút: `bg-brand-900` / `bg-brand-800` (Xanh rừng trầm `#12372A`)
     * Nhãn Tag/Badge: `bg-brand-100 text-brand-800` (Sage mint `#E8F5EE`)
     * Chữ: `text-ink-primary` (`#161918`), `text-ink-muted` (`#69706D`)
2. **CẤM DÙNG `alert()`, `confirm()`, `prompt()` MẶC ĐỊNH**:
   * Bắt buộc sử dụng hệ thống feedback chuẩn hóa: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`.
   * Hộp thoại xác nhận hành động: `const ok = await confirmDialog({ title, message, confirmText, cancelText, variant })`.
3. **Quy chuẩn Icon**:
   * Bắt buộc dùng component `<Icon name="..." />` chuẩn Lucide từ thư viện nội bộ. Không cài thêm icon sets khác.
4. **Bất biến Đa thuê (Multi-Tenant Invariant)**:
   * Mọi API query, update, delete, Socket room bắt buộc phải gắn và lọc theo `storeId`. Tuyệt đối không để lộ dữ liệu chéo giữa các nhà hàng.
5. **Tính toán Tiền bạc 100% Server-Side**:
   * Đơn giá món, topping, giảm giá voucher, phụ phí giờ cao điểm, thuế VAT, tổng tiền thanh toán... **bắt buộc tính tại Server**. Client chỉ gửi `itemId`, `quantity`, `customizations` và nhận kết quả từ Server.
6. **Chống Spam & Idempotency**:
   * Mọi thao tác tài chính, tạo đơn, xác nhận thanh toán bắt buộc sử dụng hook `useAntiSpamAction` kèm header `x-idempotency-key`.
7. **Tách biệt Interface / Types**:
   * **CẤM** khai báo `interface` hoặc `type` trực tiếp bừa bãi trong các file component hay logic code.
   * Tất cả types/interfaces bắt buộc phải nằm trong thư mục quy chuẩn: `types/` (nội bộ app) hoặc `@a2order/shared` (dùng chung).
8. **Không comment dài dòng vào code**:
   * Viết code ngắn gọn, tối ưu, tự tường minh (self-documenting). Không giải thích lan man trong file code.
9. **Quy tắc Kiểm tra & Không đoán mò**:
   * Chức năng này đã có sẵn chưa? Tái sử dụng được gì?
   * Khi gặp bất kỳ điểm nào chưa rõ hoặc không có căn cứ: **Bắt buộc phải hỏi lại người dùng**.
10. **Kiểm tra Toàn vẹn Monorepo Trước khi Bàn giao**:
    * Mọi tác vụ code xong bắt buộc chạy `npm run build` để xác nhận cả 4 workspace (`@a2order/client`, `@a2order/cms`, `@a2order/server`, `@a2order/shared`) đều build thành công với 0 lỗi Type và 0 lỗi cú pháp.

---

## ⚡ 3. CÁC KỊCH BẢN SKILL TỰ ĐỘNG KÍCH HOẠT (AUTO-TRIGGERED SKILLS)

Trong thư mục `.agents/skills/`, hệ thống đã cấu hình 4 kỹ năng cốt lõi. AI Agent **TỰ ĐỘNG ĐỌC VÀ KÍCH HOẠT** (sử dụng `view_file` trên `SKILL.md`) mà không cần người dùng phải gọi thủ công:

1. **`a2order-ui-ux-system`**:
   * *Khi nào tự dùng*: Khi tạo, sửa, review giao diện UI, component, CSS, Tailwind, modal, typography, icon, responsive di động trong `apps/client` hoặc `apps/cms`.
2. **`a2order-fnb-domain-logic`**:
   * *Khi nào tự dùng*: Khi làm việc với bàn ăn, sơ đồ bàn, đơn hàng (Order/OrderItem), màn hình bếp KDS, thu ngân, Dynamic VietQR, chia tách hóa đơn, tính phụ phí/VAT.
3. **`a2order-backend-database`**:
   * *Khi nào tự dùng*: Khi thêm route API Fastify, chỉnh sửa Prisma Schema, quản lý cơ chế Dual-Database (Mock in-memory vs PostgreSQL), seed dữ liệu.
4. **`a2order-feature-development`**:
   * *Khi nào tự dùng*: Khi tạo một module/tính năng mới từ đầu (Docs-First spec, Shared types, Backend API, Frontend UI, Build verification).

---

## 🗄️ 4. KIẾN TRÚC DUAL-DATABASE (HEXAGONAL REPOSITORY)

Server hỗ trợ 2 chế độ cơ sở dữ liệu qua biến môi trường `USE_MOCK_DB`:
* `USE_MOCK_DB=true`: Lưu trữ RAM in-memory stateful, đáp ứng cực nhanh khi code giao diện hoặc demo.
* `USE_MOCK_DB=false`: Kết nối Prisma PostgreSQL chuẩn cho Production/Staging.

Mọi controller và route gọi qua Repository Layer (`apps/server/src/core/database/`), do đó:
* **Frontend gọi REST API không cần biết server đang dùng DB nào.**
* Khi thêm trường dữ liệu mới: Cần cập nhật đồng thời `@a2order/shared`, `MockDatabaseState`, và `schema.prisma`.
* Tham khảo: [`MOCK_TO_REAL_DB_MIGRATION_GUIDE.md`](./MOCK_TO_REAL_DB_MIGRATION_GUIDE.md).

---

## 📱 5. QUY CHUẨN CÔNG THÁI HỌC DI ĐỘNG (MOBILE ERGONOMICS)

1. **Touch Target**: Mọi nút bấm, phần tử tương tác tối thiểu `h-11` (44px), lý tưởng `h-13` (52px).
2. **Safe Bottom Padding**: Các danh sách cuộn di động bắt buộc có đệm đáy `pb-28` để nội dung không bị che khuất bởi Bottom Navigation Bar.
3. **No Tap Highlight**: Mọi trang đều đã cấu hình `-webkit-tap-highlight-color: transparent;` và `touch-action: manipulation;`.
4. **Scrollbar Ẩn hoặc Mảnh**: Dùng `.no-scrollbar` cho danh sách cuộn ngang/dọc trên mobile.

---

## 📚 6. MỤC LỤC TRA CỨU NHANH

* [Đặc tả màu sắc & Design Tokens](file:///home/anv/Documents/A2Order/docs/01-technical-specs/design-tokens-palette.md)
* [Kiến trúc Đa thuê & Phân quyền RBAC](file:///home/anv/Documents/A2Order/docs/01-technical-specs/security-and-rbac.md)
* [Đặc tả Cơ sở dữ liệu Prisma](file:///home/anv/Documents/A2Order/docs/01-technical-specs/database-schema.md)
* [Giao thức Realtime WebSocket](file:///home/anv/Documents/A2Order/docs/01-technical-specs/realtime-websocket.md)
* [Hướng dẫn chuyển đổi PostgreSQL](file:///home/anv/Documents/A2Order/MOCK_TO_REAL_DB_MIGRATION_GUIDE.md)
* [Quy chuẩn viết Feature mới](file:///home/anv/Documents/A2Order/docs/02-features/TEMPLATE_FEATURE.md)
