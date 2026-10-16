import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";

export async function testDatabase() {
  dotenv.config();
  const source = process.env.TEST_DATABASE_URL || process.env.DIRECT_URL;
  if (!source || source.includes("change-me")) {
    return null;
  }
  const suffix = randomBytes(6).toString("hex");
  const schema = "a2order_test_" + suffix;
  const role = "a2order_test_role_" + suffix;
  const password = randomBytes(32).toString("hex");
  const adminUrl = new URL(source);
  adminUrl.searchParams.delete("schema");
  const admin = new Client({ connectionString: adminUrl.toString(), connectionTimeoutMillis: 10000 });
  await admin.connect();
  let schemaCreated = false;
  let roleCreated = false;
  const cleanup = async () => {
    if (!/^a2order_test_[a-f0-9]{12}$/.test(schema) || !/^a2order_test_role_[a-f0-9]{12}$/.test(role)) throw new Error("Unsafe test cleanup target");
    if (schemaCreated) await admin.query('DROP SCHEMA "' + schema + '" CASCADE');
    if (roleCreated) await admin.query('DROP ROLE "' + role + '"');
    await admin.end();
  };
  try {
    await admin.query('CREATE SCHEMA "' + schema + '"'); schemaCreated = true;
    await admin.query('SET search_path TO "' + schema + '"');
    await admin.query(await readFile(new URL("../prisma/migrations/00000000000000_baseline/migration.sql", import.meta.url), "utf8"));
    await admin.query('ALTER TABLE "MenuItem" ENABLE ROW LEVEL SECURITY; CREATE POLICY legacy_allow_all ON "MenuItem" USING (true) WITH CHECK (true)');
    await admin.query(await readFile(new URL("../prisma/migrations/20261015150000_operational_integrity/migration.sql", import.meta.url), "utf8"));
    await admin.query('CREATE ROLE "' + role + '" LOGIN PASSWORD \'' + password + '\' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS'); roleCreated = true;
    await admin.query('GRANT USAGE ON SCHEMA "' + schema + '" TO "' + role + '"');
    await admin.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "' + schema + '" TO "' + role + '"');
    const appUrl = new URL(source);
    const username = decodeURIComponent(appUrl.username);
    appUrl.username = role + (username.includes(".") ? username.slice(username.indexOf(".")) : "");
    appUrl.password = password;
    appUrl.searchParams.set("schema", schema);
    appUrl.searchParams.set("connection_limit", "5");
    appUrl.searchParams.set("connect_timeout", "10");
    process.env.DATABASE_URL = appUrl.toString();
    process.env.JWT_SECRET = randomBytes(48).toString("hex");
    process.env.APP_ORIGINS = "http://localhost:3000";
    return { cleanup, schema, role };
  } catch (error) { await cleanup(); throw error; }
}
