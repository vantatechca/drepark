"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIRecommendWidget } from "@/components/dashboard/ai-recommend";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { RecentVisits } from "@/components/dashboard/recent-visits";
import { ProTipWidget } from "@/components/dashboard/pro-tip";
import { ScoreBadge } from "@/components/spots/score-badge";
import { TimingHeatmap } from "@/components/analytics/timing-heatmap";
import {
  Trophy,
  MapPin,
  Clock,
  Compass,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import type { AnalyticsData } from "@/app/api/analytics/route";

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

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [suggestedCount, setSuggestedCount] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => setAnalytics(EMPTY_ANALYTICS))
      .finally(() => setAnalyticsLoading(false));

    // Count suggested spots (status=suggested or scouted)
    fetch("/api/spots?status=suggested")
      .then((r) => r.json())
      .then((data: unknown[]) => setSuggestedCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setSuggestedCount(0));
  }, []);

  const { topSpots, timingHeatmap } = analytics;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Your DrePark command center
          </p>
        </div>
        <Link href="/spots/new">
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            <MapPin className="w-4 h-4 mr-1.5" />
            Add Spot
          </Button>
        </Link>
      </div>

      {/* AI Recommendation — Hero Panel (full width) */}
      <AIRecommendWidget />

      {/* Quick Stats Row */}
      <QuickStats />

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT column */}
        <div className="space-y-6">
          {/* Top Spots Leaderboard */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Top Spots Leaderboard
                </CardTitle>
                <Link
                  href="/analytics"
                  className="text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  Full analytics
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {analyticsLoading && (
                <div className="space-y-2 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-12 rounded bg-zinc-800 animate-pulse"
                    />
                  ))}
                </div>
              )}
              {!analyticsLoading && topSpots.length === 0 && (
                <div className="py-10 text-center">
                  <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">No spots ranked yet</p>
                  <Link href="/spots/new">
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 border-zinc-700 text-zinc-400 hover:text-white text-xs"
                    >
                      Add your first spot
                    </Button>
                  </Link>
                </div>
              )}
              {!analyticsLoading &&
                topSpots.map((spot, i) => (
                  <div key={spot.id}>
                    <Link href={`/spots/${spot.id}`}>
                      <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer group">
                        <span className="text-zinc-600 text-sm font-mono w-5 text-right flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                            {spot.name}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {spot.visitCount > 0
                              ? `${spot.visitCount} visit${spot.visitCount !== 1 ? "s" : ""}`
                              : "Not visited yet"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ScoreBadge score={spot.scoreOverall} size="sm" />
                          <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                    {i < topSpots.length - 1 && (
                      <Separator className="bg-zinc-800/60 ml-8" />
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Timing Insight */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Timing Intelligence
                </CardTitle>
                <Link
                  href="/analytics"
                  className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                >
                  Full heatmap →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <TimingHeatmap data={timingHeatmap} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          {/* Recent Visits */}
          <RecentVisits />

          {/* Discover / Suggested Spots count */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        Spots to Scout
                      </p>
                      {suggestedCount > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs h-5">
                          {suggestedCount} new
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {suggestedCount > 0
                        ? `${suggestedCount} suggested spot${suggestedCount !== 1 ? "s" : ""} waiting to be scouted`
                        : "All caught up — discover new spots"}
                    </p>
                  </div>
                </div>
                <Link href="/spots?status=suggested">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 text-xs"
                  >
                    Scout Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tip of the Day */}
          <ProTipWidget />
        </div>
      </div>
    </div>
  );
}
