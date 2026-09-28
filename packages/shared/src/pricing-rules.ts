/**
 * ĐỊNH NGHĨA CÁC THỂ LOẠI KHUYẾN MẠI VÀ BÁO GIÁ CHO ADMIN NỀN TẢNG
 */

export interface PeriodDiscountRule {
  durationMonths: number;
  discountPercent: number;
  label: string;
}

export interface PromoVoucher {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  discountValue: number; // % hoặc số tiền VND
  minContractMonths: number;
  validUntil: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
}

export const DEFAULT_PERIOD_DISCOUNTS: PeriodDiscountRule[] = [
  { durationMonths: 1, discountPercent: 0, label: "Thanh toán theo tháng" },
  { durationMonths: 3, discountPercent: 5, label: "Gói 3 tháng (Tiết kiệm 5%)" },
  { durationMonths: 6, discountPercent: 10, label: "Gói 6 tháng (Tiết kiệm 10%)" },
  { durationMonths: 12, discountPercent: 20, label: "Gói 1 năm (Tiết kiệm 20%)" },
  { durationMonths: 24, discountPercent: 30, label: "Gói 2 năm (Tiết kiệm 30%)" },
];

import { AppModule, APP_MODULE_CATALOG, ModulePricingInfo } from "./license.js";

export function calculateContractPrice(
  selectedModules: AppModule[],
  durationMonths: number,
  voucher?: PromoVoucher | null,
  catalog: ModulePricingInfo[] = APP_MODULE_CATALOG,
  discounts: PeriodDiscountRule[] = DEFAULT_PERIOD_DISCOUNTS
): {
  monthlySum: number;
  rawTotal: number;
  periodDiscountPercent: number;
  periodDiscountAmount: number;
  voucherDiscountAmount: number;
  finalTotal: number;
} {
  const monthlySum = selectedModules.reduce((sum, modId) => {
    const item = catalog.find((m) => m.id === modId);
    return sum + (item ? item.monthlyPrice : 0);
  }, 0);

  const rawTotal = monthlySum * durationMonths;

  let periodDiscountPercent = 0;
  for (const rule of [...discounts].sort((a, b) => b.durationMonths - a.durationMonths)) {
    if (durationMonths >= rule.durationMonths) {
      periodDiscountPercent = rule.discountPercent;
      break;
    }
  }

  const periodDiscountAmount = Math.round((rawTotal * periodDiscountPercent) / 100);
  const afterPeriodDiscount = rawTotal - periodDiscountAmount;

  let voucherDiscountAmount = 0;
  if (voucher && voucher.isActive && durationMonths >= voucher.minContractMonths) {
    if (voucher.discountType === "PERCENT") {
      voucherDiscountAmount = Math.round((afterPeriodDiscount * voucher.discountValue) / 100);
    } else {
      voucherDiscountAmount = Math.min(voucher.discountValue, afterPeriodDiscount);
    }
  }

  const finalTotal = Math.max(0, afterPeriodDiscount - voucherDiscountAmount);

  return {
    monthlySum,
    rawTotal,
    periodDiscountPercent,
    periodDiscountAmount,
    voucherDiscountAmount,
    finalTotal,
  };
}

