import { CashierBillItem } from "@/types";

export const SAMPLE_BILLS: Record<string, CashierBillItem[]> = {
  "2": [
    { id: "b1", name: "Phở Bò Tái Nạm", quantity: 2, price: 65000 },
    { id: "b2", name: "Trứng Gà Trần", quantity: 2, price: 12000 },
    { id: "b3", name: "Trà Đào Cam Sả", quantity: 2, price: 35000 },
  ],
  "3": [
    { id: "b4", name: "Bún Chả Hà Nội Đặc Biệt", quantity: 2, price: 60000 },
    { id: "b5", name: "Nem Rán Hải Sản", quantity: 1, price: 55000 },
    { id: "b6", name: "Coca Cola", quantity: 2, price: 18000 },
  ],
  "4": [
    { id: "b7", name: "Lẩu Đuôi Bò Nồi Đất", quantity: 1, price: 350000 },
    { id: "b8", name: "Bia Tiger Bạc (Lon)", quantity: 6, price: 28000 },
    { id: "b9", name: "Quẩy Giòn Phở", quantity: 2, price: 10000 },
  ],
  "5": [
    { id: "b10", name: "Bò Nướng Tảng Sốt Phô Mai", quantity: 1, price: 185000 },
    { id: "b11", name: "Trà Chanh Mật Ong", quantity: 2, price: 25000 },
    { id: "b12", name: "Khoai Tây Chiên Bơ Tỏi", quantity: 1, price: 40000 },
  ],
};
