import { useState, useEffect } from "react";

// Danh sách các chuỗi nhận diện dữ liệu fake/mock cũ cần loại bỏ triệt để
const MOCK_DATA_PATTERNS = [
  "Khu Máy Lạnh",
  "Sân Vườn Thoáng Mát",
  "Phòng Tiệc VIP",
  "Bác Hùng",
  "Cô Hương Lan",
  "QUẨY BAR",
  "Quẩy Bar",
  "B12-004",
  "B03-005",
  "Coca Cola Tươi",
  "Bia Tiger Lon Bạc",
  "Sinh Tố Bơ Đắk Lắk",
  "Phở Bò Tái Nạm",
  "Bún Chả Hà Nội",
  "HD-2026",
  "Anh Hoàng Tuấn",
  "Chị Thảo Mai",
  "SAMPLE_",
  "note-init-1",
  "Kiểm tra số lượng nguyên liệu",
  "Chúc Mừng Sinh Nhật Hội Viên (Tự Động)",
  "Kéo Khách Quen 30 Ngày Chưa Quay Lại",
  "INV-2026-0091",
  "Trà Sữa Topping Đô Đô",
  "Quán Cà Phê Muối Chú Long",
];

function isMockData(raw: string): boolean {
  return MOCK_DATA_PATTERNS.some((pattern) => raw.includes(pattern));
}

export function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `a2order_${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        // Tự động kiểm tra và xóa bỏ nếu là data fake cũ còn lưu trong trình duyệt
        if (isMockData(stored)) {
          console.warn(`[A2Order Cleanup] Phát hiện data fake trong key "${storageKey}". Đang tự động xóa bỏ!`);
          localStorage.removeItem(storageKey);
          return initialValue;
        }
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn(`Lỗi đọc localStorage key "${storageKey}":`, err);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      // Chỉ lưu nếu không phải data fake
      const serialized = JSON.stringify(state);
      if (isMockData(serialized)) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, serialized);
      }
    } catch (err) {
      console.warn(`Lỗi ghi localStorage key "${storageKey}":`, err);
    }
  }, [storageKey, state]);

  return [state, setState];
}
