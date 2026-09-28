# TÀI LIỆU KỸ THUẬT & AN TOÀN HỆ THỐNG A2ORDER
## Kiến trúc Đa Nền Tảng (PWA), Đa Thuê Thuê (Multi-Tenant) & Hệ Thống Phân Quyền (RBAC)

---

# PHẦN 1: MÔ HÌNH ĐA THUÊ THUÊ (MULTI-TENANT ARCHITECTURE)
Hệ thống A2Order được xây dựng theo mô hình **SaaS Multi-Tenant (Một nền tảng - Phục vụ hàng ngàn nhà hàng độc lập)**.

### 1.1. Cách ly dữ liệu tuyệt đối (Tenant Data Isolation)
* Mỗi nhà hàng/quán ăn khi đăng ký sẽ được cấp một `store_id` (hoặc `tenant_id`) duy nhất.
* Tất cả bảng dữ liệu nghiệp vụ (`Tables`, `Categories`, `MenuItems`, `Orders`, `Bills`, `Staff`) đều được gắn chặt với `store_id`.
* Mọi câu truy vấn Database ở tầng Backend đều bắt buộc có điều kiện `WHERE store_id = current_store_id`, đảm bảo **100% không bao giờ xảy ra việc chủ quán này nhìn thấy dữ liệu, doanh thu hay menu của quán khác**.

---

# PHẦN 2: HỆ THỐNG PHÂN QUYỀN ĐA CẤP (ROLE-BASED ACCESS CONTROL - RBAC)

Hệ thống được thiết kế theo cấu trúc kim tự tháp, phân định rõ ràng giữa **Quản trị nền tảng** và **Vận hành nội bộ từng quán**:

```
                       ┌─────────────────────────┐
                       │       SUPER ADMIN       │  <-- Bạn (Chủ nền tảng A2Order)
                       │  (Quản lý từ xa các quán)│
                       └────────────┬────────────┘
                                    │ Cấp phép / Giám sát
                       ┌────────────▼────────────┐
                       │       STORE OWNER       │  <-- Chủ nhà hàng / Quán ăn
                       │ (Full quyền quán của họ)│
                       └────────────┬────────────┘
                                    │ Phân bổ quyền vận hành
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
  │  ACCOUNTANT  │           │   CASHIER    │           │     CHEF     │
  │  (Kế toán)   │           │  (Thu ngân)  │           │ (Đầu bếp/Bar)│
  └──────────────┘           └──────────────┘           └──────────────┘
                                    ▲
                                    │ Hỗ trợ linh hoạt
                             ┌──────┴──────┐
                             │   WAITER    │
                             │ (Phục vụ)   │
                             └─────────────┘
```

### 2.1. Chi tiết quyền hạn từng vai trò (Role Matrix)

