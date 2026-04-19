import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { visits, spots, timingData } from "@/db/schema";
import { getDayOfWeek, calculateDuration } from "@/lib/scoring";
import { desc, eq, and, gte, lte, avg, count, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spotId = searchParams.get("spotId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  try {
    const db = getDb();

    const conditions = [];
    if (spotId) conditions.push(eq(visits.spotId, spotId));
    if (dateFrom) conditions.push(gte(visits.date, dateFrom));
    if (dateTo) conditions.push(lte(visits.date, dateTo));

    const result = await db
      .select({
        id: visits.id,
        spotId: visits.spotId,
        spotName: spots.name,
        date: visits.date,
        arrivedAt: visits.arrivedAt,
        departedAt: visits.departedAt,
        durationMin: visits.durationMin,
        dayOfWeek: visits.dayOfWeek,
        timeSlot: visits.timeSlot,
        parkedWhere: visits.parkedWhere,
        badgeFacingCrowd: visits.badgeFacingCrowd,
        crowdQuality: visits.crowdQuality,
        crowdGender: visits.crowdGender,
        conversationsCount: visits.conversationsCount,
        contactsExchanged: visits.contactsExchanged,
        carCompliments: visits.carCompliments,
        networkingRating: visits.networkingRating,
        vibeRating: visits.vibeRating,
        contentCreated: visits.contentCreated,
        whatIDid: visits.whatIDid,
        notableInteractions: visits.notableInteractions,
        weather: visits.weather,
        notes: visits.notes,
        createdAt: visits.createdAt,
      })
      .from(visits)
      .leftJoin(spots, eq(visits.spotId, spots.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(visits.date));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    // Auto-calculate dayOfWeek from date
    const visitDate = new Date(body.date + "T12:00:00"); // noon to avoid timezone edge cases
    const dayOfWeek = getDayOfWeek(visitDate);

    // Auto-calculate duration if both times provided
    let durationMin: number | null = null;
    if (body.arrivedAt && body.departedAt) {
      durationMin = calculateDuration(body.arrivedAt, body.departedAt);
      if (durationMin < 0) durationMin = null; // guard overnight visits
    }

    const newVisit = {
      spotId: body.spotId,
      date: body.date,
      arrivedAt: body.arrivedAt || null,
      departedAt: body.departedAt || null,
      durationMin,
      dayOfWeek,
      timeSlot: body.timeSlot,
      parkedWhere: body.parkedWhere || null,
      badgeFacingCrowd: body.badgeFacingCrowd ?? false,
      crowdQuality: body.crowdQuality || null,
      crowdGender: body.crowdGender || null,
      conversationsCount: Number(body.conversationsCount ?? 0),
      contactsExchanged: Number(body.contactsExchanged ?? 0),
      carCompliments: Number(body.carCompliments ?? 0),
      networkingRating: body.networkingRating ? Number(body.networkingRating) : null,
      vibeRating: body.vibeRating ? Number(body.vibeRating) : null,
      contentCreated: body.contentCreated ?? false,
      whatIDid: body.whatIDid || null,
      notableInteractions: body.notableInteractions || null,
      weather: body.weather || null,
      notes: body.notes || null,
    };

    const [created] = await db.insert(visits).values(newVisit).returning();

    // Increment spot visitCount and update lastVisitedAt
    await db
      .update(spots)
      .set({
        visitCount: sql`${spots.visitCount} + 1`,
        lastVisitedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(spots.id, body.spotId));

    // Upsert timing_data for this spot/day/timeSlot combo
    try {
      // Check if timing record exists
      const [existing] = await db
        .select()
        .from(timingData)
        .where(
          and(
            eq(timingData.spotId, body.spotId),
            eq(timingData.dayOfWeek, dayOfWeek),
            eq(timingData.timeSlot, body.timeSlot)
          )
        )
        .limit(1);

      if (existing) {
        // Recalculate averages with new data
        const aggResult = await db
          .select({
            visitCount: count(visits.id),
            avgNetworking: avg(visits.networkingRating),
            avgConversations: avg(visits.conversationsCount),
          })
          .from(visits)
          .where(
            and(
              eq(visits.spotId, body.spotId),
              eq(visits.dayOfWeek, dayOfWeek),
              eq(visits.timeSlot, body.timeSlot)
            )
          );

        const agg = aggResult[0];

        // Calculate parking success rate: ideal_spot or acceptable = success
        const parkingVisits = await db
          .select({
            parkedWhere: visits.parkedWhere,
          })
          .from(visits)
          .where(
            and(
              eq(visits.spotId, body.spotId),
              eq(visits.dayOfWeek, dayOfWeek),
              eq(visits.timeSlot, body.timeSlot)
            )
          );

        const successCount = parkingVisits.filter(
          (v) => v.parkedWhere === "ideal_spot" || v.parkedWhere === "acceptable"
        ).length;
        const totalWithParking = parkingVisits.filter((v) => v.parkedWhere !== null).length;
        const parkingSuccessRate = totalWithParking > 0 ? successCount / totalWithParking : null;

        await db
          .update(timingData)
          .set({
            visitCount: Number(agg.visitCount),
            avgNetworkingRating: agg.avgNetworking
              ? Number(agg.avgNetworking).toFixed(1)
              : null,
            avgConversations: agg.avgConversations
              ? Number(agg.avgConversations).toFixed(1)
              : null,
            parkingSuccessRate: parkingSuccessRate !== null
              ? parkingSuccessRate.toFixed(2)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(timingData.id, existing.id));
      } else {
        // Create new timing record
        const parkingSuccessRate =
          body.parkedWhere === "ideal_spot" || body.parkedWhere === "acceptable"
            ? "1.00"
            : body.parkedWhere
            ? "0.00"
            : null;

        await db.insert(timingData).values({
          spotId: body.spotId,
          dayOfWeek,
          timeSlot: body.timeSlot,
          visitCount: 1,
          avgNetworkingRating: body.networkingRating
            ? String(body.networkingRating)
            : null,
          avgConversations: body.conversationsCount
            ? String(body.conversationsCount)
            : null,
          parkingSuccessRate,
          recommended: false,
        });
      }
    } catch {
      // Timing data upsert failure is non-fatal
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create visit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
