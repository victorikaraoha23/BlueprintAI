import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/drizzle/schema";
import { getServerEnv } from "@/lib/env";

function getDatabaseUrl() {
  try {
    const env = getServerEnv();
    return env.DATABASE_URL;
  } catch {
    return process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/dbname";
  }
}

const databaseUrl = getDatabaseUrl();

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export { schema };
export type Database = typeof db;
