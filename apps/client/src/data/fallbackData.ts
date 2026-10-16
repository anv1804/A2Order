import { TableStatus, OrderItemStatus } from "@a2order/shared";
import { TableItem, KdsTicket } from "@/types";

export const DEFAULT_FALLBACK_TABLES: TableItem[] = [
  // Tầng 1 (Máy Lạnh)
  {
    id: "tb-01",
    name: "Bàn 01",
    status: TableStatus.OCCUPIED,
    zone: "T1",
    occupiedMinutes: 24,
    totalAmount: 185000,
  },
  {
    id: "tb-02",
    name: "Bàn 02",
    status: TableStatus.EMPTY,
    zone: "T1",
    occupiedMinutes: 0,
    totalAmount: 0,
  },
  {
    id: "tb-03",
    name: "Bàn 03",
    status: TableStatus.WAITING_FOOD,
    zone: "T1",
    occupiedMinutes: 12,
    totalAmount: 320000,
  },
  {
    id: "tb-04",
    name: "Bàn 04",
    status: TableStatus.SERVED,
    zone: "T1",
    occupiedMinutes: 45,
    totalAmount: 215000,
  },
  {
    id: "tb-05",
    name: "Bàn 05",
    status: TableStatus.PAYMENT_PENDING,
    zone: "T1",
    occupiedMinutes: 58,
    totalAmount: 490000,
  },
  {
    id: "tb-06",
    name: "Bàn 06",
    status: TableStatus.EMPTY,
    zone: "T1",
    occupiedMinutes: 0,
    totalAmount: 0,
  },

  // Tầng 2 (Sân Vườn)
  {
    id: "tb-201",
    name: "Bàn 201",
    status: TableStatus.OCCUPIED,
    zone: "T2",
    occupiedMinutes: 18,
    totalAmount: 140000,
  },
  {
    id: "tb-202",
    name: "Bàn 202",
    status: TableStatus.EMPTY,
    zone: "T2",
    occupiedMinutes: 0,
    totalAmount: 0,
  },
  {
    id: "tb-203",
    name: "Bàn 203",
    status: TableStatus.WAITING_FOOD,
    zone: "T2",
    occupiedMinutes: 8,
    totalAmount: 265000,
  },
  {
    id: "tb-204",
    name: "Bàn 204",
    status: TableStatus.EMPTY,
    zone: "T2",
    occupiedMinutes: 0,
    totalAmount: 0,
  },

  // Phòng VIP
  {
    id: "tb-vip-01",
    name: "Phòng VIP 01",
    status: TableStatus.OCCUPIED,
    zone: "VIP",
    occupiedMinutes: 75,
    totalAmount: 1450000,
  },
  {
    id: "tb-vip-02",
    name: "Phòng VIP 02",
    status: TableStatus.EMPTY,
    zone: "VIP",
    occupiedMinutes: 0,
    totalAmount: 0,
  },

  // Khu Ngoài Trời
  {
    id: "tb-out-01",
    name: "Sân Vườn 01",
    status: TableStatus.EMPTY,
    zone: "SAN_VUON",
    occupiedMinutes: 0,
    totalAmount: 0,
  },
  {
    id: "tb-out-02",
    name: "Sân Vườn 02",
    status: TableStatus.SERVED,
    zone: "SAN_VUON",
    occupiedMinutes: 35,
    totalAmount: 95000,
  },
];

export const DEFAULT_FALLBACK_KDS: KdsTicket[] = [
  {
    id: "kds-101",
    tableName: "Bàn 03",
    minutesAgo: 12,
    batchNumber: 1,
    items: [
      { id: "it-1", name: "Bún Chả Hà Nội Đặc Biệt", quantity: 2, notes: "Nhiều ớt, không hạt tiêu", status: OrderItemStatus.QUEUED },
      { id: "it-2", name: "Nem Cua Bể Hải Phòng", quantity: 1, notes: "Chiên giòn", status: OrderItemStatus.QUEUED },
    ],
  },
  {
    id: "kds-102",
    tableName: "Bàn 203",
    minutesAgo: 8,
    batchNumber: 1,
    items: [
      { id: "it-3", name: "Phở Bò Tái Lăn Hà Nội", quantity: 1, notes: "Ít hành, nước béo", status: OrderItemStatus.COOKING },
      { id: "it-4", name: "Trà Đào Cam Sả Tươi", quantity: 2, notes: "50% đường, ít đá", status: OrderItemStatus.COOKING },
    ],
  },
  {
    id: "kds-103",
    tableName: "Phòng VIP 01",
    minutesAgo: 22,
    batchNumber: 2,
    items: [
      { id: "it-5", name: "Lẩu Riêu Cua Bắp Bò Sườn Sụn", quantity: 1, notes: "Nồi lớn 6 người", status: OrderItemStatus.COOKING },
      { id: "it-6", name: "Chả Cá Lã Vọng", quantity: 2, notes: "Kèm mắm tôm nguyên chất", status: OrderItemStatus.DONE },
    ],
  },
  {
    id: "kds-104",
    tableName: "Bàn 01",
    minutesAgo: 4,
    batchNumber: 1,
    items: [
      { id: "it-7", name: "Cà Phê Muối Xứ Huế", quantity: 2, notes: "Nhiều kem muối", status: OrderItemStatus.QUEUED },
      { id: "it-8", name: "Bánh Croissant Bơ Pháp", quantity: 1, notes: "Làm nóng trước khi ra", status: OrderItemStatus.DONE },
    ],
  },
];