| Vai trò (Role) | Phạm vi quản lý | Quyền hạn chi tiết | Giao diện hiển thị |
| :--- | :--- | :--- | :--- |
| **1. SUPER ADMIN** *(Bạn)* | **Toàn hệ thống (Global)** | • Xem danh sách tất cả nhà hàng đang hoạt động.<br>• Kích hoạt / Tạm khóa quán (khi hết hạn dịch vụ).<br>• Cấu hình gói dịch vụ, xem thống kê số lượng đơn toàn sàn.<br>• Đăng nhập khẩn cấp (Impersonate) để hỗ trợ kỹ thuật cho chủ quán khi cần. | **Super Admin Dashboard**: Bản đồ hệ thống, danh sách đối tác, doanh thu bản quyền. |
| **2. CHỦ QUÁN (Store Owner)** | **1 Quán duy nhất** | • Toàn quyền thiết lập quán mình: Tên, logo, địa chỉ.<br>• Cấu hình tài khoản ngân hàng nhận tiền VietQR.<br>• Quản lý Menu (món, giá, ảnh), sơ đồ phòng/bàn.<br>• Tạo và phân quyền cho nhân viên (cấp mã PIN).<br>• Xem toàn bộ báo cáo doanh thu, lợi nhuận, ca làm việc. | **Owner Portal**: Toàn bộ các tab quản lý + Cài đặt hệ thống. |
| **3. KẾ TOÁN (Accountant)** | **Tài chính 1 Quán** | • Xem báo cáo doanh thu theo ngày/tháng/ca.<br>• Lịch sử dòng tiền: Tiền mặt vs Chuyển khoản VietQR.<br>• Đối soát chênh lệch hóa đơn, xuất file Excel kế toán.<br>• Không thể sửa menu, không can thiệp vào phục vụ bàn. | **Financial Hub**: Báo cáo tài chính, Sổ giao dịch, Xuất Excel. |
| **4. THU NGÂN (Cashier)** | **Quầy tính tiền** | • Xem sơ đồ bàn & hóa đơn của từng bàn.<br>• In phiếu tạm tính, in hóa đơn GTGT/hóa đơn nhiệt.<br>• Sinh mã VietQR động, xác nhận thanh toán tiền mặt.<br>• Chốt ca làm việc, bàn giao tiền mặt đầu ca/cuối ca. | **Cashier Screen**: Bàn ăn, Hóa đơn, Máy in, Mã VietQR. |
| **5. ĐẦU BẾP / PHA CHẾ (Chef)** | **Khu vực Bếp / Bar** | • Nhận phiếu order theo thời gian thực (KDS).<br>• Bấm chuyển trạng thái: `Đang nấu` $\rightarrow$ `Đã xong`.<br>• Bật/Tắt món khẩn cấp (Hết món 86).<br>• Không thấy doanh thu, không thấy thông tin tiền nong. | **Kitchen Display (KDS)**: Nền tối, chữ to, chuông báo món. |
| **6. PHỤC VỤ (Waiter)** | **Sàn phục vụ** | • Xem sơ đồ bàn (Bàn trống, có khách).<br>• Tạo order cho bàn, chọn món, ghi chú cho bếp.<br>• Duyệt order khi khách tự quét QR gọi món.<br>• Báo yêu cầu thanh toán về quầy thu ngân.<br>• CẤM: Xóa món đã gửi bếp, sửa giá, xem báo cáo tổng. | **Waiter Mobile App**: Giao diện tối ưu ngón cái 1 tay, gõ tắt T9. |

---

### 2.2. Cơ chế thích ứng linh hoạt cho Quán Siêu Nhỏ (Dynamic Role Bundling)

Quán nhỏ tại Việt Nam thường không đủ người để chia nhỏ 5 bộ phận. Hệ thống A2Order giải quyết bài toán này bằng **Cơ chế Gộp Quyền Tự Động**:

* **Mô hình 1 người (Chủ quán kiêm tất cả - Quán cà phê/quán ăn gia đình)**:
  * Đăng nhập bằng tài khoản `STORE_OWNER` $\rightarrow$ Có một thanh chuyển nhanh (Quick Switcher) trên màn hình: Chuyển giữa `[Giao diện Bàn]` $\leftrightarrow$ `[Giao diện Bếp]` $\leftrightarrow$ `[Thu ngân/Thanh toán]` chỉ trong 1 chạm.
* **Mô hình 2 - 3 người (Chủ quán + 2 Nhân viên chạy bàn)**:
  * Không cần tạo tài khoản Kế toán hay Thu ngân riêng.
  * Nhân viên được cấp quyền gộp: `WAITER + CASHIER` (Vừa gọi món, vừa kiêm thu tiền tại bàn).
* **Mô hình Bếp kiêm Phục vụ**:
  * Cấp quyền `WAITER + CHEF`.

---

### 2.3. Trải nghiệm đăng nhập thực tế tại quán: Phân tầng 2 lớp

Để nhân viên không phải nhớ mật khẩu phức tạp, hệ thống chia thành 2 hình thức xác thực:

