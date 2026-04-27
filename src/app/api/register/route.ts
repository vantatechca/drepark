import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

export async function POST(req: Request) {
  let body: { name?: unknown; username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const usernameRaw = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 1 || name.length > 255) {
    return NextResponse.json({ error: "Name must be 1–255 characters." }, { status: 400 });
  }
  if (!USERNAME_RE.test(usernameRaw)) {
    return NextResponse.json(
      { error: "Username must be 3–32 chars: lowercase letters, digits, underscore." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  let db;
  try {
    db = getDb();
  } catch {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, usernameRaw))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const [created] = await db
    .insert(users)
    .values({ name, username: usernameRaw, passwordHash })
    .returning({ id: users.id, name: users.name, username: users.username });

  return NextResponse.json({ user: created }, { status: 201 });
}
