import {
  BusinessType,
  BusinessScenarioTemplate,
  FnbDishItem,
  TenantStoreRecord,
  SoftwareInvoiceRecord,
} from "@a2order/shared";

// ==========================================
// 1. SCENARIO REPOSITORY INTERFACE
// ==========================================
export interface IScenarioRepository {
  getAll(): Promise<BusinessScenarioTemplate[]>;
  getByType(type: BusinessType): Promise<BusinessScenarioTemplate | null>;
  addDishTemplate(type: BusinessType, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem>;
  updateDishTemplate(type: BusinessType, dishId: string, dish: Partial<FnbDishItem>): Promise<FnbDishItem | null>;
  deleteDishTemplate(type: BusinessType, dishId: string): Promise<boolean>;
}

// ==========================================
// 2. STORE REPOSITORY INTERFACE
// ==========================================
export interface IStoreRepository {
  getAll(): Promise<TenantStoreRecord[]>;
  getById(id: string): Promise<TenantStoreRecord | null>;
  create(data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord>;
  update(id: string, data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord | null>;
  delete(id: string): Promise<boolean>;
}

// ==========================================
// 3. MENU REPOSITORY INTERFACE
// ==========================================
export interface IMenuRepository {
  getDishesByStoreId(storeId: string): Promise<FnbDishItem[]>;
  getDishById(storeId: string, dishId: string): Promise<FnbDishItem | null>;
  createDish(storeId: string, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem>;
  updateDish(storeId: string, dishId: string, data: Partial<FnbDishItem>): Promise<FnbDishItem | null>;
  deleteDish(storeId: string, dishId: string): Promise<boolean>;
  applyScenarioToStore(
    storeId: string,
    scenarioType: BusinessType,
    mode: "REPLACE" | "APPEND"
  ): Promise<{ dishes: FnbDishItem[]; appliedCount: number }>;
}

// ==========================================
// 4. LICENSE & INVOICE REPOSITORY INTERFACES
// ==========================================
export interface LicenseRecord {
  id: string;
  keyCode: string;
  storeId?: string;
  storeName?: string;
  plan: string;
  maxDevices: number;
  durationMonths: number;
  issuedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED" | "UNASSIGNED";
}

export interface ILicenseRepository {
  getAll(): Promise<LicenseRecord[]>;
  getByKeyCode(keyCode: string): Promise<LicenseRecord | null>;
  create(data: Omit<LicenseRecord, "id">): Promise<LicenseRecord>;
  renew(keyCode: string, durationMonths: number): Promise<LicenseRecord | null>;
}

export interface IInvoiceRepository {
  getAll(): Promise<SoftwareInvoiceRecord[]>;
  getById(id: string): Promise<SoftwareInvoiceRecord | null>;
  create(data: Omit<SoftwareInvoiceRecord, "id">): Promise<SoftwareInvoiceRecord>;
  confirmPayment(id: string): Promise<SoftwareInvoiceRecord | null>;
}
