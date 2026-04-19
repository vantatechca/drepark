import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { spots } from "@/db/schema";
import { calculateOverallScore } from "@/lib/scoring";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [spot] = await db.select().from(spots).where(eq(spots.id, id));
    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }
    return NextResponse.json(spot);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const db = getDb();

    const scoreOverall = calculateOverallScore({
      proximity: Number(body.scoreProximity ?? 0),
      visibility: Number(body.scoreVisibility ?? 0),
      footTraffic: Number(body.scoreFootTraffic ?? 0),
      vibe: Number(body.scoreVibe ?? 0),
      networking: Number(body.scoreNetworking ?? 0),
    });

    const updates = {
      name: body.name,
      spotType: body.spotType,
      address: body.address,
      city: body.city,
      neighborhood: body.neighborhood || null,
      zone: body.zone,
      latitude: body.latitude?.toString() || "0",
      longitude: body.longitude?.toString() || "0",
      googlePlaceId: body.googlePlaceId || null,
      googleMapsUrl: body.googleMapsUrl || null,
      websiteUrl: body.websiteUrl || null,
      phone: body.phone || null,
      parkingType: body.parkingType || null,
      parkingSpotsCount: body.parkingSpotsCount ? Number(body.parkingSpotsCount) : null,
      distanceCarToSeatingM: body.distanceCarToSeatingM ? Number(body.distanceCarToSeatingM) : null,
      badgeVisible: body.badgeVisible ?? false,
      backInPossible: body.backInPossible ?? false,
      terracePatio: body.terracePatio ?? false,
      laptopFriendly: body.laptopFriendly ?? false,
      priceRange: body.priceRange || null,
      audienceTags: body.audienceTags ?? [],
      streetViewHeading: body.streetViewHeading ? Number(body.streetViewHeading) : 0,
      scoreProximity: Number(body.scoreProximity ?? 0),
      scoreVisibility: Number(body.scoreVisibility ?? 0),
      scoreFootTraffic: Number(body.scoreFootTraffic ?? 0),
      scoreVibe: Number(body.scoreVibe ?? 0),
      scoreNetworking: Number(body.scoreNetworking ?? 0),
      scoreOverall: scoreOverall.toString(),
      status: body.status || "suggested",
      notes: body.notes || null,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(spots)
      .set(updates)
      .where(eq(spots.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update spot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const db = getDb();

    // Build partial update — only include fields that were sent
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.scoreProximity !== undefined) updates.scoreProximity = Number(body.scoreProximity);
    if (body.scoreVisibility !== undefined) updates.scoreVisibility = Number(body.scoreVisibility);
    if (body.scoreFootTraffic !== undefined) updates.scoreFootTraffic = Number(body.scoreFootTraffic);
    if (body.scoreVibe !== undefined) updates.scoreVibe = Number(body.scoreVibe);
    if (body.scoreNetworking !== undefined) updates.scoreNetworking = Number(body.scoreNetworking);
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes || null;

    // Recalculate overall score if any score was updated
    const hasScoreUpdate = [
      body.scoreProximity,
      body.scoreVisibility,
      body.scoreFootTraffic,
      body.scoreVibe,
      body.scoreNetworking,
    ].some((v) => v !== undefined);

    if (hasScoreUpdate) {
      // We need current values to compute overall — fetch first
      const [current] = await db.select().from(spots).where(eq(spots.id, id));
      if (current) {
        const newOverall = calculateOverallScore({
          proximity: Number(updates.scoreProximity ?? current.scoreProximity ?? 0),
          visibility: Number(updates.scoreVisibility ?? current.scoreVisibility ?? 0),
          footTraffic: Number(updates.scoreFootTraffic ?? current.scoreFootTraffic ?? 0),
          vibe: Number(updates.scoreVibe ?? current.scoreVibe ?? 0),
          networking: Number(updates.scoreNetworking ?? current.scoreNetworking ?? 0),
        });
        updates.scoreOverall = newOverall.toString();
      }
    }

    const [updated] = await db
      .update(spots)
      .set(updates)
      .where(eq(spots.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update spot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [deleted] = await db
      .delete(spots)
      .where(eq(spots.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete spot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
