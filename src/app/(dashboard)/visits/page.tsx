"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  MessageCircle,
  Handshake,
  Filter,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_SLOTS } from "@/lib/constants";
import type { Spot } from "@/types";

interface VisitRow {
  id: string;
  spotId: string;
  spotName: string | null;
  date: string;
  arrivedAt: string | null;
  departedAt: string | null;
  durationMin: number | null;
  dayOfWeek: string;
  timeSlot: string;
  parkedWhere: string | null;
  crowdQuality: string | null;
  conversationsCount: number | null;
  contactsExchanged: number | null;
  carCompliments: number | null;
  networkingRating: number | null;
  vibeRating: number | null;
  notableInteractions: string | null;
  notes: string | null;
}

const CROWD_QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  perfect: { label: "Perfect", color: "bg-emerald-500/20 text-emerald-400" },
  good: { label: "Good", color: "bg-green-500/20 text-green-400" },
  mediocre: { label: "Mediocre", color: "bg-yellow-500/20 text-yellow-400" },
  wrong_crowd: { label: "Wrong Crowd", color: "bg-orange-500/20 text-orange-400" },
  empty: { label: "Empty", color: "bg-gray-500/20 text-gray-400" },
};

function StarRating({ value, max = 5 }: { value: number | null; max?: number }) {
  if (!value) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < value ? "fill-amber-400 text-amber-400" : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

function formatTime(time: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return `${h12}:${m}${ampm}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotFilter, setSpotFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (spotFilter !== "all") params.set("spotId", spotFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/visits?${params.toString()}`);
      const data = await res.json();
      setVisits(Array.isArray(data) ? data : []);
    } catch {
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [spotFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((d) => setSpots(Array.isArray(d) ? d : []))
      .catch(() => setSpots([]));
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visit History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {visits.length} visit{visits.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Link href="/visits/new">
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Log Visit
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-border/50 bg-card/50">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Filter className="h-4 w-4" />
            <span>Filter:</span>
          </div>

          <div className="flex-1 min-w-[180px] max-w-[260px]">
            <Select value={spotFilter} onValueChange={(v) => setSpotFilter(v ?? "all")}>
              <SelectTrigger className="bg-background border-border/50">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Spots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Spots</SelectItem>
                {spots.map((spot) => (
                  <SelectItem key={spot.id} value={spot.id}>
                    {spot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-background border-border/50 w-[150px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-background border-border/50 w-[150px]"
            />
          </div>

          {(spotFilter !== "all" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSpotFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Visit Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Loading visits...
        </div>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <CalendarDays className="h-14 w-14 text-muted-foreground/30" />
          <div className="text-center">
            <p className="text-foreground font-medium">No visits yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Start tracking your spot visits to build your intelligence database.
            </p>
          </div>
          <Link href="/visits/new">
            <Button
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Your First Visit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visits.map((visit) => {
            const crowdInfo = visit.crowdQuality
              ? CROWD_QUALITY_LABELS[visit.crowdQuality]
              : null;
            const timeSlotInfo = visit.timeSlot
              ? TIME_SLOTS[visit.timeSlot as keyof typeof TIME_SLOTS]
              : null;

            return (
              <Card
                key={visit.id}
                className="border-border/50 bg-card/50 hover:border-amber-500/30 hover:bg-card/80 transition-all duration-200"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {visit.spotName ?? "Unknown Spot"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(visit.date)}
                        </span>
                      </div>
                    </div>
                    {crowdInfo && (
                      <Badge className={`${crowdInfo.color} border-0 text-xs flex-shrink-0`}>
                        {crowdInfo.label}
                      </Badge>
                    )}
                  </div>

                  {/* Time Row */}
                  <div className="flex items-center gap-3 text-sm">
                    {timeSlotInfo && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400/70" />
                        <span className="text-muted-foreground">{timeSlotInfo.label}</span>
                        <span className="text-muted-foreground/50 text-xs">
                          {timeSlotInfo.range}
                        </span>
                      </div>
                    )}
                    {visit.arrivedAt && visit.departedAt && (
                      <span className="text-muted-foreground/60 text-xs">
                        {formatTime(visit.arrivedAt)} – {formatTime(visit.departedAt)}
                        {visit.durationMin && (
                          <span className="ml-1">({visit.durationMin}min)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-0.5 rounded-md bg-background/50 py-2">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-sm font-semibold text-foreground">
                          {visit.conversationsCount ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">convos</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 rounded-md bg-background/50 py-2">
                      <div className="flex items-center gap-1">
                        <Handshake className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-sm font-semibold text-foreground">
                          {visit.contactsExchanged ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">contacts</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 rounded-md bg-background/50 py-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-sm font-semibold text-foreground">
                          {visit.carCompliments ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">compliments</span>
                    </div>
                  </div>

                  {/* Ratings Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Networking:</span>
                      <StarRating value={visit.networkingRating} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Vibe:</span>
                      <StarRating value={visit.vibeRating} />
                    </div>
                  </div>

                  {/* Notable Interactions */}
                  {visit.notableInteractions && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic border-t border-border/30 pt-2">
                      "{visit.notableInteractions}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
