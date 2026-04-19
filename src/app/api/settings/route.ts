import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { spots } from "@/db/schema";
import { sql } from "drizzle-orm";

export type SettingsStatus = {
  hasDatabase: boolean;
  hasGoogleMaps: boolean;
  hasAnthropic: boolean;
};

export async function GET() {
  let hasDatabase = false;
  try {
    const db = getDb();
    // Try a lightweight query to confirm DB connectivity
    await db.select({ one: sql<number>`1` }).from(spots).limit(1);
    hasDatabase = true;
  } catch {
    // DB unavailable — but key might still be set
    hasDatabase = !!process.env.DATABASE_URL;
  }

  return NextResponse.json({
    hasDatabase,
    hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  } as SettingsStatus);
}
