import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { spots, visits, contacts } from "@/db/schema";
import { gte, eq, or } from "drizzle-orm";

export type SummaryData = {
  verifiedSpotsCount: number;
  visitsThisMonth: number;
  conversationsThisMonth: number;
  contactsThisMonth: number;
  avgNetworkingRating: number;
};

export async function GET() {
  try {
    const db = getDb();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthStr = thisMonthStart.toISOString().split("T")[0];

    const allSpots = await db
      .select()
      .from(spots)
      .where(or(eq(spots.status, "verified"), eq(spots.status, "favorite")));

    const monthVisits = await db
      .select()
      .from(visits)
      .where(gte(visits.date, thisMonthStr));

    const monthContacts = await db
      .select()
      .from(contacts)
      .where(gte(contacts.metAt, thisMonthStart));

    const rated = monthVisits.filter((v) => v.networkingRating != null);
    const avgNR =
      rated.length > 0
        ? rated.reduce((s, v) => s + (v.networkingRating ?? 0), 0) /
          rated.length
        : 0;

    return NextResponse.json({
      verifiedSpotsCount: allSpots.length,
      visitsThisMonth: monthVisits.length,
      conversationsThisMonth: monthVisits.reduce(
        (s, v) => s + (v.conversationsCount ?? 0),
        0
      ),
      contactsThisMonth: monthContacts.length,
      avgNetworkingRating: avgNR,
    } as SummaryData);
  } catch {
    return NextResponse.json({
      verifiedSpotsCount: 0,
      visitsThisMonth: 0,
      conversationsThisMonth: 0,
      contactsThisMonth: 0,
      avgNetworkingRating: 0,
    } as SummaryData);
  }
}
