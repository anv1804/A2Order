import {
  BusinessType,
  BusinessScenarioTemplate,
  FnbDishItem,
  TenantStoreRecord,
  SoftwareInvoiceRecord,
  AppModule,
} from "@a2order/shared";
import {
  IScenarioRepository,
  IStoreRepository,
  IMenuRepository,
  ILicenseRepository,
  IInvoiceRepository,
  LicenseRecord,
} from "../IRepository.js";
import { DEFAULT_BUSINESS_SCENARIOS } from "../../../mockData/businessScenariosData.js";

// ==========================================
// IN-MEMORY MOCK DATABASE STATE (MUTABLE)
// ==========================================
class MockDatabaseState {
  scenarios: Record<BusinessType, BusinessScenarioTemplate> = { ...DEFAULT_BUSINESS_SCENARIOS };

  stores: TenantStoreRecord[] = [
    {
      id: "s-001",
      name: "Phở Bò Gia Truyền Bát Đàn",
      owner: "Nguyễn Văn Hùng",
      phone: "0912 345 678",
      address: "49 Bát Đàn, Cửa Đông, Hoàn Kiếm, Hà Nội",
      tableCount: 16,
      licenseKey: "A2-PRO-98X2K1",
      plan: "PRO",
      status: "ACTIVE",
      activatedAt: "01/01/2026",
      expiresAt: "01/01/2027",
      daysLeft: 275,
      pingMs: 24,
      activeDevices: 3,
      configVer: "v1.2.4",
      businessType: "OTHER",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_KDS,
        AppModule.MODULE_QR_ORDER,
        AppModule.MODULE_ADVANCED_ANALYTICS,
        AppModule.MODULE_LANDING_PAGE,
      ],
    },
    {
      id: "s-002",
      name: "Trà Sữa KOI Thé - Landmark 81",
      owner: "Trần Thị Mai Anh",
      phone: "0988 765 432",
      address: "Tầng B1, TTTM Vincom Landmark 81, Bình Thạnh, TP.HCM",
      tableCount: 22,
      licenseKey: "A2-GROWTH-44M9P0",
      plan: "GROWTH",
      status: "ACTIVE",
      activatedAt: "15/02/2026",
      expiresAt: "15/08/2026",
      daysLeft: 138,
      pingMs: 18,
      activeDevices: 4,
      configVer: "v2.0.1",
      businessType: "BUBBLE_TEA",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_QR_ORDER,
        AppModule.MODULE_LANDING_PAGE,
      ],
    },
    {
      id: "s-003",
      name: "Mì Cay Seoul 7 Cấp Độ - Cầu Giấy",
      owner: "Lê Hoàng Long",
      phone: "0904 112 233",
      address: "105 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
      tableCount: 14,
      licenseKey: "A2-GROWTH-77B2A8",
      plan: "GROWTH",
      status: "ACTIVE",
      activatedAt: "10/03/2026",
      expiresAt: "10/09/2026",
      daysLeft: 162,
      pingMs: 21,
      activeDevices: 2,
      configVer: "v1.1.0",
      businessType: "SPICY_NOODLE",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_KDS,
        AppModule.MODULE_QR_ORDER,
      ],
    },
    {
      id: "s-004",
      name: "A2 Roastery Coffee - Hồ Con Rùa",
      owner: "Phạm Minh Tuấn",
      phone: "0933 556 789",
      address: "02 Công Xã Paris, Bến Nghé, Quận 1, TP.HCM",
      tableCount: 28,
      licenseKey: "A2-PRO-88H7C3",
      plan: "PRO",
      status: "ACTIVE",
      activatedAt: "01/01/2026",
      expiresAt: "01/07/2026",
      daysLeft: 92,
      pingMs: 16,
      activeDevices: 5,
      configVer: "v1.3.0",
      businessType: "COFFEE_SHOP",
      modules: [
        AppModule.CORE_POS,
        AppModule.MODULE_QR_ORDER,
        AppModule.MODULE_LANDING_PAGE,
        AppModule.MODULE_ADVANCED_ANALYTICS,
      ],
    },
  ];

  // StoreId -> FnbDishItem[]
  storeMenus: Map<string, FnbDishItem[]> = new Map();

  licenses: LicenseRecord[] = [
    {
      id: "lic-1",
      keyCode: "A2-PRO-98X2K1",
      storeId: "s-001",
      storeName: "Phở Bò Gia Truyền Bát Đàn",
      plan: "PRO",
      maxDevices: 8,
      durationMonths: 12,
      issuedAt: "01/01/2026",
      expiresAt: "01/01/2027",
      status: "ACTIVE",
    },
    {
      id: "lic-2",
      keyCode: "A2-GROWTH-44M9P0",
      storeId: "s-002",
      storeName: "Trà Sữa KOI Thé - Landmark 81",
      plan: "GROWTH",
      maxDevices: 4,
      durationMonths: 6,
      issuedAt: "15/02/2026",
      expiresAt: "15/08/2026",
      status: "ACTIVE",
    },
    {
      id: "lic-3",
      keyCode: "A2-GROWTH-77B2A8",
      storeId: "s-003",
      storeName: "Mì Cay Seoul 7 Cấp Độ - Cầu Giấy",
      plan: "GROWTH",
      maxDevices: 4,
      durationMonths: 6,
      issuedAt: "10/03/2026",
      expiresAt: "10/09/2026",
      status: "ACTIVE",
    },
    {
      id: "lic-4",
      keyCode: "A2-STARTER-33F1D9",
      plan: "STARTER",
      maxDevices: 2,
      durationMonths: 3,
      issuedAt: "20/03/2026",
      expiresAt: "20/06/2026",
      status: "UNASSIGNED",
    },
  ];

  invoices: SoftwareInvoiceRecord[] = [
    {
      id: "inv-101",
      invoiceCode: "INV-2026-9041",
      storeId: "s-001",
      storeName: "Phở Bò Gia Truyền Bát Đàn",
      plan: "Gói Chuỗi Chuyên Nghiệp (PRO)",
      durationMonths: 12,
      subTotal: 7188000,
      discountAmount: 1437600,
      finalAmount: 5750400,
      status: "PAID",
      paymentMethod: "VIETQR",
      createdAt: "01/01/2026 09:30",
      paidAt: "01/01/2026 09:35",
    },
    {
      id: "inv-102",
      invoiceCode: "INV-2026-8812",
      storeId: "s-002",
      storeName: "Trà Sữa KOI Thé - Landmark 81",
      plan: "Gói Quán Vừa (GROWTH)",
      durationMonths: 6,
      subTotal: 2394000,
      discountAmount: 239400,
      finalAmount: 2154600,
      status: "PAID",
      paymentMethod: "VIETQR",
      createdAt: "15/02/2026 14:15",
      paidAt: "15/02/2026 14:20",
    },
    {
      id: "inv-103",
      invoiceCode: "INV-2026-7731",
      storeId: "s-003",
      storeName: "Mì Cay Seoul 7 Cấp Độ - Cầu Giấy",
      plan: "Gói Quán Vừa (GROWTH)",
      durationMonths: 6,
      subTotal: 2394000,
      discountAmount: 239400,
      finalAmount: 2154600,
      status: "PENDING",
      paymentMethod: "VIETQR",
      createdAt: "10/03/2026 10:00",
    },
  ];

  constructor() {
    // Tự động khởi tạo menu ban đầu cho các quán từ kịch bản mẫu tương ứng
    this.stores.forEach((store) => {
      const type = store.businessType || "OTHER";
      const scenario = this.scenarios[type];
      if (scenario) {
        this.storeMenus.set(store.id, JSON.parse(JSON.stringify(scenario.dishes)));
      }
    });
  }
}

