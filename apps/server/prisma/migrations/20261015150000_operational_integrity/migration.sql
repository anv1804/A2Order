BEGIN;
-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "OrderSession" DROP CONSTRAINT "OrderSession_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_orderSessionId_fkey";

-- DropForeignKey
ALTER TABLE "StoreLicense" DROP CONSTRAINT "StoreLicense_storeId_fkey";

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "vatRate" INTEGER NOT NULL DEFAULT 8;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shift" TEXT NOT NULL DEFAULT 'FULL_TIME';

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "costPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customizationGroups" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "majorCategory" TEXT,
ADD COLUMN     "modifiers" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "stockCount" INTEGER,
ADD COLUMN     "subCategory" TEXT,
ADD COLUMN     "variants" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "OrderSession" ADD COLUMN     "adjustments" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "guestCount" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "OrderBatch" ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promotionSnapshot" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "voucherCode" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "costSnapshot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nameSnapshot" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "optionSnapshot" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "station" TEXT NOT NULL DEFAULT 'KITCHEN';

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "cashierId" TEXT,
ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountReason" TEXT,
ADD COLUMN     "includeVat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lineSnapshot" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "splitCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "surchargeAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StoreLicense" ALTER COLUMN "storeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SoftwareInvoice" ADD COLUMN     "requestedModules" TEXT,
ADD COLUMN     "voucherCode" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "transactionRef" TEXT,
    "partIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotentCommand" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotentCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "storeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceDocument_pkey" PRIMARY KEY ("storeId","key")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");

-- CreateIndex
CREATE INDEX "Payment_billId_idx" ON "Payment"("billId");

-- CreateIndex
CREATE INDEX "Payment_storeId_createdAt_idx" ON "Payment"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_billId_partIndex_key" ON "Payment"("billId", "partIndex");

-- CreateIndex
CREATE INDEX "IdempotentCommand_storeId_createdAt_idx" ON "IdempotentCommand"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_storeId_status_requestedAt_idx" ON "ServiceRequest"("storeId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_id_storeId_key" ON "Staff"("id", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "TableZone_id_storeId_key" ON "TableZone"("id", "storeId");

