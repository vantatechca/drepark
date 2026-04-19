import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { contacts, spots } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [contact] = await db
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
      .where(eq(contacts.id, id))
      .limit(1);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch contact";
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

    const updateData: Partial<typeof contacts.$inferInsert> = {};

    if (body.visitId !== undefined) updateData.visitId = body.visitId || null;
    if (body.spotId !== undefined) updateData.spotId = body.spotId || null;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.contactType !== undefined)
      updateData.contactType = body.contactType;
    if (body.contactValue !== undefined)
      updateData.contactValue = body.contactValue || null;
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.context !== undefined) updateData.context = body.context || null;
    if (body.potential !== undefined) updateData.potential = body.potential;
    if (body.followedUp !== undefined) updateData.followedUp = body.followedUp;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.metAt !== undefined) updateData.metAt = new Date(body.metAt);

    const [updated] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update contact";
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
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning({ id: contacts.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete contact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
