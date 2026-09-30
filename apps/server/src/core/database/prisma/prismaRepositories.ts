import {
  BusinessType,
  BusinessScenarioTemplate,
  FnbDishItem,
  AppModule,
  TenantStoreRecord,
  SoftwareInvoiceRecord,
} from "@a2order/shared";
import {
  IScenarioRepository,
  IStoreRepository,
  IMenuRepository,
  ILicenseRepository,
  IInvoiceRepository,
  LicenseRecord,
} from "../IRepository.js";
import { prisma } from "../prismaClient.js";
import { DEFAULT_BUSINESS_SCENARIOS } from "../../../mockData/businessScenariosData.js";

const getStoreAdminStatus = (
  storeStatus: string,
  license: { status: string; endDate: Date } | null
): TenantStoreRecord["status"] => {
  if (storeStatus === "SUSPENDED" || license?.status === "SUSPENDED") return "SUSPENDED";
  if (!license || license.status === "REVOKED") return "EXPIRED";
  const daysLeft = Math.ceil((license.endDate.getTime() - Date.now()) / 86400000);
  if (daysLeft <= 0 || license.status === "EXPIRED") return "EXPIRED";
  if (daysLeft <= 7 || license.status === "EXPIRING_SOON") return "EXPIRING_SOON";
  return "ACTIVE";
};

// ==========================================
// 1. PRISMA SCENARIO REPOSITORY
// ==========================================
const activeScenarios: Record<BusinessType, BusinessScenarioTemplate> = { ...DEFAULT_BUSINESS_SCENARIOS };

export class PrismaScenarioRepository implements IScenarioRepository {
  async getAll(): Promise<BusinessScenarioTemplate[]> {
    return Object.values(activeScenarios);
  }

  async getByType(type: BusinessType): Promise<BusinessScenarioTemplate | null> {
    return activeScenarios[type] || null;
  }

