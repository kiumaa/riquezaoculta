import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  env.DATABASE_URL &&
  (globalForDb.pool ??
    new Pool({
      connectionString: env.DATABASE_URL,
      max: 10
    }));

if (!globalForDb.pool && pool) {
  globalForDb.pool = pool;
}

export const db = pool ? drizzle(pool) : null;
