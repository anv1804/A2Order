import { randomUUID } from "node:crypto";
import type { Prisma, Bill, Store, Payment } from "@prisma/client";
import { AdjustmentSchema, calculateBillAmount } from "@a2order/shared";
import type { BillView } from "@a2order/shared";
import type { Transaction } from "../../types/security.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { lockTable } from "../order/order.service.js";

export function billView(bill: Bill & { payments: Payment[] }, store: Store, table: { id: string; name: string }): BillView {
  const transferContent = bill.transactionCode || ("A2O" + bill.id.replace(/-/g, "").slice(0, 20)).toUpperCase();
  const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
  const shares = Array.from({ length: bill.splitCount }, (_, i) => Math.floor(bill.finalAmount / bill.splitCount) + (i < bill.finalAmount % bill.splitCount ? 1 : 0));
  const qrUrl = store.bankBin && store.bankAccount && store.bankOwnerName ? "https://img.vietqr.io/image/" + encodeURIComponent(store.bankBin) + "-" + encodeURIComponent(store.bankAccount) + "-compact2.png?amount=" + (bill.finalAmount - paidAmount) + "&addInfo=" + encodeURIComponent(transferContent) + "&accountName=" + encodeURIComponent(store.bankOwnerName) : undefined;
  return { id: bill.id, billCode: transferContent, storeId: store.id, tableId: table.id, tableName: table.name, totalAmount: bill.totalAmount, discountAmount: bill.discountAmount, taxAmount: bill.taxAmount, surchargeAmount: bill.surchargeAmount, finalAmount: bill.finalAmount, paymentStatus: bill.paymentStatus, items: bill.lineSnapshot as unknown as BillView["items"], qrUrl, transferContent, bankBin: store.bankBin || undefined, bankAccount: store.bankAccount || undefined, bankOwnerName: store.bankOwnerName || undefined, paidAmount, splitCount: bill.splitCount, shares, paidParts: bill.payments.flatMap(p => p.partIndex === null ? [] : [p.partIndex]) };
}

export async function quoteBill(tx: Transaction, storeId: string, tableId: string, rawAdjustment: unknown, splitCount = 1, allocation?: Array<{ itemId: string; quantity: number }>) {
  const table = await lockTable(tx, storeId, tableId);
  const session = requireValue(await tx.orderSession.findFirst({ where: { storeId, tableId, status: "ACTIVE" }, include: { batches: { include: { items: true } } } }), "Bàn chưa có phiên đang phục vụ");
  if (session.batches.some(b => b.status === "PENDING_APPROVAL" && b.items.some(i => i.status !== "CANCELLED"))) throw new AppError(409, "Cần xử lý đơn đang chờ duyệt trước khi thanh toán");
  const adjustment = AdjustmentSchema.parse(rawAdjustment ?? session.adjustments);
  if ((adjustment.discountPercent || adjustment.fixedDiscount) && !adjustment.discountReason) throw new AppError(400, "Cần lý do giảm giá");
  const store = requireValue(await tx.store.findUnique({ where: { id: storeId } }));
  const prior = await tx.bill.findMany({ where: { storeId, orderSessionId: session.id }, include: { payments: true } });
  const paidBills = prior.filter(b => b.paymentStatus === "PAID");
  if (paidBills.length && rawAdjustment && JSON.stringify(AdjustmentSchema.parse(rawAdjustment)) !== JSON.stringify(AdjustmentSchema.parse(session.adjustments))) throw new AppError(409, "Không thể đổi điều chỉnh tiền sau khi đã thu một phần");
  if (!paidBills.length && rawAdjustment) await tx.orderSession.update({ where: { id: session.id }, data: { adjustments: adjustment } });
  const live = prior.find(b => b.paymentStatus === "PENDING");
  if (live?.payments.length) return billView(live, store, table);
  const paidQuantities = new Map<string, number>();
  for (const bill of prior.filter(b => b.paymentStatus === "PAID")) for (const line of bill.lineSnapshot as unknown as BillView["items"]) paidQuantities.set(line.id, (paidQuantities.get(line.id) || 0) + line.quantity);
  const available = session.batches.filter(b => b.status === "APPROVED").flatMap(b => b.items).filter(i => i.status !== "CANCELLED").map(i => ({ id: i.id, name: i.nameSnapshot, quantity: i.quantity - (paidQuantities.get(i.id) || 0), price: i.price, notes: i.notes || "" })).filter(i => i.quantity > 0);
  const items = allocation ? allocation.map(a => {
    const line = requireValue(available.find(i => i.id === a.itemId), "Món không còn số lượng chưa thanh toán");
    if (a.quantity < 1 || a.quantity > line.quantity) throw new AppError(400, "Số lượng tách bill không hợp lệ");
    return { ...line, quantity: a.quantity };
  }) : available;
  if (!items.length) throw new AppError(409, "Bàn không còn món cần thanh toán");
  if (new Set(items.map(i => i.id)).size !== items.length) throw new AppError(400, "Món tách bill bị trùng");
  const fullSubtotal = session.batches.filter(b => b.status === "APPROVED").flatMap(b => b.items).filter(i => i.status !== "CANCELLED").reduce((sum, i) => sum + i.price * i.quantity, 0);
  const voucherDiscount = session.batches.filter(b => b.status === "APPROVED").reduce((sum, b) => sum + b.discountAmount, 0);
  if (voucherDiscount && (adjustment.discountPercent || adjustment.fixedDiscount)) throw new AppError(409, "Không cộng dồn giảm giá thủ công với voucher");
  const full = calculateBillAmount(fullSubtotal, { ...adjustment, fixedDiscount: voucherDiscount || adjustment.fixedDiscount }, store.vatRate);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const remainingSubtotal = fullSubtotal - paidBills.reduce((s, b) => s + b.totalAmount, 0);
  const allocate = (field: "discountAmount" | "taxAmount" | "surchargeAmount") => subtotal === remainingSubtotal ? full[field] - paidBills.reduce((s, b) => s + b[field], 0) : Math.floor(full[field] * subtotal / fullSubtotal);
  const discountAmount = allocate("discountAmount"), taxAmount = allocate("taxAmount"), surchargeAmount = allocate("surchargeAmount");
  const totals = { totalAmount: subtotal, discountAmount, taxAmount, surchargeAmount, finalAmount: subtotal - discountAmount + taxAmount + surchargeAmount };
  const id = live?.id || randomUUID();
  const data = { ...totals, discountPercent: adjustment.discountPercent, discountReason: adjustment.discountReason, includeVat: adjustment.includeVat, splitCount, lineSnapshot: items as Prisma.InputJsonValue, transactionCode: ("A2O" + id.replace(/-/g, "").slice(0, 20)).toUpperCase() };
  const bill = live ? await tx.bill.update({ where: { id: live.id }, data, include: { payments: true } }) : await tx.bill.create({ data: { id, storeId, orderSessionId: session.id, ...data }, include: { payments: true } });
  await tx.table.update({ where: { id: tableId }, data: { status: "PAYMENT_PENDING" } });
  return billView(bill, store, table);
}

