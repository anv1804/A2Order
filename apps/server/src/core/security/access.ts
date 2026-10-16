import type { FastifyInstance, FastifyRequest } from "fastify";
import { UserRole } from "@a2order/shared";
import { prisma, databaseScope, systemQuery } from "../database/prismaClient.js";
import type { Principal } from "../../types/security.js";
import { AppError } from "./errors.js";

const rateWindows = new Map<string, { count: number; until: number }>();
const owners = ["STORE_OWNER"];
const money = ["STORE_OWNER", "CASHIER", "ACCOUNTANT"];
const service = ["STORE_OWNER", "CASHIER", "WAITER"];

export function limitAttempts(key: string, max = 30, windowMs = 60000) {
  const isDev = process.env.NODE_ENV !== "production" || key.includes("127.0.0.1") || key.includes("::1");
  const effectiveMax = isDev ? Math.max(max * 10, 500) : max;
  const effectiveWindowMs = isDev ? Math.min(windowMs, 10000) : windowMs;

  const now = Date.now();
  if (rateWindows.size > 10000) for (const [id, row] of rateWindows) if (row.until <= now) rateWindows.delete(id);
  const previous = rateWindows.get(key);
  if (!previous && rateWindows.size >= 20000) throw new AppError(429, "Máy chủ đang bận, vui lòng thử lại sau");
  const row = previous && previous.until > now ? previous : { count: 0, until: now + effectiveWindowMs };
  row.count++;
  rateWindows.set(key, row);
  if (row.count > effectiveMax) throw new AppError(429, "Thao tác quá nhanh. Vui lòng thử lại sau.", "RATE_LIMITED");
}

export async function verifyPrincipal(app: FastifyInstance, token: string): Promise<Principal> {
  let decoded: Principal;
  try { decoded = app.jwt.verify<Principal>(token); } catch { throw new AppError(401, "Phiên đăng nhập không hợp lệ", "UNAUTHORIZED"); }
  if (decoded.kind === "staff") {
    const staff = await systemQuery(() => prisma.staff.findUnique({ where: { id: decoded.userId } }));
    if (!staff?.isActive || staff.sessionVersion !== decoded.sessionVersion) throw new AppError(401, "Phiên đăng nhập đã bị thu hồi", "UNAUTHORIZED");
    if (!Object.values(UserRole).includes(staff.role as UserRole)) throw new AppError(403, "Vai trò không được hỗ trợ");
    return { ...decoded, storeId: staff.storeId, role: staff.role };
  }
  if (decoded.kind === "customer") {
    const session = await systemQuery(() => prisma.orderSession.findFirst({ where: { id: decoded.sessionId, storeId: decoded.storeId, tableId: decoded.tableId, status: "ACTIVE" } }));
    if (!session) throw new AppError(401, "Phiên bàn đã kết thúc", "SESSION_CLOSED");
    return decoded;
  }
  throw new AppError(401, "Loại phiên không hợp lệ", "UNAUTHORIZED");
}

export function requireRoles(request: FastifyRequest, allowed: string[]) {
  if (!request.principal || request.principal.kind !== "staff" || !allowed.includes(request.principal.role)) throw new AppError(403, "Bạn không có quyền thực hiện thao tác này", "FORBIDDEN");
}

export function currentStore(request: FastifyRequest): string {
  if (!request.principal) throw new AppError(401, "Vui lòng đăng nhập", "UNAUTHORIZED");
  return request.principal.storeId;
}

