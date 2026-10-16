import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { Prisma } from "@prisma/client";
import { transaction } from "../database/prismaClient.js";
import type { Transaction } from "../../types/security.js";
import { AppError } from "./errors.js";

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export async function command<T>(request: FastifyRequest, storeId: string, operation: string, run: (tx: Transaction) => Promise<T>): Promise<T> {
  const key = request.headers["x-idempotency-key"];
  if (typeof key !== "string" || key.length < 8 || key.length > 128) throw new AppError(400, "Thiếu mã chống xử lý trùng hợp lệ", "IDEMPOTENCY_REQUIRED");
  const actorId = request.principal?.userId || `guest:${request.ip}:${String(request.headers["x-client-id"] || "").slice(0, 80)}`;
  const id = createHash("sha256").update(`${storeId}:${actorId}:${operation}:${key}`).digest("hex");
  const requestHash = createHash("sha256").update(canonicalJson({ params: request.params, body: request.body })).digest("hex");
  return transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const existing = await tx.idempotentCommand.findUnique({ where: { id } });
    if (existing) {
      if (existing.requestHash !== requestHash) throw new AppError(409, "Mã chống trùng đã dùng cho yêu cầu khác", "IDEMPOTENCY_CONFLICT");
      return existing.response as T;
    }
    const result = await run(tx);
    const response = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
    await tx.idempotentCommand.create({ data: { id, storeId, actorId, operation, requestHash, response } });
    if (request.principal?.kind === "staff") {
      const fields = result && typeof result === "object" ? Object.fromEntries(Object.entries(result).filter(([key]) => ["itemId", "orderId", "billId", "tableId", "reason"].includes(key))) : {};
      await tx.auditLog.create({ data: { storeId, staffId: request.principal.userId, action: operation, details: JSON.stringify({ requestId: request.id, resource: request.params, ...Object.fromEntries(Object.entries((request.body || {}) as Record<string, unknown>).filter(([key]) => ["billId", "itemId", "reason", "partIndex"].includes(key))), ...fields }) } });
    }
    return response as T;
  });
}
