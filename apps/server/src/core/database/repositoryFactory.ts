import {
  IScenarioRepository,
  IStoreRepository,
  IMenuRepository,
  ILicenseRepository,
  IInvoiceRepository,
  IStaffRepository,
} from "./IRepository.js";
import {
  PrismaScenarioRepository,
  PrismaStoreRepository,
  PrismaMenuRepository,
  PrismaLicenseRepository,
  PrismaInvoiceRepository,
  PrismaStaffRepository,
} from "./prisma/prismaRepositories.js";

console.log("🐘 [A2Order Database] Connected to Supabase PostgreSQL via Prisma");

export const scenarioRepository: IScenarioRepository = new PrismaScenarioRepository();
export const storeRepository: IStoreRepository = new PrismaStoreRepository();
export const menuRepository: IMenuRepository = new PrismaMenuRepository();
export const licenseRepository: ILicenseRepository = new PrismaLicenseRepository();
export const invoiceRepository: IInvoiceRepository = new PrismaInvoiceRepository();
export const staffRepository: IStaffRepository = new PrismaStaffRepository();

