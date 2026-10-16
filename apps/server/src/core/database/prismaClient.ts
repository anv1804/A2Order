import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, Prisma } from "@prisma/client";
import type { DatabaseScope, Transaction } from "../../types/security.js";

export const databaseScope = new AsyncLocalStorage<DatabaseScope>();
const client = new PrismaClient({ log: [] });

export async function applyScope(tx: Transaction) {
  const scope = databaseScope.getStore();
  await tx.$executeRaw`SELECT set_config('app.store_id', ${scope?.storeId || ""}, true), set_config('app.role', ${scope?.role || ""}, true), set_config('app.system', ${scope?.system ? "true" : "false"}, true)`;
}

export function systemQuery<T>(run: () => Promise<T>): Promise<T> {
  return databaseScope.run({ storeId: "", role: "SYSTEM", system: true }, run);
}

export async function transaction<T>(run: (tx: Transaction) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.$transaction(async tx => {
        await applyScope(tx);
        return run(tx);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 20000 });
    } catch (error) {
      const failure = error as { code?: string; meta?: { code?: string; modelName?: string } };
      const retryable = failure.code === "P2034" || (failure.code === "P2010" && ["40001", "40P01"].includes(failure.meta?.code || "")) || (failure.code === "P2002" && failure.meta?.modelName === "IdempotentCommand");
      if (!retryable || attempt >= 4) throw error;
    }
  }
}

export const prisma = new Proxy(client, {
  get(target, property) {
    if (property === "$transaction") return async (run: (tx: Transaction) => Promise<unknown>) => transaction(run);
    const value = Reflect.get(target, property);
    if (typeof property === "string" && !property.startsWith("$") && !property.startsWith("_") && value && typeof value === "object") {
      return new Proxy(value, {
        get(delegate, operation) {
          const method = Reflect.get(delegate, operation);
          if (typeof method !== "function") return method;
          return (args: unknown) => transaction(async tx => {
            const model = Reflect.get(tx, property);
            return Reflect.get(model, operation).call(model, args);
          });
        },
      });
    }
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as PrismaClient;
