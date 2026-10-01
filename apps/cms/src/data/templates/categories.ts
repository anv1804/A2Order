import { FnbCategoryTemplate } from "@a2order/shared";

// ==========================================
// DANH MỤC THỰC ĐƠN MẪU THEO 3 TRỤ CỘT & SUBCATEGORIES
// ==========================================
export const INITIAL_CATEGORIES: FnbCategoryTemplate[] = [
  // --- 1. ĐỒ ĂN (FOOD) ---
  {
    id: "cat_food_com",
    name: "Cơm & Món Mặn",
    majorType: "FOOD",
    emoji: "🍚",
    description: "Cơm tấm, cơm văn phòng, cơm thố, món xào, món kho",
    order: 1,
    subCategories: [
      { id: "sub_com_tam", name: "Cơm Tấm & Cơm Thố", majorType: "FOOD", parentId: "cat_food_com" },
      { id: "sub_mon_man", name: "Món Xào & Kho Đậm Vị", majorType: "FOOD", parentId: "cat_food_com" },
    ],
  },
  {
    id: "cat_food_bun_pho",
    name: "Bún, Phở & Món Nước",
    majorType: "FOOD",
    emoji: "🍜",
    description: "Phở bò, bún bò Huế, bánh canh, hủ tiếu, mì cay các cấp",
    order: 2,
    subCategories: [
      { id: "sub_pho_bo", name: "Phở Bò & Món Nước Truyền Thống", majorType: "FOOD", parentId: "cat_food_bun_pho" },
      { id: "sub_bun_bo", name: "Bún Bò Huế & Bánh Canh", majorType: "FOOD", parentId: "cat_food_bun_pho" },
    ],
  },
  {
    id: "cat_food_lau_nuong",
    name: "Món Lẩu & Đồ Nướng",
    majorType: "FOOD",
    emoji: "🍲",
    description: "Lẩu Thái, lẩu riêu cua, bò nướng tảng, thịt xiên nướng",
    order: 3,
    subCategories: [
      { id: "sub_lau", name: "Lẩu & Nước Dùng Đặc Biệt", majorType: "FOOD", parentId: "cat_food_lau_nuong" },
      { id: "sub_nuong", name: "Đồ Nướng & Xiên Que BBQ", majorType: "FOOD", parentId: "cat_food_lau_nuong" },
    ],
  },
  {
    id: "cat_food_an_vat",
    name: "Ăn Vặt & Chiên Rán",
    majorType: "FOOD",
    emoji: "🍗",
    description: "Khoai tây lắc, gà rán giòn rụm, nem chua rán, cá viên chiên",
    order: 4,
    subCategories: [
      { id: "sub_chien_ran", name: "Đồ Chiên Rán Giòn Rụm", majorType: "FOOD", parentId: "cat_food_an_vat" },
      { id: "sub_an_vat", name: "Món Ăn Vặt Giới Trẻ", majorType: "FOOD", parentId: "cat_food_an_vat" },
    ],
  },
  {
    id: "cat_food_khai_vi",
    name: "Khai Vị & Gỏi / Salad",
    majorType: "FOOD",
    emoji: "🥗",
    description: "Gỏi ngó sen, salad lườn ngỗng, chả giò tôm thịt, súp cua",
    order: 5,
    subCategories: [
      { id: "sub_goi_salad", name: "Gỏi & Salad Thanh Mát", majorType: "FOOD", parentId: "cat_food_khai_vi" },
      { id: "sub_sup_cha", name: "Chả Giò & Khai Vị Nóng", majorType: "FOOD", parentId: "cat_food_khai_vi" },
    ],
  },
  {
    id: "cat_food_banh_mi",
    name: "Bánh Mì & Fast Food",
    majorType: "FOOD",
    emoji: "🥪",
    description: "Bánh mì pate trứng nướng, burger, sandwich nướng phô mai",
    order: 6,
    subCategories: [
      { id: "sub_bm_vn", name: "Bánh Mì Việt Nam", majorType: "FOOD", parentId: "cat_food_banh_mi" },
      { id: "sub_fast_food", name: "Burger & Sandwich", majorType: "FOOD", parentId: "cat_food_banh_mi" },
    ],
  },

  // --- 2. ĐỒ UỐNG (DRINK) ---
  {
    id: "cat_drink_cafe",
    name: "Cà Phê & Cacao",
    majorType: "DRINK",
    emoji: "☕",
    description: "Cà phê sữa đá pha phin, bạc xỉu, cappuccino, espresso, cold brew",
    order: 1,
    subCategories: [
      { id: "sub_cf_phin", name: "Cà Phê Phin Truyền Thống", majorType: "DRINK", parentId: "cat_drink_cafe" },
      { id: "sub_cf_may", name: "Cà Phê Máy & Ý (Espresso, Cold Brew)", majorType: "DRINK", parentId: "cat_drink_cafe" },
    ],
  },
  {
    id: "cat_drink_tra_sua",
    name: "Trà Sữa & Macchiato",
    majorType: "DRINK",
    emoji: "🧋",
    description: "Trà sữa nướng ô long, trà sữa trân châu hoàng gia, kem cheese béo",
    order: 2,
    subCategories: [
      { id: "sub_ts_nuong", name: "Trà Sữa Truyền Thống & Nướng", majorType: "DRINK", parentId: "cat_drink_tra_sua" },
      { id: "sub_ts_cheese", name: "Kem Cheese & Macchiato", majorType: "DRINK", parentId: "cat_drink_tra_sua" },
    ],
  },
  {
    id: "cat_drink_tra_trai_cay",
    name: "Trà Trái Cây & Thanh Nhiệt",
    majorType: "DRINK",
    emoji: "🍋",
    description: "Trà đào cam sả, trà ổi hồng hạt chia, trà sen vàng thanh mát",
    order: 3,
    subCategories: [
      { id: "sub_tra_hoa_qua", name: "Trà Trái Cây Nhiệt Đới", majorType: "DRINK", parentId: "cat_drink_tra_trai_cay" },
      { id: "sub_tra_thanh_nhiet", name: "Trà Thảo Mộc & Dưỡng Nhan", majorType: "DRINK", parentId: "cat_drink_tra_trai_cay" },
    ],
  },
  {
    id: "cat_drink_sinh_to",
    name: "Sinh Tố & Nước Ép Tươi",
    majorType: "DRINK",
    emoji: "🥤",
    description: "Nước cam vắt nguyên chất, ép thơm dưa hấu, sinh tố bơ hạt",
    order: 4,
    subCategories: [
      { id: "sub_nuoc_ep", name: "Nước Ép Tươi Nguyên Chất", majorType: "DRINK", parentId: "cat_drink_sinh_to" },
      { id: "sub_sinh_to", name: "Sinh Tố Hoa Quả Béo Bùi", majorType: "DRINK", parentId: "cat_drink_sinh_to" },
    ],
  },
  {
    id: "cat_drink_nuoc_ngot",
    name: "Nước Ngọt & Giải Khát",
    majorType: "DRINK",
    emoji: "🥤",
    description: "Coca-Cola, Pepsi, 7Up, Sprite, Fanta, Mirinda, Sting, nước trái cây đóng chai",
    order: 5,
    subCategories: [
      { id: "sub_ng_cola", name: "Cola & Nước Có Ga (Coca, Pepsi, 7Up, Sprite)", majorType: "DRINK", parentId: "cat_drink_nuoc_ngot" },
      { id: "sub_ng_trai_cay", name: "Nước Ngọt Hương Trái Cây (Fanta, Mirinda)", majorType: "DRINK", parentId: "cat_drink_nuoc_ngot" },
      { id: "sub_ng_tra_chai", name: "Trà Đóng Chai & Nước Cam (0 Độ, TEA+, C2, Teppy, Twister)", majorType: "DRINK", parentId: "cat_drink_nuoc_ngot" },
    ],
  },
  {
    id: "cat_drink_bia",
    name: "Bia Chai & Lon",
    majorType: "DRINK",
    emoji: "🍺",
    description: "Heineken, Tiger, Saigon, Hà Nội, 333, Sapporo, Budweiser, Strongbow",
    order: 6,
    subCategories: [
      { id: "sub_bia_viet", name: "Bia Việt Nam (Sài Gòn, Hà Nội, 333, Huda, Larue, Bivina)", majorType: "DRINK", parentId: "cat_drink_bia" },
      { id: "sub_bia_quoc_te", name: "Bia Quốc Tế & Cận Cao Cấp (Heineken, Tiger, Budweiser, Sapporo)", majorType: "DRINK", parentId: "cat_drink_bia" },
      { id: "sub_bia_nhap_khau", name: "Bia Nhập Khẩu & Thủ Công (Corona, Hoegaarden, 1664 Blanc)", majorType: "DRINK", parentId: "cat_drink_bia" },
      { id: "sub_bia_cider", name: "Cider & Nước Táo Lên Men (Strongbow)", majorType: "DRINK", parentId: "cat_drink_bia" },
    ],
  },
  {
    id: "cat_drink_nuoc_suoi",
    name: "Nước Suối & Tăng Lực",
    majorType: "DRINK",
    emoji: "💧",
    description: "Aquafina, La Vie, Vĩnh Hảo, Red Bull, Warrior, Monster Energy",
    order: 7,
    subCategories: [
      { id: "sub_nuoc_khoang", name: "Nước Tinh Khiết & Khoáng Thiên Nhiên (Aquafina, La Vie, Vĩnh Hảo, Dasani)", majorType: "DRINK", parentId: "cat_drink_nuoc_suoi" },
      { id: "sub_tang_luc", name: "Nước Tăng Lực (Red Bull, Sting, Warrior, Monster, Carabao)", majorType: "DRINK", parentId: "cat_drink_nuoc_suoi" },
    ],
  },

  // --- 3. ĐỒ TRÁNG MIỆNG (DESSERT) ---
  {
    id: "cat_des_che",
    name: "Chè & Tàu Hũ",
    majorType: "DESSERT",
    emoji: "🥣",
    description: "Chè bưởi An Giang, chè khúc bạch, tàu hũ trân châu cốt dừa",
    order: 1,
    subCategories: [
      { id: "sub_che_truyen_thong", name: "Chè Truyền Thống Nam Bộ", majorType: "DESSERT", parentId: "cat_des_che" },
      { id: "sub_tau_hu", name: "Tàu Hũ & Pudding Cốt Dừa", majorType: "DESSERT", parentId: "cat_des_che" },
    ],
  },
  {
    id: "cat_des_banh",
    name: "Bánh Ngọt & Pastry",
    majorType: "DESSERT",
    emoji: "🍰",
    description: "Tiramisu Ý, mousse chanh dây, phô mai nướng burnt cheesecake",
    order: 2,
    subCategories: [
      { id: "sub_banh_kem", name: "Bánh Mousse & Tiramisu", majorType: "DESSERT", parentId: "cat_des_banh" },
      { id: "sub_banh_nuong", name: "Bánh Nướng & Phô Mai", majorType: "DESSERT", parentId: "cat_des_banh" },
    ],
  },
  {
    id: "cat_des_kem",
    name: "Kem Tươi & Trái Cây Đĩa",
    majorType: "DESSERT",
    emoji: "🍨",
    description: "Kem ốc quế gelato 3 viên, dĩa trái cây thập cẩm ướp lạnh",
    order: 3,
    subCategories: [
      { id: "sub_kem_gelato", name: "Kem Ly & Gelato", majorType: "DESSERT", parentId: "cat_des_kem" },
      { id: "sub_trai_cay_dia", name: "Trái Cây Đĩa Ướp Lạnh", majorType: "DESSERT", parentId: "cat_des_kem" },
    ],
  },
  {
    id: "cat_des_sua_chua",
    name: "Sữa Chua & Pudding",
    majorType: "DESSERT",
    emoji: "🍮",
    description: "Sữa chua dẻo trân châu Hạ Long, pudding trứng caramel",
    order: 4,
    subCategories: [
      { id: "sub_sua_chua", name: "Sữa Chua Dẻo Trân Châu", majorType: "DESSERT", parentId: "cat_des_sua_chua" },
      { id: "sub_pudding", name: "Pudding Trứng & Caramel", majorType: "DESSERT", parentId: "cat_des_sua_chua" },
    ],
  },
];