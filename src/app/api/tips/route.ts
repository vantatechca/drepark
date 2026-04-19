import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { proTips } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const FALLBACK_TIPS = [
  {
    id: "fallback-1",
    category: "parking",
    title: "Always back in so the AMG badge faces the patio/terrace.",
    description:
      "The badge is the conversation starter. Front-in parking hides your best asset.",
    active: true,
    createdAt: new Date(),
  },
  {
    id: "fallback-2",
    category: "timing",
    title: "Weekday daytime beats Friday night on Crescent.",
    description:
      "A cafe with your laptop on a Tuesday afternoon attracts more quality professionals than a packed weekend bar.",
    active: true,
    createdAt: new Date(),
  },
  {
    id: "fallback-3",
    category: "parking",
    title: "5-10 meter visibility max.",
    description:
      "If the car is further than 10 meters from where people sit, the spot doesn't work. Proximity is everything.",
    active: true,
    createdAt: new Date(),
  },
  {
    id: "fallback-4",
    category: "general",
    title: "Rotate spots. Don't become 'that guy who's always at Cafe X.'",
    description:
      "Variety keeps it natural. Visiting the same spot too often makes you predictable, not mysterious.",
    active: true,
    createdAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const random = searchParams.get("random") === "true";

  try {
    const db = getDb();

    if (random) {
      const tips = await db
        .select()
        .from(proTips)
        .where(eq(proTips.active, true))
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (tips.length > 0) return NextResponse.json(tips[0]);

      // Fallback to random hardcoded tip
      const idx = Math.floor(Math.random() * FALLBACK_TIPS.length);
      return NextResponse.json(FALLBACK_TIPS[idx]);
    }

    const tips = await db
      .select()
      .from(proTips)
      .where(eq(proTips.active, true));

    return NextResponse.json(tips.length > 0 ? tips : FALLBACK_TIPS);
  } catch {
    if (random) {
      const idx = Math.floor(Math.random() * FALLBACK_TIPS.length);
      return NextResponse.json(FALLBACK_TIPS[idx]);
    }
    return NextResponse.json(FALLBACK_TIPS);
  }
}