  async addDishTemplate(type: BusinessType, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem> {
    const scenario = activeScenarios[type];
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
    const scenario = activeScenarios[type];
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
    const scenario = activeScenarios[type];
    if (!scenario) return false;
    const index = scenario.dishes.findIndex((d) => d.id === dishId);
    if (index === -1) return false;
    scenario.dishes.splice(index, 1);
    return true;
  }
}

// ==========================================
// 2. PRISMA STORE REPOSITORY
// ==========================================
export class PrismaStoreRepository implements IStoreRepository {
  async getAll(): Promise<TenantStoreRecord[]> {
    const stores = await prisma.store.findMany({
      include: {
        license: true,
        _count: { select: { tables: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return stores.map((s) => ({
      id: s.id,
      name: s.name,
      owner: s.bankOwnerName || "Chưa cập nhật",
      phone: s.phone || "",
      address: s.address || "",
      tableCount: s._count.tables,
      licenseKey: s.license?.licenseKey || "Chưa cấp",
      plan: (s.license?.planType as any) || "STARTER",
      status: getStoreAdminStatus(s.status, s.license),
      activatedAt: s.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: s.license?.endDate ? s.license.endDate.toLocaleDateString("vi-VN") : "",
      daysLeft: s.license?.endDate ? Math.max(0, Math.ceil((s.license.endDate.getTime() - Date.now()) / (1000 * 86400))) : 0,
      pingMs: 0,
      activeDevices: 0,
      configVer: s.configVersion,
      modules: s.license?.enabledModules ? (s.license.enabledModules.split(",") as AppModule[]) : [],
    }));
  }

  async getById(id: string): Promise<TenantStoreRecord | null> {
    const s = await prisma.store.findUnique({
      where: { id },
      include: {
        license: true,
        _count: { select: { tables: true } },
      },
    });
    if (!s) return null;

    return {
      id: s.id,
      name: s.name,
      owner: s.bankOwnerName || "Chưa cập nhật",
      phone: s.phone || "",
      address: s.address || "",
      tableCount: s._count.tables,
      licenseKey: s.license?.licenseKey || "Chưa cấp",
      plan: (s.license?.planType as any) || "STARTER",
      status: getStoreAdminStatus(s.status, s.license),
      activatedAt: s.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: s.license?.endDate ? s.license.endDate.toLocaleDateString("vi-VN") : "",
      daysLeft: s.license?.endDate ? Math.max(0, Math.ceil((s.license.endDate.getTime() - Date.now()) / (1000 * 86400))) : 0,
      pingMs: 0,
      activeDevices: 0,
      configVer: s.configVersion,
      modules: s.license?.enabledModules ? (s.license.enabledModules.split(",") as AppModule[]) : [],
    };
  }

  async create(data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord> {
    const slug = (data.name || "store").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
    const planType = data.plan || "STARTER";
    const licenseKey = data.licenseKey || `A2-${planType}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const created = await prisma.$transaction(async (transaction) => {
      const store = await transaction.store.create({
        data: {
          name: data.name || "Quán Mới",
          slug,
          phone: data.phone,
          address: data.address,
          bankOwnerName: data.owner,
          status: data.status || "ACTIVE",
          configVersion: data.configVer || "v1.0.0",
        },
      });
      const pendingPaymentExpiry = new Date();
      await transaction.storeLicense.create({
        data: {
          storeId: store.id,
          licenseKey,
          planType,
          enabledModules: (data.modules || []).join(","),
          // Chưa mở license cho đến khi hóa đơn đầu tiên được xác nhận.
          status: "EXPIRED",
          startDate: pendingPaymentExpiry,
          endDate: pendingPaymentExpiry,
          maxTables: data.tableCount || 30,
          maxStaff: 20,
        },
      });
      return store;
    });

    return {
      id: created.id,
      name: created.name,
      owner: data.owner || "Chưa cập nhật",
      phone: created.phone || "",
      address: created.address || "",
      tableCount: data.tableCount || 0,
      licenseKey,
      plan: planType,
      status: "EXPIRED",
      activatedAt: created.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: new Date().toLocaleDateString("vi-VN"),
      daysLeft: 0,
      pingMs: 0,
      activeDevices: 0,
      configVer: created.configVersion,
      modules: data.modules || [],
    };
  }

  async update(id: string, data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord | null> {
    const updated = await prisma.store.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        status: data.status,
      },
    });

    if (data.modules) {
      const planType = data.plan || "STARTER";
      const endDate = new Date(Date.now() + Math.max(data.daysLeft || 30, 1) * 86400000);
      await prisma.storeLicense.upsert({
        where: { storeId: id },
        update: {
          enabledModules: data.modules.join(","),
          ...(data.plan ? { planType: data.plan } : {}),
        },
        create: {
          storeId: id,
          licenseKey: data.licenseKey || `A2-${planType}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          planType,
          enabledModules: data.modules.join(","),
          status: "ACTIVE",
          endDate,
          maxTables: data.tableCount || 30,
          maxStaff: 20,
        },
      });
    }
    return this.getById(updated.id);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.store.delete({ where: { id } });
    return true;
  }
}

// ==========================================
// 3. PRISMA MENU REPOSITORY
// ==========================================
export class PrismaMenuRepository implements IMenuRepository {
  async getDishesByStoreId(storeId: string): Promise<FnbDishItem[]> {
    const items = await prisma.menuItem.findMany({
      where: { storeId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return items.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category?.name || "Món Chính",
      price: m.price,
      costPrice: Math.round(m.price * 0.4),
      station: (m.station as any) || "KITCHEN",
      isAvailable: m.isAvailable,
      image: m.image || undefined,
    }));
  }

  async getDishById(storeId: string, dishId: string): Promise<FnbDishItem | null> {
    const m = await prisma.menuItem.findFirst({
      where: { id: dishId, storeId },
      include: { category: true },
    });
    if (!m) return null;

    return {
      id: m.id,
      name: m.name,
      category: m.category?.name || "Món Chính",
      price: m.price,
      costPrice: Math.round(m.price * 0.4),
      station: (m.station as any) || "KITCHEN",
      isAvailable: m.isAvailable,
      image: m.image || undefined,
    };
  }

  async createDish(storeId: string, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem> {
    // Find or create category
    let category = await prisma.category.findFirst({
      where: { storeId, name: dish.category },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { storeId, name: dish.category },
      });
    }

    const created = await prisma.menuItem.create({
      data: {
        storeId,
        categoryId: category.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        station: dish.station,
        isAvailable: dish.isAvailable,
      },
      include: { category: true },
    });

    return {
      id: created.id,
      name: created.name,
      category: created.category.name,
      price: created.price,
      costPrice: dish.costPrice,
      station: (created.station as any) || "KITCHEN",
      isAvailable: created.isAvailable,
      image: created.image || undefined,
    };
  }

  async updateDish(storeId: string, dishId: string, data: Partial<FnbDishItem>): Promise<FnbDishItem | null> {
    const updated = await prisma.menuItem.update({
      where: { id: dishId },
      data: {
        name: data.name,
        price: data.price,
        image: data.image,
        isAvailable: data.isAvailable,
        station: data.station,
      },
      include: { category: true },
    });

    return {
      id: updated.id,
      name: updated.name,
      category: updated.category.name,
      price: updated.price,
      costPrice: data.costPrice || Math.round(updated.price * 0.4),
      station: (updated.station as any) || "KITCHEN",
      isAvailable: updated.isAvailable,
      image: updated.image || undefined,
    };
  }

  async deleteDish(storeId: string, dishId: string): Promise<boolean> {
    await prisma.menuItem.delete({ where: { id: dishId } });
    return true;
  }

  async applyScenarioToStore(
    storeId: string,
    scenarioType: BusinessType,
    mode: "REPLACE" | "APPEND"
  ): Promise<{ dishes: FnbDishItem[]; appliedCount: number }> {
    const scenario = DEFAULT_BUSINESS_SCENARIOS[scenarioType];
    if (!scenario) throw new Error("Scenario not found");

    if (mode === "REPLACE") {
      await prisma.menuItem.deleteMany({ where: { storeId } });
    }

    for (const d of scenario.dishes) {
      await this.createDish(storeId, d);
    }

    const dishes = await this.getDishesByStoreId(storeId);
    return { dishes, appliedCount: scenario.dishes.length };
  }
}

// ==========================================
// 4. PRISMA LICENSE REPOSITORY
// ==========================================
export class PrismaLicenseRepository implements ILicenseRepository {
  async getAll(): Promise<LicenseRecord[]> {
    const licenses = await prisma.storeLicense.findMany({
      include: { store: true },
      orderBy: { createdAt: "desc" },
    });

    return licenses.map((l) => ({
      id: l.id,
      keyCode: l.licenseKey,
      storeId: l.storeId || undefined,
      storeName: l.store?.name,
      plan: l.planType,
      maxDevices: l.maxTables,
      durationMonths: 12,
      issuedAt: l.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: l.endDate.toLocaleDateString("vi-VN"),
      status: l.status === "UNASSIGNED" && l.endDate < new Date()
        ? "EXPIRED"
        : (l.status as any) || "ACTIVE",
    }));
  }

  async getByKeyCode(keyCode: string): Promise<LicenseRecord | null> {
    const l = await prisma.storeLicense.findUnique({
      where: { licenseKey: keyCode },
      include: { store: true },
    });
    if (!l) return null;

    return {
      id: l.id,
      keyCode: l.licenseKey,
      storeId: l.storeId || undefined,
      storeName: l.store?.name,
      plan: l.planType,
      maxDevices: l.maxTables,
      durationMonths: 12,
      issuedAt: l.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: l.endDate.toLocaleDateString("vi-VN"),
      status: l.status === "UNASSIGNED" && l.endDate < new Date()
        ? "EXPIRED"
        : (l.status as any) || "ACTIVE",
    };
  }

  async create(data: Omit<LicenseRecord, "id">): Promise<LicenseRecord> {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (data.durationMonths || 12));
    const created = await prisma.storeLicense.create({
      data: {
        ...(data.storeId ? { storeId: data.storeId } : {}),
        licenseKey: data.keyCode,
        planType: data.plan,
        enabledModules: "CORE_POS",
        maxTables: data.maxDevices,
        endDate,
        status: data.storeId ? data.status : "UNASSIGNED",
      },
      include: { store: true },
    });

    return {
      id: created.id,
      keyCode: created.licenseKey,
      storeId: created.storeId || undefined,
      storeName: created.store?.name,
      plan: created.planType,
      maxDevices: created.maxTables,
      durationMonths: data.durationMonths,
      issuedAt: created.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: created.endDate.toLocaleDateString("vi-VN"),
      status: (created.status as any) || "UNASSIGNED",
    };
  }

  async renew(keyCode: string, durationMonths: number): Promise<LicenseRecord | null> {
    const target = await prisma.storeLicense.findUnique({ where: { licenseKey: keyCode } });
    if (!target) return null;

    const newEndDate = new Date(target.endDate.getTime() + durationMonths * 30 * 86400000);
    const updated = await prisma.storeLicense.update({
      where: { licenseKey: keyCode },
      data: {
        endDate: newEndDate,
        status: "ACTIVE",
      },
      include: { store: true },
    });

    return {
      id: updated.id,
      keyCode: updated.licenseKey,
      storeId: updated.storeId || undefined,
      storeName: updated.store?.name,
      plan: updated.planType,
      maxDevices: updated.maxTables,
      durationMonths,
      issuedAt: updated.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: updated.endDate.toLocaleDateString("vi-VN"),
      status: "ACTIVE",
    };
  }

  async revoke(keyCode: string): Promise<LicenseRecord | null> {
    const license = await prisma.storeLicense.findUnique({ where: { licenseKey: keyCode } });
    if (!license) return null;
    const revoked = await prisma.storeLicense.update({
      where: { licenseKey: keyCode },
      data: { status: "REVOKED" },
      include: { store: true },
    });
    return {
      id: revoked.id,
      keyCode: revoked.licenseKey,
      storeId: revoked.storeId || undefined,
      storeName: revoked.store?.name,
      plan: revoked.planType,
      maxDevices: revoked.maxTables,
      durationMonths: 12,
      issuedAt: revoked.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: revoked.endDate.toLocaleDateString("vi-VN"),
      status: "REVOKED",
    };
  }
}

// ==========================================
// 5. PRISMA INVOICE REPOSITORY
// ==========================================
export class PrismaInvoiceRepository implements IInvoiceRepository {
  async getAll(): Promise<SoftwareInvoiceRecord[]> {
    const invoices = await prisma.softwareInvoice.findMany({
      include: { license: { include: { store: true } } },
      orderBy: { createdAt: "desc" },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceCode: inv.invoiceCode,
      storeId: inv.license.storeId || "",
      storeName: inv.license.store?.name || "License dự phòng",
      plan: inv.license.planType,
      durationMonths: inv.durationMonths,
      subTotal: inv.amount,
      discountAmount: 0,
      finalAmount: inv.amount,
      status: (inv.status as any) || "PENDING",
      paymentMethod: "VIETQR",
      createdAt: inv.createdAt.toLocaleDateString("vi-VN"),
      paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString("vi-VN") : undefined,
      qrUrl: inv.pdfUrl || undefined,
    }));
  }

