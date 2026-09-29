import {
  IScenarioRepository,
  IStoreRepository,
  IMenuRepository,
  ILicenseRepository,
  IInvoiceRepository,
} from "./IRepository.js";
import {
  MockScenarioRepository,
  MockStoreRepository,
  MockMenuRepository,
  MockLicenseRepository,
  MockInvoiceRepository,
} from "./mock/mockRepositories.js";
import {
  PrismaScenarioRepository,
  PrismaStoreRepository,
  PrismaMenuRepository,
  PrismaLicenseRepository,
  PrismaInvoiceRepository,
} from "./prisma/prismaRepositories.js";

// Đọc cờ môi trường: mặc định là MOCK DB (in-memory stateful repository)
// Khi cắm DB thật (PostgreSQL / MySQL) -> Chỉ cần đặt USE_MOCK_DB=false trong .env
const isMockMode = process.env.USE_MOCK_DB !== "false";

if (isMockMode) {
  console.log("📦 [A2Order Database] Running in MOCK REPOSITORY mode (Stateful In-Memory Layer)");
} else {
  console.log("🐘 [A2Order Database] Running in REAL DATABASE mode (Prisma Client Layer)");
}

export const scenarioRepository: IScenarioRepository = isMockMode
  ? new MockScenarioRepository()
  : new PrismaScenarioRepository();

export const storeRepository: IStoreRepository = isMockMode
  ? new MockStoreRepository()
  : new PrismaStoreRepository();

export const menuRepository: IMenuRepository = isMockMode
  ? new MockMenuRepository()
  : new PrismaMenuRepository();

export const licenseRepository: ILicenseRepository = isMockMode
  ? new MockLicenseRepository()
  : new PrismaLicenseRepository();

export const invoiceRepository: IInvoiceRepository = isMockMode
  ? new MockInvoiceRepository()
  : new PrismaInvoiceRepository();
