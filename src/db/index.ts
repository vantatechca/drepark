import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Allow app to run without DB for development/preview
const client = connectionString
  ? postgres(connectionString, { prepare: false })
  : (null as unknown as ReturnType<typeof postgres>);

export const db = connectionString
  ? drizzle(client, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

export function getDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local to enable database features."
    );
  }
  return db;
}
