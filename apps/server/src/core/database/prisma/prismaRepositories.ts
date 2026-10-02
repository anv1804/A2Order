import {
  BusinessType,
  BusinessScenarioTemplate,
  FnbDishItem,
  AppModule,
  TenantStoreRecord,
  CreateStoreInput,
  SoftwareInvoiceRecord,
} from "@a2order/shared";
import {
  IScenarioRepository,
  IStoreRepository,
  IMenuRepository,
  ILicenseRepository,
  IInvoiceRepository,
  IStaffRepository,
  LicenseRecord,
  StaffRecord,
} from "../IRepository.js";
import { prisma } from "../prismaClient.js";
import { DEFAULT_BUSINESS_SCENARIOS } from "../../../mockData/businessScenariosData.js";
import bcrypt from "bcryptjs";

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
      where: {
        slug: { not: "a2order-platform" }, // Trụ sở A2Order HQ không phải quán thuê phần mềm
      },
      include: {
        license: true,
        staff: true,
        _count: { select: { tables: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return stores.map((s) => {
      const ownerStaff = s.staff.find((st) => st.role === "STORE_OWNER") || s.staff[0];
      return {
        id: s.id,
        name: s.name,
        owner: ownerStaff ? ownerStaff.name : (s.bankOwnerName || "Chưa cập nhật"),
        ownerEmail: ownerStaff?.email || undefined,
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
        staffList: s.staff.map((st) => ({
          id: st.id,
          name: st.name,
          email: st.email,
          role: st.role,
          isActive: st.isActive,
        })),
      };
    });
  }

  async getById(id: string): Promise<TenantStoreRecord | null> {
    const s = await prisma.store.findUnique({
      where: { id },
      include: {
        license: true,
        staff: true,
        _count: { select: { tables: true } },
      },
    });
    if (!s) return null;

    const ownerStaff = s.staff.find((st) => st.role === "STORE_OWNER") || s.staff[0];
    return {
      id: s.id,
      name: s.name,
      owner: ownerStaff ? ownerStaff.name : (s.bankOwnerName || "Chưa cập nhật"),
      ownerEmail: ownerStaff?.email || undefined,
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
      staffList: s.staff.map((st) => ({
        id: st.id,
        name: st.name,
        email: st.email,
        role: st.role,
        isActive: st.isActive,
      })),
    };
  }

  async create(data: CreateStoreInput): Promise<TenantStoreRecord> {
    const slug = (data.name || "store").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
    const planType = data.plan || "GROWTH";
    const licenseKey = data.licenseKey || `A2-${planType}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const durationMonths = data.durationMonths && data.durationMonths > 0 ? data.durationMonths : 12;
    const startDate = new Date();
    const endDate = new Date(Date.now() + durationMonths * 30 * 86400000);
    const tableCount = data.tableCount && data.tableCount > 0 ? data.tableCount : 12;
    const ownerEmail = data.ownerEmail ? data.ownerEmail.toLowerCase().trim() : null;

    if (ownerEmail) {
      const existing = await prisma.staff.findUnique({
        where: { email: ownerEmail },
      });
      if (existing) {
        throw new Error(`Email "${ownerEmail}" đã được sử dụng bởi một tài khoản khác trong hệ thống.`);
      }
    }

    const rawPassword = data.ownerPassword || "123456";
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const pinCode = data.ownerPin && data.ownerPin.trim() ? data.ownerPin.trim() : "1234";

    const { store, staff } = await prisma.$transaction(async (transaction) => {
      // 1. Tạo Store
      const storeRecord = await transaction.store.create({
        data: {
          name: data.name || "Quán Mới",
          slug,
          phone: data.phone,
          address: data.address,
          bankOwnerName: data.owner,
          status: "ACTIVE",
          configVersion: data.configVer || "v1.0.0",
        },
      });

      // 2. Tạo Staff (Tài khoản Chủ Quán)
      const staffRecord = await transaction.staff.create({
        data: {
          storeId: storeRecord.id,
          name: data.owner || "Chủ Quán",
          email: ownerEmail,
          passwordHash,
          pinCode,
          role: "STORE_OWNER",
          isActive: true,
        },
      });

      // 3. Tạo StoreLicense (Kích hoạt dùng ngay)
      const enabledModules = (data.modules && data.modules.length > 0 ? data.modules : ["CORE_POS", "MODULE_QR_ORDER"]).join(",");
      const maxTables = planType === "PRO" ? 150 : planType === "GROWTH" ? 50 : 20;
      const maxStaff = planType === "PRO" ? 50 : planType === "GROWTH" ? 15 : 5;

      const licenseRecord = await transaction.storeLicense.create({
        data: {
          storeId: storeRecord.id,
          licenseKey,
          planType,
          enabledModules,
          status: "ACTIVE",
          startDate,
          endDate,
          maxTables: Math.max(tableCount, maxTables),
          maxStaff,
        },
      });

      // 4. Tạo Khu vực bàn & Danh sách bàn ban đầu
      const zone = await transaction.tableZone.create({
        data: {
          storeId: storeRecord.id,
          name: "Khu Vực Chính",
          sortOrder: 1,
        },
      });

      const tablesData = [];
      for (let i = 1; i <= tableCount; i++) {
        const padIndex = i < 10 ? `0${i}` : `${i}`;
        tablesData.push({
          storeId: storeRecord.id,
          zoneId: zone.id,
          name: `Bàn ${padIndex}`,
          status: "EMPTY",
        });
      }
      await transaction.table.createMany({
        data: tablesData,
      });

      // 5. Tạo Hóa đơn thuê bao bản quyền lấy trực tiếp từ cấu hình DB
      let pricePerMonth = planType === "STARTER" ? 119000 : planType === "GROWTH" ? 199000 : 299000;
      try {
        const plansConfigRow = await transaction.systemConfig.findUnique({ where: { key: "pricing_plans" } });
        if (plansConfigRow?.value) {
          const plansData = JSON.parse(plansConfigRow.value);
          const matchedPlan = Array.isArray(plansData)
            ? plansData.find((p: any) => p.id === planType)
            : plansData[planType];
          if (matchedPlan?.monthlyPrice) {
            pricePerMonth = matchedPlan.monthlyPrice;
          }
        }
      } catch {
        // Fallback to defaults
      }

      const subTotal = pricePerMonth * durationMonths;
      const discount = durationMonths >= 12 ? Math.round(subTotal * 0.2) : durationMonths >= 6 ? Math.round(subTotal * 0.1) : 0;
      const finalAmount = subTotal - discount;
      const invoiceCode = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      await transaction.softwareInvoice.create({
        data: {
          storeLicenseId: licenseRecord.id,
          invoiceCode,
          amount: finalAmount,
          durationMonths,
          periodStart: startDate,
          periodEnd: endDate,
          status: "PAID",
          paidAt: startDate,
          paymentMethod: "VIETQR",
        },
      });

      return { store: storeRecord, staff: staffRecord };
    });

    // 6. Nạp thực đơn mẫu theo mô hình F&B trực tiếp vào CSDL PostgreSQL
    if (data.businessType) {
      const menuRepo = new PrismaMenuRepository();
      try {
        await menuRepo.applyScenarioToStore(store.id, data.businessType, "REPLACE");
      } catch (err) {
        console.warn(`[StoreRepo] Seeding scenario dishes failed for store ${store.id}:`, err);
      }
    }

    return {
      id: store.id,
      name: store.name,
      owner: data.owner || "Chủ Quán",
      ownerEmail: ownerEmail || undefined,
      phone: store.phone || "",
      address: store.address || "",
      tableCount,
      licenseKey,
      plan: planType as any,
      status: "ACTIVE",
      activatedAt: startDate.toLocaleDateString("vi-VN"),
      expiresAt: endDate.toLocaleDateString("vi-VN"),
      daysLeft: durationMonths * 30,
      pingMs: 0,
      activeDevices: 0,
      configVer: store.configVersion,
      modules: data.modules || [],
      businessType: data.businessType,
      staffList: [
        {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          isActive: staff.isActive,
        },
      ],
    };
  }

  async update(id: string, data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord | null> {
    const storeUpdateData: Record<string, any> = {};
    if (data.name !== undefined) storeUpdateData.name = data.name;
    if (data.phone !== undefined) storeUpdateData.phone = data.phone;
    if (data.address !== undefined) storeUpdateData.address = data.address;
    if (data.status !== undefined) storeUpdateData.status = data.status;

    if (Object.keys(storeUpdateData).length > 0) {
      await prisma.store.update({
        where: { id },
        data: storeUpdateData,
      });
    }

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
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { storeId: id } });
      await tx.bill.deleteMany({ where: { storeId: id } });
      await tx.orderSession.deleteMany({ where: { storeId: id } });
      await tx.menuItem.deleteMany({ where: { storeId: id } });
      await tx.category.deleteMany({ where: { storeId: id } });
      await tx.table.deleteMany({ where: { storeId: id } });
      await tx.tableZone.deleteMany({ where: { storeId: id } });
      await tx.staff.deleteMany({ where: { storeId: id } });
      await tx.storeTelemetry.deleteMany({ where: { storeId: id } });
      await tx.storeLandingPage.deleteMany({ where: { storeId: id } });
      const license = await tx.storeLicense.findUnique({ where: { storeId: id } });
      if (license) {
        await tx.softwareInvoice.deleteMany({ where: { storeLicenseId: license.id } });
        await tx.storeLicense.delete({ where: { id: license.id } });
      }
      await tx.store.delete({ where: { id } });
    });
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
    const createData: any = {
      licenseKey: data.keyCode,
      planType: data.plan,
      enabledModules: "CORE_POS",
      maxTables: data.maxDevices,
      endDate,
      status: data.storeId ? data.status : "UNASSIGNED",
    };
    if (data.storeId) {
      createData.storeId = data.storeId;
    }

    const created: any = await (prisma.storeLicense as any).create({
      data: createData,
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

// ==========================================
// 6. PRISMA STAFF REPOSITORY
// ==========================================
export class PrismaStaffRepository implements IStaffRepository {
  async getAll(params?: {
    storeId?: string;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<StaffRecord[]> {
    const whereClause: any = {};
    if (params?.storeId && params.storeId !== "ALL") whereClause.storeId = params.storeId;
    if (params?.role && params.role !== "ALL") whereClause.role = params.role;
    if (params?.status === "ACTIVE") whereClause.isActive = true;
    else if (params?.status === "INACTIVE" || params?.status === "SUSPENDED") whereClause.isActive = false;

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { pinCode: { contains: q } },
        { store: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const list = await prisma.staff.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
      orderBy: [{ store: { name: "asc" } }, { createdAt: "desc" }],
    });

    return list.map((st: any) => ({
      id: st.id,
      storeId: st.storeId,
      storeName: st.store?.name || "Cửa Hàng",
      storeStatus: st.store?.status || "ACTIVE",
      storePlan: st.store?.license?.planType || "STARTER",
      name: st.name,
      email: st.email,
      passwordHash: st.passwordHash,
      pinCode: st.pinCode,
      role: st.role,
      isActive: st.isActive,
      createdAt: st.createdAt.toISOString(),
    }));
  }

  async getById(id: string): Promise<StaffRecord | null> {
    const st: any = await prisma.staff.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
    });
    if (!st) return null;
    return {
      id: st.id,
      storeId: st.storeId,
      storeName: st.store?.name || "Cửa Hàng",
      storeStatus: st.store?.status || "ACTIVE",
      storePlan: st.store?.license?.planType || "STARTER",
      name: st.name,
      email: st.email,
      passwordHash: st.passwordHash,
      pinCode: st.pinCode,
      role: st.role,
      isActive: st.isActive,
      createdAt: st.createdAt.toISOString(),
    };
  }

  async getByEmail(email: string): Promise<StaffRecord | null> {
    const st: any = await prisma.staff.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
    });
    if (!st) return null;
    return {
      id: st.id,
      storeId: st.storeId,
      storeName: st.store?.name || "Cửa Hàng",
      storeStatus: st.store?.status || "ACTIVE",
      storePlan: st.store?.license?.planType || "STARTER",
      name: st.name,
      email: st.email,
      passwordHash: st.passwordHash,
      pinCode: st.pinCode,
      role: st.role,
      isActive: st.isActive,
      createdAt: st.createdAt.toISOString(),
    };
  }

  async findByPin(storeId: string, staffId: string, pinCode: string): Promise<StaffRecord | null> {
    const st: any = await prisma.staff.findFirst({
      where: { id: staffId, storeId, pinCode, isActive: true },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
    });
    if (!st) return null;
    return {
      id: st.id,
      storeId: st.storeId,
      storeName: st.store?.name || "Cửa Hàng",
      storeStatus: st.store?.status || "ACTIVE",
      storePlan: st.store?.license?.planType || "STARTER",
      name: st.name,
      email: st.email,
      passwordHash: st.passwordHash,
      pinCode: st.pinCode,
      role: st.role,
      isActive: st.isActive,
      createdAt: st.createdAt.toISOString(),
    };
  }

  async create(data: {
    storeId: string;
    name: string;
    email?: string | null;
    passwordHash?: string | null;
    pinCode?: string;
    role: string;
    isActive?: boolean;
  }): Promise<StaffRecord> {
    const created: any = await prisma.staff.create({
      data: {
        storeId: data.storeId,
        name: data.name.trim(),
        email: data.email ? data.email.trim().toLowerCase() : null,
        passwordHash: data.passwordHash || null,
        pinCode: data.pinCode || "1111",
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
    });
    return {
      id: created.id,
      storeId: created.storeId,
      storeName: created.store?.name || "Cửa Hàng",
      storeStatus: created.store?.status || "ACTIVE",
      storePlan: created.store?.license?.planType || "STARTER",
      name: created.name,
      email: created.email,
      passwordHash: created.passwordHash,
      pinCode: created.pinCode,
      role: created.role,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async update(id: string, data: Partial<StaffRecord>): Promise<StaffRecord | null> {
    const updated: any = await prisma.staff.update({
      where: { id },
      data: data as any,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
    });
    return {
      id: updated.id,
      storeId: updated.storeId,
      storeName: updated.store?.name || "Cửa Hàng",
      storeStatus: updated.store?.status || "ACTIVE",
      storePlan: updated.store?.license?.planType || "STARTER",
      name: updated.name,
      email: updated.email,
      passwordHash: updated.passwordHash,
      pinCode: updated.pinCode,
      role: updated.role,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    await prisma.staff.delete({ where: { id } });
    return true;
  }

  async toggleStatus(id: string): Promise<StaffRecord | null> {
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) return null;
    const updated: any = await prisma.staff.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            license: { select: { planType: true } },
          },
        },
      },
    });
    return {
      id: updated.id,
      storeId: updated.storeId,
      storeName: updated.store?.name || "Cửa Hàng",
      storeStatus: updated.store?.status || "ACTIVE",
      storePlan: updated.store?.license?.planType || "STARTER",
      name: updated.name,
      email: updated.email,
      passwordHash: updated.passwordHash,
      pinCode: updated.pinCode,
      role: updated.role,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