-- CreateIndex
CREATE INDEX "Table_zoneId_idx" ON "Table"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_id_storeId_key" ON "Table"("id", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_storeId_code_key" ON "Table"("storeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_id_storeId_key" ON "Category"("id", "storeId");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_id_storeId_key" ON "MenuItem"("id", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSession_id_storeId_key" ON "OrderSession"("id", "storeId");

-- CreateIndex
CREATE INDEX "OrderBatch_orderSessionId_createdAt_idx" ON "OrderBatch"("orderSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderBatchId_idx" ON "OrderItem"("orderBatchId");

-- CreateIndex
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "Bill_orderSessionId_idx" ON "Bill"("orderSessionId");

-- CreateIndex
CREATE INDEX "Bill_storeId_paidAt_idx" ON "Bill"("storeId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_id_storeId_key" ON "Bill"("id", "storeId");

-- CreateIndex
CREATE INDEX "AuditLog_staffId_idx" ON "AuditLog"("staffId");

-- CreateIndex
CREATE INDEX "SoftwareInvoice_storeLicenseId_idx" ON "SoftwareInvoice"("storeLicenseId");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_zoneId_storeId_fkey" FOREIGN KEY ("zoneId", "storeId") REFERENCES "TableZone"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_storeId_fkey" FOREIGN KEY ("categoryId", "storeId") REFERENCES "Category"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSession" ADD CONSTRAINT "OrderSession_tableId_storeId_fkey" FOREIGN KEY ("tableId", "storeId") REFERENCES "Table"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_orderSessionId_storeId_fkey" FOREIGN KEY ("orderSessionId", "storeId") REFERENCES "OrderSession"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreLicense" ADD CONSTRAINT "StoreLicense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_storeId_fkey" FOREIGN KEY ("billId", "storeId") REFERENCES "Bill"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotentCommand" ADD CONSTRAINT "IdempotentCommand_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;


UPDATE "OrderSession" SET status = 'COMPLETED' WHERE status = 'CLOSED';
UPDATE "OrderItem" AS item SET "nameSnapshot" = menu.name, "station" = menu.station
FROM "MenuItem" AS menu WHERE item."menuItemId" = menu.id AND item."nameSnapshot" = '';

CREATE UNIQUE INDEX "OrderSession_one_active_table" ON "OrderSession" ("tableId") WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX "Bill_transfer_code_unique" ON "Bill" ("transactionCode") WHERE "transactionCode" IS NOT NULL;

ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_money_valid" CHECK (price >= 0 AND "costPrice" >= 0 AND ("stockCount" IS NULL OR "stockCount" >= 0));
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_money_valid" CHECK (quantity > 0 AND price >= 0);
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_money_valid" CHECK ("totalAmount" >= 0 AND "finalAmount" >= 0 AND "discountAmount" >= 0 AND "discountAmount" <= "totalAmount" AND "taxAmount" >= 0 AND "surchargeAmount" >= 0 AND "splitCount" BETWEEN 1 AND 100);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_valid" CHECK (amount >= 0);
ALTER TABLE "OrderBatch" ADD CONSTRAINT "OrderBatch_discount_valid" CHECK ("discountAmount" >= 0);
ALTER TABLE "SoftwareInvoice" ADD CONSTRAINT "SoftwareInvoice_money_period_valid" CHECK (amount >= 0 AND "durationMonths" BETWEEN 1 AND 120);
ALTER TABLE "OrderSession" ADD CONSTRAINT "OrderSession_status_valid" CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'));
ALTER TABLE "OrderBatch" ADD CONSTRAINT "OrderBatch_status_valid" CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED'));
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_status_valid" CHECK (status IN ('PENDING_APPROVAL', 'QUEUED', 'COOKING', 'DONE', 'SERVED', 'CANCELLED'));

DO $hardening$
DECLARE record_name text; predicate text; existing_policy text;
BEGIN
  FOREACH record_name IN ARRAY ARRAY['Store','Staff','TableZone','Table','Category','MenuItem','OrderSession','OrderBatch','OrderItem','Bill','Payment','AuditLog','StoreLicense','SoftwareInvoice','StoreTelemetry','StoreLandingPage','SystemConfig','WorkspaceDocument','IdempotentCommand','ServiceRequest'] LOOP
    IF record_name = 'Store' THEN
      predicate := '(current_setting(''app.system'', true) = ''true'' OR id = current_setting(''app.store_id'', true))';
    ELSIF record_name = 'OrderBatch' THEN
      predicate := '(current_setting(''app.system'', true) = ''true'' OR EXISTS (SELECT 1 FROM "OrderSession" s WHERE s.id = "orderSessionId" AND s."storeId" = current_setting(''app.store_id'', true)))';
    ELSIF record_name = 'OrderItem' THEN
      predicate := '(current_setting(''app.system'', true) = ''true'' OR EXISTS (SELECT 1 FROM "OrderBatch" b JOIN "OrderSession" s ON s.id = b."orderSessionId" WHERE b.id = "orderBatchId" AND s."storeId" = current_setting(''app.store_id'', true)))';
    ELSIF record_name = 'SoftwareInvoice' THEN
      predicate := '(current_setting(''app.system'', true) = ''true'' OR EXISTS (SELECT 1 FROM "StoreLicense" l WHERE l.id = "storeLicenseId" AND l."storeId" = current_setting(''app.store_id'', true)))';
    ELSIF record_name = 'SystemConfig' THEN
      predicate := '(current_setting(''app.system'', true) = ''true'')';
    ELSE
      predicate := '(current_setting(''app.system'', true) = ''true'' OR "storeId" = current_setting(''app.store_id'', true))';
    END IF;
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', record_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', record_name);
    FOR existing_policy IN SELECT policyname FROM pg_policies WHERE schemaname = current_schema() AND tablename = record_name LOOP
      EXECUTE format('DROP POLICY %I ON %I', existing_policy, record_name);
    END LOOP;
    EXECUTE format('CREATE POLICY a2order_tenant_scope ON %I FOR ALL USING (%s) WITH CHECK (%s)', record_name, predicate, predicate);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE format('REVOKE ALL ON %I FROM anon', record_name); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE format('REVOKE ALL ON %I FROM authenticated', record_name); END IF;
  END LOOP;
END
$hardening$;

CREATE FUNCTION a2order_item_tenant_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "MenuItem" m JOIN "OrderBatch" b ON b.id = NEW."orderBatchId" JOIN "OrderSession" s ON s.id = b."orderSessionId" WHERE m.id = NEW."menuItemId" AND m."storeId" = s."storeId") THEN
    RAISE EXCEPTION 'Order item tenant mismatch' USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END
$guard$;
REVOKE ALL ON FUNCTION a2order_item_tenant_guard() FROM PUBLIC;
CREATE TRIGGER a2order_item_tenant BEFORE INSERT OR UPDATE OF "menuItemId", "orderBatchId" ON "OrderItem" FOR EACH ROW EXECUTE FUNCTION a2order_item_tenant_guard();

CREATE POLICY system_config_pricing_read ON "SystemConfig" FOR SELECT USING (current_setting('app.role',true) IN ('STORE_OWNER','SUPER_ADMIN') AND key IN ('pricing_plans','pricing_modules','pricing_discounts','pricing_vouchers'));

COMMIT;
