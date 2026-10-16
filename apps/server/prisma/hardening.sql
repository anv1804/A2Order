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
