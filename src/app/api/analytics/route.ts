import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { spots, visits, contacts, timingData } from "@/db/schema";
import { desc, gte, lt, and, isNotNull } from "drizzle-orm";

export type HeatmapCell = {
  dayOfWeek: string;
  timeSlot: string;
  value: number;
  visitCount: number;
};

export type TopSpot = {
  id: string;
  name: string;
  scoreOverall: number;
  avgNetworkingRating: number;
  visitCount: number;
  audienceTags: string[];
};

export type WeeklyTrend = {
  weekLabel: string;
  weekStart: string;
  conversations: number;
  contacts: number;
};

export type AudienceBreakdown = {
  tag: string;
  count: number;
  avgRating: number;
};

export type AnalyticsData = {
  monthlyStats: {
    visits: number;
    conversations: number;
    contacts: number;
    avgNetworkingRating: number;
    prevVisits: number;
    prevConversations: number;
    prevContacts: number;
    prevAvgNetworkingRating: number;
  };
  topSpots: TopSpot[];
  timingHeatmap: HeatmapCell[];
  audienceBreakdown: AudienceBreakdown[];
  trends: WeeklyTrend[];
};

const EMPTY_ANALYTICS: AnalyticsData = {
  monthlyStats: {
    visits: 0,
    conversations: 0,
    contacts: 0,
    avgNetworkingRating: 0,
    prevVisits: 0,
    prevConversations: 0,
    prevContacts: 0,
    prevAvgNetworkingRating: 0,
  },
  topSpots: [],
  timingHeatmap: [],
  audienceBreakdown: [],
  trends: [],
};

export async function GET() {
  try {
    const db = getDb();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthStr = thisMonthStart.toISOString().split("T")[0];
    const lastMonthStartStr = lastMonthStart.toISOString().split("T")[0];
    const lastMonthEndStr = lastMonthEnd.toISOString().split("T")[0];

    // This month visits
    const thisMonthVisits = await db
      .select()
      .from(visits)
      .where(gte(visits.date, thisMonthStr));

    // Last month visits
    const lastMonthVisits = await db
      .select()
      .from(visits)
      .where(
        and(gte(visits.date, lastMonthStartStr), lt(visits.date, thisMonthStr))
      );

    // This month contacts
    const thisMonthContacts = await db
      .select()
      .from(contacts)
      .where(gte(contacts.metAt, thisMonthStart));

    // Last month contacts
    const lastMonthContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          gte(contacts.metAt, lastMonthStart),
          lt(contacts.metAt, thisMonthStart)
        )
      );

    const sumConversations = (vs: typeof thisMonthVisits) =>
      vs.reduce((s, v) => s + (v.conversationsCount ?? 0), 0);

    const avgRating = (vs: typeof thisMonthVisits) => {
      const rated = vs.filter((v) => v.networkingRating != null);
      if (rated.length === 0) return 0;
      return (
        rated.reduce((s, v) => s + (v.networkingRating ?? 0), 0) / rated.length
      );
    };

    const monthlyStats = {
      visits: thisMonthVisits.length,
      conversations: sumConversations(thisMonthVisits),
      contacts: thisMonthContacts.length,
      avgNetworkingRating: avgRating(thisMonthVisits),
      prevVisits: lastMonthVisits.length,
      prevConversations: sumConversations(lastMonthVisits),
      prevContacts: lastMonthContacts.length,
      prevAvgNetworkingRating: avgRating(lastMonthVisits),
    };

    // Top spots
    const allSpots = await db
      .select()
      .from(spots)
      .where(isNotNull(spots.scoreOverall))
      .orderBy(desc(spots.scoreOverall))
      .limit(20);

    const allVisits = await db.select().from(visits);

    const spotVisitMap = new Map<
      string,
      { ratings: number[]; count: number }
    >();
    for (const v of allVisits) {
      if (!spotVisitMap.has(v.spotId)) {
        spotVisitMap.set(v.spotId, { ratings: [], count: 0 });
      }
      const entry = spotVisitMap.get(v.spotId)!;
      entry.count++;
      if (v.networkingRating != null) entry.ratings.push(v.networkingRating);
    }

    const topSpots: TopSpot[] = allSpots
      .map((s) => {
        const entry = spotVisitMap.get(s.id) ?? { ratings: [], count: 0 };
        const avgNR =
          entry.ratings.length > 0
            ? entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length
            : 0;
        return {
          id: s.id,
          name: s.name,
          scoreOverall: parseFloat(s.scoreOverall ?? "0"),
          avgNetworkingRating: avgNR,
          visitCount: entry.count,
          audienceTags: (s.audienceTags as string[]) ?? [],
        };
      })
      .sort((a, b) => b.avgNetworkingRating - a.avgNetworkingRating || b.scoreOverall - a.scoreOverall)
      .slice(0, 10);

    // Timing heatmap from timing_data table
    const timingRows = await db.select().from(timingData);
    const heatmapMap = new Map<
      string,
      { totalRating: number; count: number; visits: number }
    >();

    for (const row of timingRows) {
      const key = `${row.dayOfWeek}::${row.timeSlot}`;
      const existing = heatmapMap.get(key) ?? {
        totalRating: 0,
        count: 0,
        visits: 0,
      };
      const rating = parseFloat(row.avgNetworkingRating ?? "0");
      existing.totalRating += rating;
      existing.count++;
      existing.visits += row.visitCount ?? 0;
      heatmapMap.set(key, existing);
    }

    const timingHeatmap: HeatmapCell[] = Array.from(heatmapMap.entries()).map(
      ([key, data]) => {
        const [dayOfWeek, timeSlot] = key.split("::");
        return {
          dayOfWeek,
          timeSlot,
          value: data.count > 0 ? data.totalRating / data.count : 0,
          visitCount: data.visits,
        };
      }
    );

    // Audience breakdown from top spots
    const tagMap = new Map<string, { count: number; totalRating: number }>();
    for (const s of topSpots) {
      for (const tag of s.audienceTags) {
        const existing = tagMap.get(tag) ?? { count: 0, totalRating: 0 };
        existing.count++;
        existing.totalRating += s.avgNetworkingRating;
        tagMap.set(tag, existing);
      }
    }

    const audienceBreakdown: AudienceBreakdown[] = Array.from(
      tagMap.entries()
    )
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        avgRating: data.count > 0 ? data.totalRating / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Weekly trends — last 12 weeks
    const trends: WeeklyTrend[] = [];
    for (let w = 11; w >= 0; w--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);

      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekEndStr = weekEnd.toISOString().split("T")[0];

      const weekVisits = allVisits.filter(
        (v) => v.date >= weekStartStr && v.date <= weekEndStr
      );
      const weekContacts = await db
        .select()
        .from(contacts)
        .where(
          and(gte(contacts.metAt, weekStart), lt(contacts.metAt, weekEnd))
        );

      trends.push({
        weekLabel: `W${12 - w}`,
        weekStart: weekStartStr,
        conversations: weekVisits.reduce(
          (s, v) => s + (v.conversationsCount ?? 0),
          0
        ),
        contacts: weekContacts.length,
      });
    }

    return NextResponse.json({
      monthlyStats,
      topSpots,
      timingHeatmap,
      audienceBreakdown,
      trends,
    } as AnalyticsData);
  } catch {
    return NextResponse.json(EMPTY_ANALYTICS);
  }
}
