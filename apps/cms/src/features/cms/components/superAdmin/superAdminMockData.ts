import { AppModule } from "@/types/cms.types";

// Interface dùng cho type trong LicenseManager - dữ liệu thực lấy từ Supabase qua API
export interface LicenseKeyRecord {
  id: string;
  keyCode: string;
  storeName?: string;
  storeId?: string;
  plan: "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE";
  maxDevices: number;
  durationMonths: number;
  issuedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED" | "UNASSIGNED";
  modules: AppModule[];
}
