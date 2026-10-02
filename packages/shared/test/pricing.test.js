const { test } = require("node:test");
const assert = require("node:assert");
const {
  AppModule,
  calculateContractPrice,
  DEFAULT_PERIOD_DISCOUNTS,
  APP_MODULE_CATALOG,
} = require("../dist/index.js");

test("calculateContractPrice - 1 month basic core pos", () => {
  const result = calculateContractPrice([AppModule.CORE_POS], 1);
  assert.strictEqual(result.monthlySum, 99000);
  assert.strictEqual(result.rawTotal, 99000);
  assert.strictEqual(result.periodDiscountPercent, 0);
  assert.strictEqual(result.periodDiscountAmount, 0);
  assert.strictEqual(result.finalTotal, 99000);
});

test("calculateContractPrice - 6 months with 10% period discount", () => {
  const result = calculateContractPrice([AppModule.CORE_POS, AppModule.MODULE_KDS], 6);
  // 99k + 49k (KDS) = 148k / month
  assert.strictEqual(result.monthlySum, 148000);
  assert.strictEqual(result.rawTotal, 148000 * 6); // 888000
  assert.strictEqual(result.periodDiscountPercent, 10);
  assert.strictEqual(result.periodDiscountAmount, 88800);
  assert.strictEqual(result.finalTotal, 888000 - 88800); // 799200
});

test("calculateContractPrice - 12 months with 20% discount and percent voucher", () => {
  const voucher = {
    id: "v1",
    code: "TEST10",
    discountType: "PERCENT",
    discountValue: 10,
    minContractMonths: 6,
    validUntil: "2026-12-31",
    usageCount: 0,
    maxUsage: 10,
    isActive: true,
  };

  const result = calculateContractPrice(
    [AppModule.CORE_POS, AppModule.MODULE_LANDING_PAGE],
    12,
    voucher
  );

  // 99k + 69k (Landing page Add-on) = 168k / month
  // 168k * 12 = 2,016,000
  // 20% period discount = 403,200 => 1,612,800
  // 10% voucher discount = 161,280 => 1,451,520
  assert.strictEqual(result.monthlySum, 168000);
  assert.strictEqual(result.periodDiscountPercent, 20);
  assert.strictEqual(result.finalTotal, 1451520);
});

test("calculateContractPrice - Core POS + Chấm công HRM + Bộ đàm Intercom", () => {
  const result = calculateContractPrice(
    [AppModule.CORE_POS, AppModule.MODULE_ATTENDANCE_HRM, AppModule.MODULE_STAFF_INTERCOM],
    1
  );
  // 99k + 49k + 29k = 177k / month
  assert.strictEqual(result.monthlySum, 177000);
  assert.strictEqual(result.finalTotal, 177000);
});

