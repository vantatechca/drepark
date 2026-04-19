import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { visits, spots } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();

    const recentVisits = await db
      .select()
      .from(visits)
      .orderBy(desc(visits.createdAt))
      .limit(5);

    if (recentVisits.length === 0) return NextResponse.json([]);

    const spotIds = [...new Set(recentVisits.map((v) => v.spotId))];
    const spotRows = await db
      .select({ id: spots.id, name: spots.name })
      .from(spots)
      .where(inArray(spots.id, spotIds));

    const spotMap = new Map(spotRows.map((s) => [s.id, s.name]));

    const result = recentVisits.map((v) => ({
      id: v.id,
      spotId: v.spotId,
      spotName: spotMap.get(v.spotId) ?? "Unknown Spot",
      date: v.date,
      networkingRating: v.networkingRating,
      conversationsCount: v.conversationsCount ?? 0,
      timeSlot: v.timeSlot,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