export function registerAccess(app: FastifyInstance) {
  app.decorateRequest("principal", null);
  app.addHook("onRequest", (_request, _reply, done) => databaseScope.run({ storeId: "", role: "PUBLIC", system: false }, done));
  app.addHook("preHandler", async request => {
    const path = request.url.split("?")[0].replace(/\/$/, "");
    const route = request.routeOptions.url || "";
    const method = request.method;
    if (method === "OPTIONS") return;
    limitAttempts(`${request.ip}:general`, 600);
    const isLogin = path.startsWith("/api/auth/login-");
    const isLocal = process.env.NODE_ENV !== "production" || request.ip === "127.0.0.1" || request.ip === "::1";
    if (isLogin) limitAttempts(`${request.ip}:login`, isLocal ? 300 : 60);
    if (path.includes("unlock-pin")) limitAttempts(`${request.ip}:${(request.params as { storeId?: string }).storeId}:pin`, isLocal ? 300 : 30, 300000);
    if (path === "/api/billing/webhook/payment") return;
    const authorization = request.headers.authorization;
    if (authorization?.startsWith("Bearer ")) request.principal = await verifyPrincipal(app, authorization.slice(7));
    const publicRoute = ["/health", "/ready", "/api/auth/password-reset-request"].includes(path) || isLogin ||
      (method === "GET" && (route.includes("/auth/staff/") || route.includes("/landing/public/") || route.endsWith("/session/:tableCode"))) ||
      (method === "POST" && (route.endsWith("/session/request") || route.endsWith("/session/unlock-pin")));
    const scope = databaseScope.getStore()!;
    if (publicRoute) {
      Object.assign(scope, { storeId: (request.params as { storeId?: string })?.storeId || "", role: "PUBLIC", system: true });
      return;
    }
    const principal = request.principal;
    if (!principal) throw new AppError(401, "Vui lòng đăng nhập", "UNAUTHORIZED");
    const isAdmin = principal.kind === "staff" && principal.role === "SUPER_ADMIN";
    const params = request.params as Record<string, string>;
    const body = (request.body || {}) as Record<string, unknown>;
    const query = (request.query || {}) as Record<string, string>;
    for (const storeId of [params.storeId, body.storeId, query.storeId]) {
      if (storeId && storeId !== "ALL" && storeId !== principal.storeId && !isAdmin) throw new AppError(403, "Không có quyền truy cập cửa hàng này", "TENANT_MISMATCH");
      if (storeId === "ALL" && !isAdmin) throw new AppError(403, "Không có quyền truy cập toàn hệ thống");
    }
    Object.assign(scope, { storeId: principal.storeId, role: principal.role, system: isAdmin });
    if (principal.kind === "customer") {
      const allowed = (path === "/api/orders/submit" && method === "POST") || route.endsWith("/cancel-item") || route.endsWith("/service-request") || route.endsWith("/customer-snapshot");
      if (!allowed) throw new AppError(403, "Phiên khách không có quyền truy cập", "FORBIDDEN");
      if (body.tableId && body.tableId !== principal.tableId) throw new AppError(403, "Sai phiên bàn", "TENANT_MISMATCH");
      return;
    }
    if (path === "/api/auth/me" || path === "/api/auth/logout") return;
    const platformRoute = path.startsWith("/api/config") || path === "/api/stores" || path.startsWith("/api/stores/telemetry") || path === "/api/stores/audit/system" ||
      (path.startsWith("/api/licenses") && !route.endsWith("/:storeId/info") && !["/api/licenses/calculate-pricing", "/api/licenses/invoice/create"].includes(path));
    if (["/api/licenses/calculate-pricing", "/api/licenses/invoice/create"].includes(path)) { requireRoles(request, ["SUPER_ADMIN", "STORE_OWNER"]); return; }
    if (platformRoute) { requireRoles(request, ["SUPER_ADMIN"]); return; }
    if (isAdmin) {
      if (path.startsWith("/api/orders") || path.startsWith("/api/billing") || path.startsWith("/api/analytics") || path.startsWith("/api/workspace")) throw new AppError(403, "Dữ liệu vận hành riêng tư của cửa hàng");
      return;
    }
    if (path.startsWith("/api/billing")) requireRoles(request, method === "GET" ? money : ["STORE_OWNER", "CASHIER"]);
    else if (path.startsWith("/api/analytics")) requireRoles(request, money);
    else if (path.startsWith("/api/staff")) requireRoles(request, owners);
    else if (path.startsWith("/api/landing") || (path.startsWith("/api/stores") && method !== "GET")) requireRoles(request, owners);
    else if (path.startsWith("/api/menu") && method !== "GET") requireRoles(request, route.endsWith("/stock") ? ["STORE_OWNER", "CHEF"] : owners);
    else if (route.includes("/kds/") || route.endsWith("/items/:itemId/status")) requireRoles(request, ["STORE_OWNER", "CHEF", "WAITER", "CASHIER"]);
    else if (path.startsWith("/api/tables") && method !== "GET") requireRoles(request, route.includes("/session/") || route.endsWith("/service-request") ? service : owners);
    else if (path.startsWith("/api/orders") && method !== "GET") requireRoles(request, service);
  });
}