```
[LỚP 1: CẤP QUẢN LÝ (Admin / Chủ quán / Kế toán)]
• Đăng nhập bằng Email + Mật khẩu mạnh hoặc Google Login (OAuth).
• Bảo vệ đa lớp (2FA nếu cần), phục vụ việc quản lý từ xa mọi lúc mọi nơi.

[LỚP 2: CẤP VẬN HÀNH TẠI QUÁN (Bồi bàn / Thu ngân / Đầu bếp)]
• Cơ chế Fast PIN (4 số) / Thẻ QR nhân viên:
  - Máy tính bảng tại quầy hoặc điện thoại nhân viên chỉ cần mở App.
  - Màn hình hiện danh sách nhân viên trong ca: [Hùng - Phục vụ], [Lan - Thu ngân], [Bác Ba - Bếp].
  - Nhân viên bấm vào tên mình -> Nhập mã PIN 4 số (Ví dụ: 1234) -> Đăng nhập ngay trong 1 giây!
  - Hết ca: Bấm "Đổi ca" -> Khóa màn hình lại chờ nhân viên ca sau.
```

---

# PHẦN 3: KIẾN TRÚC CÀI ĐẶT ĐA NỀN TẢNG (PWA CHO IOS & ANDROID)

Hệ thống A2Order áp dụng kiến trúc **Progressive Web App (PWA)** chuẩn W3C, cho phép một mã nguồn Web duy nhất hoạt động như Native App trên mọi thiết bị:

### 3.1. Hướng dẫn cài đặt thực địa cho nhân viên
* **Trên iPhone (iOS)**: Mở Safari $\rightarrow$ Bấm nút "Chia sẻ" $\rightarrow$ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
* **Trên Android (Samsung, Xiaomi, Oppo...)**: Mở Chrome $\rightarrow$ Hiện thông báo **"Cài đặt ứng dụng"** $\rightarrow$ Bấm "Cài đặt".
* **Đặc tính sau cài đặt**:
  * Chạy toàn màn hình (**Full-screen**, không có thanh gõ địa chỉ web).
  * Dung lượng siêu nhẹ (~2MB).
  * Tự động cập nhật tính năng mới tức thì mà không cần qua App Store/Google Play.

---

# PHẦN 4: HỆ THỐNG PHÒNG THỦ AN NINH MẠNG 5 LỚP

| Nguy cơ | Giải pháp kỹ thuật A2Order |
| :--- | :--- |
| **1. Order ma / Phá hoại từ xa** | **Cổng Duyệt 1 chạm (Staff Gate)**: Khách quét QR ở nhà gọi món sẽ bị chặn lại ở trạng thái Chờ duyệt; nhân viên thấy khách thật mới bấm Duyệt.<br>**Mã Session Động (Rolling QR)**: Mã QR bàn tự vô hiệu hóa sau khi khách thanh toán xong. |
| **2. Gian lận bill chuyển khoản giả** | **Dynamic VietQR + Webhook**: Màn hình chỉ nhảy chuông "Đã nhận tiền" khi tiền thực sự đã vào tài khoản ngân hàng của quán thông qua Webhook tự động. Thu ngân không cần nhìn màn hình khách. |
| **3. Gian lận nội bộ** | **RBAC + Mã PIN Quản lý**: Nhân viên không có quyền xóa món đã gửi bếp hoặc tự ý giảm giá. Mọi hành vi bất thường đều được ghi vào **Audit Log** vĩnh viễn. |
| **4. Tấn công sập máy chủ (DDoS/Spam)** | **Cloudflare WAF**: Ẩn IP máy chủ, chống DDoS L3/L4/L7 miễn phí.<br>**Rate Limiting**: Giới hạn tối đa 10 request/phút trên mỗi thiết bị. |
| **5. Sửa giá / Đánh cắp dữ liệu** | **Server-side Calculation**: Giá tiền tính toán 100% tại máy chủ.<br>**Prisma ORM**: Chống tuyệt đối lỗi SQL Injection. |

---

# PHẦN 5: TỔNG KẾT
Kiến trúc này đảm bảo:
1. **Bạn (Super Admin)**: Nắm toàn quyền vận hành kinh doanh, có thể mở rộng từ 1 quán lên 1.000 quán ăn trên khắp cả nước mà không cần viết lại hệ thống.
2. **Chủ quán**: Kiểm soát toàn bộ doanh thu, dữ liệu độc lập, an tâm không bị lộ bí mật kinh doanh.
3. **Nhân viên**: Dễ dùng, phân quyền rõ ràng, không thể gian lận, thích ứng linh hoạt từ quán 1 người đến nhà hàng nhiều bộ phận.
