import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { visits, spots } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [visit] = await db
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
      .where(eq(visits.id, id))
      .limit(1);

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch visit";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const updateData: Partial<typeof visits.$inferInsert> = {};

    if (body.date !== undefined) updateData.date = body.date;
    if (body.arrivedAt !== undefined)
      updateData.arrivedAt = body.arrivedAt || null;
    if (body.departedAt !== undefined)
      updateData.departedAt = body.departedAt || null;
    if (body.durationMin !== undefined) updateData.durationMin = body.durationMin;
    if (body.dayOfWeek !== undefined) updateData.dayOfWeek = body.dayOfWeek;
    if (body.timeSlot !== undefined) updateData.timeSlot = body.timeSlot;
    if (body.parkedWhere !== undefined)
      updateData.parkedWhere = body.parkedWhere || null;
    if (body.badgeFacingCrowd !== undefined)
      updateData.badgeFacingCrowd = body.badgeFacingCrowd;
    if (body.crowdQuality !== undefined)
      updateData.crowdQuality = body.crowdQuality || null;
    if (body.crowdGender !== undefined)
      updateData.crowdGender = body.crowdGender || null;
    if (body.conversationsCount !== undefined)
      updateData.conversationsCount = Number(body.conversationsCount);
    if (body.contactsExchanged !== undefined)
      updateData.contactsExchanged = Number(body.contactsExchanged);
    if (body.carCompliments !== undefined)
      updateData.carCompliments = Number(body.carCompliments);
    if (body.networkingRating !== undefined)
      updateData.networkingRating = body.networkingRating
        ? Number(body.networkingRating)
        : null;
    if (body.vibeRating !== undefined)
      updateData.vibeRating = body.vibeRating
        ? Number(body.vibeRating)
        : null;
    if (body.contentCreated !== undefined)
      updateData.contentCreated = body.contentCreated;
    if (body.whatIDid !== undefined)
      updateData.whatIDid = body.whatIDid || null;
    if (body.notableInteractions !== undefined)
      updateData.notableInteractions = body.notableInteractions || null;
    if (body.weather !== undefined) updateData.weather = body.weather || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    const [updated] = await db
      .update(visits)
      .set(updateData)
      .where(eq(visits.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update visit";
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

    const [visit] = await db
      .select({ spotId: visits.spotId })
      .from(visits)
      .where(eq(visits.id, id))
      .limit(1);

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    await db.delete(visits).where(eq(visits.id, id));

    // Decrement spot visitCount
    const [spot] = await db
      .select({ visitCount: spots.visitCount })
      .from(spots)
      .where(eq(spots.id, visit.spotId))
      .limit(1);

    if (spot && (spot.visitCount ?? 0) > 0) {
      await db
        .update(spots)
        .set({
          visitCount: (spot.visitCount ?? 1) - 1,
          updatedAt: new Date(),
        })
        .where(eq(spots.id, visit.spotId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete visit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
