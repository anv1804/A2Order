# Hướng Dẫn Thiết Kế Giao Diện (UI/UX Guidelines)
Dự án: **A2Order Platform (B2B SaaS F&B)**

Tài liệu này quy định các tiêu chuẩn thiết kế UI/UX đặc trưng của hệ thống A2Order. Bất kỳ Agent hay Lập trình viên nào khi phát triển tính năng mới ĐỀU PHẢI tuân thủ nghiêm ngặt để đảm bảo tính nhất quán (Consistency) và tránh sinh ra mã thừa.

## 1. Bảng Màu Đặc Trưng (Color Palette)
Hệ thống sử dụng các biến màu Semantic (ý nghĩa) được định nghĩa sẵn trong Tailwind:

- **Brand (Màu thương hiệu - Xanh rêu/Xanh ngọc tối):**
  - `bg-brand-900`: Nút bấm chính (Primary Button), Header đặc biệt.
  - `text-brand-800`: Text nhấn mạnh, tiêu đề phần.
  - `bg-brand-50`: Nền làm nổi bật nhẹ.
- **Ink (Màu văn bản):**
  - `text-ink-primary`: Tiêu đề, text chính (Slate-900).
  - `text-ink-secondary`: Đoạn văn thông thường.
  - `text-ink-muted`: Chú thích, phụ đề (Slate-500).
- **Surface (Màu bề mặt & Nền):**
  - `bg-surface-canvas`: Nền trang tổng thể (thường là xám rất sáng).
  - `bg-white`: Nền thẻ (Card), Panel.
  - `border-surface-border`: Viền thẻ, viền input (Slate-200/Slate-100).
- **Semantic/Trạng thái (Tones):**
  - `emerald-600` / `emerald-50`: Thành công (Thanh toán xong, Hoạt động).
  - `amber-600` / `amber-50`: Cảnh báo (Đang chờ, Sắp hết hạn).
  - `rose-600` / `rose-50`: Lỗi, Hủy (Quá hạn, Hủy bỏ, Xóa).
  - `indigo-600` / `indigo-50`: Hành động đặc biệt, Thông tin bổ sung.

## 2. Các Thành Phần (UI Components) Cốt Lõi
Toàn bộ UI Component được tái sử dụng từ `apps/cms/src/components/ui/`. KHÔNG tạo component trùng lặp.
- **Panel (`<Panel>`):** Khung chứa nội dung chính, luôn có `rounded-2xl` hoặc `rounded-3xl` và đổ bóng nhẹ `shadow-sm` hoặc `shadow-elevated`. Không dùng `div` cứng.
- **Button (`<Button>`):** Dùng cho mọi nút bấm. Hỗ trợ các variant (`primary`, `outline`, `danger`) và size (`sm`, `md`, `lg`). Các nút chính thường bo tròn hoàn toàn `rounded-full`.
- **Badge (`<Badge>`):** Dùng để hiển thị trạng thái (Thành công, Thất bại, Cảnh báo).
- **Icon (`<Icon>`):** Import từ bộ icon chung `iconMap`. Không chèn ảnh SVG trực tiếp vào component để tránh rác code.
- **Pagination (`<Pagination>`):** Dùng chung cho mọi bảng dữ liệu.

## 3. Phong Cách Thiết Kế Đặc Trưng (Signature Style)
1. **Bo góc lớn (Large Radius):** Rất chuộng các viền bo tròn mềm mại (`rounded-2xl`, `rounded-xl` cho Panel/Card và `rounded-full` cho Button/Tag).
2. **Đổ bóng mượt (Soft Shadows):** Không dùng bóng đen gắt. Dùng bóng có độ nhòe lớn và opacity thấp (VD: `shadow-[0_4px_18px_rgba(15,23,42,.035)]`).
3. **Typography:** Dùng font sans-serif, tiêu đề thường có font-weight lớn (`font-black`, `font-extrabold`) để tạo sự rõ ràng.
4. **Viền thẻ đứt nét (Ticket Style):** Thường áp dụng cho Mã khuyến mại (Voucher) hoặc Hóa đơn để tạo cảm giác thương mại điện tử.
5. **Mini-dashboard:** Mọi trang quản trị danh sách (List View) đều nên có một dải thẻ KPI (Mini-dashboard) ở trên cùng để tóm tắt số liệu trước khi hiển thị bảng.