// Singleton state instance for server runtime
export const mockDbState = new MockDatabaseState();

// ==========================================
// 1. MOCK SCENARIO REPOSITORY
// ==========================================
export class MockScenarioRepository implements IScenarioRepository {
  async getAll(): Promise<BusinessScenarioTemplate[]> {
    return Object.values(mockDbState.scenarios);
  }

  async getByType(type: BusinessType): Promise<BusinessScenarioTemplate | null> {
    return mockDbState.scenarios[type] || null;
  }

  async addDishTemplate(type: BusinessType, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem> {
    const scenario = mockDbState.scenarios[type];
    if (!scenario) {
      throw new Error(`Kịch bản ${type} không tồn tại`);
    }
    const newDish: FnbDishItem = {
      ...dish,
      id: `tmpl-${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    scenario.dishes.unshift(newDish);
    return newDish;
  }

  async updateDishTemplate(type: BusinessType, dishId: string, dish: Partial<FnbDishItem>): Promise<FnbDishItem | null> {
    const scenario = mockDbState.scenarios[type];
    if (!scenario) return null;
    const index = scenario.dishes.findIndex((d) => d.id === dishId);
    if (index === -1) return null;
    scenario.dishes[index] = {
      ...scenario.dishes[index],
      ...dish,
      id: dishId,
    };
    return scenario.dishes[index];
  }

  async deleteDishTemplate(type: BusinessType, dishId: string): Promise<boolean> {
    const scenario = mockDbState.scenarios[type];
    if (!scenario) return false;
    const index = scenario.dishes.findIndex((d) => d.id === dishId);
    if (index === -1) return false;
    scenario.dishes.splice(index, 1);
    return true;
  }
}

// ==========================================
// 2. MOCK STORE REPOSITORY
// ==========================================
export class MockStoreRepository implements IStoreRepository {
  async getAll(): Promise<TenantStoreRecord[]> {
    return [...mockDbState.stores];
  }

  async getById(id: string): Promise<TenantStoreRecord | null> {
    return mockDbState.stores.find((s) => s.id === id) || null;
  }

  async create(data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord> {
    const id = data.id || `s-${Date.now()}`;
    const newStore: TenantStoreRecord = {
      id,
      name: data.name || "Quán Mới",
      owner: data.owner || "Chủ Quán",
      phone: data.phone || "0900000000",
      address: data.address || "Chưa cập nhật",
      tableCount: data.tableCount || 10,
      licenseKey: data.licenseKey || `A2-STARTER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      plan: data.plan || "STARTER",
      status: data.status || "ACTIVE",
      activatedAt: data.activatedAt || new Date().toLocaleDateString("vi-VN"),
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 86400000).toLocaleDateString("vi-VN"),
      daysLeft: data.daysLeft || 30,
      pingMs: data.pingMs || 0,
      activeDevices: data.activeDevices || 0,
      configVer: data.configVer || "v1.0.0",
      modules: data.modules || [AppModule.CORE_POS],
      businessType: data.businessType || "OTHER",
    };

    mockDbState.stores.unshift(newStore);

    // Tự động gán menu từ kịch bản mẫu nếu có
    if (newStore.businessType && mockDbState.scenarios[newStore.businessType]) {
      const scenario = mockDbState.scenarios[newStore.businessType];
      mockDbState.storeMenus.set(newStore.id, JSON.parse(JSON.stringify(scenario.dishes)));
    }

    return newStore;
  }

