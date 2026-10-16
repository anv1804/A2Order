import { MenuCategoryType } from "@a2order/shared";
import type { BillView, DeepAnalyticsReport, MenuItemAnalytics } from "@a2order/shared";
import { prisma } from "../../core/database/prismaClient.js";

export function reportWindow(period: DeepAnalyticsReport["period"], now = new Date()) {
  const offset = 7 * 3600000;
  const local = new Date(now.getTime() + offset);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset;
  const end = new Date(period === "yesterday" ? midnight : midnight + 86400000);
  const start = new Date(period === "yesterday" ? midnight - 86400000 : period === "week" ? midnight - ((local.getUTCDay() + 6) % 7) * 86400000 : period === "month" ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - offset : midnight);
  return { start, end };
}

export async function salesReport(storeId: string, period: DeepAnalyticsReport["period"]) {
  const { start, end } = reportWindow(period);
  const rows = await prisma.bill.findMany({ where: { storeId, paymentStatus: "PAID", paidAt: { gte: start, lt: end } }, include: { payments: true, orderSession: { include: { table: true } } }, orderBy: { paidAt: "desc" } });
  const staff = await prisma.staff.findMany({ where: { storeId, id: { in: rows.map(r => r.cashierId || "") } }, select: { id: true, name: true } });
  const bills = rows.map(row => ({ id: row.id, billCode: row.transactionCode || row.id, tableName: row.orderSession.table.name, cashierName: staff.find(s => s.id === row.cashierId)?.name || "Ngân hàng", shiftName: new Date(row.paidAt!.getTime() + 7 * 3600000).getUTCHours() < 14 ? "CA_SANG" : "CA_TOI", openedAt: row.orderSession.checkInAt.toISOString(), closedAt: row.paidAt!.toISOString(), items: (row.lineSnapshot as unknown as BillView["items"]).map(i => ({ id: i.id, name: i.name, quantity: i.quantity, unitPrice: i.price, totalPrice: i.price * i.quantity, notes: i.notes })), subTotal: row.totalAmount, discountAmount: row.discountAmount, vatAmount: row.taxAmount, surchargeAmount: row.surchargeAmount, finalAmount: row.finalAmount, paymentMethod: row.paymentMethod, status: "COMPLETED", vietQrRef: row.payments.find(p => p.transactionRef)?.transactionRef }));
  const audit = await prisma.auditLog.findMany({ where: { storeId, action: "ORDER_CANCEL_ITEM", createdAt: { gte: start, lt: end } }, include: { staff: { select: { name: true } } } });
  const cancelledIds = audit.map(row => { try { return JSON.parse(row.details || "{}").itemId as string; } catch { return ""; } }).filter(Boolean);
  const allLineIds = rows.flatMap(row => (row.lineSnapshot as unknown as BillView["items"]).map(i => i.id));
  const items = await prisma.orderItem.findMany({ where: { id: { in: [...allLineIds, ...cancelledIds] }, orderBatch: { orderSession: { storeId } } }, include: { orderBatch: { include: { orderSession: { include: { table: true } } } } } });
  const canceledItems = audit.flatMap(log => {
    let data: { itemId?: string; reason?: string };
    try { data = JSON.parse(log.details || "{}"); } catch { return []; }
    const item = items.find(i => i.id === data.itemId);
    return item ? [{ id: log.id, dishName: item.nameSnapshot, quantity: item.quantity, price: item.price, canceledAt: log.createdAt.toISOString(), tableName: item.orderBatch.orderSession.table.name, canceledBy: log.staff?.name || "", reason: data.reason || "Hủy món chờ", type: "CANCEL_WAITING" }] : [];
  });
  const totalRevenue = rows.reduce((sum, row) => sum + row.finalAmount, 0);
  const products = new Map<string, { name: string; sold: number; revenue: number; cost: number }>();
  for (const row of rows) for (const line of row.lineSnapshot as unknown as BillView["items"]) {
    const item = items.find(i => i.id === line.id);
    if (!item) continue;
    const current = products.get(item.menuItemId) || { name: line.name, sold: 0, revenue: 0, cost: 0 };
    current.sold += line.quantity; current.revenue += line.price * line.quantity; current.cost += item.costSnapshot * line.quantity;
    products.set(item.menuItemId, current);
  }
  const averageSold = products.size ? [...products.values()].reduce((s, p) => s + p.sold, 0) / products.size : 0;
  const averageMargin = products.size ? [...products.values()].reduce((s, p) => s + (p.revenue ? (p.revenue - p.cost) / p.revenue : 0), 0) / products.size : 0;
  const matrix: MenuItemAnalytics[] = [...products].map(([id, p]) => {
    const margin = p.revenue ? (p.revenue - p.cost) / p.revenue : 0;
    const categoryType = p.sold >= averageSold ? margin >= averageMargin ? MenuCategoryType.STARS : MenuCategoryType.PLOWHORSES : margin >= averageMargin ? MenuCategoryType.PUZZLES : MenuCategoryType.DOGS;
    return { id, name: p.name, price: Math.round(p.revenue / p.sold), costPrice: Math.round(p.cost / p.sold), marginPercent: Math.round(margin * 100), totalSold: p.sold, revenue: p.revenue, categoryType, advice: "Đối chiếu thêm giá vốn thực tế trước khi điều chỉnh menu" };
  });
  const hourlyHeatmap = Array.from({ length: 24 }, (_, hour) => {
    const matching = rows.filter(r => new Date(r.paidAt!.getTime() + 7 * 3600000).getUTCHours() === hour);
    return { hourLabel: String(hour).padStart(2, "0") + ":00", revenue: matching.reduce((s, r) => s + r.finalAmount, 0), orderCount: matching.length, isPeak: matching.length > rows.length / 24 && matching.length > 0 };
  });
  const report: DeepAnalyticsReport = { period, summary: { totalRevenue, totalOrders: rows.length, averageOrderValue: rows.length ? Math.round(totalRevenue / rows.length) : 0, discountLossTotal: rows.reduce((s, r) => s + r.discountAmount, 0), canceledItemCount: canceledItems.length }, hourlyHeatmap, paymentDistribution: (["CASH", "VIETQR", "CARD"] as const).map(method => { const payments = rows.flatMap(r => r.payments).filter(p => p.method === method); const totalAmount = payments.reduce((s, p) => s + p.amount, 0); return { method, label: method === "CASH" ? "Tiền mặt" : method === "VIETQR" ? "Chuyển khoản" : "Thẻ", totalAmount, transactionCount: payments.length, percentage: totalRevenue ? Math.round(totalAmount / totalRevenue * 100) : 0 }; }), menuMatrix: { stars: matrix.filter(i => i.categoryType === MenuCategoryType.STARS), plowhorses: matrix.filter(i => i.categoryType === MenuCategoryType.PLOWHORSES), puzzles: matrix.filter(i => i.categoryType === MenuCategoryType.PUZZLES), dogs: matrix.filter(i => i.categoryType === MenuCategoryType.DOGS) } };
  return { ...report, report, bills: bills.map((bill, index) => ({ ...bill, payments: rows[index].payments.map(p => ({ method: p.method, amount: p.amount })) })), canceledItems, recognizedAt: "bill_fully_paid" };
}