export const DEFAULT_FALLBACK_MENU = [
  {
    id: "dish-01",
    name: "Bún Chả Hà Nội Đặc Biệt",
    price: 65000,
    costPrice: 28000,
    categoryId: "cat-main",
    categoryName: "Món Chính",
    description: "Thịt nướng than hoa thơm lừng, chả băm đậm đà kèm nước chấm đu đủ cà rốt và bún tươi.",
    imageUrl: "/menu/buncha.jpg",
    isAvailable: true,
    variants: [
      { id: "v1", name: "Suất Thường", price: 65000 },
      { id: "v2", name: "Suất Đặc Biệt (+Chả)", price: 85000 },
    ],
    optionGroups: [
      {
        id: "g1",
        name: "Yêu Cầu Nước Chấm",
        options: [
          { id: "o1", name: "Nhiều ớt tươi cay", price: 0 },
          { id: "o2", name: "Không tỏi ớt", price: 0 },
        ],
      },
    ],
  },
  {
    id: "dish-02",
    name: "Phở Bò Tái Lăn Hà Nội",
    price: 60000,
    costPrice: 25000,
    categoryId: "cat-main",
    categoryName: "Món Chính",
    description: "Thịt bò thăn xào lăn thơm mùi gừng tỏi, nước dùng xương hầm 12 tiếng ngọt thanh.",
    imageUrl: "/menu/pho.jpg",
    isAvailable: true,
    variants: [
      { id: "v3", name: "Tô Vừa", price: 60000 },
      { id: "v4", name: "Tô Lớn Thêm Bò", price: 80000 },
    ],
  },
  {
    id: "dish-03",
    name: "Nem Cua Bể Hải Phòng (4 Chiếc)",
    price: 85000,
    costPrice: 40000,
    categoryId: "cat-appetizer",
    categoryName: "Khai Vị",
    description: "Thịt cua bể tươi bọc bánh đa nem giòn rụm, kèm mộc nhĩ nấm hương gia truyền.",
    imageUrl: "/menu/nem.jpg",
    isAvailable: true,
  },
  {
    id: "dish-04",
    name: "Lẩu Riêu Cua Bắp Bò Sườn Sụn",
    price: 385000,
    costPrice: 165000,
    categoryId: "cat-hotpot",
    categoryName: "Lẩu & Nướng",
    description: "Nước lẩu riêu cua đồng chua thanh thơm mùi giấm bỗng, bắp bò hoa và sườn sụn tươi non.",
    imageUrl: "/menu/lau.jpg",
    isAvailable: true,
  },
  {
    id: "dish-05",
    name: "Trà Đào Cam Sả Tươi",
    price: 35000,
    costPrice: 12000,
    categoryId: "cat-drinks",
    categoryName: "Đồ Uống",
    description: "Trà đen ủ lạnh kết hợp đào miếng giòn ngọt, nước cam tươi vắt và sả thơm dịu mát.",
    imageUrl: "/menu/tradao.jpg",
    isAvailable: true,
  },
  {
    id: "dish-06",
    name: "Cà Phê Muối Xứ Huế",
    price: 32000,
    costPrice: 10000,
    categoryId: "cat-drinks",
    categoryName: "Đồ Uống",
    description: "Cà phê Robusta pha phin đậm vị phủ lớp bọt kem sữa muối biển béo ngậy đặc trưng.",
    imageUrl: "/menu/cafemuoi.jpg",
    isAvailable: true,
  },
];
