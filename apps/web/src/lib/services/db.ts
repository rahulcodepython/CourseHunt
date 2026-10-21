import { Pool, type PoolConfig } from "pg";
import { Kysely, PostgresDialect } from "kysely";

// The backend (Go) and this app share one DATABASE_URL. node-postgres treats
// `sslmode=require` as verify-full, which rejects managed databases with
// self-signed certificates (e.g. Voroa). Apply libpq semantics instead, as
// the Go driver does: `require` encrypts without verifying the certificate,
// `verify-full` verifies it.
function poolConfig(connectionString = process.env.DATABASE_URL): PoolConfig {
  if (!connectionString) return {};

  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  if (!sslmode) return { connectionString };

  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: sslmode === "disable" ? false : { rejectUnauthorized: sslmode === "verify-full" },
  };
}

const pool = new Pool(poolConfig());

export const db = new Kysely({
  dialect: new PostgresDialect({ pool }),
});
