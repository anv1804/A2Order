import { FnbDishItem } from "@a2order/shared";

// Thực đơn mẫu: Nước Suối & Tăng Lực (Chuẩn hóa 1 Món Chính + Biến Thể Có Ảnh Riêng)
export const ENERGY_WATER_TEMPLATE_DISHES: FnbDishItem[] = [
  // 1. NƯỚC SUỐI & KHOÁNG
  {
    id: "dish_water_master",
    name: "Nước Suối & Nước Khoáng Đóng Chai",
    category: "Nước Suối & Tăng Lực",
    subCategory: "Nước Tinh Khiết & Khoáng Thiên Nhiên (Aquafina, La Vie, Vĩnh Hảo, Dasani)",
    majorCategory: "DRINK",
    price: 12000,
    costPrice: 4000,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80",
    description: "Nước uống đóng chai tinh khiết và khoáng thiên nhiên thanh khiết, ướp lạnh sẵn sàng phục vụ",
    variants: [
      {
        id: "v_aq_500",
        name: "Chai 500ml - Nước Tinh Khiết Aquafina",
        price: 12000,
        image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_aq_1500",
        name: "Chai Lớn 1.5L - Aquafina Cả Bàn",
        price: 18000,
        image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_lv_500",
        name: "Chai 500ml - Nước Khoáng Thiên Nhiên La Vie",
        price: 12000,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_lv_1500",
        name: "Chai Lớn 1.5L - La Vie Cỡ Lớn",
        price: 18000,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_vh_500",
        name: "Chai 500ml - Khoáng Vĩnh Hảo (Không Ga)",
        price: 12000,
        image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_vh_gas",
        name: "Chai 500ml - Nước Khoáng Vĩnh Hảo Có Ga (Tiêu Thực)",
        price: 15000,
        image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_dasani",
        name: "Chai 500ml - Nước Tinh Khiết Dasani",
        price: 10000,
        image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 2. NƯỚC TĂNG LỰC RED BULL & STING
  {
    id: "dish_energy_redbull_sting",
    name: "Nước Tăng Lực Red Bull & Sting",
    category: "Nước Suối & Tăng Lực",
    subCategory: "Nước Tăng Lực (Red Bull, Sting, Warrior, Monster, Carabao)",
    majorCategory: "DRINK",
    price: 25000,
    costPrice: 11000,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
    description: "Nước tăng lực hàng đầu cung cấp taurine, vitamin B và inositol, giúp phục hồi năng lượng và tỉnh táo tức thì",
    variants: [
      {
        id: "v_rb_thai",
        name: "Lon 250ml - Red Bull Thái Lan (Bò Húc Nhập Khẩu)",
        price: 25000,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_rb_vn",
        name: "Lon 250ml - Red Bull Việt Nam Bổ Sung Kẽm",
        price: 22000,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_st_do_lon",
        name: "Lon 320ml - Sting Dâu Đỏ Mát Lạnh",
        price: 18000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_st_do_chai",
        name: "Chai PET 330ml - Sting Dâu Đỏ",
        price: 18000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_st_vang",
        name: "Lon 320ml - Sting Vàng Nhân Sâm (Gold)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 3. NƯỚC TĂNG LỰC MONSTER & QUỐC TẾ
  {
    id: "dish_energy_intl",
    name: "Nước Tăng Lực Cao Cấp (Monster, Warrior, Carabao)",
    category: "Nước Suối & Tăng Lực",
    subCategory: "Nước Tăng Lực (Red Bull, Sting, Warrior, Monster, Carabao)",
    majorCategory: "DRINK",
    price: 42000,
    costPrice: 20000,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80",
    description: "Bộ sưu tập nước tăng lực phong cách thể thao quốc tế: Monster Energy Mỹ cực mạnh, Warrior Thái Lan hương trái cây ga sảng khoái",
    variants: [
      {
        id: "v_ms_green",
        name: "Lon 355ml - Monster Energy Original (Xanh Lá)",
        price: 42000,
        image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_ms_white",
        name: "Lon 355ml - Monster Ultra White (0 Đường 0 Calo)",
        price: 42000,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_ms_pink",
        name: "Lon 355ml - Monster Pipeline Punch (Nước Ép Trái Cây Hawaii)",
        price: 42000,
        image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_wr_nho",
        name: "Lon 320ml - Warrior Chiến Binh Vị Nho Có Ga",
        price: 18000,
        image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_wr_dau",
        name: "Lon 320ml - Warrior Chiến Binh Vị Dâu Có Ga",
        price: 18000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_carabao",
        name: "Lon 250ml - Carabao Đầu Trâu Thái Lan",
        price: 20000,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
];