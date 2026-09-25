import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = new Kysely({
  dialect: new PostgresDialect({ pool }),
});
