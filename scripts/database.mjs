import { Client } from "pg";
import { Prisma } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const envPath = fileURLToPath(new URL("../apps/server/.env", import.meta.url));
dotenv.config({ path: envPath });
const mode = process.argv[2] || "check";
if (!["check", "deploy", "runtime"].includes(mode)) throw new Error("Expected check, deploy, or runtime");
const source = process.env.DIRECT_URL;
if (!source) throw new Error("Configure DIRECT_URL in apps/server/.env");
const url = new URL(source);
const schema = url.searchParams.get("schema") || "public";
if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(schema)) throw new Error("Invalid database schema");
url.searchParams.delete("schema");
const db = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
await db.connect();
const q = value => '"' + value.replaceAll('"', '""') + '"';
const migrations = new URL("../apps/server/prisma/migrations/", import.meta.url);
const runPrisma = args => {
  try {
    execFileSync(process.execPath, [root + "node_modules/prisma/build/index.js", ...args], { cwd: root + "apps/server", env: { ...process.env, DATABASE_URL: source }, stdio: "pipe" });
  } catch { throw new Error("Prisma migration failed. Inspect the migration status with the admin connection; credentials were not logged."); }
};

try {
  await db.query("SET search_path TO " + q(schema));
  const tables = (await db.query("SELECT tablename FROM pg_tables WHERE schemaname=$1", [schema])).rows.map(r => r.tablename);
  const columns = (await db.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=$1", [schema])).rows;
  const owned = Prisma.dmmf.datamodel.models.map(m => m.name);
  const additional = tables.filter(t => !owned.includes(t) && t !== "_prisma_migrations");
  console.log(JSON.stringify({ schema, ownedTables: tables.filter(t => owned.includes(t)).length, additionalTablesPreserved: additional }));
  const issues = [];
  if (tables.includes("Store")) {
    const checks = {
      duplicateActiveSessions: `SELECT count(*)::int AS count FROM (SELECT "tableId" FROM "OrderSession" WHERE status='ACTIVE' GROUP BY "tableId" HAVING count(*)>1) t`,
      duplicateTableCodes: `SELECT count(*)::int AS count FROM (SELECT "storeId",code FROM "Table" WHERE code IS NOT NULL GROUP BY "storeId",code HAVING count(*)>1) t`,
      foreignMenuCategories: `SELECT count(*)::int AS count FROM "MenuItem" m JOIN "Category" c ON c.id=m."categoryId" WHERE m."storeId"<>c."storeId"`,
      foreignTableZones: `SELECT count(*)::int AS count FROM "Table" t JOIN "TableZone" z ON z.id=t."zoneId" WHERE t."storeId"<>z."storeId"`,
      foreignSessions: `SELECT count(*)::int AS count FROM "OrderSession" s JOIN "Table" t ON t.id=s."tableId" WHERE s."storeId"<>t."storeId"`,
      foreignBills: `SELECT count(*)::int AS count FROM "Bill" b JOIN "OrderSession" s ON s.id=b."orderSessionId" WHERE b."storeId"<>s."storeId"`,
      invalidOrderMoney: `SELECT count(*)::int AS count FROM "OrderItem" WHERE quantity<=0 OR price<0`,
      invalidBillMoney: `SELECT count(*)::int AS count FROM "Bill" WHERE "totalAmount"<0 OR "finalAmount"<0 OR "discountAmount"<0 OR "discountAmount">"totalAmount"`,
      duplicateTransferCodes: `SELECT count(*)::int AS count FROM (SELECT "transactionCode" FROM "Bill" WHERE "transactionCode" IS NOT NULL GROUP BY "transactionCode" HAVING count(*)>1) t`,
      unsupportedSessions: `SELECT count(*)::int AS count FROM "OrderSession" WHERE status NOT IN ('ACTIVE','COMPLETED','CLOSED','CANCELLED')`,
      unsupportedItems: `SELECT count(*)::int AS count FROM "OrderItem" WHERE status NOT IN ('PENDING_APPROVAL','QUEUED','COOKING','DONE','SERVED','CANCELLED')`,
      unsupportedRoles: `SELECT count(*)::int AS count FROM "Staff" WHERE role NOT IN ('SUPER_ADMIN','STORE_OWNER','ACCOUNTANT','CASHIER','CHEF','WAITER')`,
    };
    for (const [name, sql] of Object.entries(checks)) {
      const count = (await db.query(sql)).rows[0].count;
      if (count) issues.push({ name, count });
    }
    const baseline = readFileSync(new URL("00000000000000_baseline/migration.sql", migrations), "utf8");
    for (const match of baseline.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)) {
      const [, table, body] = match;
      for (const column of [...body.matchAll(/^\s*"([^"]+)"\s/gm)].map(m => m[1])) {
        if (!columns.some(r => r.table_name === table && r.column_name === column)) issues.push({ name: "missingBaselineColumn", table, column });
      }
    }
  }
  console.log(JSON.stringify({ preflightIssues: issues }));
  if (issues.length) throw new Error("Preflight failed. Resolve the listed existing data/schema conflicts before migration.");
  if (mode === "check") {
    console.log("Read-only preflight passed. No database changes were applied.");
  } else if (mode === "deploy") {
    if (tables.includes("Store") && !tables.includes("_prisma_migrations")) runPrisma(["migrate", "resolve", "--applied", "00000000000000_baseline"]);
    runPrisma(["migrate", "deploy"]);
    const staff = (await db.query('SELECT id,"pinCode" FROM "Staff" WHERE "pinCode" IS NOT NULL')).rows;
    let upgraded = 0;
    for (const row of staff) {
      if (!row.pinCode.startsWith("$2")) {
        const hash = await bcrypt.hash(row.pinCode, 12);
        await db.query('UPDATE "Staff" SET "pinCode"=$1,"sessionVersion"="sessionVersion"+1 WHERE id=$2 AND "pinCode"=$3', [hash, row.id, row.pinCode]);
        upgraded++;
      }
    }
    console.log(JSON.stringify({ migration: "applied", legacyPinsHashed: upgraded }));
  } else {
    const role = "a2order_v7_runtime";
    const existing = (await db.query("SELECT rolname FROM pg_roles WHERE rolname=$1", [role])).rows[0];
    if (existing) throw new Error("Runtime role already exists; preserve its current credentials or rotate it explicitly with your database administrator.");
    const password = randomBytes(32).toString("hex");
    await db.query("BEGIN");
    try {
      await db.query("CREATE ROLE " + q(role) + " LOGIN PASSWORD '" + password + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
      await db.query("GRANT USAGE ON SCHEMA " + q(schema) + " TO " + q(role));
      for (const table of owned) await db.query("GRANT SELECT, INSERT, UPDATE, DELETE ON " + q(schema) + "." + q(table) + " TO " + q(role));
      await db.query("COMMIT");
    } catch (error) { await db.query("ROLLBACK"); throw error; }
    const runtime = new URL(source);
    const username = decodeURIComponent(runtime.username);
    runtime.username = role + (username.includes(".") ? username.slice(username.indexOf(".")) : "");
    runtime.password = password;
    const entry = "DATABASE_URL=" + JSON.stringify(runtime.toString());
    let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
    env = /^DATABASE_URL=/m.test(env) ? env.replace(/^DATABASE_URL=.*$/m, entry) : env + "\n" + entry + "\n";
    writeFileSync(envPath, env);
    console.log("Least-privilege runtime role created; DATABASE_URL saved only in ignored local .env.");
  }
} finally { await db.end(); }