  async getById(id: string): Promise<SoftwareInvoiceRecord | null> {
    const inv = await prisma.softwareInvoice.findUnique({
      where: { id },
      include: { license: { include: { store: true } } },
    });
    if (!inv) return null;

    return {
      id: inv.id,
      invoiceCode: inv.invoiceCode,
      storeId: inv.license.storeId || "",
      storeName: inv.license.store?.name || "License dự phòng",
      plan: inv.license.planType,
      durationMonths: inv.durationMonths,
      subTotal: inv.amount,
      discountAmount: 0,
      finalAmount: inv.amount,
      status: (inv.status as any) || "PENDING",
      paymentMethod: "VIETQR",
      createdAt: inv.createdAt.toLocaleDateString("vi-VN"),
      paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString("vi-VN") : undefined,
      qrUrl: inv.pdfUrl || undefined,
    };
  }

  async create(data: Omit<SoftwareInvoiceRecord, "id">): Promise<SoftwareInvoiceRecord> {
    const license = await prisma.storeLicense.findFirst({
      where: { storeId: data.storeId },
      include: { store: true },
    });

    if (!license) {
      throw new Error(`Cannot create invoice: StoreLicense not found for store ${data.storeId}`);
    }

    const created = await prisma.softwareInvoice.create({
      data: {
        storeLicenseId: license.id,
        invoiceCode: data.invoiceCode,
        amount: data.finalAmount,
        durationMonths: data.durationMonths,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + data.durationMonths * 30 * 86400000),
        status: data.status,
        paymentMethod: data.paymentMethod || "VIETQR",
      },
      include: { license: { include: { store: true } } },
    });

