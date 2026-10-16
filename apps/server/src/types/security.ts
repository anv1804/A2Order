import type { Prisma } from "@prisma/client";

export interface Principal {
  userId: string;
  storeId: string;
  role: string;
  kind: "staff" | "customer" | "request";
  sessionId?: string;
  tableId?: string;
  requestId?: string;
  sessionVersion?: number;
  iat?: number;
}

export interface DatabaseScope {
  storeId: string;
  role: string;
  system: boolean;
}

export type Transaction = Prisma.TransactionClient;

declare module "fastify" {
  interface FastifyRequest {
    principal: Principal | null;
  }
}
