# 🛡️ AN TOÀN HỆ THỐNG & PHÂN QUYỀN 6 CẤP (SECURITY & RBAC)

---

## 1. HỆ THỐNG PHÒNG THỦ AN NINH 5 LỚP

```
[ TẦNG 1: CLOUDFLARE EDGE ]
  • Chống DDoS L3/L4/L7, ẩn 100% IP máy chủ gốc.
  • Rate Limiting: Giới hạn tối đa 10 request/phút trên mỗi client.

[ TẦNG 2: PHIÊN BÀN & CHỐNG ORDER ẢO ]
  • Cổng Duyệt 1 chạm (Staff Confirmation Gate): Khách quét QR ở xa gọi món thì đơn ở trạng thái PENDING. Nhân viên thấy khách thật mới bấm DUYỆT -> Đơn mới vào bếp.
  • Rolling Session QR: Mã QR tự đổi token sau khi bàn thanh toán xong. Chụp ảnh QR mang về nhà quét sẽ bị vô hiệu hóa.

[ TẦNG 3: BẢO MẬT DỮ LIỆU & LOGIC SERVER ]
  • Server-Side Calculation: Giá món, tổng tiền tính 100% ở Server. Client can thiệp sửa giá thành 0đ sẽ bị từ chối ngay lập tức.
  • Prisma ORM: Chống tuyệt đối SQL Injection thông qua Parameterized Queries.
  • Zod Validation: Kiểm tra chặt chẽ kiểu dữ liệu đầu vào.

[ TẦNG 4: THANH TOÁN TỰ ĐỘNG CHỐNG BILL GIẢ ]
  • Dynamic VietQR: Nhúng sẵn số tiền + mã hóa đơn duy nhất.
  • Webhook ngân hàng: Tiền thực sự vào tài khoản chủ quán thì hệ thống mới nhảy chuông "Đã nhận tiền" và đổi màu bàn. Nhân viên không cần nhìn màn hình khách.

[ TẦNG 5: CHỐNG GIAN LẬN NỘI BỘ ]
  • Phân quyền RBAC: Nhân viên không thể tự ý xóa món hay sửa giá.
  • Mã PIN Quản lý: Chỉ Chủ quán/Quản lý mới có quyền duyệt hủy món.
  • Audit Log bất biến: Lưu vết mọi hành động sửa/xóa/hủy.
```

---

## 2. MA TRẬN PHÂN QUYỀN 6 CẤP (ROLE-BASED ACCESS CONTROL)

| Role Code | Tên hiển thị | Phạm vi | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Quản trị nền tảng | Toàn hệ thống | Quản lý danh sách các nhà hàng, kích hoạt/tạm khóa quán, cấu hình gói cước. |
| `STORE_OWNER` | Chủ nhà hàng | 1 Quán | Toàn quyền quán mình: Cài đặt menu, sơ đồ bàn, tài khoản ngân hàng, nhân sự, xem doanh thu lãi lỗ. |
| `ACCOUNTANT` | Kế toán | 1 Quán | Báo cáo doanh thu, đối soát tiền mặt vs VietQR, xuất file Excel kế toán. |
| `CASHIER` | Thu ngân | Quầy thu ngân | Quản lý hóa đơn, in bill tạm tính/bill nhiệt, mở mã VietQR động, chốt ca tiền mặt. |
| `CHEF` | Đầu bếp / Pha chế | Bếp / Bar | Nhận order KDS, bấm đổi trạng thái `Đang làm` -> `Đã xong`, bật/tắt nút Hết món (86). |
| `WAITER` | Nhân viên phục vụ | Sàn phục vụ | Xem trạng thái bàn, tạo order cho khách, gõ tắt T9, duyệt order khách quét QR, báo thanh toán. |

---

## 3. CƠ CHẾ GỘP QUYỀN CHO QUÁN SIÊU NHỎ (DYNAMIC ROLE BUNDLING)
* **Quán 1 người (Chủ làm tất cả)**: Tài khoản `STORE_OWNER` có Quick Switcher 1 chạm để chuyển qua lại giữa `Bàn` $\leftrightarrow$ `Bếp` $\leftrightarrow$ `Thu ngân`.
* **Quán 2 - 3 người**: Nhân viên được tích chọn quyền gộp: `WAITER + CASHIER` hoặc `WAITER + CHEF`.

---

## 4. XÁC THỰC NHÂN VIÊN BẰNG MÃ FAST-PIN 4 SỐ
* Chủ quán / Kế toán: Đăng nhập bằng Email + Mật khẩu an toàn hoặc Google OAuth.
* Nhân viên phục vụ / Thu ngân / Bếp: Chạm vào tên mình trên màn hình $\rightarrow$ Nhập mã PIN 4 số (VD: `1234`) $\rightarrow$ Đăng nhập ngay trong 1 giây mà không cần nhớ mật khẩu email phức tạp.
