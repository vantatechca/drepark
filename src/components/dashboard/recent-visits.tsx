"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Star, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RecentVisit = {
  id: string;
  spotId: string;
  spotName: string;
  date: string;
  networkingRating: number | null;
  conversationsCount: number;
  timeSlot: string;
};

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-zinc-600 text-xs">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3 h-3",
            s <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
          )}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}

function formatSlot(slot: string): string {
  return slot.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecentVisits() {
  const [visits, setVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/visits/recent")
      .then((r) => r.json())
      .then((data) => setVisits(Array.isArray(data) ? data : []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-400" />
            Recent Visits
          </CardTitle>
          <Link
            href="/spots"
            className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && visits.length === 0 && (
          <div className="py-8 text-center">
            <CalendarDays className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">No visits logged yet</p>
            <p className="text-zinc-600 text-xs mt-1">
              Visit a spot and log it to see it here
            </p>
          </div>
        )}
        {!loading &&
          visits.map((visit) => (
            <Link key={visit.id} href={`/spots/${visit.spotId}`}>
              <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {visit.spotName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500">
                      {formatDate(visit.date)}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-600">
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                      {formatSlot(visit.timeSlot)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StarRating rating={visit.networkingRating} />
                  {visit.conversationsCount > 0 && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {visit.conversationsCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
      </CardContent>
    </Card>
  );
}
