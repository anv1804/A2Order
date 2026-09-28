# 🎨 BẢNG MÀU CHUẨN & QUY TẮC PHỐI MÀU A2ORDER (COLOR PALETTE & TOKENS)

> **CẢNH BÁO CHO TẤT CẢ AGENT & LẬP TRÌNH VIÊN**: 
> Đây là bảng mã màu chính thức được chốt dựa trên phong cách thiết kế **Forest Green & Warm Sage (Donezo Style)**. 
> **TUYỆT ĐỐI CẤM** tự ý bịa màu lạ, cấm dùng màu xanh dương công nghệ đại trà, cấm dùng màu cam/đỏ chói mắt. Mọi thành phần giao diện bắt buộc dùng các biến màu dưới đây.

---

## 1. TRIẾT LÝ PHỐI MÀU: "XANH RỪNG TRẦM & NỀN GIẤY DỊU MẮT"
* **Nền tổng thể (Canvas)**: `#F4F5F6` (Màu ghi ấm dịu mắt, chống mỏi mắt khi nhân viên/chủ quán nhìn màn hình 10 tiếng/ngày).
* **Khối Card/Panel**: `#FFFFFF` (Trắng tinh khiết, viền mảnh `#E5E7E8`, bo tròn mềm mại `rounded-3xl` 24px).
* **Màu chủ đạo (Primary Accent)**: **Deep Forest Green** (`#12372A` - `#1B4D3E`) kết hợp **Sage Mint** (`#48B182` / `#E8F5EE`).
* **Phong cách nút**: Nút bo tròn dạng Pill (`rounded-full` hoặc `rounded-2xl`).

---

## 2. BẢNG MÃ MÀU CHÍNH THỨC (TAILWIND TOKENS)

### 2.1. Nhóm Màu Chủ Đạo (Forest Green)
```css
/* Tông màu thương hiệu & Nút hành động chính */
--brand-950: #0B241B; /* Đậm nhất, nền đen xanh */
--brand-900: #12372A; /* Thẻ chỉ số nổi bật (Featured Card) */
--brand-800: #194B3A; /* Nút chính (Primary Button), Active Sidebar */
--brand-700: #22604B; /* Nút Hover */
--brand-600: #2E795E; /* Điểm nhấn icon */
--brand-500: #48B182; /* Màu Sage dịu */
--brand-200: #A3DBCE; /* Sage nhạt */
--brand-100: #E8F5EE; /* Nền nhãn Pill tag, Active badge */
--brand-50:  #F2F9F5; /* Nền hover nhẹ */
```

### 2.2. Nhóm Màu Nền & Khối (Surface & Canvas)
```css
--canvas:        #F4F5F6; /* Nền toàn bộ màn hình */
--surface-card:  #FFFFFF; /* Nền các thẻ Panel / Card */
--surface-muted: #ECEEED; /* Nền ô Search Pill, Nền nút phụ */
--border-subtle: #E3E5E5; /* Đường viền siêu mảnh, tinh tế */
--text-primary:  #161918; /* Màu chữ chính (Charcoal mềm, không dùng đen tuyền) */
--text-muted:    #69706D; /* Màu chữ mô tả, phụ đề */
--text-subtle:   #9CA29F; /* Màu chữ gợi ý, icon phụ */
```

### 2.3. Nhóm 5 Màu Trạng Thái Bàn & Nghiệp Vụ (Semantic Colors)
Được cân chỉnh độ bão hòa dịu mắt, không bị gắt:

| Trạng thái bàn | Màu chữ & Icon | Màu nền (Badge/Card) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| 🟢 **Bàn Trống** | `#194B3A` (Forest Green) | `#E8F5EE` | Bàn sẵn sàng đón khách |
| 🟡 **Đang chọn món** | `#B45309` (Warm Amber) | `#FEF3C7` | Khách đang xem menu |
| 🟠 **Đang chờ Bếp** | `#C2410C` (Terracotta) | `#FFEDD5` | Bếp đang nấu (Bắt đầu đếm SLA) |
| 🔵 **Đã lên đủ món** | `#1D4ED8` (Muted Blue) | `#EFF6FF` | Khách đang dùng bữa |
| 🔴 **Chờ thanh toán**| `#B91C1C` (Soft Crimson) | `#FEE2E2` | Khách gọi tính tiền |

---

## 3. QUY TẮC TẠO DÁNG COMPONENT (COMPONENT STYLING RULES)

1. **Thẻ Panel / Card**:
   * Bo góc: `rounded-3xl` (24px) hoặc `rounded-2xl` (16px).
   * Viền: `border border-[#E3E5E5]`.
   * Đổ bóng: `shadow-[0_2px_12px_rgba(0,0,0,0.03)]` (Đổ bóng cực nhẹ như sương).
2. **Thanh tìm kiếm & Nút hành động**:
   * Bo tròn hoàn toàn: `rounded-full`.
   * Chiều cao chuẩn: `h-11` (44px) đến `h-12` (48px).
3. **Thẻ chỉ số nổi bật (Featured Metric Card)**:
   * Giống card `Total Projects` trong mẫu tham khảo: Nền màu xanh trầm `#12372A`, chữ số màu trắng cực lớn `text-4xl font-extrabold text-white`, icon mũi tên trong vòng tròn trắng mờ.
