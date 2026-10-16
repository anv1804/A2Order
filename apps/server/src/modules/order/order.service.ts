import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { OrderInputSchema, MoneySchema, AdjustmentSchema, calculateBillAmount } from "@a2order/shared";
import type { DishVariantOption, DishCustomizationGroup, OperationalTable } from "@a2order/shared";
import type { Transaction, Principal } from "../../types/security.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { prisma } from "../../core/database/prismaClient.js";
import { takePromotion, releasePromotion, promotionDiscount } from "../promotion/promotion.service.js";
import { PromotionSchema } from "@a2order/shared";

export async function checkLicense(tx: Transaction, storeId: string, module = "CORE_POS") {
  const store = requireValue(await tx.store.findUnique({ where: { id: storeId }, include: { license: true } }), "Cửa hàng không tồn tại");
  const license = store.license;
  if (store.status === "SUSPENDED" || !license || !["ACTIVE", "EXPIRING_SOON"].includes(license.status) || license.endDate <= new Date()) throw new AppError(402, "Bản quyền cửa hàng đã hết hạn hoặc bị khóa", "LICENSE_EXPIRED");
  if (!license.enabledModules.split(",").includes(module)) throw new AppError(403, "Gói hiện tại chưa có tính năng này", "MODULE_REQUIRED");
  return store;
}

export async function lockTable(tx: Transaction, storeId: string, tableId: string) {
  await tx.$queryRaw`SELECT id FROM "Table" WHERE id = ${tableId} AND "storeId" = ${storeId} FOR UPDATE`;
  return requireValue(await tx.table.findFirst({ where: { id: tableId, storeId, archivedAt: null }, include: { zone: true } }), "Bàn không tồn tại");
}

export async function openSession(tx: Transaction, storeId: string, tableId: string, guestCount = 2) {
  const store = await checkLicense(tx, storeId);
  const table = await lockTable(tx, storeId, tableId);
  const active = await tx.orderSession.findFirst({ where: { storeId, tableId, status: "ACTIVE" } });
  if (active) return { table, session: active };
  if (table.status !== "EMPTY") throw new AppError(409, "Bàn chưa sẵn sàng mở phiên mới");
  const session = await tx.orderSession.create({ data: { storeId, tableId, guestCount, status: "ACTIVE" } });
  await tx.table.update({ where: { id_storeId: { id: tableId, storeId } }, data: { currentSessionId: session.id, status: "OCCUPIED" } });
  await tx.serviceRequest.updateMany({ where: { storeId, tableId, type: "SESSION", status: "PENDING" }, data: { status: "APPROVED", sessionId: session.id } });
  return { table, session, store };
}

export async function closeEmptySession(tx: Transaction, storeId: string, tableId: string) {
  const table = await lockTable(tx, storeId, tableId);
  const session = await tx.orderSession.findFirst({ where: { storeId, tableId, status: "ACTIVE" }, include: { batches: { include: { items: true } } } });
  const liveItems = session?.batches.flatMap(b => b.status === "REJECTED" ? [] : b.items).filter(i => i.status !== "CANCELLED") || [];
  if (liveItems.length) throw new AppError(409, "Bàn còn món chưa thanh toán. Vui lòng thanh toán trước.", "UNPAID_SESSION");
  if (session) await tx.orderSession.update({ where: { id: session.id }, data: { status: "COMPLETED", checkOutAt: new Date() } });
  await tx.table.update({ where: { id_storeId: { id: tableId, storeId } }, data: { status: "EMPTY", currentSessionId: null, qrSecret: randomUUID() } });
  return { tableId, tableName: table.name, sessionId: session?.id };
}

