# QUY CHUẨN MÃ NGUỒN, TYPESCRIPT VÀ KIẾN TRÚC CODE

Tài liệu này định nghĩa các tiêu chuẩn kỹ thuật khi viết code TypeScript trong Monorepo A2Order.

## 1. Tách Biệt Types & Interfaces Tuyệt Đối
* **CẤM**: Khai báo `interface` hoặc `type` trực tiếp bừa bãi trong các file component `.tsx` hoặc controller `.ts` khi type đó có tính chất mô hình dữ liệu (Domain model) hoặc DTO.
* **Quy chuẩn**:
  * Các types dùng chung giữa Frontend và Backend (Model, Enums, DTOs, API Schemas): Bắt buộc đặt trong `packages/shared/src/`.
  * Các types chỉ dùng nội bộ một app (Component props, local UI state): Đặt trong thư mục `src/types/` của app đó hoặc file `.types.ts` liền kề.

## 2. Mã Nguồn Ngắn Gọn & Tự Tường Minh (Self-Documenting)
* Không viết comment giải thích hiển nhiên (ví dụ: `// hàm render thẻ bàn`, `// lấy store id`).
* Đặt tên biến, tên hàm rõ ràng, chuẩn tiếng Anh (`isSubmitting`, `handleCheckout`, `fetchMenuItems`, `activeZoneId`).
* Giữ component ngắn gọn, tách nhỏ các sub-component khi file vượt quá 250-300 dòng.

## 3. Quản Lý Trạng Thái (Zustand & React Hooks)
* Sử dụng selector nguyên tử (atomic selectors) để tránh re-render không cần thiết:
  ```tsx
  // Đúng: Chỉ re-render khi activeTable thay đổi
  const activeTable = useTableStore((s) => s.activeTable);
  
  // Tránh: Gây re-render toàn bộ component khi bất kỳ trường nào trong store thay đổi
  const { activeTable, tables, loading } = useTableStore();
  ```
* Không lưu trữ dữ liệu phái sinh (derived data) vào state nếu có thể tính toán trực tiếp từ state hiện tại (`useMemo` hoặc tính tức thì).

## 4. Tương Tác Backend & REST API
* Mọi lời gọi API từ frontend phải đi qua các service client chuẩn (ví dụ: `orderApi`, `menuApi`, `tableApi`), không gọi `fetch()` hoặc `axios()` trực tiếp trong thân component JSX.
* Xử lý lỗi tập trung qua toast: Luôn bọc trong `try...catch` và hiển thị thông điệp thân thiện với người dùng thông qua `toast.error()`.