  async update(id: string, data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord | null> {
    const idx = mockDbState.stores.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    mockDbState.stores[idx] = { ...mockDbState.stores[idx], ...data };
    return mockDbState.stores[idx];
  }

  async delete(id: string): Promise<boolean> {
    const prevLen = mockDbState.stores.length;
    mockDbState.stores = mockDbState.stores.filter((s) => s.id !== id);
    mockDbState.storeMenus.delete(id);
    return mockDbState.stores.length < prevLen;
  }
}

// ==========================================
// 3. MOCK MENU REPOSITORY
// ==========================================
export class MockMenuRepository implements IMenuRepository {
  async getDishesByStoreId(storeId: string): Promise<FnbDishItem[]> {
    const dishes = mockDbState.storeMenus.get(storeId);
    if (!dishes) {
      // Fallback: khởi tạo từ kịch bản của store hoặc kịch bản OTHER
      const store = mockDbState.stores.find((s) => s.id === storeId);
      const scenarioType = store?.businessType || "OTHER";
      const fallback = JSON.parse(JSON.stringify(mockDbState.scenarios[scenarioType].dishes));
      mockDbState.storeMenus.set(storeId, fallback);
      return fallback;
    }
    return [...dishes];
  }

  async getDishById(storeId: string, dishId: string): Promise<FnbDishItem | null> {
    const dishes = await this.getDishesByStoreId(storeId);
    return dishes.find((d) => d.id === dishId) || null;
  }

