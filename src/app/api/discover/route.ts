import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { spotSuggestions, discoverySearches, spots } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { ZONE_CENTERS, SEARCH_QUERIES } from "@/lib/zones";
import { getAISpotAssessment, hasAIKey } from "@/lib/ai";
import { getStreetViewUrl } from "@/lib/google-maps";

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const NEARBY_RADIUS = 5000; // 5km

// ── Helpers ────────────────────────────────────────────────────────────────

function spotTypeFromGoogleType(types: string[]): string {
  if (types.includes("cafe")) return "cafe";
  if (types.includes("bar") || types.includes("night_club")) return "wine_bar";
  if (types.includes("restaurant")) return "restaurant";
  if (types.includes("gym") || types.includes("health")) return "gym";
  if (types.includes("hair_care") || types.includes("beauty_salon")) return "barber";
  if (types.includes("ice_cream_shop")) return "ice_cream";
  return "other";
}

async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  keyword: string,
  type: string
): Promise<GooglePlace[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${lat},${lng}` +
    `&radius=${NEARBY_RADIUS}` +
    `&type=${type}` +
    `&keyword=${encodeURIComponent(keyword)}` +
    `&key=${GOOGLE_PLACES_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  const data = await res.json() as { results: GooglePlace[]; status: string };
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API status: ${data.status}`);
  }
  return data.results ?? [];
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
}

// ── POST: run discovery search ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!GOOGLE_PLACES_KEY) {
    return NextResponse.json(
      { error: "Google Places API key required for discovery" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const zone = (body.zone as keyof typeof ZONE_CENTERS) || "south_shore_primary";
  const spotTypeFilter = body.spotType as string | undefined;
  const center = ZONE_CENTERS[zone] || ZONE_CENTERS.south_shore_primary;

  let db;
  try {
    db = getDb();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Load existing spots & suggestions to avoid duplicates
  const [existingSpots, existingSuggestions] = await Promise.all([
    db.select({ googlePlaceId: spots.googlePlaceId }).from(spots),
    db.select({ googlePlaceId: spotSuggestions.googlePlaceId }).from(spotSuggestions),
  ]);

  const existingPlaceIds = new Set([
    ...existingSpots.map((s) => s.googlePlaceId).filter(Boolean),
    ...existingSuggestions.map((s) => s.googlePlaceId).filter(Boolean),
  ]);

  // Pick queries to run (filter by spotType if provided)
  const queriesToRun = spotTypeFilter
    ? SEARCH_QUERIES.filter((q) => q.type === spotTypeFilter || spotTypeFilter === "all")
    : SEARCH_QUERIES;

  const allPlaces: GooglePlace[] = [];
  const seenIds = new Set<string>();

  for (const query of queriesToRun.slice(0, 5)) {
    try {
      const places = await fetchNearbyPlaces(center.lat, center.lng, query.keyword, query.type);
      for (const p of places) {
        if (!seenIds.has(p.place_id)) {
          seenIds.add(p.place_id);
          allPlaces.push(p);
        }
      }
    } catch {
      // continue with next query
    }
  }

  // Filter: rating >= 3.5, review count >= 10, not already known
  const eligible = allPlaces.filter(
    (p) =>
      (p.rating ?? 0) >= 3.5 &&
      (p.user_ratings_total ?? 0) >= 10 &&
      !existingPlaceIds.has(p.place_id)
  );

  const created = [];
  for (const place of eligible.slice(0, 20)) {
    const lat = place.geometry.location.lat;
    const lng = place.geometry.location.lng;
    const streetViewUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? getStreetViewUrl(lat, lng, 0, "600x300")
      : null;

    // Optional AI assessment
    let aiAssessment: string | null = null;
    let aiParkingScoreEst: number | null = null;

    if (hasAIKey()) {
      try {
        const spotType = spotTypeFromGoogleType(place.types);
        const result = await getAISpotAssessment({
          name: place.name,
          type: spotType,
          address: place.vicinity,
          googleRating: place.rating,
          reviewCount: place.user_ratings_total,
        });
        if (result) {
          aiAssessment = result.assessment;
          aiParkingScoreEst = result.estimatedParkingScore;
        }
      } catch {
        // continue without AI
      }
    }

    const spotType = spotTypeFromGoogleType(place.types);

    try {
      const [suggestion] = await db
        .insert(spotSuggestions)
        .values({
          googlePlaceId: place.place_id,
          name: place.name,
          address: place.vicinity,
          city: "Unknown", // Places API doesn't return city directly
          spotType: spotType as "cafe" | "ice_cream" | "brunch" | "restaurant" | "wine_bar" | "barber" | "cigar_lounge" | "gym" | "car_meet" | "other",
          latitude: lat.toString(),
          longitude: lng.toString(),
          googleRating: place.rating?.toString() ?? null,
          googleReviewCount: place.user_ratings_total ?? null,
          streetViewUrl: streetViewUrl || null,
          aiAssessment,
          aiParkingScoreEst,
          status: "pending",
        })
        .returning();

      created.push(suggestion);
    } catch {
      // skip duplicate
    }
  }

  // Log search
  const searchQuery = `${zone} — ${spotTypeFilter ?? "all types"}`;
  await db.insert(discoverySearches).values({
    searchQuery,
    zone,
    spotTypeFilter: spotTypeFilter ?? null,
    resultsCount: eligible.length,
    suggestionsCreated: created.length,
  }).catch(() => {});

  return NextResponse.json({
    suggestions: created,
    total: created.length,
    scanned: eligible.length,
  });
}

// ── GET: list discovery searches history ───────────────────────────────────

export async function GET() {
  try {
    const db = getDb();
    const searches = await db
      .select()
      .from(discoverySearches)
      .orderBy(discoverySearches.searchedAt);

    return NextResponse.json(searches);
  } catch {
    return NextResponse.json([]);
  }
}
