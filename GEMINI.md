# 🤖 A2ORDER - HƯỚNG DẪN DỰ ÁN CHO GEMINI & ANTIGRAVITY AGENTS

> Tham khảo chi tiết toàn bộ nguyên tắc tại [`AGENTS.md`](./AGENTS.md) và [`docs/.agent-guidelines.md`](./docs/.agent-guidelines.md).

## 🛑 BỘ QUY TẮC BẤT BIẾN TỐI CAO
1. **Bảng màu Donezo Forest Green**: Nền `bg-surface-canvas` (`#F4F5F6`), card trắng `bg-surface-card` bo góc `rounded-3xl`, màu chính `bg-brand-900`/`800` (`#12372A`), badge mint `bg-brand-100 text-brand-800` (`#E8F5EE`). Cấm tự bịa màu lạ, cấm màu xanh dương công nghệ đại trà.
2. **Cấm Alert/Confirm Trình Duyệt**: Bắt buộc dùng `toast.success()`, `toast.error()`, `confirmDialog()`.
3. **Quy chuẩn Icon**: Dùng `<Icon name="..." />` Lucide từ thư viện nội bộ.
4. **Bảo toàn Multi-Tenancy**: Mọi truy vấn, mutation, WebSocket bắt buộc có `storeId`.
5. **Tính toán Tiền 100% Server-Side**: Không bao giờ tính giá, chiết khấu, VAT tại client.
6. **Chống Spam**: Dùng `useAntiSpamAction` kèm `x-idempotency-key` cho submit đơn/thanh toán.
7. **Tách Types/Interfaces**: Đặt trong `types/` hoặc `packages/shared`, cấm inline trong JSX.
8. **Code Gọn Gàng**: Tự tường minh, không comment lan man vào code.
9. **Xác thực Toàn diện**: Chạy `npm run build` trước khi hoàn tất mọi tác vụ để đảm bảo 0 lỗi.
10. **Tự Kích Hoạt Skills**: Chủ động đọc các kỹ năng tại `.agents/skills/` khi gặp tác vụ tương ứng.