  async createDish(storeId: string, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem> {
    const dishes = await this.getDishesByStoreId(storeId);
    const newDish: FnbDishItem = {
      ...dish,
      id: `dish-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    dishes.unshift(newDish);
    mockDbState.storeMenus.set(storeId, dishes);
    return newDish;
  }

  async updateDish(storeId: string, dishId: string, data: Partial<FnbDishItem>): Promise<FnbDishItem | null> {
    const dishes = await this.getDishesByStoreId(storeId);
    const idx = dishes.findIndex((d) => d.id === dishId);
    if (idx === -1) return null;
    dishes[idx] = { ...dishes[idx], ...data };
    mockDbState.storeMenus.set(storeId, dishes);
    return dishes[idx];
  }

  async deleteDish(storeId: string, dishId: string): Promise<boolean> {
    const dishes = await this.getDishesByStoreId(storeId);
    const prevLen = dishes.length;
    const filtered = dishes.filter((d) => d.id !== dishId);
    mockDbState.storeMenus.set(storeId, filtered);
    return filtered.length < prevLen;
  }

  async applyScenarioToStore(
    storeId: string,
    scenarioType: BusinessType,
    mode: "REPLACE" | "APPEND"
  ): Promise<{ dishes: FnbDishItem[]; appliedCount: number }> {
    const scenario = mockDbState.scenarios[scenarioType];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioType} not found`);
    }

    const scenarioDishes = JSON.parse(JSON.stringify(scenario.dishes)) as FnbDishItem[];

    if (mode === "REPLACE") {
      mockDbState.storeMenus.set(storeId, scenarioDishes);
      return { dishes: scenarioDishes, appliedCount: scenarioDishes.length };
    } else {
      const existing = await this.getDishesByStoreId(storeId);
      const existingIds = new Set(existing.map((d) => d.id));
      const toAdd = scenarioDishes.filter((d) => !existingIds.has(d.id));
      const merged = [...existing, ...toAdd];
      mockDbState.storeMenus.set(storeId, merged);
      return { dishes: merged, appliedCount: toAdd.length };
    }
  }
}

// ==========================================
// 4. MOCK LICENSE REPOSITORY
// ==========================================
export class MockLicenseRepository implements ILicenseRepository {
  async getAll(): Promise<LicenseRecord[]> {
    return [...mockDbState.licenses];
  }

  async getByKeyCode(keyCode: string): Promise<LicenseRecord | null> {
    return mockDbState.licenses.find((l) => l.keyCode === keyCode) || null;
  }

  async create(data: Omit<LicenseRecord, "id">): Promise<LicenseRecord> {
    const newLicense: LicenseRecord = {
      ...data,
      id: `lic-${Date.now()}`,
    };
    mockDbState.licenses.unshift(newLicense);
    return newLicense;
  }

  async renew(keyCode: string, durationMonths: number): Promise<LicenseRecord | null> {
    const lic = mockDbState.licenses.find((l) => l.keyCode === keyCode);
    if (!lic) return null;
    lic.durationMonths += durationMonths;
    lic.status = "ACTIVE";
    return lic;
  }

  async revoke(keyCode: string): Promise<LicenseRecord | null> {
    const lic = mockDbState.licenses.find((license) => license.keyCode === keyCode);
    if (!lic) return null;
    lic.status = "REVOKED";
    return lic;
  }
}

// ==========================================
// 5. MOCK INVOICE REPOSITORY
// ==========================================
export class MockInvoiceRepository implements IInvoiceRepository {
  async getAll(): Promise<SoftwareInvoiceRecord[]> {
    return [...mockDbState.invoices];
  }

  async getById(id: string): Promise<SoftwareInvoiceRecord | null> {
    return mockDbState.invoices.find((i) => i.id === id) || null;
  }

  async create(data: Omit<SoftwareInvoiceRecord, "id">): Promise<SoftwareInvoiceRecord> {
    const newInvoice: SoftwareInvoiceRecord = {
      ...data,
      id: `inv-${Date.now()}`,
    };
    mockDbState.invoices.unshift(newInvoice);
    return newInvoice;
  }

  async confirmPayment(id: string): Promise<SoftwareInvoiceRecord | null> {
    const inv = mockDbState.invoices.find((i) => i.id === id);
    if (!inv) return null;
    inv.status = "PAID";
    inv.paidAt = new Date().toLocaleString("vi-VN");
    return inv;
  }
}
