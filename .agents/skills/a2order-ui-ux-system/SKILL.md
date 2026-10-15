---
name: a2order-ui-ux-system
description: >-
  Expert design system, Donezo Forest Green styling, and mobile ergonomics guidelines for A2Order apps (apps/client and apps/cms).
  The agent MUST activate and read this skill automatically whenever creating, modifying, styling, or reviewing UI components,
  Tailwind classes, modals, badges, cards, buttons, responsive mobile layouts, touch ergonomics, or icons.
---

# A2Order UI/UX Design System Skill

Kỹ năng này hướng dẫn toàn diện cách xây dựng và hiệu chỉnh giao diện người dùng (UI/UX) đạt tiêu chuẩn cao cấp, chuẩn phong cách **Donezo Forest Green** và tối ưu công thái học di động cho A2Order.

---

## 1. Bảng Màu Chuẩn (Donezo Forest Green Palette)

Tuyệt đối không sử dụng các màu xanh dương mặc định (`bg-blue-600`), màu tím, hay màu cam chói lọi. Mọi giao diện phải dùng bảng mã màu chuẩn:

| Token / Nhóm màu | Giá trị Hex / Class Tailwind | Vị trí áp dụng |
| :--- | :--- | :--- |
| **Nền Canvas** | `#F4F5F6` (`bg-surface-canvas`) | Nền tổng thể của toàn bộ màn hình, dịu mắt |
| **Nền Card / Panel** | `#FFFFFF` (`bg-surface-card`) | Thẻ nội dung, bo góc lớn `rounded-3xl` (24px) |
| **Viền Card** | `#E3E5E5` (`border-surface-border`) | Viền mảnh thanh lịch `border border-surface-border` |
| **Brand Hero (Tối)** | `#12372A` (`bg-brand-900`) | Thẻ Hero, banner điểm nhấn, header quan trọng |
| **Brand Button (Chính)**| `#194B3A` (`bg-brand-800`) | Nút hành động chính (Thanh toán, Xác nhận, Gọi món) |
| **Brand Hover / Active**| `#2E795E` (`bg-brand-600`) | Trạng thái hover nút, item đang được chọn |
| **Sage Mint (Badge)** | `#E8F5EE` (`bg-brand-100`) | Nền badge trạng thái, tag phân loại, pill filter |
| **Badge Text** | `#194B3A` (`text-brand-800`) | Chữ bên trong badge mint |
| **Chữ Chính** | `#161918` (`text-ink-primary`) | Tiêu đề, tên món, tổng số tiền |
| **Chữ Mô Tả** | `#69706D` (`text-ink-muted`) | Phụ đề, mô tả món, ghi chú |
| **Chữ Mờ** | `#9CA29F` (`text-ink-subtle`) | Thời gian, mã đơn, placeholder |

---

## 2. Quy Chuẩn Công Thái Học Di Động (Mobile Ergonomics)

1. **Touch Target**:
   * Chiều cao nút bấm di động tối thiểu `h-11` (44px).
   * Nút hành động ngón cái (Thanh toán, Gửi bếp): `h-13` (52px), bo tròn `rounded-2xl` hoặc `rounded-full`.
2. **Safe Bottom Padding (Chống che khuất)**:
   * Trên các màn hình cuộn di động (POS Waiter, Thực đơn khách hàng, Danh sách bàn), vùng cuộn bắt buộc phải có padding đáy:
   ```tsx
   <div className="flex-1 overflow-y-auto pb-28">
     {/* Danh sách nội dung */}
   </div>
   ```
3. **Thanh Cuộn (Scrollbar)**:
   * Dùng class `no-scrollbar` cho các thanh cuộn ngang (Category pills, Zone tabs) để giữ giao diện sạch sẽ, mượt mà trên mobile.
4. **Định dạng Tiền Tệ**:
   * Luôn gắn `whitespace-nowrap` khi hiển thị giá tiền (ví dụ: `25.000 đ`) để tránh việc chữ `đ` bị rớt xuống dòng riêng làm vỡ layout.

---

## 3. Hệ Thống Feedback Tương Tác

### Không dùng hộp thoại trình duyệt
Tuyệt đối **CẤM** gọi `alert()`, `confirm()`, `prompt()`.

### Toast Notification
Sử dụng thư viện toast nội bộ:
```tsx
import { toast } from "@/components/feedback";

toast.success("Đã gửi đơn vào bếp thành công!");
toast.error("Không thể kết nối máy in hóa đơn.");
toast.warning("Bàn này đang có đơn chờ thanh toán.");
toast.info("Đã cập nhật số lượng món.");
```

### Hộp Thoại Xác Nhận (Confirm Dialog)
```tsx
import { confirmDialog } from "@/components/feedback";

const handleCancelOrder = async () => {
  const ok = await confirmDialog({
    title: "Hủy đơn hàng bàn 04",
    message: "Các món đang nấu sẽ bị hủy. Bạn có chắc chắn không?",
    confirmText: "Hủy đơn",
    cancelText: "Giữ lại",
    variant: "danger"
  });
  if (ok) {
    // Thực hiện hủy đơn
  }
};
```

---

## 4. Quy Chuẩn Icon

* Luôn dùng component:
  ```tsx
  import { Icon } from "@/components/ui";

  <Icon name="Utensils" size={18} className="text-brand-800" />
  ```
* Không import trực tiếp icon ngoài ngoại trừ component wrapper đã chuẩn hóa.

---

## 5. Checklist Kiểm Tra Trước Khi Hoàn Tất UI
- [ ] Giao diện có đúng màu Donezo Forest Green (`#12372A`, `#E8F5EE`, `#F4F5F6`) không?
- [ ] Các thẻ Card có dùng `rounded-3xl` và viền `border-surface-border` không?
- [ ] Danh sách di động có `pb-28` để không bị che bởi thanh điều hướng không?
- [ ] Tiền tệ có `whitespace-nowrap` không?
- [ ] Đã thay thế toàn bộ `alert()`/`confirm()` bằng Toast/ConfirmDialog chưa?
- [ ] Đã chạy `npm run build` kiểm tra 0 lỗi type/syntax chưa?