export async function submitBatch(tx: Transaction, principal: Principal, body: unknown) {
  const input = OrderInputSchema.parse(body);
  if (input.storeId !== principal.storeId) throw new AppError(403, "Sai cửa hàng");
  await checkLicense(tx, input.storeId, principal.kind === "customer" ? "MODULE_QR_ORDER" : "CORE_POS");
  const table = await lockTable(tx, input.storeId, input.tableId);
  let session = await tx.orderSession.findFirst({ where: { storeId: input.storeId, tableId: table.id, status: "ACTIVE" } });
  if (!session && principal.kind === "staff") session = (await openSession(tx, input.storeId, table.id)).session;
  session = requireValue(session, "Phiên bàn chưa được mở");
  if (principal.kind === "customer" && (principal.sessionId !== session.id || principal.tableId !== table.id)) throw new AppError(403, "Sai phiên bàn");
  if (input.voucherCode && await tx.orderBatch.findFirst({ where: { orderSessionId: session.id, voucherCode: { not: null }, discountAmount: { gt: 0 } } })) throw new AppError(409, "Phiên bàn đã sử dụng khuyến mãi");
  if (await tx.bill.findFirst({ where: { orderSessionId: session.id, paymentStatus: "PENDING" } })) throw new AppError(409, "Bàn đang chờ thanh toán; vui lòng liên hệ thu ngân");
  const dishes = await tx.menuItem.findMany({ where: { storeId: input.storeId, id: { in: input.items.map(i => i.dishId) }, archivedAt: null } });
  const createdItems: Prisma.OrderItemCreateWithoutOrderBatchInput[] = [];
  for (const item of input.items) {
    const dish = requireValue(dishes.find(d => d.id === item.dishId && d.isAvailable), "Món không tồn tại hoặc đã hết hàng");
    let price = dish.price;
    const labels: string[] = [];
    if (Array.isArray(dish.variants) && dish.variants.length && !item.variantId) throw new AppError(400, "Vui lòng chọn biến thể món");
    if (item.variantId) {
      const variant = requireValue((dish.variants as unknown as DishVariantOption[]).find(v => v.id === item.variantId), "Biến thể không hợp lệ");
      price = variant.price;
      labels.push(variant.name);
    }
    const selected = new Set(item.customizationIds);
    let matched = 0;
    for (const group of dish.customizationGroups as unknown as DishCustomizationGroup[]) {
      const options = group.options.filter(o => selected.has(o.id));
      const minimum = group.minSelect ?? (group.required ? 1 : 0);
      const maximum = group.maxSelect ?? (group.type === "SINGLE" ? 1 : group.options.length);
      if (options.length < minimum || options.length > maximum) throw new AppError(400, `Tùy chọn ${group.name} không hợp lệ`);
      for (const option of options) { price += option.priceModifier || 0; labels.push(option.name); matched++; }
    }
    if (matched !== selected.size) throw new AppError(400, "Tùy chọn món không hợp lệ");
    MoneySchema.parse(price * item.quantity);
    if (dish.stockCount !== null) {
      const reserved = await tx.menuItem.updateMany({ where: { id: dish.id, storeId: input.storeId, isAvailable: true, stockCount: { gte: item.quantity } }, data: { stockCount: { decrement: item.quantity } } });
      if (reserved.count !== 1) throw new AppError(409, `Không đủ số lượng món ${dish.name}`, "OUT_OF_STOCK");
    }
    createdItems.push({ menuItem: { connect: { id: dish.id } }, quantity: item.quantity, price, nameSnapshot: dish.name, costSnapshot: dish.costPrice, station: dish.station, notes: [labels.join(", "), item.notes].filter(Boolean).join(" · "), optionSnapshot: labels, status: principal.kind === "customer" ? "PENDING_APPROVAL" : "QUEUED" });
  }
  const batchNumber = await tx.orderBatch.count({ where: { orderSessionId: session.id } }) + 1;
  const subtotal = MoneySchema.parse(createdItems.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0));
  const offer = input.voucherCode ? await takePromotion(tx, input.storeId, input.voucherCode, subtotal) : null;
  const batch = await tx.orderBatch.create({ data: { orderSessionId: session.id, batchNumber, isCustomerQr: principal.kind === "customer", customerPhone: input.customerPhone, voucherCode: offer?.promotion.code, discountAmount: offer?.discountAmount || 0, promotionSnapshot: offer ? offer.promotion as unknown as Prisma.InputJsonValue : {}, status: principal.kind === "customer" ? "PENDING_APPROVAL" : "APPROVED", items: { create: createdItems } }, include: batchInclude });
  if (batch.status === "APPROVED") await tx.table.update({ where: { id: table.id }, data: { status: "WAITING_FOOD" } });
  return orderDto(batch);
}

