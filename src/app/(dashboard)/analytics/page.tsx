"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/analytics/stats-card";
import { TimingHeatmap } from "@/components/analytics/timing-heatmap";
import { TrendChart } from "@/components/analytics/trend-chart";
import { ScoreBadge } from "@/components/spots/score-badge";
import {
  MapPin,
  MessageSquare,
  Users,
  Star,
  CalendarDays,
  BarChart3,
  Clock,
  TrendingUp,
} from "lucide-react";
import { AUDIENCE_TAGS } from "@/lib/constants";
import type { AnalyticsData } from "@/app/api/analytics/route";

const EMPTY: AnalyticsData = {
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

function getTagLabel(tag: string): string {
  return AUDIENCE_TAGS.find((t) => t.value === tag)?.label ?? tag;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const { monthlyStats, topSpots, timingHeatmap, audienceBreakdown, trends } =
    data;

  const isEmpty =
    monthlyStats.visits === 0 &&
    topSpots.length === 0 &&
    timingHeatmap.length === 0;

  const audienceChartData = audienceBreakdown.map((a) => ({
    name: getTagLabel(a.tag),
    spots: a.count,
    rating: parseFloat(a.avgRating.toFixed(1)),
  }));

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-400" />
          Analytics
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Performance metrics and insights for your DrePark network
        </p>
      </div>

      {isEmpty && !loading && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No data yet</p>
            <p className="text-zinc-600 text-sm mt-1">
              Start logging visits to see analytics
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Visits This Month"
          value={monthlyStats.visits}
          previousValue={monthlyStats.prevVisits}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <StatsCard
          label="Conversations"
          value={monthlyStats.conversations}
          previousValue={monthlyStats.prevConversations}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <StatsCard
          label="Contacts"
          value={monthlyStats.contacts}
          previousValue={monthlyStats.prevContacts}
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          label="Avg Networking Rating"
          value={monthlyStats.avgNetworkingRating}
          previousValue={monthlyStats.prevAvgNetworkingRating}
          format="rating"
          icon={<Star className="w-5 h-5" />}
        />
      </div>

      {/* Top Spots + Timing Heatmap row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Spots */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Top Performing Spots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topSpots.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">
                No spots data yet
              </p>
            ) : (
              topSpots.map((spot, i) => (
                <div key={spot.id}>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-zinc-600 text-sm w-5 text-right flex-shrink-0 font-mono">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {spot.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-zinc-400">
                          {spot.avgNetworkingRating > 0
                            ? `${spot.avgNetworkingRating.toFixed(1)}/5 networking`
                            : "No ratings yet"}
                        </span>
                        {spot.visitCount > 0 && (
                          <span className="text-xs text-zinc-600">
                            · {spot.visitCount} visit{spot.visitCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <ScoreBadge score={spot.scoreOverall} size="sm" />
                  </div>
                  {i < topSpots.length - 1 && (
                    <Separator className="bg-zinc-800" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Timing Heatmap */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              When To Go — Global Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimingHeatmap data={timingHeatmap} />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart + Audience Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Conversations & Contacts — Last 12 Weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trends} />
          </CardContent>
        </Card>

        {/* Audience Breakdown */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Audience Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {audienceChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-zinc-500 text-sm">
                  Tag your spots with audience types to see breakdown
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={audienceChartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="spots" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Top Spots" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {audienceChartData.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {audienceBreakdown.slice(0, 6).map((a) => (
                  <Badge
                    key={a.tag}
                    variant="outline"
                    className="border-zinc-700 text-zinc-400 text-xs"
                  >
                    {getTagLabel(a.tag)}
                    <span className="ml-1 text-amber-400 font-semibold">
                      {a.count}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
