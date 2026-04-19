import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { spots, visits, timingData, aiRecommendations } from "@/db/schema";
import { desc, eq, or, inArray } from "drizzle-orm";
import { getAIRecommendation, hasAIKey } from "@/lib/ai";
import { getTimeSlotFromHour, getDayOfWeek } from "@/lib/scoring";

export async function POST() {
  if (!hasAIKey()) {
    return NextResponse.json(
      {
        recommendations: null,
        message: "Add ANTHROPIC_API_KEY for AI recommendations",
      },
      { status: 200 }
    );
  }

  try {
    const db = getDb();

    // Current time context
    const now = new Date();
    const dayOfWeek = getDayOfWeek(now);
    const hour = now.getHours();
    const timeSlot = getTimeSlotFromHour(hour);
    const currentTime = now.toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Fetch verified + favorite spots
    const eligibleSpots = await db
      .select()
      .from(spots)
      .where(or(eq(spots.status, "verified"), eq(spots.status, "favorite")))
      .orderBy(desc(spots.scoreOverall))
      .limit(20);

    if (eligibleSpots.length === 0) {
      return NextResponse.json({
        recommendations: null,
        message: "Add some verified spots first to get recommendations",
      });
    }

    // Fetch timing data for eligible spots
    const spotIds = eligibleSpots.map((s) => s.id);
    const timing = await db
      .select()
      .from(timingData)
      .where(inArray(timingData.spotId, spotIds));

    const timingBySpot = new Map<string, typeof timing>();
    for (const row of timing) {
      if (!timingBySpot.has(row.spotId)) timingBySpot.set(row.spotId, []);
      timingBySpot.get(row.spotId)!.push(row);
    }

    // Fetch last 5 visits with spot names
    const recentVisitRows = await db
      .select()
      .from(visits)
      .orderBy(desc(visits.createdAt))
      .limit(5);

    const visitSpotIds = recentVisitRows.map((v) => v.spotId);
    const visitSpotsMap = new Map<string, string>();
    if (visitSpotIds.length > 0) {
      const visitSpots = await db
        .select({ id: spots.id, name: spots.name })
        .from(spots)
        .where(inArray(spots.id, visitSpotIds));
      for (const s of visitSpots) visitSpotsMap.set(s.id, s.name);
    }

    const recentVisits = recentVisitRows.map((v) => ({
      spotName: visitSpotsMap.get(v.spotId) ?? "Unknown Spot",
      date: v.date,
      networkingRating: v.networkingRating ?? 0,
    }));

    // Build spots context for AI
    const spotsContext = eligibleSpots.map((s) => {
      const spotTiming = timingBySpot.get(s.id) ?? [];
      return {
        id: s.id,
        name: s.name,
        scoreOverall: parseFloat(s.scoreOverall ?? "0"),
        spotType: s.spotType,
        zone: s.zone,
        audienceTags: (s.audienceTags as string[]) ?? [],
        timingData: spotTiming.map((t) => ({
          dayOfWeek: t.dayOfWeek,
          timeSlot: t.timeSlot,
          avgNetworkingRating: parseFloat(t.avgNetworkingRating ?? "0"),
          avgConversations: parseFloat(t.avgConversations ?? "0"),
          parkingSuccessRate: parseFloat(t.parkingSuccessRate ?? "0"),
        })),
      };
    });

    const result = await getAIRecommendation({
      dayOfWeek,
      timeSlot,
      currentTime,
      spots: spotsContext,
      recentVisits,
    });

    if (!result) {
      return NextResponse.json(
        { recommendations: null, message: "AI returned no recommendations" },
        { status: 200 }
      );
    }

    // Store each recommendation in ai_recommendations table
    for (const rec of result.recommendations) {
      const spot = eligibleSpots.find((s) => s.id === rec.spotId);
      if (spot) {
        await db.insert(aiRecommendations).values({
          type: "go_now",
          spotId: rec.spotId,
          reasoning: rec.reasoning,
          timeSlot: timeSlot,
          audiencePrediction: rec.expectedAudience,
        });
      }
    }

    return NextResponse.json({
      recommendations: result.recommendations,
      insight: result.insight,
      context: { dayOfWeek, timeSlot, currentTime },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get recommendations";
    return NextResponse.json({ recommendations: null, message }, { status: 500 });
  }
}
