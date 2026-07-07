import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "../env.js";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (
  !databaseUrl.startsWith("postgres://") &&
  !databaseUrl.startsWith("postgresql://")
) {
  throw new Error("DATABASE_URL must start with postgres:// or postgresql://");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });
export { pool };

export async function assertDatabaseReady(): Promise<void> {
  await pool.query("select 1");

  const schemaCheck = await pool.query<{
    users_table: string | null;
    places_table: string | null;
  }>(
    "select to_regclass('public.users') as users_table, to_regclass('public.places') as places_table",
  );

  if (!schemaCheck.rows[0]?.users_table || !schemaCheck.rows[0]?.places_table) {
    throw new Error(
      "Database schema is not ready. Run the migrations before starting the API.",
    );
  }
}
