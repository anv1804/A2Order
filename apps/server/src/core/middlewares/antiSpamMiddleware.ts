import { FastifyRequest, FastifyReply } from "fastify";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Cấu hình mặc định (CMS / Admin có thể ghi đè sau này)
export const defaultRateLimitConfig: Record<string, RateLimitConfig> = {
  order: { windowMs: 60 * 1000, maxRequests: 20 },
  billing: { windowMs: 60 * 1000, maxRequests: 10 },
  general: { windowMs: 60 * 1000, maxRequests: 60 },
};

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const idempotencyStore = new Map<string, { response: unknown; expiresAt: number }>();

export async function antiSpamMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  category: "order" | "billing" | "general" = "general"
) {
  const clientIp = request.ip || "unknown";
  const storeId = (request.headers["x-store-id"] as string) || "global";
  const rateLimitKey = `${storeId}:${clientIp}:${category}`;

  const now = Date.now();
  const config = defaultRateLimitConfig[category] || defaultRateLimitConfig.general;

  // 1. Kiểm tra Rate Limiting
  const currentRecord = requestCounts.get(rateLimitKey);
  if (!currentRecord || now > currentRecord.resetAt) {
    requestCounts.set(rateLimitKey, { count: 1, resetAt: now + config.windowMs });
  } else {
    currentRecord.count += 1;
    if (currentRecord.count > config.maxRequests) {
      reply.status(429).send({
        success: false,
        error: "RATE_LIMITED",
        message: "Hệ thống phát hiện thao tác bất thường. Vui lòng chờ 30 giây!",
      });
      return;
    }
  }

  // 2. Kiểm tra Idempotency Key (Chống gửi trùng đơn/trùng bill)
  const idempotencyKey = request.headers["x-idempotency-key"] as string;
  if (idempotencyKey) {
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached && now < cached.expiresAt) {
      reply.status(200).send(cached.response);
      return;
    }
  }
}

export function cacheIdempotentResponse(idempotencyKey: string, response: unknown, ttlMs: number = 60000) {
  idempotencyStore.set(idempotencyKey, {
    response,
    expiresAt: Date.now() + ttlMs,
  });
}