    return {
      id: created.id,
      invoiceCode: created.invoiceCode,
      storeId: created.license.storeId || "",
      storeName: created.license.store?.name || data.storeName || "License dự phòng",
      plan: created.license.planType,
      durationMonths: created.durationMonths,
      subTotal: created.amount,
      discountAmount: 0,
      finalAmount: created.amount,
      status: (created.status as any) || "PENDING",
      paymentMethod: "VIETQR",
      createdAt: created.createdAt.toLocaleDateString("vi-VN"),
      paidAt: created.paidAt ? created.paidAt.toLocaleDateString("vi-VN") : undefined,
    };
  }

  async confirmPayment(id: string): Promise<SoftwareInvoiceRecord | null> {
    const updated = await prisma.softwareInvoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
      include: { license: { include: { store: true } } },
    });

    return {
      id: updated.id,
      invoiceCode: updated.invoiceCode,
      storeId: updated.license.storeId || "",
      storeName: updated.license.store?.name || "License dự phòng",
      plan: updated.license.planType,
      durationMonths: updated.durationMonths,
      subTotal: updated.amount,
      discountAmount: 0,
      finalAmount: updated.amount,
      status: "PAID",
      paymentMethod: "VIETQR",
      createdAt: updated.createdAt.toLocaleDateString("vi-VN"),
      paidAt: updated.paidAt ? updated.paidAt.toLocaleDateString("vi-VN") : undefined,
    };
  }
}
