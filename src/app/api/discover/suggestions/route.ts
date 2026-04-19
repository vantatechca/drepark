import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { spotSuggestions, spots } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateOverallScore } from "@/lib/scoring";
import { desc } from "drizzle-orm";

// ── GET: list suggestions ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const db = getDb();
    const query = db
      .select()
      .from(spotSuggestions)
      .orderBy(desc(spotSuggestions.suggestedAt));

    const result = await (status
      ? db
          .select()
          .from(spotSuggestions)
          .where(eq(spotSuggestions.status, status as "pending" | "interested" | "scouted" | "added" | "rejected"))
          .orderBy(desc(spotSuggestions.suggestedAt))
      : query);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

// ── PUT: update suggestion status ─────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, rejectionReason } = body as {
      id: string;
      status: "interested" | "rejected" | "added" | "scouted" | "pending";
      rejectionReason?: string;
    };

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const db = getDb();

    // If adding, create the spot from the suggestion
    if (status === "added") {
      const [suggestion] = await db
        .select()
        .from(spotSuggestions)
        .where(eq(spotSuggestions.id, id));

      if (!suggestion) {
        return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
      }

      // Create minimal spot from suggestion data
      const scoreOverall = calculateOverallScore({
        proximity: 0,
        visibility: 0,
        footTraffic: 0,
        vibe: 0,
        networking: 0,
      });

      const [newSpot] = await db
        .insert(spots)
        .values({
          name: suggestion.name,
          spotType: suggestion.spotType ?? "other",
          address: suggestion.address,
          city: suggestion.city,
          zone: "south_shore_primary", // default — user can edit
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          googlePlaceId: suggestion.googlePlaceId ?? null,
          streetViewImageUrl: suggestion.streetViewUrl ?? null,
          scoreProximity: 0,
          scoreVisibility: 0,
          scoreFootTraffic: 0,
          scoreVibe: 0,
          scoreNetworking: 0,
          scoreOverall: scoreOverall.toString(),
          status: "suggested",
          discoverySource: "google_places",
          notes: suggestion.aiAssessment
            ? `AI Assessment: ${suggestion.aiAssessment}`
            : null,
        })
        .returning();

      // Mark suggestion as added
      await db
        .update(spotSuggestions)
        .set({ status: "added" })
        .where(eq(spotSuggestions.id, id));

      return NextResponse.json({ suggestion: { ...suggestion, status: "added" }, spot: newSpot });
    }

    // For other status updates
    const updateData: Record<string, unknown> = { status };
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const [updated] = await db
      .update(spotSuggestions)
      .set(updateData)
      .where(eq(spotSuggestions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update suggestion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
