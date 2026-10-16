import {
  FnbDishItem,
  AppModule,
  TenantStoreRecord,
  CreateStoreInput,
  SoftwareInvoiceRecord,
} from "@a2order/shared";
import {
  IStoreRepository,
  IMenuRepository,
  ILicenseRepository,
  IInvoiceRepository,
  IStaffRepository,
  LicenseRecord,
  StaffRecord,
} from "../IRepository.js";
import { prisma } from "../prismaClient.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { AppError } from "../../security/errors.js";
import { getPricingConfig, reserveSubscriptionQuote, addMonths } from "../../../modules/config/pricing.service.js";
import { menuView, saveDish } from "../../../modules/menu/menu.service.js";
import { transaction } from "../prismaClient.js";
import type { Transaction } from "../../../types/security.js";

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
// 1. PRISMA STORE REPOSITORY
// ==========================================
export class PrismaStoreRepository implements IStoreRepository {
  async getAll(): Promise<TenantStoreRecord[]> {
    const stores = await prisma.store.findMany({
      where: {
        slug: { not: "a2order-platform" },
        status: { not: "ARCHIVED" }, // Trụ sở A2Order HQ không phải quán thuê phần mềm
      },
      include: {
        license: { include: { invoices: { where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 1 } } },
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
        monthlyRecurringRevenue: s.license?.invoices[0] ? Math.round(s.license.invoices[0].amount / s.license.invoices[0].durationMonths) : 0,
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

  async getById(id: string, db: Pick<Transaction, "store"> = prisma): Promise<TenantStoreRecord | null> {
    const s = await db.store.findUnique({
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

  async create(data: CreateStoreInput, existingTx?: Transaction): Promise<TenantStoreRecord> {
    if (!data.ownerEmail || !data.ownerPassword || data.ownerPassword.length < 10) throw new AppError(400, "Cần email và mật khẩu riêng ít nhất 10 ký tự");
    const passwordHash = await bcrypt.hash(data.ownerPassword, 12);
    const pinHash = data.ownerPin ? await bcrypt.hash(data.ownerPin, 12) : null;
    const run = async (tx: Transaction) => {
      const config = await getPricingConfig(tx);
      const plan = config.plans.find(p => p.id === (data.plan || "GROWTH"));
      if (!plan) throw new AppError(400, "Gói không hợp lệ");
      const tableCount = data.tableCount || 1;
      if (tableCount < 1 || tableCount > plan.maxTables) throw new AppError(400, "Số bàn vượt hạn mức gói");
      const durationMonths = data.durationMonths || 12;
      const modules = data.modules?.length ? data.modules : plan.includedModules;
      const quote = await reserveSubscriptionQuote(tx, { selectedModules: modules, durationMonths, voucherCode: data.voucherCode });
      const store = await tx.store.create({ data: { name: (data.name || "").trim(), slug: "store-" + randomUUID(), phone: data.phone, address: data.address, status: "ACTIVE" } });
      await tx.staff.create({ data: { storeId: store.id, name: data.owner || data.name || "Chủ quán", email: data.ownerEmail!.trim().toLowerCase(), passwordHash, pinCode: pinHash, role: "STORE_OWNER" } });
      const license = await tx.storeLicense.create({ data: { storeId: store.id, licenseKey: data.licenseKey || "A2-" + randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase(), planType: plan.id, enabledModules: modules.join(","), maxTables: plan.maxTables, maxStaff: plan.maxStaff, status: "EXPIRED", endDate: new Date() } });
      const zone = await tx.tableZone.create({ data: { storeId: store.id, name: "Khu Vực Chính" } });
      await tx.table.createMany({ data: Array.from({ length: tableCount }, (_, i) => ({ storeId: store.id, zoneId: zone.id, name: "Bàn " + String(i + 1).padStart(2, "0"), code: "TB-" + String(i + 1).padStart(2, "0") })) });
      await tx.softwareInvoice.create({ data: { storeLicenseId: license.id, invoiceCode: "INV-" + randomUUID().slice(0, 18), amount: quote.finalAmount, durationMonths, periodStart: new Date(), periodEnd: addMonths(new Date(), durationMonths), status: "PENDING", requestedModules: modules.join(","), voucherCode: data.voucherCode } });
      return (await this.getById(store.id, tx))!;
    };
    return existingTx ? run(existingTx) : transaction(run);
  }

  async update(id: string, data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord | null> {
    const storeUpdateData: Record<string, any> = {};
    if (data.name !== undefined) storeUpdateData.name = data.name;
    if (data.configVer !== undefined) storeUpdateData.configVersion = data.configVer;
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
    await transaction(async tx => {
      await tx.store.update({ where: { id }, data: { status: "ARCHIVED" } });
      await tx.staff.updateMany({ where: { storeId: id }, data: { isActive: false, sessionVersion: { increment: 1 } } });
      await tx.storeLicense.updateMany({ where: { storeId: id }, data: { status: "REVOKED" } });
    });
    return true;
  }
}

// ==========================================
// 3. PRISMA MENU REPOSITORY
// ==========================================
export class PrismaMenuRepository implements IMenuRepository {
  async getDishesByStoreId(storeId: string): Promise<FnbDishItem[]> { return (await prisma.menuItem.findMany({ where: { storeId, archivedAt: null }, include: { category: true } })).map(menuView); }
  async getDishById(storeId: string, dishId: string): Promise<FnbDishItem | null> { const row = await prisma.menuItem.findFirst({ where: { id: dishId, storeId, archivedAt: null }, include: { category: true } }); return row ? menuView(row) : null; }
  async createDish(storeId: string, dish: Omit<FnbDishItem, "id">): Promise<FnbDishItem> { return transaction(tx => saveDish(tx, storeId, dish)); }
  async updateDish(storeId: string, dishId: string, data: Partial<FnbDishItem>): Promise<FnbDishItem | null> { return transaction(tx => saveDish(tx, storeId, data, dishId)); }
  async deleteDish(storeId: string, dishId: string): Promise<boolean> { await prisma.menuItem.update({ where: { id_storeId: { id: dishId, storeId } }, data: { archivedAt: new Date(), isAvailable: false } }); return true; }
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
      durationMonths: Math.max(1, Math.round((l.endDate.getTime() - l.startDate.getTime()) / 2629800000)),
      issuedAt: l.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: l.endDate.toLocaleDateString("vi-VN"),
      status: !["REVOKED", "SUSPENDED"].includes(l.status) && l.endDate < new Date()
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
      durationMonths: Math.max(1, Math.round((l.endDate.getTime() - l.startDate.getTime()) / 2629800000)),
      issuedAt: l.createdAt.toLocaleDateString("vi-VN"),
      expiresAt: l.endDate.toLocaleDateString("vi-VN"),
      status: !["REVOKED", "SUSPENDED"].includes(l.status) && l.endDate < new Date()
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

    if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) throw new AppError(400, "Kỳ hạn không hợp lệ");
    const newEndDate = addMonths(new Date(Math.max(Date.now(), target.endDate.getTime())), durationMonths);
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
      durationMonths: Math.max(1, Math.round((revoked.endDate.getTime() - revoked.startDate.getTime()) / 2629800000)),
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
        pinCode: data.pinCode ? await bcrypt.hash(data.pinCode, 12) : null,
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
