---
name: a2order-feature-development
description: >-
  Standard end-to-end feature development workflow, docs-first specification, and full-stack quality assurance for A2Order.
  The agent MUST activate and read this skill automatically whenever creating, refactoring, or extending a new business module,
  subsystem, or feature across client, CMS, server, and shared packages.
---

# A2Order Fullstack Feature Development Workflow

Kỹ năng này hướng dẫn quy trình phát triển tính năng mới từ đầu đến cuối theo triết lý **Tư duy phản biện (Critical Thinking) & Docs-First & Type-Safe** trong Monorepo A2Order.

---

## 🧠 0. BỘ NGUYÊN TẮC TƯ DUY BẮT BIẾN KHI LÀM TÍNH NĂNG MỚI

Khi người dùng yêu cầu làm bất kỳ tính năng, màn hình hoặc logic mới nào, AI Agent **BẮT BUỘC** thực hiện chu trình:

1. 🔍 **TÌM HIỂU**: Quét codebase xem tính năng này đã có sẵn chưa, có logic/component nào tái sử dụng được không.
2. 📖 **ĐỌC KĨ**: Đọc thấu đáo specs trong `docs/` và yêu cầu người dùng, nắm trọn luồng tương tác giữa các vai trò (Chủ quán, Thu ngân, Bếp, Khách).
3. ⚖️ **PHẢN BIỆN**:
   * Chỉ ra ngay nếu giải pháp vi phạm tính toàn vẹn đa thuê (`storeId`).
   * Phản biện nếu tính năng tạo thêm gánh nặng thao tác cho nhân viên chạy bàn trong giờ cao điểm.
   * Cảnh báo nếu có nguy cơ tính tiền/chiết khấu ở Client.
4. 💡 **ĐƯA RA QUAN ĐIỂM**: Đề xuất kiến trúc chuẩn (Hexagonal, Zustand store, Fastify module) và so sánh các phương án Đánh đổi (Trade-offs).
5. ✍️ **GÓP Ý**: Hiến kế cải tiến trải nghiệm F&B (âm thanh KDS, phím tắt POS, QR động gạch nợ tự động, giao diện Donezo Forest Green chuẩn mực).
6. 🚀 **UPDATE**: Viết code chuẩn TypeScript, cập nhật docs, và chạy `npm run build` xác nhận 0 lỗi.

---

## 1. Quy Trình 5 Bước Triển Khai Kỹ Thuật

```
1. Đặc tả (Docs-First)  ──►  2. Hợp đồng dữ liệu (@a2order/shared)
                                           │
4. Giao diện (Client/CMS) ◄──  3. Backend API (Fastify + Dual-DB)
            │
            ▼
5. Xác thực toàn vẹn (npm run build)
```

---

## 2. Chi Tiết Từng Bước Thực Hiện

### Bước 1: Tài liệu đi trước code (Docs-First)
1. Kiểm tra xem tính năng này đã có tài liệu hoặc code tương tự trong hệ thống chưa.
2. Tạo thư mục tính năng mới trong `docs/02-features/Fxx-[ten-tinh-nang]/`.
3. Tạo file `SPEC.md` dựa theo mẫu chuẩn tại [`docs/02-features/TEMPLATE_FEATURE.md`](file:///home/anv/Documents/A2Order/docs/02-features/TEMPLATE_FEATURE.md):
   * Tác nhân & Vai trò (Super Admin, Chủ quán, Thu ngân, Bếp, Waiter, Khách).
   * Quy trình hoạt động (Workflow & Sequence).
   * Ảnh hưởng tới cơ sở dữ liệu & API.
   * Kịch bản kiểm thử (Test cases).

### Bước 2: Định nghĩa Hợp đồng dữ liệu (`packages/shared`)
1. Định nghĩa các Entity interfaces, Enums, và Zod schemas trong `packages/shared/src/`.
2. Export các types qua `packages/shared/src/index.ts`.
3. Chạy `npm run build --workspace=packages/shared` để cập nhật dist type definitions.

### Bước 3: Phát triển Backend API (`apps/server`)
1. Tạo module mới trong `apps/server/src/modules/[feature]/`.
2. Tạo `*.routes.ts` và đăng ký vào `apps/server/src/index.ts`.
3. Triển khai controller và tương tác với Repository Layer (`core/database/`).
4. Nếu lưu trữ dữ liệu mới, cập nhật cả `MockDatabaseState` và `schema.prisma`.

### Bước 4: Phát triển Giao diện (`apps/client` hoặc `apps/cms`)
1. Tạo API client trong `src/api/` hoặc `features/[feature]/api/`.
2. Tạo Store Zustand nếu tính năng có trạng thái dùng chung giữa nhiều component.
3. Tạo UI component tuân thủ tuyệt đối quy tắc **Donezo Forest Green**:
   * Card `bg-surface-card rounded-3xl border border-surface-border`.
   * Nút bấm `bg-brand-800` hover `bg-brand-900`.
   * Nhãn badge `bg-brand-100 text-brand-800`.
   * Touch target di động $\ge 44\text{px}$, vùng cuộn có `pb-28`.
   * Feedback dùng `toast.success/error` hoặc `confirmDialog`, tuyệt đối không dùng `alert()`.

### Bước 5: Xác thực toàn diện Monorepo
* Chạy lệnh kiểm tra build toàn bộ 4 workspace:
  ```bash
  npm run build
  ```
* Bắt buộc cả 4 workspace đều phải biên dịch thành công 100% với 0 lỗi Type và 0 cảnh báo nghiêm trọng trước khi thông báo hoàn tất cho người dùng.
