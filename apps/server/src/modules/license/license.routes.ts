import { FastifyInstance } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";
import { licenseRepository, invoiceRepository } from "../../core/database/repositoryFactory.js";
import { LicensePlan, LicenseStatus, InvoiceStatus, AppModule, APP_MODULE_CATALOG, SoftwareInvoiceRecord } from "@a2order/shared";

export async function licenseRoutes(fastify: FastifyInstance) {
  /**
   * 0. LẤY TẤT CẢ GIẤY PHÉP BẢN QUYỀN
   * GET /api/licenses
   */
  fastify.get("/", async (_request, reply) => {
    try {
      const licenses = await licenseRepository.getAll();
      return { success: true, count: licenses.length, data: licenses };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * TẠO MỚI GIẤY PHÉP BẢN QUYỀN
   * POST /api/licenses
   */
  fastify.post("/", async (request, reply) => {
    try {
      const body = request.body as any;
      const created = await licenseRepository.create(body);
      return { success: true, data: created };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * GIA HẠN GIẤY PHÉP BẢN QUYỀN
   * POST /api/licenses/:keyCode/renew
   */
  fastify.post("/:keyCode/renew", async (request, reply) => {
    const { keyCode } = request.params as { keyCode: string };
    const { durationMonths } = (request.body as { durationMonths?: number }) || {};
    try {
      const renewed = await licenseRepository.renew(keyCode, durationMonths || 12);
      if (!renewed) return reply.status(404).send({ success: false, error: "License not found" });
      return { success: true, data: renewed };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * LẤY TOÀN BỘ HÓA ĐƠN SAAS
   * GET /api/licenses/invoices/all
   */
  fastify.get("/invoices/all", async (_request, reply) => {
    try {
      const invoices = await invoiceRepository.getAll();
      return { success: true, count: invoices.length, data: invoices };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 1. LẤY THÔNG TIN LICENSE & CÁC MODULE KÍCH HOẠT CỦA QUÁN
   */
  fastify.get("/:storeId/info", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };

    let license = await prisma.storeLicense.findUnique({
      where: { storeId },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!license) {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      license = await prisma.storeLicense.create({
        data: {
          storeId,
          licenseKey: `A2-PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          planType: LicensePlan.PRO,
          enabledModules: "CORE_POS,MODULE_KDS,MODULE_ACCOUNTING,MODULE_QR_ORDER,MODULE_ADVANCED_ANALYTICS",
          status: LicenseStatus.ACTIVE,
          startDate: now,
          endDate: end,
          maxTables: 30,
          maxStaff: 20,
        },
        include: { invoices: true },
      });
    }

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((new Date(license.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const enabledModules = license.enabledModules ? (license.enabledModules.split(",") as AppModule[]) : [AppModule.CORE_POS];

    return {
      storeId: license.storeId,
      licenseKey: license.licenseKey,
      planType: license.planType,
      enabledModules,
      status: daysRemaining === 0 ? LicenseStatus.EXPIRED : license.status,
      startDate: license.startDate,
      endDate: license.endDate,
      daysRemaining,
      maxTables: license.maxTables,
      maxStaff: license.maxStaff,
      recentInvoices: license.invoices,
    };
  });

  /**
   * 2. TÍNH TOÁN GIÁ HỢP ĐỒNG LINH HOẠT THEO CÁC MODULE ĐƯỢC CHỌN
   */
  fastify.post("/calculate-pricing", async (request, reply) => {
    const body = request.body as {
      selectedModules: AppModule[];
      durationMonths: number;
    };

    const modules = body.selectedModules || [AppModule.CORE_POS];
    const duration = Number(body.durationMonths) || 1;

    // Tính tổng giá hàng tháng từ danh mục catalog
    const monthlyTotal = modules.reduce((sum, modId) => {
      const item = APP_MODULE_CATALOG.find((m) => m.id === modId);
      return sum + (item ? item.monthlyPrice : 0);
    }, 0);

    // Chiết khấu: 6 tháng giảm 10%, 12 tháng giảm 20%
    let discountPercent = 0;
    if (duration >= 12) discountPercent = 20;
    else if (duration >= 6) discountPercent = 10;

    const rawTotal = monthlyTotal * duration;
    const discountAmount = Math.round((rawTotal * discountPercent) / 100);
    const finalAmount = rawTotal - discountAmount;

    return {
      selectedModules: modules,
      durationMonths: duration,
      monthlyTotal,
      rawTotal,
      discountPercent,
      discountAmount,
      finalAmount,
      breakdown: modules.map((modId) => {
        const item = APP_MODULE_CATALOG.find((m) => m.id === modId);
        return {
          id: modId,
          name: item?.name || modId,
          monthlyPrice: item?.monthlyPrice || 0,
        };
      }),
    };
  });

  /**
   * 3. SUPER ADMIN: TẠO HÓA ĐƠN THUÊ PHẦN MỀM CHO CHỦ QUÁN
   */
  fastify.post("/invoice/create", async (request, reply) => {
    const body = request.body as {
      storeId: string;
      durationMonths: number;
      amount: number;
      enabledModules?: AppModule[];
    };

    const license = await prisma.storeLicense.findUnique({
      where: { storeId: body.storeId },
    });

    if (!license) {
      return reply.status(404).send({ error: "Store License not found" });
    }

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + body.durationMonths);

    const invoiceCode = `INV-${Date.now().toString().slice(-6)}`;

    // Nếu có cập nhật module thì lưu lại vào license
    if (body.enabledModules && body.enabledModules.length > 0) {
      await prisma.storeLicense.update({
        where: { id: license.id },
        data: { enabledModules: body.enabledModules.join(",") },
      });
    }

    const invoice = await prisma.softwareInvoice.create({
      data: {
        storeLicenseId: license.id,
        invoiceCode,
        amount: body.amount,
        durationMonths: body.durationMonths,
        periodStart,
        periodEnd,
        status: InvoiceStatus.PENDING,
        paymentMethod: "VIETQR",
      },
    });

    return {
      success: true,
      message: "Đã tạo hóa đơn thuê phần mềm thành công!",
      invoice,
    };
  });

  /**
   * 4. GIA HẠN KHI THANH TOÁN THÀNH CÔNG
   */
  fastify.post("/invoice/:invoiceId/confirm-payment", async (request, reply) => {
    const { invoiceId } = request.params as { invoiceId: string };

    const invoice = await prisma.softwareInvoice.findUnique({
      where: { id: invoiceId },
      include: { license: true },
    });

    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    await prisma.softwareInvoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    const currentEnd = new Date(invoice.license.endDate);
    const newEnd = currentEnd > new Date() ? currentEnd : new Date();
    newEnd.setMonth(newEnd.getMonth() + invoice.durationMonths);

    const updatedLicense = await prisma.storeLicense.update({
      where: { id: invoice.license.id },
      data: {
        endDate: newEnd,
        status: LicenseStatus.ACTIVE,
      },
    });

    return {
      success: true,
      message: "Đã gia hạn thành công giấy phép thuê phần mềm!",
      newEndDate: updatedLicense.endDate,
    };
  });
}