const batchInclude = { items: { include: { menuItem: { include: { category: true } } } }, orderSession: { include: { table: true } } } satisfies Prisma.OrderBatchInclude;

export function orderDto(batch: Prisma.OrderBatchGetPayload<{ include: typeof batchInclude }>) {
  const session = batch.orderSession;
  const items = batch.items.map(i => ({ id: i.id, dishId: i.menuItemId, name: i.nameSnapshot || i.menuItem.name, price: i.price, quantity: i.quantity, notes: i.notes || "", category: i.menuItem.category.name, station: i.station, status: i.status }));
  const totalAmount = items.filter(i => i.status !== "CANCELLED").reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { orderId: batch.id, storeId: session.storeId, sessionId: session.id, tableId: session.tableId, tableCode: session.table.code || "", tableName: session.table.name, items, totalAmount, discountAmount: batch.discountAmount, voucherCode: batch.voucherCode, finalAmount: Math.max(0, totalAmount - batch.discountAmount), submittedAt: batch.createdAt.getTime(), status: batch.status, batchNumber: batch.batchNumber };
}

export async function changeBatch(tx: Transaction, storeId: string, orderId: string, action: "APPROVED" | "REJECTED", reason?: string) {
  const batch = requireValue(await tx.orderBatch.findFirst({ where: { id: orderId, orderSession: { storeId, status: "ACTIVE" } }, include: batchInclude }));
  await lockTable(tx, storeId, batch.orderSession.tableId);
  if (batch.status === action) return orderDto(batch);
  if (batch.status !== "PENDING_APPROVAL") throw new AppError(409, "Đơn đã được xử lý");
  if (action === "APPROVED") await checkLicense(tx, storeId);
  for (const item of batch.items.filter(i => i.status === "PENDING_APPROVAL")) {
    if (action === "REJECTED" && item.menuItem.stockCount !== null) await tx.menuItem.update({ where: { id: item.menuItemId }, data: { stockCount: { increment: item.quantity } } });
    await tx.orderItem.update({ where: { id: item.id }, data: { status: action === "APPROVED" ? "QUEUED" : "CANCELLED" } });
  }
  if (action === "REJECTED" && batch.voucherCode && batch.discountAmount) await releasePromotion(tx, storeId, batch.voucherCode);
  await tx.orderBatch.update({ where: { id: batch.id }, data: { status: action, rejectionReason: reason, ...(action === "REJECTED" ? { discountAmount: 0 } : {}) } });
  if (action === "APPROVED") await tx.table.update({ where: { id: batch.orderSession.tableId }, data: { status: "WAITING_FOOD" } });
  return orderDto(requireValue(await tx.orderBatch.findUnique({ where: { id: batch.id }, include: batchInclude })));
}

