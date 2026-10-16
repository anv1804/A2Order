import { CmsAppRole } from "@/types/cms.types";

export const AUTH_TOKEN_KEY = "a2order_auth_token";
export const AUTH_USER_KEY = "a2order_auth_user";

export const ROLE_ALLOWED_MENUS: Record<CmsAppRole, string[]> = {
  SUPER_ADMIN: [
    "telemetry",
    "tenants",
    "store_users",
    "license_manager",
    "software_invoices",
    "pricing_config",
    "audit_logs",
    "profile",
  ],
  STORE_OWNER: [
    "dashboard",
    "staff_order",
    "tables",
    "delivery_integrations",
    "kds",
    "reservations",
    "menu",
    "inventory",
    "customers",
    "promotions",
    "analytics",
    "einvoice",
    "team",
    "hardware",
    "landing_page",
    "settings",
    "profile",
  ],
  ACCOUNTANT: ["analytics", "inventory", "einvoice", "dashboard", "profile"],
  CASHIER: ["staff_order", "tables", "delivery_integrations", "dashboard", "reservations", "customers", "einvoice", "profile"],
  CHEF: ["kds", "menu", "profile"],
  WAITER: ["tables", "staff_order", "reservations", "profile"],
};

export const ROLE_DEFAULT_MENUS: Record<CmsAppRole, string> = {
  SUPER_ADMIN: "telemetry",
  STORE_OWNER: "dashboard",
  ACCOUNTANT: "analytics",
  CASHIER: "staff_order",
  CHEF: "kds",
  WAITER: "tables",
};

export const normalizeAppRole = (role?: string | null): CmsAppRole => {
  if (!role) return "WAITER";
  const upper = role.toUpperCase();
  if (upper === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (upper === "ACCOUNTANT") return "ACCOUNTANT";
  if (upper === "CASHIER") return "CASHIER";
  if (upper === "CHEF") return "CHEF";
  if (upper === "WAITER") return "WAITER";
  if (upper === "ADMIN" || upper === "OWNER" || upper === "STORE_OWNER") return "STORE_OWNER";
  return "STORE_OWNER";
};