export async function settleBill(tx: Transaction, storeId: string, billId: string, method: "CASH" | "VIETQR", actorId: string | null, reference?: string, partIndex?: number, expectedAmount?: number) {
  const initial = requireValue(await tx.bill.findFirst({ where: { id: billId, storeId }, include: { orderSession: true } }));
  const table = await lockTable(tx, storeId, initial.orderSession.tableId);
  const bill = requireValue(await tx.bill.findUnique({ where: { id: billId }, include: { payments: true } }));
  const store = requireValue(await tx.store.findUnique({ where: { id: storeId } }));
  if (bill.paymentStatus === "PAID") {
    if (reference && !bill.payments.some(p => p.transactionRef === reference)) throw new AppError(409, "Hóa đơn đã được thanh toán bằng giao dịch khác", "PAYMENT_MISMATCH");
    return { bill: billView(bill, store, table), sessionId: initial.orderSessionId, closed: initial.orderSession.status === "COMPLETED" };
  }
  if (bill.paymentStatus !== "PENDING") throw new AppError(409, "Hóa đơn không ở trạng thái chờ thanh toán");
  const paidAmount = bill.payments.reduce((s, p) => s + p.amount, 0);
  if (partIndex !== undefined && (!Number.isInteger(partIndex) || partIndex < 0 || partIndex >= bill.splitCount)) throw new AppError(400, "Phần thanh toán không hợp lệ");
  if (partIndex !== undefined && bill.payments.some(p => p.partIndex === partIndex)) return { bill: billView(bill, store, table), sessionId: initial.orderSessionId, closed: false };
  const amount = partIndex === undefined ? bill.finalAmount - paidAmount : Math.floor(bill.finalAmount / bill.splitCount) + (partIndex < bill.finalAmount % bill.splitCount ? 1 : 0);
  if (expectedAmount !== undefined && expectedAmount !== amount) throw new AppError(409, "Số tiền nhận không khớp hóa đơn", "PAYMENT_MISMATCH");
  if (amount < 0 || amount + paidAmount > bill.finalAmount) throw new AppError(409, "Số tiền đã được xử lý");
  await tx.payment.create({ data: { billId, storeId, method, amount, transactionRef: reference, partIndex } });
  const fullyPaid = amount + paidAmount === bill.finalAmount;
  await tx.bill.update({ where: { id: billId }, data: { paymentStatus: fullyPaid ? "PAID" : "PENDING", paidAt: fullyPaid ? new Date() : null, cashierId: actorId, paymentMethod: bill.payments.some(p => p.method !== method) ? "MIXED" : method } });
  let closed = false;
  if (fullyPaid) {
    const remaining = await tx.orderItem.findMany({ where: { status: { not: "CANCELLED" }, orderBatch: { status: "APPROVED", orderSessionId: initial.orderSessionId } } });
    const paidBills = await tx.bill.findMany({ where: { orderSessionId: initial.orderSessionId, paymentStatus: "PAID" } });
    const quantities = new Map<string, number>();
    for (const b of paidBills) for (const line of b.lineSnapshot as unknown as BillView["items"]) quantities.set(line.id, (quantities.get(line.id) || 0) + line.quantity);
    closed = remaining.every(i => (quantities.get(i.id) || 0) >= i.quantity);
    if (closed) {
      await tx.orderSession.update({ where: { id: initial.orderSessionId }, data: { status: "COMPLETED", checkOutAt: new Date() } });
      await tx.table.update({ where: { id: table.id }, data: { status: "EMPTY", currentSessionId: null, qrSecret: randomUUID() } });
    } else await tx.table.update({ where: { id: table.id }, data: { status: "SERVED" } });
  }
  return { bill: billView(requireValue(await tx.bill.findUnique({ where: { id: billId }, include: { payments: true } })), store, table), sessionId: initial.orderSessionId, closed };
}
