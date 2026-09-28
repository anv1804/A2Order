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
  // 99k + 39k = 138k / month
  assert.strictEqual(result.monthlySum, 138000);
  assert.strictEqual(result.rawTotal, 138000 * 6); // 828000
  assert.strictEqual(result.periodDiscountPercent, 10);
  assert.strictEqual(result.periodDiscountAmount, 82800);
  assert.strictEqual(result.finalTotal, 828000 - 82800); // 745200
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

  // 99k + 49k = 148k / month
  // 148k * 12 = 1,776,000
  // 20% period discount = 355,200 => 1,420,800
  // 10% voucher discount = 142,080 => 1,278,720
  assert.strictEqual(result.monthlySum, 148000);
  assert.strictEqual(result.periodDiscountPercent, 20);
  assert.strictEqual(result.finalTotal, 1278720);
});
