import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/drizzle/schema";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/dbname";

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export { schema };
export type Database = typeof db;
