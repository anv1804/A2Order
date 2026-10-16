import { z } from "zod";

export const MoneySchema = z.number().int().min(0).max(2000000000);
export const OrderLineInputSchema = z.object({
  dishId: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(999),
  notes: z.string().trim().max(500).optional(),
  variantId: z.string().max(100).optional(),
  customizationIds: z.array(z.string().max(100)).max(30).default([]),
});
export const OrderInputSchema = z.object({
  storeId: z.string().min(1).max(100),
  tableId: z.string().min(1).max(100),
  items: z.array(OrderLineInputSchema).min(1).max(100),
  customerPhone: z.string().regex(/^\+?[0-9]{9,15}$/).optional(),
  voucherCode: z.string().max(50).optional(),
});
export const AdjustmentSchema = z.object({
  discountPercent: z.number().int().min(0).max(100).default(0),
  fixedDiscount: MoneySchema.default(0),
  discountReason: z.string().trim().max(300).optional(),
  includeVat: z.boolean().default(false),
  surchargeAmount: MoneySchema.default(0),
});
export const MenuInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  price: MoneySchema,
  costPrice: MoneySchema.default(0),
  station: z.enum(["KITCHEN", "BAR", "DESSERT"]).default("KITCHEN"),
  isAvailable: z.boolean().default(true),
  stockCount: z.number().int().min(0).max(1000000).nullable().optional(),
  image: z.string().max(2000000).optional(),
  description: z.string().max(2000).optional(),
  isBestSeller: z.boolean().default(false),
  variants: z.array(z.object({ id: z.string(), name: z.string().min(1), price: MoneySchema, image: z.string().optional() })).max(50).default([]),
  modifiers: z.array(z.object({ name: z.string().min(1), price: MoneySchema })).max(50).default([]),
  customizationGroups: z.array(z.object({
    id: z.string(), name: z.string().min(1), required: z.boolean().optional(), minSelect: z.number().int().min(0).optional(), maxSelect: z.number().int().min(1).optional(),
    type: z.enum(["SINGLE", "MULTIPLE"]).optional(),
    options: z.array(z.object({ id: z.string(), name: z.string(), priceModifier: MoneySchema.optional() })),
  })).max(30).default([]),
  majorCategory: z.enum(["FOOD", "DRINK", "DESSERT"]).optional(),
  subCategory: z.string().max(100).optional(),
});

export type OrderInput = z.infer<typeof OrderInputSchema>;
export type OrderLineInput = z.infer<typeof OrderLineInputSchema>;
export type BillAdjustment = z.infer<typeof AdjustmentSchema>;

export interface OperationalItem {
  id: string;
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  status: string;
  station: string;
  round: number;
  orderId: string;
  orderedAt: string;
}

export interface OperationalTable {
  tableId: string;
  tableName: string;
  tableCode: string;
  zoneName: string;
  status: string;
  sessionId?: string;
  guestCount: number;
  openedAt?: string;
  openedAtMs?: number;
  items: OperationalItem[];
  totalAmount: number;
  adjustment?: BillAdjustment;
  balanceAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  surchargeAmount?: number;
  paidAmount?: number;
  pendingBillId?: string;
}

export interface BillView {
  id: string;
  billCode: string;
  storeId: string;
  tableId: string;
  tableName: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  surchargeAmount: number;
  finalAmount: number;
  paymentStatus: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; notes?: string }>;
  qrUrl?: string;
  transferContent: string;
  bankBin?: string;
  bankAccount?: string;
  bankOwnerName?: string;
  paidAmount?: number;
  splitCount?: number;
  shares?: number[];
  paidParts?: number[];
}

export function calculateBillAmount(subtotal: number, adjustment: BillAdjustment, vatRate: number) {
  MoneySchema.parse(subtotal);
  const discountAmount = Math.min(subtotal, adjustment.fixedDiscount || Math.round(subtotal * adjustment.discountPercent / 100));
  const taxable = subtotal - discountAmount + adjustment.surchargeAmount;
  const taxAmount = adjustment.includeVat ? Math.round(taxable * vatRate / 100) : 0;
  const finalAmount = MoneySchema.parse(taxable + taxAmount);
  return { totalAmount: subtotal, discountAmount, taxAmount, surchargeAmount: adjustment.surchargeAmount, finalAmount };
}

export const PromotionSchema = z.object({
  id: z.string().min(1), code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,50}$/), title: z.string().min(1).max(200), description: z.string().max(1000),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]), discountValue: MoneySchema, minOrderAmount: MoneySchema,
  maxDiscountAmount: MoneySchema.optional(), startDate: z.string().max(30), endDate: z.string().max(30), usageLimit: z.number().int().min(1).max(1000000), usedCount: z.number().int().min(0).default(0),
  happyHourOnly: z.boolean().optional(), happyHourTimeRange: z.string().max(30).optional(), isActive: z.boolean(),
}).refine(v => v.discountType !== "PERCENTAGE" || v.discountValue <= 100, "Giảm phần trăm không vượt 100");
export type FoodPromotion = z.infer<typeof PromotionSchema>;
export interface PublicLandingPageProps { slug: string; }
