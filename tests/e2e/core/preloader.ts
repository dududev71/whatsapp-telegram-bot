import { Client } from "pg";
import { env } from "../../../src/core/env";
import { randomUUID } from "node:crypto";

// tests/e2e/core/preloader.ts - CORREÇÃO
export default async function () {
  const schema = `test_${randomUUID().replace(/-/g, "")}`;

  // Salva o schema para uso posterior
  process.env.TEST_SCHEMA = schema;

  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

  // Roda migrations no schema específico
  const databaseUrlWithSchema = new URL(env.DATABASE_URL);
  databaseUrlWithSchema.searchParams.set("schema", schema);
  process.env.DATABASE_URL = databaseUrlWithSchema.toString();

  const { execSync } = await import("node:child_process");
  execSync("pnpm dlx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });

  // Agora crie uma nova connection string SEM o schema= para runtime
  // e use middleware ou transaction para setar search_path

  return async () => {
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
    await client.end();
  };
}