export async function cancelItem(tx: Transaction, principal: Principal, itemId: string, reason?: string) {
  const item = requireValue(await tx.orderItem.findFirst({ where: { id: itemId, orderBatch: { orderSession: { storeId: principal.storeId, status: "ACTIVE", ...(principal.kind === "customer" ? { id: principal.sessionId } : {}) } } }, include: { menuItem: true, orderBatch: { include: { orderSession: true } } } }));
  await lockTable(tx, principal.storeId, item.orderBatch.orderSession.tableId);
  if (item.status === "CANCELLED") return { itemId, sessionId: item.orderBatch.orderSessionId, orderId: item.orderBatchId, tableId: item.orderBatch.orderSession.tableId };
  if (principal.kind === "customer" && item.status !== "PENDING_APPROVAL") throw new AppError(409, "Món đã được bếp tiếp nhận, không thể tự hủy");
  const paidBills = await tx.bill.findMany({ where: { orderSessionId: item.orderBatch.orderSessionId, paymentStatus: "PAID" } });
  if (paidBills.length) throw new AppError(409, "Phiên đã thu một phần; cần xử lý hoàn tiền có đối soát trước khi hủy món");
  if (paidBills.some(b => (b.lineSnapshot as unknown as Array<{ id: string }>).some(line => line.id === item.id))) throw new AppError(409, "Món đã được thanh toán, không thể hủy trực tiếp");
  if (!["PENDING_APPROVAL", "QUEUED"].includes(item.status) && (principal.role !== "STORE_OWNER" || !reason?.trim())) throw new AppError(403, "Hủy món đang làm cần quyền chủ quán và lý do");
  if (await tx.bill.findFirst({ where: { orderSessionId: item.orderBatch.orderSessionId, paymentStatus: "PENDING" } })) throw new AppError(409, "Bàn đang chờ thanh toán");
  if (["PENDING_APPROVAL", "QUEUED"].includes(item.status) && item.menuItem.stockCount !== null) await tx.menuItem.update({ where: { id: item.menuItemId }, data: { stockCount: { increment: item.quantity } } });
  await tx.orderItem.update({ where: { id: item.id }, data: { status: "CANCELLED" } });
  if (item.orderBatch.voucherCode && item.orderBatch.discountAmount) {
    const remaining = await tx.orderItem.findMany({ where: { orderBatchId: item.orderBatchId, status: { not: "CANCELLED" } } });
    const subtotal = remaining.reduce((sum, row) => sum + row.price * row.quantity, 0);
    const discountAmount = promotionDiscount(PromotionSchema.parse(item.orderBatch.promotionSnapshot), subtotal);
    if (!discountAmount) await releasePromotion(tx, principal.storeId, item.orderBatch.voucherCode);
    await tx.orderBatch.update({ where: { id: item.orderBatchId }, data: { discountAmount } });
  }
  return { itemId, sessionId: item.orderBatch.orderSessionId, orderId: item.orderBatchId, tableId: item.orderBatch.orderSession.tableId, dishName: item.nameSnapshot, reason };
}

export async function tableSnapshot(storeId: string): Promise<OperationalTable[]> {
  const store = requireValue(await prisma.store.findUnique({ where: { id: storeId } }));
  const tables = await prisma.table.findMany({ where: { storeId, archivedAt: null }, include: { zone: true, orderSessions: { where: { status: "ACTIVE" }, include: { bills: { where: { paymentStatus: { in: ["PAID", "PENDING"] } }, include: { payments: true } }, batches: { where: { status: "APPROVED" }, include: { items: { include: { menuItem: true } } }, orderBy: { createdAt: "asc" } } } } }, orderBy: { name: "asc" } });
  return tables.map(table => {
    const session = table.orderSessions[0];
    const adjustment = AdjustmentSchema.parse(session?.adjustments || {});
    const subtotal = session?.batches.flatMap(b => b.items).filter(i => i.status !== "CANCELLED").reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
    const voucherDiscount = session?.batches.reduce((sum, b) => sum + b.discountAmount, 0) || 0;
    const totals = calculateBillAmount(subtotal, voucherDiscount ? { ...adjustment, discountPercent: 0, fixedDiscount: voucherDiscount } : adjustment, store.vatRate);
    const balanceAmount = Math.max(0, totals.finalAmount - (session?.bills.reduce((sum, b) => sum + (b.payments.length ? b.payments.reduce((paid, payment) => paid + payment.amount, 0) : b.paymentStatus === "PAID" ? b.finalAmount : 0), 0) || 0));
    const remaining = (field: "discountAmount" | "taxAmount" | "surchargeAmount") => Math.max(0, totals[field] - (session?.bills.filter(b => b.paymentStatus === "PAID").reduce((sum, b) => sum + b[field], 0) || 0));
    const paidAmount = session?.bills.filter(b => b.paymentStatus === "PENDING").flatMap(b => b.payments).reduce((sum, p) => sum + p.amount, 0) || 0;
    const paid = new Map<string, number>();
    for (const bill of session?.bills.filter(b => b.paymentStatus === "PAID") || []) for (const line of bill.lineSnapshot as unknown as Array<{id:string;quantity:number}>) paid.set(line.id, (paid.get(line.id) || 0) + line.quantity);
    const items = session?.batches.flatMap(batch => batch.items.filter(i => i.status !== "CANCELLED").map(i => ({ id: i.id, dishId: i.menuItemId, name: i.nameSnapshot || i.menuItem.name, price: i.price, quantity: Math.max(0, i.quantity - (paid.get(i.id) || 0)), notes: i.notes || "", status: i.status === "QUEUED" ? "WAITING" : i.status === "DONE" ? "READY" : i.status, station: i.station, round: batch.batchNumber, orderId: batch.id, orderedAt: i.createdAt.toISOString() }))).filter(i => i.quantity > 0) || [];
    return { tableId: table.id, tableName: table.name, tableCode: table.code || "", zoneName: table.zone.name, sessionId: session?.id, guestCount: session?.guestCount || 0, openedAt: session?.checkInAt.toISOString(), openedAtMs: session?.checkInAt.getTime(), status: session ? table.status : "EMPTY", adjustment, discountAmount: remaining("discountAmount"), taxAmount: remaining("taxAmount"), surchargeAmount: remaining("surchargeAmount"), paidAmount, balanceAmount: session ? balanceAmount : 0, pendingBillId: session?.bills.find(b => b.paymentStatus === "PENDING")?.id, items, totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0) };
  });
}

