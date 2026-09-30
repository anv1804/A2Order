# Kiến Trúc và Luồng Dữ Liệu (Architecture & Data Flow)
Dự án: **A2Order Platform (B2B SaaS F&B)**

Tài liệu này chuẩn hóa quy trình phát triển và luồng dữ liệu của dự án, nhằm ngăn chặn việc viết code sai cấu trúc, trùng lặp tính năng, hoặc nhầm lẫn giữa các vai trò (Roles).

## 1. Cấu Trúc Monorepo
Dự án sử dụng kiến trúc Monorepo (Turborepo/pnpm):
- `apps/cms`: Hệ thống quản trị. Chứa CẢ giao diện của **Super Admin** (Chủ nền tảng) và **Tenant Admin** (Chủ quán).
- `apps/client`: Ứng dụng dành cho Khách hàng cuối (Quét mã QR gọi món) và Nhân viên (POS, KDS).
- `apps/server`: Backend API (Fastify, Prisma, PostgreSQL).
- `packages/shared`: Nơi lưu trữ logic dùng chung (Types, Enum, Constants, Bảng giá `APP_MODULE_CATALOG`, Validation Schemas).
  - *Quy tắc*: Mọi định nghĩa dùng chung (VD: Tên module, cấu hình giá, loại business) ĐỀU PHẢI khai báo ở đây để tái sử dụng giữa CMS, Client và Server.

## 2. Phân Quyền Vai Trò (Role & Auth Flow)
Trong `apps/cms`, có sự phân định rạch ròi về Role:
1. **SUPER_ADMIN**: 
   - Quản lý toàn bộ nền tảng A2Order. 
   - Mã nguồn nằm tại: `apps/cms/src/features/cms/components/superAdmin/`.
   - Chức năng: Dashboard hệ thống, Quán thuê, License Key, Hóa đơn, Kịch bản mẫu, Bảng giá nền tảng.
2. **TENANT_ADMIN (Chủ quán)**:
   - Quản lý một nhà hàng/quán cafe cụ thể.
   - Mã nguồn (sẽ phát triển) nằm tại: `apps/cms/src/features/cms/components/tenantAdmin/`.
   - Chức năng: Thiết lập sơ đồ bàn, Quản lý Menu (Món ăn, Size, Topping), Báo cáo doanh thu của quán, Quản lý nhân viên.

*Quy tắc Router*: Tệp `CmsLayout.tsx` và `App.tsx` chịu trách nhiệm rẽ nhánh hiển thị thanh bên (Sidebar) và các màn hình dựa trên `currentRole`.

## 3. Quản Lý Trạng Thái & Dữ Liệu (State & Data)
1. **Dữ liệu mồi (Mock Data)**: 
   - Để đẩy nhanh tốc độ xây dựng UI, dữ liệu mồi được tách riêng ra các file `*MockData.ts`. KHÔNG viết cứng dữ liệu (hardcode) trực tiếp vào Component.
2. **API Integration (Hướng tương lai)**:
   - Việc gọi API (Fetch/Axios) được đưa vào các Services (VD: `services/api/storeApi.ts`). 
   - Component UI chỉ nhận dữ liệu thông qua Props hoặc State (React Query / useEffect), không chứa logic fetch dữ liệu phức tạp.

## 4. Quy Chuẩn Đóng Gói (Componentization)
- **Quy tắc < 300 Dòng**: Bất kỳ tệp Component nào dài vượt quá 300-400 dòng ĐỀU PHẢI được cắt nhỏ thành các component con (Sub-components) đưa vào thư mục tương ứng.
- **Tách Biệt Logic và UI**: Các logic tính toán (VD: giả lập giá, lọc dữ liệu) nên được đưa vào `useMemo` hoặc tách thành Custom Hook nếu quá dài.

## 5. Danh Mục Đã Hoàn Thiện (Không Build Lại)
- Toàn bộ tính năng thuộc `SUPER_ADMIN` (Tổng quan, Hóa đơn, Đối tác, License, Nhật ký, Bảng giá) đã **HOÀN THIỆN 100% GIAO DIỆN**. Mọi yêu cầu liên quan đến Super Admin chỉ là bảo trì hoặc đấu nối API, KHÔNG đập đi xây lại trừ khi có yêu cầu đặc biệt.
