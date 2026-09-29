import { MenuItemData } from "@/types";

/** Menu hiển thị trên tab "Kiểm Soát Thực Đơn (Báo Hết Món)" trong App.tsx */
export const INITIAL_MENU: (MenuItemData & { category: string })[] = [
  {
    id: "m1",
    name: "Phở Bò Tái Nạm",
    price: 65000,
    isAvailable: true,
    category: "PHO",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m2",
    name: "Phở Bò Tái Lăn",
    price: 70000,
    isAvailable: true,
    category: "PHO",
    image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m3",
    name: "Bún Chả Hà Nội Đặc Biệt",
    price: 60000,
    isAvailable: true,
    category: "PHO",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m4",
    name: "Bò Tái Thăn Thượng Hạng",
    price: 85000,
    isAvailable: false,
    category: "PHO",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m5",
    name: "Lẩu Đuôi Bò Nồi Đất",
    price: 350000,
    isAvailable: true,
    category: "LAU",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m6",
    name: "Bò Nướng Tảng Sốt Phô Mai",
    price: 185000,
    isAvailable: true,
    category: "LAU",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m7",
    name: "Nem Rán Hải Sản",
    price: 55000,
    isAvailable: true,
    category: "KHAI_VI",
    image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m8",
    name: "Trà Đào Cam Sả",
    price: 35000,
    isAvailable: true,
    category: "DOUONG",
    image: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
  },
];

export interface DishOption {
  id: string;
  name: string;
  priceModifier?: number;
}

export interface DishOptionGroup {
  id: string;
  name: string;
  required?: boolean;
  options: DishOption[];
}

/** Interface cho món ăn trong OrderMenuModal (có thêm fields riêng) */
export interface MenuDishItem {
  id: string;
  name: string;
  category: "PHO_BUN" | "NUONG_LAU" | "KHAI_VI" | "DOUONG";
  categoryLabel: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  variants?: { id: string; name: string; price: number }[];
  optionGroups?: DishOptionGroup[];
}

/** Menu database dùng bên trong OrderMenuModal */
export const MENU_DATABASE: MenuDishItem[] = [
  {
    id: "m1",
    name: "Phở Bò Tái Nạm",
    category: "PHO_BUN",
    categoryLabel: "Phở & Bún",
    price: 65000,
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
    isPopular: true,
    variants: [
      { id: "v1_std", name: "Tô Vừa", price: 65000 },
      { id: "v1_large", name: "Tô Lớn (+15k)", price: 80000 },
      { id: "v1_spec", name: "Đặc Biệt (+30k)", price: 95000 },
    ],
    optionGroups: [
      {
        id: "opt_banh",
        name: "Loại Bánh Phở",
        options: [
          { id: "b_mem", name: "Bánh mềm" },
          { id: "b_dai", name: "Bánh dai" },
        ],
      },
      {
        id: "opt_extra",
        name: "Thêm Món Kèm",
        options: [
          { id: "quay", name: "Thêm quẩy giòn", priceModifier: 10000 },
          { id: "trung", name: "Thêm trứng trần", priceModifier: 12000 },
          { id: "tiet", name: "Tiết luộc", priceModifier: 15000 },
        ],
      },
    ],
  },
  {
    id: "m2",
    name: "Phở Bò Tái Lăn",
    category: "PHO_BUN",
    categoryLabel: "Phở & Bún",
    price: 70000,
    image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
    variants: [
      { id: "v2_std", name: "Tô Vừa", price: 70000 },
      { id: "v2_large", name: "Tô Lớn", price: 85000 },
    ],
    optionGroups: [
      {
        id: "opt_extra2",
        name: "Kèm Thêm",
        options: [
          { id: "quay2", name: "Thêm quẩy giòn", priceModifier: 10000 },
          { id: "trung2", name: "Trứng gà trần", priceModifier: 12000 },
        ],
      },
    ],
  },
  {
    id: "m3",
    name: "Bún Chả Hà Nội Đặc Biệt",
    category: "PHO_BUN",
    categoryLabel: "Phở & Bún",
    price: 60000,
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
    isPopular: true,
    variants: [
      { id: "v3_std", name: "Suất Thường", price: 60000 },
      { id: "v3_large", name: "Suất Nhiều Thịt (+20k)", price: 80000 },
    ],
    optionGroups: [
      {
        id: "opt_cha",
        name: "Thêm Chả",
        options: [
          { id: "cha_mieng", name: "Thêm chả miếng", priceModifier: 20000 },
          { id: "cha_vien", name: "Thêm chả viên", priceModifier: 20000 },
          { id: "nem_ran", name: "Thêm 1 nem rán", priceModifier: 15000 },
        ],
      },
    ],
  },
  {
    id: "m4",
    name: "Bò Tái Thăn Thượng Hạng",
    category: "PHO_BUN",
    categoryLabel: "Phở & Bún",
    price: 85000,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m5",
    name: "Lẩu Đuôi Bò Nồi Đất",
    category: "NUONG_LAU",
    categoryLabel: "Nướng & Lẩu",
    price: 350000,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
    isPopular: true,
    variants: [
      { id: "l_nho", name: "Nồi Vừa (2-3 người)", price: 350000 },
      { id: "l_lon", name: "Nồi Lớn (4-6 người)", price: 490000 },
    ],
  },
  {
    id: "m6",
    name: "Bò Nướng Tảng Sốt Phô Mai",
    category: "NUONG_LAU",
    categoryLabel: "Nướng & Lẩu",
    price: 185000,
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m7",
    name: "Nem Rán Hải Sản (4 chiếc)",
    category: "KHAI_VI",
    categoryLabel: "Khai Vị",
    price: 55000,
    image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m8",
    name: "Gỏi Cuốn Tôm Thịt (3 cuốn)",
    category: "KHAI_VI",
    categoryLabel: "Khai Vị",
    price: 45000,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m9",
    name: "Quẩy Giòn Phở",
    category: "KHAI_VI",
    categoryLabel: "Khai Vị",
    price: 10000,
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m10",
    name: "Trứng Gà Trần",
    category: "KHAI_VI",
    categoryLabel: "Khai Vị",
    price: 12000,
    image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m11",
    name: "Trà Đào Cam Sả",
    category: "DOUONG",
    categoryLabel: "Đồ Uống",
    price: 35000,
    image: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
    isPopular: true,
  },
  {
    id: "m12",
    name: "Trà Chanh Mật Ong",
    category: "DOUONG",
    categoryLabel: "Đồ Uống",
    price: 25000,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m13",
    name: "Bia Tiger Bạc (Lon)",
    category: "DOUONG",
    categoryLabel: "Đồ Uống",
    price: 28000,
    image: "https://images.unsplash.com/photo-1608270195561-12ec3f63ca5f?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
  {
    id: "m14",
    name: "Coca Cola / Pepsi",
    category: "DOUONG",
    categoryLabel: "Đồ Uống",
    price: 18000,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
  },
];

/** Ghi chú nhanh khi gọi món */
export const QUICK_NOTES = ["Không hành", "Nhiều nước béo", "Ít cay", "Cay nhiều", "Ít đá", "Để riêng nước dùng"];
