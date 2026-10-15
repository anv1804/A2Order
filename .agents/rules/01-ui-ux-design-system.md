# QUY CHUẨN THIẾT KẾ UI/UX & BẢNG MÀU DONEZO FOREST GREEN

Tài liệu này là quy tắc bắt buộc áp dụng khi làm việc với `apps/client` và `apps/cms`.

## 1. Bảng Màu Bất Biến (Donezo Forest Green Palette)
Mọi màu sắc giao diện phải tuân thủ nghiêm ngặt bảng màu sau:

* **Nền trang (Canvas)**: `bg-surface-canvas` (`#F4F5F6`) - Không dùng màu trắng bệch hoặc xám tối công nghệ.
* **Thẻ chứa nội dung (Cards / Panels)**: `bg-surface-card` (`#FFFFFF`), bo góc lớn `rounded-3xl` (24px), viền mảnh `border border-surface-border` (`#E3E5E5`).
* **Màu thương hiệu chính (Brand Primary)**:
  * Thẻ Hero / Điểm nhấn tối: `bg-brand-900` (`#12372A`)
  * Nút bấm chính (CTA): `bg-brand-800` (`#194B3A`) hover `bg-brand-900`
  * Trạng thái đang chọn (Active): `bg-brand-700` (`#22604B`) hoặc `bg-brand-600` (`#2E795E`)
* **Nhãn / Huy hiệu (Badges / Tags)**:
  * Nền mint: `bg-brand-100` (`#E8F5EE`)
  * Chữ xanh lá trầm: `text-brand-800` (`#194B3A`)
* **Chữ & Văn bản (Typography Tokens)**:
  * Tiêu đề / Nội dung chính: `text-ink-primary` (`#161918`)
  * Phụ đề / Mô tả: `text-ink-muted` (`#69706D`)
  * Ghi chú mờ: `text-ink-subtle` (`#9CA29F`)

> **CẤM TUYỆT ĐỐI**:
> - Không tự bịa màu ngẫu nhiên như `bg-blue-600`, `bg-indigo-500`, `bg-purple-600`.
> - Không dùng màu cam/đỏ chói cho các nút chính.

## 2. Hệ Thống Feedback Tương Tác
* **CẤM DÙNG**: `window.alert()`, `window.confirm()`, `window.prompt()`.
* **Thông báo nổi (Toasts)**:
  * Thành công: `toast.success("Thông báo...")`
  * Thất bại / Lỗi: `toast.error("Lỗi...")`
  * Cảnh báo: `toast.warning("Cảnh báo...")`
  * Thông tin: `toast.info("...")`
* **Hộp thoại xác nhận (Confirm Dialog)**:
  ```tsx
  const confirmed = await confirmDialog({
    title: "Xác nhận hủy đơn",
    message: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
    confirmText: "Hủy đơn",
    cancelText: "Quay lại",
    variant: "danger"
  });
  if (!confirmed) return;
  ```

## 3. Quy Chuẩn Icon
* Luôn sử dụng component wrapper `<Icon name="..." size={...} className="..." />` từ `@/components/ui`.
* Sử dụng tên icon chuẩn từ bộ Lucide Icons.
* Không cài thêm font icon (FontAwesome, Material Icons, v.v.).

## 4. Công Thái Học Di Động & Chống Lệch Layout
* **Touch Target**: Mọi nút bấm, tap area phải cao tối thiểu `h-11` (44px), nút thanh toán/hành động chính ngón cái là `h-13` (52px).
* **Safe Bottom Padding**: Mọi container cuộn danh sách trên di động bắt buộc có padding đáy `pb-28` để không bị che khuất bởi Bottom Bar.
* **Chống vỡ dòng Typography**: Dùng `truncate`, `line-clamp-1`, `line-clamp-2` và `whitespace-nowrap` hợp lý, không để nhãn tiền tệ bị nhảy xuống dòng riêng.
