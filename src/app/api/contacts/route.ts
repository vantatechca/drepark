import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { contacts, spots } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spotId = searchParams.get("spotId");
  const potential = searchParams.get("potential");

  try {
    const db = getDb();

    const conditions = [];
    if (spotId) conditions.push(eq(contacts.spotId, spotId));
    if (potential) conditions.push(eq(contacts.potential, potential as any));

    const result = await db
      .select({
        id: contacts.id,
        visitId: contacts.visitId,
        spotId: contacts.spotId,
        spotName: spots.name,
        name: contacts.name,
        contactType: contacts.contactType,
        contactValue: contacts.contactValue,
        gender: contacts.gender,
        context: contacts.context,
        potential: contacts.potential,
        followedUp: contacts.followedUp,
        notes: contacts.notes,
        metAt: contacts.metAt,
      })
      .from(contacts)
      .leftJoin(spots, eq(contacts.spotId, spots.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contacts.metAt));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const newContact = {
      visitId: body.visitId || null,
      spotId: body.spotId || null,
      name: body.name,
      contactType: body.contactType,
      contactValue: body.contactValue || null,
      gender: body.gender || null,
      context: body.context || null,
      potential: body.potential || "medium",
      followedUp: body.followedUp ?? false,
      notes: body.notes || null,
      metAt: body.metAt ? new Date(body.metAt) : new Date(),
    };

    const [created] = await db.insert(contacts).values(newContact).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create contact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
