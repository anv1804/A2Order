# 🎨 HƯỚNG DẪN THIẾT KẾ GIAO DIỆN & CÔNG THÁI HỌC (UI/UX GUIDELINES v7.0.0)

> **Dự án**: A2Order Platform (B2B SaaS F&B Ecosystem)  
> **Phong cách**: Donezo Forest Green & Warm Sage

Tài liệu này chuẩn hóa toàn bộ ngôn ngữ thiết kế, token màu sắc, typography và quy chuẩn công thái học di động (Mobile Ergonomics) cho hai ứng dụng `apps/client` và `apps/cms`.

---

## 1. BẢNG MÀU CHỦ ĐẠO (DONEZO FOREST GREEN PALETTE)

Toàn bộ UI sử dụng hệ thống token chuẩn hóa trong Tailwind:

* **Tông Màu Thương Hiệu (Forest Green & Sage)**:
  * `bg-brand-950` (`#0B241B`): Đen xanh rêu đậm nhất.
  * `bg-brand-900` (`#12372A`): Xanh rừng trầm, thẻ chỉ số KPI nổi bật (Featured Card), Header.
  * `bg-brand-800` (`#194B3A`): Nút hành động chính (Primary Button), Active Sidebar.
  * `bg-brand-700` (`#22604B`): Trạng thái Hover của nút chính.
  * `bg-brand-100 text-brand-800` (`#E8F5EE`): Nền nhãn Tag / Badge, Active pill.
  * `bg-brand-50` (`#F2F9F5`): Nền hover nhẹ nhàng của hàng danh sách.
* **Màu Bề Mặt & Nền (Surface & Canvas)**:
  * `bg-surface-canvas` (`#F4F5F6`): Nền tổng thể toàn trang (ghi ấm dịu mắt, chống mỏi mắt cho nhân viên ca 10 tiếng).
  * `bg-surface-card` (`#FFFFFF`): Nền thẻ Panel, Card, Dialog.
  * `border-surface-border` (`#E3E5E5`): Viền siêu mảnh tinh tế.
* **Màu Chữ (Typography Ink)**:
  * `text-ink-primary` (`#161918`): Chữ chính, tiêu đề (Charcoal mềm, không dùng đen tuyền gắt).
  * `text-ink-secondary` (`#37413D`): Nội dung đoạn văn.
  * `text-ink-muted` (`#69706D`): Phụ đề, ghi chú thời gian, icon phụ.

---

## 2. QUY CHUẨN CÔNG THÁI HỌC DI ĐỘNG (MOBILE ERGONOMICS)

1. **Kích thước Điểm Chạm (Touch Targets)**:
   * Tất cả nút bấm, ô chọn, tab, icon tương tác tối thiểu `h-11` (44px), lý tưởng `h-13` (52px) để thao tác dễ dàng bằng một ngón cái.
2. **Khoảng Đệm An Toàn Đáy (Safe Bottom Padding)**:
   * Mọi danh sách cuộn trên mobile bắt buộc có đệm đáy `pb-28` để nội dung không bị che khuất bởi Bottom Navigation Bar hoặc Cart Bar.
3. **Chống Nháy Màn Hình Di Động**:
   * Áp dụng `-webkit-tap-highlight-color: transparent;` và `touch-action: manipulation;` để triệt tiêu hiệu ứng nháy xanh khó chịu khi chạm nhanh trên iOS Safari và Android Chrome.
4. **Thanh Cuộn Mảnh hoặc Ẩn (No-Scrollbar)**:
   * Sử dụng class `.no-scrollbar` cho các thanh danh mục cuộn ngang.
5. **Hệ thống Phản hồi Chuẩn hóa (Zero Native Alerts)**:
   * **Tuyệt đối cấm** `alert()`, `confirm()`, `prompt()` mặc định của trình duyệt.
   * Thông báo: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`.
   * Hộp thoại xác nhận: `await confirmDialog({ title, message, confirmText, cancelText, variant })`.

---

## 3. QUY CHUẨN COMPONENT CỐT LÕI

* **Panel (`<Panel>` hoặc `div.bg-white`)**: Luôn có `rounded-3xl` (24px) hoặc `rounded-2xl` (16px), viền `border border-surface-border`, đổ bóng cực nhẹ `shadow-sm`.
* **Button (`<Button>`)**:
  * Nút chính: `bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-2xl` hoặc `rounded-full`.
  * Nút phụ: `variant="outline"` viền `border-surface-border` nền `bg-white`.
* **Icon (`<Icon name="..." />`)**:
  * Sử dụng bộ Lucide Icons đồng bộ qua component `<Icon>`. Cấm nhúng SVG thô hoặc cài thêm bộ icon ngoài.
* **Empty State**:
  * Khi danh sách dữ liệu rỗng (chưa có món, chưa có bàn, chưa có thông báo), bắt buộc hiển thị Empty State với icon trong vòng tròn `w-16 h-16 rounded-full bg-brand-50 border border-brand-100 text-brand-800` kèm dòng giải thích rõ ràng và nút hành động thêm mới.
