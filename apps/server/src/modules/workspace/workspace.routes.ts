import type { FastifyPluginAsync } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../core/database/prismaClient.js";
import { currentStore, requireRoles } from "../../core/security/access.js";
import { command } from "../../core/security/commands.js";
import { AppError } from "../../core/security/errors.js";
import { checkLicense } from "../order/order.service.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import { validatePromotions } from "../promotion/promotion.service.js";

const permissions: Record<string, string[]> = {
  customers_data: ["STORE_OWNER", "CASHIER"], loyalty_rules: ["STORE_OWNER"], crm_campaigns: ["STORE_OWNER"],
  inventory_ingredients: ["STORE_OWNER", "ACCOUNTANT"], inventory_receipts: ["STORE_OWNER", "ACCOUNTANT"], inventory_recipes: ["STORE_OWNER", "ACCOUNTANT"],
  reservations_data: ["STORE_OWNER", "CASHIER", "WAITER"], promotions_list: ["STORE_OWNER"],
  hardware_printers: ["STORE_OWNER"], hardware_template: ["STORE_OWNER"], delivery_channels: ["STORE_OWNER"],
  attendance_logs: ["STORE_OWNER"], calendar_notes: ["STORE_OWNER", "ACCOUNTANT", "CASHIER"],
};

function validateDocument(value: unknown, depth = 0): void {
  if (depth > 12) throw new AppError(400, "Dữ liệu lồng quá nhiều cấp");
  if (typeof value === "number" && !Number.isFinite(value)) throw new AppError(400, "Số không hợp lệ");
  if (Array.isArray(value)) { if (value.length > 10000) throw new AppError(400, "Dữ liệu vượt giới hạn"); for (const item of value) validateDocument(item, depth + 1); }
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) throw new AppError(400, "Thuộc tính không hợp lệ");
    if (/^(?:api_?key|api_?secret|access_?token|refresh_?token|password|secret)$/i.test(key) && item) throw new AppError(400, "Thông tin bí mật phải được cấu hình phía server");
    if (["currentStock", "quantity", "unitPrice", "avgCostPrice", "discountValue", "depositAmount", "points"].includes(key) && typeof item === "number" && item < 0) throw new AppError(400, "Giá trị không được âm: " + key);
    validateDocument(item, depth + 1);
  }
}

export const workspaceRoutes: FastifyPluginAsync = async app => {
  app.get("/:storeId/:key", async request => {
    const { key } = z.object({ key: z.string().max(80) }).parse(request.params);
    const allowed = permissions[key];
    if (!allowed) throw new AppError(404, "Loại dữ liệu chưa được hỗ trợ");
    requireRoles(request, allowed);
    const row = await prisma.workspaceDocument.findUnique({ where: { storeId_key: { storeId: currentStore(request), key } } });
    return { success: true, data: { value: row?.data ?? null, version: row?.version ?? 0 } };
  });
  app.put("/:storeId/:key", async request => {
    const { key } = z.object({ key: z.string().max(80) }).parse(request.params);
    const allowed = permissions[key];
    if (!allowed) throw new AppError(404, "Loại dữ liệu chưa được hỗ trợ");
    requireRoles(request, allowed);
    const { value, version } = z.object({ value: z.unknown(), version: z.number().int().min(0) }).parse(request.body);
    if (["attendance_logs", "inventory_receipts"].includes(key)) throw new AppError(409, "Dữ liệu này phải được ghi qua nghiệp vụ chuyên dụng");
    validateDocument(value);
    if (value === undefined) throw new AppError(400, "Thiếu dữ liệu");
    const storeId = currentStore(request);
    const result = await command(request, storeId, "WORKSPACE_" + key, async tx => {
      await checkLicense(tx, storeId, key === "attendance_logs" ? "MODULE_ATTENDANCE_HRM" : "CORE_POS");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":document:" + key}))`;
      const current = await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key } } });
      if ((current?.version ?? 0) !== version) throw new AppError(409, "Dữ liệu đã được thiết bị khác cập nhật. Vui lòng tải lại trước khi lưu.", "VERSION_CONFLICT");
      let normalized = value;
      if (key === "reservations_data") {
        if (!Array.isArray(value)) throw new AppError(400, "Danh sách đặt bàn không hợp lệ");
        const old = (current?.data || []) as unknown as Array<Record<string, unknown>>;
        const reservations = z.array(z.object({ id: z.string().min(1).max(100), guestCount: z.number().int().min(1).max(100), status: z.enum(["PENDING", "CONFIRMED", "LATE", "ARRIVED", "NO_SHOW", "CANCELLED"]), depositAmount: z.number().int().min(0).max(1000000000).optional(), depositStatus: z.enum(["PAID", "UNPAID"]).optional() }).passthrough()).max(10000).parse(value);
        if (new Set(reservations.map(r => r.id)).size !== reservations.length) throw new AppError(400, "Lượt đặt bàn bị trùng ID");
        for (const row of value as Array<Record<string, unknown>>) {
          const previous = old.find(r => r.id === row.id);
          if (row.status === "ARRIVED" && previous?.status !== "ARRIVED") throw new AppError(409, "Đón khách qua thao tác mở bàn");
          if (row.depositResolution === "VOUCHER_CREDIT" && previous?.depositResolution !== "VOUCHER_CREDIT") throw new AppError(409, "Bảo lưu cọc bằng voucher chưa được hỗ trợ");
          if (request.principal!.role === "WAITER" && (Number(row.depositAmount || 0) !== Number(previous?.depositAmount || 0) || String(row.depositStatus || "UNPAID") !== String(previous?.depositStatus || "UNPAID") || row.depositResolution !== previous?.depositResolution)) throw new AppError(403, "Chỉ chủ quán hoặc thu ngân được xác nhận tiền cọc");
        }
        if (old.some(r => r.status === "ARRIVED" && !(value as Array<Record<string, unknown>>).some(row => row.id === r.id && row.status === "ARRIVED"))) throw new AppError(409, "Không thể xóa hoặc đổi trạng thái lượt khách đang tại quán");
      }
      if (key === "promotions_list") {
        const old = validatePromotions(current?.data || []), rows = validatePromotions(value);
        for (const row of rows) row.usedCount = old.find(p => p.id === row.id)?.usedCount || 0;
        if (old.some(p => p.usedCount && !rows.some(row => row.id === p.id && row.code === p.code))) throw new AppError(409, "Không thể xóa hoặc đổi mã khuyến mãi đã sử dụng");
        normalized = rows;
      }
      const data = JSON.parse(JSON.stringify(normalized)) as Prisma.InputJsonValue;
      const row = current ? await tx.workspaceDocument.update({ where: { storeId_key: { storeId, key } }, data: { data, version: { increment: 1 } } }) : await tx.workspaceDocument.create({ data: { storeId, key, data } });
      return { version: row.version, value: row.data };
    });
    emitToStore(storeId, "WORKSPACE_UPDATED", { storeId, key, version: result.version });
    return { success: true, data: result };
  });
};
