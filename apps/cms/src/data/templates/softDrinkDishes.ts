import { FnbDishItem } from "@a2order/shared";

// Thực đơn mẫu: Nước Ngọt & Giải Khát (Chuẩn hóa 1 Món Chính Duy Nhất + Biến Thể Có Ảnh Riêng)
export const SOFT_DRINK_TEMPLATE_DISHES: FnbDishItem[] = [
  // 1. COCA-COLA
  {
    id: "dish_coca_cola",
    name: "Nước Ngọt Coca-Cola Ướp Lạnh",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Cola & Nước Có Ga (Coca, Pepsi, 7Up, Sprite)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 8500,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
    description: "Coca-Cola ướp xô đá tuyết sảng khoái, ga bùng nổ, có đủ các dòng nguyên bản, zero không đường và plus bổ sung chất xơ FOS",
    variants: [
      {
        id: "v_coca_lon",
        name: "Lon 320ml - Vị Nguyên Bản",
        price: 18000,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_coca_zero",
        name: "Lon 320ml - Zero Không Đường",
        price: 18000,
        image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_coca_plus",
        name: "Lon 320ml - Plus Bổ Sung Chất Xơ FOS",
        price: 22000,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_coca_chai390",
        name: "Chai Nhựa 390ml (Tiện Lợi)",
        price: 15000,
        image: "https://images.unsplash.com/photo-1567103472667-6898f3a79cf2?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_coca_chai1500",
        name: "Chai Lớn 1.5L (Dùng Chung Bàn)",
        price: 30000,
        image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=400&q=80",
      },
    ],
    customizationGroups: [
      {
        id: "opt_coca_da",
        name: "Quy Cách Phục Vụ",
        type: "SINGLE",
        options: [
          { id: "da1", name: "Kèm ly đá đầy mát lạnh", priceModifier: 0 },
          { id: "da2", name: "Kèm ly ít đá", priceModifier: 0 },
          { id: "da3", name: "Không lấy đá (Uống lon lạnh)", priceModifier: 0 },
        ],
      },
    ],
  },

  // 2. PEPSI
  {
    id: "dish_pepsi_cola",
    name: "Nước Ngọt Pepsi Cola Ướp Lạnh",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Cola & Nước Có Ga (Coca, Pepsi, 7Up, Sprite)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 8000,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80",
    description: "Pepsi Cola sảng khoái đã khát ngọt dịu đặc trưng, đầy đủ phiên bản nguyên bản, zero calo và vị chanh tươi mát",
    variants: [
      {
        id: "v_pep_lon",
        name: "Lon 320ml - Vị Nguyên Bản",
        price: 18000,
        image: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_pep_zero",
        name: "Lon 320ml - Zero Không Calo",
        price: 18000,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_pep_lime",
        name: "Lon 320ml - Vị Chanh Không Calo (Lime Zero)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_pep_chai390",
        name: "Chai Nhựa 390ml",
        price: 15000,
        image: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_pep_chai1500",
        name: "Chai Lớn 1.5L (Bàn Tiệc)",
        price: 28000,
        image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=400&q=80",
      },
    ],
    customizationGroups: [
      {
        id: "opt_pep_da",
        name: "Quy Cách Phục Vụ",
        type: "SINGLE",
        options: [
          { id: "pda1", name: "Kèm ly đá đầy mát lạnh", priceModifier: 0 },
          { id: "pda2", name: "Kèm ly ít đá", priceModifier: 0 },
          { id: "pda3", name: "Không lấy đá (Uống lon lạnh)", priceModifier: 0 },
        ],
      },
    ],
  },

  // 3. 7UP
  {
    id: "dish_7up_chanh",
    name: "Nước Ngọt 7Up Chanh Tự Nhiên",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Cola & Nước Có Ga (Coca, Pepsi, 7Up, Sprite)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 7500,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
    description: "7Up hương chanh tự nhiên nước trong suốt thanh mát, kích thích tiêu hóa, giải ngấy hiệu quả cho các món nướng lẩu",
    variants: [
      {
        id: "v_7u_lon",
        name: "Lon 320ml Ướp Lạnh",
        price: 18000,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_7u_chai",
        name: "Chai Nhựa 390ml",
        price: 15000,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_7u_15",
        name: "Chai Lớn 1.5L (Dùng Bàn Tiệc)",
        price: 28000,
        image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 4. SPRITE
  {
    id: "dish_sprite_chanh",
    name: "Nước Ngọt Sprite Chanh Tươi",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Cola & Nước Có Ga (Coca, Pepsi, 7Up, Sprite)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 8000,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
    description: "Sprite hương chanh tươi sảng khoái và đã khát từ Coca-Cola, tạo bọt khí rộn rã kích thích vị giác",
    variants: [
      {
        id: "v_sp_lon",
        name: "Lon 320ml - Vị Nguyên Bản",
        price: 18000,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sp_zero",
        name: "Lon 320ml - Sprite Zero Không Đường",
        price: 18000,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sp_chai",
        name: "Chai 390ml",
        price: 15000,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 5. FANTA
  {
    id: "dish_fanta_flavors",
    name: "Nước Ngọt Fanta Đa Vị Trái Cây",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Nước Ngọt Hương Trái Cây (Fanta, Mirinda)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 7500,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80",
    description: "Fanta trái cây ngọt ngào vui tươi, nhiều hương vị hấp dẫn phù hợp cho giới trẻ và trẻ nhỏ",
    variants: [
      {
        id: "v_fan_cam",
        name: "Lon 320ml - Hương Cam Tươi Mát",
        price: 18000,
        image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_fan_nho",
        name: "Lon 320ml - Hương Nho Đen Ngọt Lịm",
        price: 18000,
        image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_fan_xaxi",
        name: "Lon 320ml - Hương Xá Xị Thảo Mộc",
        price: 18000,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_fan_dau",
        name: "Lon 320ml - Hương Dâu Đỏ Mọng",
        price: 18000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_fan_chai_cam",
        name: "Chai Nhựa 390ml - Hương Cam",
        price: 15000,
        image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 6. MIRINDA
  {
    id: "dish_mirinda_flavors",
    name: "Nước Ngọt Mirinda Sảng Khoái",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Nước Ngọt Hương Trái Cây (Fanta, Mirinda)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 7500,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80",
    description: "Mirinda bùng nổ hương vị thơm ngon nức tiếng, đặc biệt là vị Soda Kem béo bùi và Đá Me đậm chất đường phố",
    variants: [
      {
        id: "v_mir_sodakem",
        name: "Lon 320ml - Soda Kem Xanh (Bán Chạy Nhất)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_mir_cam",
        name: "Lon 320ml - Hương Cam Đậm Đà",
        price: 18000,
        image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_mir_xaxi",
        name: "Lon 320ml - Hương Xá Xị Truyền Thống",
        price: 18000,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_mir_dame",
        name: "Lon 320ml - Vị Đá Me Chua Ngọt Hậu",
        price: 18000,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_mir_chai_sk",
        name: "Chai Nhựa 390ml - Soda Kem",
        price: 15000,
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 7. TRÀ ĐÓNG CHAI
  {
    id: "dish_tra_dong_chai",
    name: "Trà Xanh & Trà Ô Long Đóng Chai",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Trà Đóng Chai & Nước Cam (0 Độ, TEA+, C2, Teppy, Twister)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 8500,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
    description: "Các dòng trà thanh nhiệt giải độc đóng chai ướp lạnh, chiết xuất búp trà tự nhiên giàu chất chống oxy hóa EGCG và OTPP",
    variants: [
      {
        id: "v_tx_0do",
        name: "Trà Xanh Không Độ 455ml (Vị Chanh)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tx_0do_itduong",
        name: "Trà Xanh Không Độ 455ml (Ít Đường)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tea_plus_nb",
        name: "Trà Ô Long TEA+ Plus 450ml (Nguyên Bản)",
        price: 20000,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tea_plus_kd",
        name: "Trà Ô Long TEA+ Plus 450ml (Không Đường 0 Calo)",
        price: 20000,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_c2_chanh",
        name: "Trà Xanh C2 Hương Chanh 455ml",
        price: 15000,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 8. NƯỚC CAM ĐÓNG HỘP / CHAI
  {
    id: "dish_nuoc_cam_dong_hop",
    name: "Nước Cam Ép Đóng Chai & Tép Cam",
    category: "Nước Ngọt & Giải Khát",
    subCategory: "Trà Đóng Chai & Nước Cam (0 Độ, TEA+, C2, Teppy, Twister)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 8000,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80",
    description: "Nước cam thơm mát bổ sung vitamin C tự nhiên, tiện lợi và giải khát tức thì",
    variants: [
      {
        id: "v_teppy",
        name: "Nước Cam Có Tép Minute Maid Teppy Chai 327ml",
        price: 18000,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_twister_chai",
        name: "Nước Cam Ép Tropicana Twister Chai 455ml",
        price: 18000,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_twister_lon",
        name: "Nước Cam Ép Tropicana Twister Lon 320ml",
        price: 18000,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
];