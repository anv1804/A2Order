# 🎨 QUY CHUẨN THIẾT KẾ ĐỒNG BỘ GIAO DIỆN (DESIGN SYSTEM STANDARDS)

Tài liệu này là **bộ quy chuẩn bất biến** về khoảng cách, kích thước chữ, màu sắc, lề, kích thước chạm và hệ thống phản hồi người dùng cho toàn bộ ứng dụng Client của A2Order. Bất kỳ AI Agent hay lập trình viên nào khi viết UI đều **BẮT BUỘC** tuân thủ 100%, không tự ý chế thêm class lạ hay dùng popup mặc định của trình duyệt.

---

## 1. HỆ THỐNG THÔNG BÁO & XÁC NHẬN CHUẨN HÓA (FEEDBACK SYSTEM)

**QUY TẮC BẤT DI BẤT DỊCH**: **CẤM 100% việc dùng `window.alert()` hoặc `window.confirm()` mặc định của trình duyệt**. Toàn bộ hệ thống chỉ sử dụng duy nhất một bộ thông báo tập trung điều khiển bởi Zustand:

### 1.1. Thông báo Toast không chặn (`toast` API)
Dùng cho phản hồi trạng thái nhanh (thao tác thành công, lỗi, cảnh báo) và tự biến mất sau 3 giây:
```typescript
import { toast } from "@/stores/notificationStore";

toast.success("Đã gửi đơn vào Bếp thành công!");
toast.error("Mất kết nối với máy chủ!");
toast.warning("Món này đã hết nguyên liệu!");
toast.info("Đang in hóa đơn...");
```

### 1.2. Hộp thoại Xác nhận đồng bộ (`confirmDialog` API)
Dùng khi có sự thay đổi nhưng chưa lưu mà người dùng bấm thoát ra, hoặc các hành động nguy hiểm (Hủy món, Xóa bàn, Thoát giỏ hàng):
```typescript
import { confirmDialog } from "@/stores/notificationStore";

const isConfirmed = await confirmDialog({
  title: "Chưa gửi đơn vào bếp!",
  message: "Các món trong giỏ sẽ bị hủy nếu bạn thoát bây giờ. Bạn có chắc chắn?",
  confirmText: "Hủy và Thoát",
  cancelText: "Ở lại tiếp tục",
  variant: "danger", // 'primary' | 'danger' | 'warning'
});

if (isConfirmed) {
  // Thực hiện thoát / xóa
}
```

---

## 2. HỆ THỐNG KHOẢNG CÁCH & LỀ (SPACING & LAYOUT TOKENS)

| Mục | Quy chuẩn Tailwind | Giá trị thực | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Cách lề màn hình (Screen Margin)** | `px-3 py-3` (Mobile)<br>`px-6 py-6` (Tablet/PC) | 12px / 24px | Lề mép ngoài cùng của trang ứng dụng |
| **Khoảng cách lưới Bàn / Món (Grid Gap)** | `gap-3` (Mobile)<br>`gap-4` (Tablet/PC) | 12px / 16px | Khoảng cách giữa các thẻ Bàn hoặc thẻ Món ăn |
| **Khoảng cách danh sách (List Spacing)** | `space-y-2` (Dày)<br>`space-y-3` (Tiêu chuẩn) | 8px / 12px | Danh sách món trong giỏ hàng, thẻ vé bếp |
| **Đệm trong thẻ (Panel Padding)** | `p-3` (Nhỏ)<br>`p-4` (Tiêu chuẩn)<br>`p-6` (Modal) | 12px / 16px / 24px | Padding bên trong các Panel, Card, Modal |
| **Bo góc (Border Radius)** | `rounded-xl` (Nút, Input: 12px)<br>`rounded-2xl` (Card: 16px)<br>`rounded-3xl` (Modal, Drawer: 24px) | 12px / 16px / 24px | Đồng bộ độ cong mềm mại toàn ứng dụng |

---

## 3. QUY CHUẨN CÔNG THÁI HỌC VÀ CHẠM DI ĐỘNG (TOUCH TARGETS)

* **Nút bấm / Thao tác chạm tối thiểu**: `h-11` (44px) - Đảm bảo ngón tay bấm không bị trượt.
* **Nút chính ngón cái (Mobile Action)**: `h-13` (52px).
* **Nút thao tác Bếp KDS (Tablet)**: `h-14` hoặc `h-16` (56px - 64px) - Dễ bấm khi tay ướt hoặc từ xa.

---

## 4. THANG KÍCH THƯỚC CHỮ (TYPOGRAPHY SCALE)

| Cấp bậc | Font Size | Line Height | Font Weight | Class Tailwind |
| :--- | :--- | :--- | :--- | :--- |
| **Hero / Số tiền lớn** | 24px | 1.2 | 900 (Black) | `text-2xl font-black tracking-tight` |
| **Tiêu đề lớn (Page Header)** | 20px | 1.25 | 800 (Extrabold) | `text-xl font-extrabold` |
| **Tiêu đề mục (Card Title)** | 16px | 1.3 | 700 (Bold) | `text-base font-bold` |
| **Nội dung chính (Body Text)** | 14px | 1.4 | 500 (Medium) | `text-sm font-medium` |
| **Nhãn phụ / Ghi chú (Caption)** | 12px | 1.4 | 600 (Semibold) | `text-xs font-semibold` |
| **Huy hiệu nhỏ (Micro Badge)** | 10px | 1.2 | 700 (Bold) | `text-[10px] font-bold uppercase` |

---

## 5. BỘ COMPONENT CHUNG BẮT BUỘC SỬ DỤNG (`@/components/ui`)
* `<Button />`: Hỗ trợ `variant: primary | secondary | danger | ghost | outline`, `size: sm | md | lg | xl`.
* `<Panel />`: Khung viền thẻ chuẩn hóa padding, header, footer.
* `<Input />`: Ô nhập liệu chuẩn chiều cao 44px, hỗ trợ icon.
* `<Badge />`: Huy hiệu nhãn trạng thái.
* `<Modal />`: Cửa sổ popup chuẩn căn giữa, hiệu ứng zoom-in.
* `<Drawer />`: Khung trượt từ dưới lên (Bottom sheet) cho di động.
* `<GlobalFeedback />`: Đặt ở gốc ứng dụng để kích hoạt Toast và ConfirmDialog.
