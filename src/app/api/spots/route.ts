import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { spots } from "@/db/schema";
import { calculateOverallScore } from "@/lib/scoring";
import { desc, ilike, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spotType = searchParams.get("spotType");
  const zone = searchParams.get("zone");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  try {
    const db = getDb();

    const conditions = [];
    if (spotType) conditions.push(eq(spots.spotType, spotType as any));
    if (zone) conditions.push(eq(spots.zone, zone as any));
    if (status) conditions.push(eq(spots.status, status as any));
    if (search) conditions.push(ilike(spots.name, `%${search}%`));

    const result = await db
      .select()
      .from(spots)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(spots.scoreOverall));

    return NextResponse.json(result);
  } catch {
    // DB unavailable — return empty array
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
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

    const newSpot = {
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
    };

    const [created] = await db.insert(spots).values(newSpot).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create spot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
