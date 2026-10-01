import { FnbDishItem } from "@a2order/shared";

// Thực đơn mẫu: Bia Chai & Lon (Chuẩn hóa 1 Món Thương Hiệu + Biến Thể Có Ảnh Riêng)
export const BEER_TEMPLATE_DISHES: FnbDishItem[] = [
  // 1. HEINEKEN
  {
    id: "dish_heineken_master",
    name: "Bia Heineken Ướp Xô Đá Lạnh",
    category: "Bia Chai & Lon",
    subCategory: "Bia Quốc Tế & Cận Cao Cấp (Heineken, Tiger, Budweiser, Sapporo)",
    majorCategory: "DRINK",
    price: 35000,
    costPrice: 17500,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1618886614638-80e3c15cd819?auto=format&fit=crop&w=400&q=80",
    description: "Bia lager cao cấp hàng đầu thế giới với men A-Yeast độc quyền, vị đắng dịu cân bằng và hương hoa bia tinh tế",
    variants: [
      {
        id: "v_hk_orig_lon",
        name: "Lon 330ml - Heineken Original (5.0%)",
        price: 35000,
        image: "https://images.unsplash.com/photo-1618886614638-80e3c15cd819?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hk_orig_chai",
        name: "Chai 330ml - Heineken Original (5.0%)",
        price: 35000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hk_silver_lon",
        name: "Lon 330ml - Heineken Silver Bạc (4.0%)",
        price: 35000,
        image: "https://images.unsplash.com/photo-1618886614638-80e3c15cd819?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hk_zero_lon",
        name: "Lon 330ml - Heineken 0.0 Không Cồn (0.0%)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hk_king_lon",
        name: "Lon Lớn 500ml - Heineken King Size",
        price: 50000,
        image: "https://images.unsplash.com/photo-1618886614638-80e3c15cd819?auto=format&fit=crop&w=400&q=80",
      },
    ],
    customizationGroups: [
      {
        id: "opt_hk_service",
        name: "Quy Cách Phục Vụ",
        type: "MULTIPLE",
        options: [
          { id: "hk_s1", name: "Ướp trong xô đá tuyết lạnh sâu", priceModifier: 0 },
          { id: "hk_s2", name: "Kèm quai chanh tươi vắt và muối", priceModifier: 5000 },
          { id: "hk_s3", name: "Kèm ly ướp lạnh riêng", priceModifier: 0 },
        ],
      },
    ],
  },

  // 2. TIGER
  {
    id: "dish_tiger_master",
    name: "Bia Tiger (Con Cọp) Ướp Lạnh",
    category: "Bia Chai & Lon",
    subCategory: "Bia Quốc Tế & Cận Cao Cấp (Heineken, Tiger, Budweiser, Sapporo)",
    majorCategory: "DRINK",
    price: 30000,
    costPrice: 15500,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1608270199993-9c8491c3600b?auto=format&fit=crop&w=400&q=80",
    description: "Vua bàn tiệc nhậu Việt Nam, hương vị mạnh mẽ đầm đà, nổi bật với dòng Crystal lọc lạnh -1°C và Tiger Platinum lúa mì thơm ngát",
    variants: [
      {
        id: "v_tg_crystal_lon",
        name: "Lon 330ml - Tiger Crystal Bạc (4.6%)",
        price: 30000,
        image: "https://images.unsplash.com/photo-1608270199993-9c8491c3600b?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tg_crystal_chai",
        name: "Chai 330ml - Tiger Crystal Bạc (4.6%)",
        price: 30000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tg_nau_lon",
        name: "Lon 330ml - Tiger Nâu Truyền Thống (5.0%)",
        price: 28000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tg_platinum",
        name: "Lon 330ml - Tiger Platinum Lúa Mì Vỏ Cam (4.5%)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1583344686411-cf49c36d2c48?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_tg_soju",
        name: "Lon 330ml - Tiger Soju Infused Vị Trái Cây (4.0%)",
        price: 30000,
        image: "https://images.unsplash.com/photo-1597290282695-edc43d0e7129?auto=format&fit=crop&w=400&q=80",
      },
    ],
    customizationGroups: [
      {
        id: "opt_tg_service",
        name: "Quy Cách Phục Vụ",
        type: "SINGLE",
        options: [
          { id: "tg_s1", name: "Kèm ly đá tuyết lạnh sâu", priceModifier: 0 },
          { id: "tg_s2", name: "Ướp xô đá tuyết cả bàn", priceModifier: 0 },
          { id: "tg_s3", name: "Không lấy đá (Uống lon lạnh)", priceModifier: 0 },
        ],
      },
    ],
  },

  // 3. BIA SÀI GÒN (SABECO)
  {
    id: "dish_saigon_master",
    name: "Bia Sài Gòn (Sabeco) Đủ Dòng",
    category: "Bia Chai & Lon",
    subCategory: "Bia Việt Nam (Sài Gòn, Hà Nội, 333, Huda, Larue, Bivina)",
    majorCategory: "DRINK",
    price: 22000,
    costPrice: 11000,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
    description: "Biểu tượng bia phương Nam hơn 145 năm lịch sử, đầy đủ các dòng từ Saigon Lager quốc dân, Special lúa mạch đến Saigon Chill -2°C",
    variants: [
      {
        id: "v_sg_lager_lon",
        name: "Lon 330ml - Saigon Lager (Xanh)",
        price: 20000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_lager_chai",
        name: "Chai 355ml - Saigon Lager (Xanh)",
        price: 20000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_lager_chai450",
        name: "Chai Lớn 450ml - Saigon Lager",
        price: 25000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_special_lon",
        name: "Lon 330ml - Saigon Special (Lúa Mạch)",
        price: 25000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_special_chai",
        name: "Chai Lùn 330ml - Saigon Special",
        price: 25000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_export_lon",
        name: "Lon 330ml - Saigon Export (Đỏ Đậm Đà)",
        price: 22000,
        image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_chill_lon",
        name: "Lon 330ml - Saigon Chill Lọc Lạnh -2°C",
        price: 25000,
        image: "https://images.unsplash.com/photo-1608270199993-9c8491c3600b?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sg_gold_lon",
        name: "Lon 330ml - Saigon Gold Hoàng Gia (5.0%)",
        price: 35000,
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 4. BIA HÀ NỘI (HABECO)
  {
    id: "dish_hanoi_master",
    name: "Bia Hà Nội (Habeco) Truyền Thống",
    category: "Bia Chai & Lon",
    subCategory: "Bia Việt Nam (Sài Gòn, Hà Nội, 333, Huda, Larue, Bivina)",
    majorCategory: "DRINK",
    price: 20000,
    costPrice: 10800,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=400&q=80",
    description: "Nét văn hóa ẩm thực thủ đô Hà Nội, nước bia vàng óng, bọt mịn màng, hương hoa bia dịu nhẹ thanh mát",
    variants: [
      {
        id: "v_hn_lon_vang",
        name: "Lon 330ml - Bia Hà Nội Nhãn Vàng",
        price: 20000,
        image: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hn_chai_330",
        name: "Chai 330ml - Bia Hà Nội Nhãn Vàng",
        price: 20000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hn_chai_450",
        name: "Chai Nâu 450ml - Bia Hà Nội Phố Cổ",
        price: 22000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hn_bold",
        name: "Lon 330ml - Hanoi Bold Đậm Men (4.8%)",
        price: 25000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hn_premium",
        name: "Lon 330ml - Hanoi Premium Hoa Bia Saaz (4.9%)",
        price: 25000,
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 5. BIA 333
  {
    id: "dish_bia_333_master",
    name: "Bia 333 (Ba Số Ba) Truyền Thống",
    category: "Bia Chai & Lon",
    subCategory: "Bia Việt Nam (Sài Gòn, Hà Nội, 333, Huda, Larue, Bivina)",
    majorCategory: "DRINK",
    price: 22000,
    costPrice: 11200,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80",
    description: "Bia lon đầu tiên của Việt Nam, nồng độ cồn 5.3% vol đậm đà sâu lắng khó quên",
    variants: [
      {
        id: "v_333_lon",
        name: "Lon 330ml Ướp Lạnh",
        price: 22000,
        image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_333_chai",
        name: "Chai 330ml Kênh Quán Ăn",
        price: 22000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 6. BUDWEISER & SAPPORO
  {
    id: "dish_bud_sap_master",
    name: "Bia Budweiser & Sapporo Cao Cấp",
    category: "Bia Chai & Lon",
    subCategory: "Bia Quốc Tế & Cận Cao Cấp (Heineken, Tiger, Budweiser, Sapporo)",
    majorCategory: "DRINK",
    price: 32000,
    costPrice: 16000,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80",
    description: "Budweiser 'King of Beers' Mỹ ủ gỗ sồi Beechwood 30 ngày & Sapporo Premium Nhật Bản với bọt bia siêu mịn Super Dreamy Foam",
    variants: [
      {
        id: "v_bud_lon",
        name: "Lon 330ml - Budweiser Original Mỹ (5.0%)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_bud_chai",
        name: "Chai 330ml - Budweiser Original Mỹ (5.0%)",
        price: 35000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sap_lon",
        name: "Lon 330ml - Sapporo Premium Nhật Bản (5.0%)",
        price: 30000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_sap_thep",
        name: "Lon Thép Bạc 650ml - Sapporo Silver Can",
        price: 55000,
        image: "https://images.unsplash.com/photo-1608270199993-9c8491c3600b?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 7. BIA NHẬP KHẨU & THỦ CÔNG
  {
    id: "dish_import_beer_master",
    name: "Bia Nhập Khẩu (Corona, Hoegaarden, 1664 Blanc)",
    category: "Bia Chai & Lon",
    subCategory: "Bia Nhập Khẩu & Thủ Công (Corona, Hoegaarden, 1664 Blanc)",
    majorCategory: "DRINK",
    price: 45000,
    costPrice: 22000,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80",
    description: "Bộ sưu tập bia ngoại nhập danh tiếng: Corona Extra Mexico sảng khoái, Hoegaarden lúa mì Bỉ và 1664 Blanc Pháp hương hoa quả",
    variants: [
      {
        id: "v_corona_chai",
        name: "Chai 355ml - Corona Extra Mexico (Thưởng thức kèm lát chanh)",
        price: 50000,
        image: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hoeg_white",
        name: "Chai/Lon 330ml - Hoegaarden White Bia Lúa Mì Bỉ (4.9%)",
        price: 45000,
        image: "https://images.unsplash.com/photo-1583344686411-cf49c36d2c48?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_hoeg_rosee",
        name: "Chai 248ml - Hoegaarden Rosée Mâm Xôi Ngọt Dịu (3.0%)",
        price: 40000,
        image: "https://images.unsplash.com/photo-1597290282695-edc43d0e7129?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_1664_lon",
        name: "Lon 330ml - 1664 Blanc Pháp Hương Vỏ Cam (5.0%)",
        price: 35000,
        image: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_1664_chai",
        name: "Chai 330ml - 1664 Blanc Chai Xanh Cobalt Sang Trọng",
        price: 38000,
        image: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 8. BIA ĐỊA PHƯƠNG MIỀN TRUNG
  {
    id: "dish_central_beer_master",
    name: "Bia Miền Trung & Đặc Sản (Huda, Larue, Bivina)",
    category: "Bia Chai & Lon",
    subCategory: "Bia Việt Nam (Sài Gòn, Hà Nội, 333, Huda, Larue, Bivina)",
    majorCategory: "DRINK",
    price: 18000,
    costPrice: 10000,
    station: "BAR",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80",
    description: "Các dòng bia mang đậm phong vị duyên hải và miền Trung: Bia Huda Huế 'Đậm tình miền Trung', Larue 'Con cọp' Đà Nẵng, Bivina duyên hải",
    variants: [
      {
        id: "v_huda_lon",
        name: "Lon 330ml - Bia Huda Huế",
        price: 20000,
        image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_huda_chai450",
        name: "Chai Lớn 450ml - Bia Huda Huế",
        price: 22000,
        image: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_larue_lon",
        name: "Lon 330ml - Bia Larue Xanh (4.2%)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_larue_spec",
        name: "Lon 330ml - Bia Larue Special Vàng (4.6%)",
        price: 20000,
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_bivina_lon",
        name: "Lon 330ml - Bia Bivina Duyên Hải (4.3%)",
        price: 18000,
        image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },

  // 9. STRONGBOW CIDER
  {
    id: "dish_strongbow_master",
    name: "Nước Táo Lên Men Strongbow Cider",
    category: "Bia Chai & Lon",
    subCategory: "Cider & Nước Táo Lên Men (Strongbow)",
    majorCategory: "DRINK",
    price: 32000,
    costPrice: 16500,
    station: "BAR",
    isAvailable: true,
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1597290282695-edc43d0e7129?auto=format&fit=crop&w=400&q=80",
    description: "Cider nước táo lên men tự nhiên vị chua thanh giòn tan kết hợp hương quả mọng thơm ngọt, nồng độ cồn nhẹ 4.5% cực kỳ dễ uống",
    variants: [
      {
        id: "v_stb_tao",
        name: "Lon/Chai 330ml - Gold Apple (Vị Táo Nguyên Bản)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1597290282695-edc43d0e7129?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_stb_dau_den",
        name: "Lon/Chai 330ml - Dark Fruit (Vị Dâu Đen Quả Mọng)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_stb_mat_ong",
        name: "Lon/Chai 330ml - Honey (Vị Mật Ong Ngọt Ấm)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "v_stb_dao",
        name: "Lon/Chai 330ml - Chilly Peach (Vị Đào Thơm Nồng)",
        price: 32000,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
];