export async function pendingOrders(storeId: string) {
  return (await prisma.orderBatch.findMany({ where: { status: "PENDING_APPROVAL", orderSession: { storeId, status: "ACTIVE" } }, include: batchInclude, orderBy: { createdAt: "asc" } })).map(orderDto);
}

export async function customerOrders(principal: Principal) {
  return (await prisma.orderBatch.findMany({ where: { orderSessionId: principal.sessionId, orderSession: { storeId: principal.storeId, tableId: principal.tableId, status: "ACTIVE" } }, include: batchInclude, orderBy: { createdAt: "asc" } })).map(orderDto);
}

export async function transferSession(tx: Transaction, storeId: string, fromTableId: string, toTableId: string, mode: "MOVE" | "MERGE") {
  if (fromTableId === toTableId) throw new AppError(400, "Bàn nguồn và đích phải khác nhau");
  await checkLicense(tx, storeId);
  for (const id of [fromTableId, toTableId].sort()) await lockTable(tx, storeId, id);
  const source = requireValue(await tx.orderSession.findFirst({ where: { storeId, tableId: fromTableId, status: "ACTIVE" } }));
  const target = await tx.orderSession.findFirst({ where: { storeId, tableId: toTableId, status: "ACTIVE" } });
  const ids = [source.id, ...(target ? [target.id] : [])];
  if (await tx.bill.count({ where: { orderSessionId: { in: ids }, paymentStatus: { in: ["PENDING", "PAID"] } } })) throw new AppError(409, "Không chuyển/gộp bàn đã lập hóa đơn hoặc thu tiền");
  if (mode === "MOVE") {
    if (target) throw new AppError(409, "Bàn đích đang có khách");
    await tx.orderSession.update({ where: { id: source.id }, data: { tableId: toTableId } });
    await tx.table.update({ where: { id: toTableId }, data: { currentSessionId: source.id, status: "WAITING_FOOD" } });
  } else {
    if (!target) throw new AppError(409, "Cần mở bàn đích trước khi gộp");
    for (const session of [source, target]) {
      const adjustment = AdjustmentSchema.parse(session.adjustments);
      if (adjustment.discountPercent || adjustment.fixedDiscount || adjustment.surchargeAmount || adjustment.includeVat) throw new AppError(409, "Cần gỡ phụ thu/giảm giá riêng trước khi gộp bàn");
    }
    let round = await tx.orderBatch.count({ where: { orderSessionId: target.id } });
    for (const batch of await tx.orderBatch.findMany({ where: { orderSessionId: source.id }, orderBy: { createdAt: "asc" } })) await tx.orderBatch.update({ where: { id: batch.id }, data: { orderSessionId: target.id, batchNumber: ++round } });
    await tx.orderSession.update({ where: { id: target.id }, data: { guestCount: target.guestCount + source.guestCount } });
    await tx.orderSession.update({ where: { id: source.id }, data: { status: "COMPLETED", checkOutAt: new Date() } });
    await tx.table.update({ where: { id: toTableId }, data: { status: "WAITING_FOOD" } });
  }
  await tx.table.update({ where: { id: fromTableId }, data: { currentSessionId: null, status: "EMPTY", qrSecret: randomUUID() } });
  return { storeId, tableId: fromTableId, toTableId, sessionId: source.id, mode };
}
