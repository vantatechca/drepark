"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Compass,
  Navigation,
  MapPin,
  ChevronDown,
  ChevronUp,
  Save,
  Star,
  RefreshCw,
  CheckCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNavigationUrl, getStreetViewUrl } from "@/lib/google-maps";
import { SPOT_STATUSES } from "@/lib/constants";
import type { Spot, SpotSuggestion } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────

type ScoutItem =
  | { kind: "spot"; data: Spot }
  | { kind: "suggestion"; data: SpotSuggestion };

interface QuickRateState {
  proximity: number;
  visibility: number;
  footTraffic: number;
  vibe: number;
  networking: number;
  status: string;
  notes: string;
}

const DEFAULT_RATE: QuickRateState = {
  proximity: 5,
  visibility: 5,
  footTraffic: 5,
  vibe: 5,
  networking: 5,
  status: "verified",
  notes: "",
};

// ── Score slider row ──────────────────────────────────────────────────────

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const color =
    value >= 7
      ? "text-emerald-400"
      : value >= 5
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      </div>
      <Slider
        min={0}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        className="w-full"
      />
    </div>
  );
}

// ── Scout Card ────────────────────────────────────────────────────────────

function ScoutCard({
  item,
  onRated,
}: {
  item: ScoutItem;
  onRated: (id: string, kind: "spot" | "suggestion") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState<QuickRateState>({ ...DEFAULT_RATE });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSpot = item.kind === "spot";
  const d = item.data;

  const lat = parseFloat(String(d.latitude));
  const lng = parseFloat(String(d.longitude));
  const hasCoords = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
  const navUrl = hasCoords ? getNavigationUrl(lat, lng) : null;
  const streetViewUrl = hasCoords
    ? getStreetViewUrl(lat, lng, isSpot ? ((d as Spot).streetViewHeading ?? 0) : 0, "600x300")
    : null;

  const name = d.name;
  const address = isSpot ? `${(d as Spot).address}, ${(d as Spot).city}` : `${(d as SpotSuggestion).address}, ${(d as SpotSuggestion).city}`;

  const calcOverall = () => {
    return (
      rating.proximity * 0.25 +
      rating.visibility * 0.25 +
      rating.footTraffic * 0.2 +
      rating.vibe * 0.15 +
      rating.networking * 0.15
    ).toFixed(1);
  };

  async function handleSave() {
    setSaving(true);
    try {
      if (isSpot) {
        // Update existing spot
        await fetch(`/api/spots/${(d as Spot).id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scoreProximity: rating.proximity,
            scoreVisibility: rating.visibility,
            scoreFootTraffic: rating.footTraffic,
            scoreVibe: rating.vibe,
            scoreNetworking: rating.networking,
            status: rating.status,
            notes: rating.notes || undefined,
          }),
        });
        onRated((d as Spot).id, "spot");
      } else {
        // For suggestions: update suggestion to "scouted" then create spot
        const suggestion = d as SpotSuggestion;
        await fetch("/api/discover/suggestions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: suggestion.id, status: "scouted" }),
        });

        // Create a real spot
        await fetch("/api/spots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: suggestion.name,
            spotType: suggestion.spotType ?? "other",
            address: suggestion.address,
            city: suggestion.city,
            zone: "south_shore_primary",
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            googlePlaceId: suggestion.googlePlaceId,
            scoreProximity: rating.proximity,
            scoreVisibility: rating.visibility,
            scoreFootTraffic: rating.footTraffic,
            scoreVibe: rating.vibe,
            scoreNetworking: rating.networking,
            status: rating.status,
            notes: rating.notes || undefined,
            discoverySource: "google_places",
          }),
        });

        onRated(suggestion.id, "suggestion");
      }

      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 overflow-hidden">
      {/* Street View */}
      {streetViewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={streetViewUrl}
          alt={name}
          className="w-full h-44 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (d as SpotSuggestion).streetViewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={(d as SpotSuggestion).streetViewUrl!}
          alt={name}
          className="w-full h-44 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-background to-card/60 flex flex-col items-center justify-center gap-2">
          <MapPin className="h-10 w-10 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground/50">No street view</p>
        </div>
      )}

      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-lg leading-tight">{name}</h3>
            <p className="text-muted-foreground text-sm mt-0.5 truncate">{address}</p>
          </div>
          {isSpot && (
            <div className="flex-shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 text-center">
              <div className="text-amber-400 font-bold text-base leading-none">
                {parseFloat(String((d as Spot).scoreOverall ?? 0)).toFixed(1)}
              </div>
              <div className="text-muted-foreground/60 text-[10px] mt-0.5">score</div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-background/60 border border-border/40 text-muted-foreground capitalize">
            {isSpot ? (d as Spot).spotType?.replace(/_/g, " ") : (d as SpotSuggestion).spotType?.replace(/_/g, " ") ?? "unknown"}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded border font-medium ${
              item.kind === "spot"
                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}
          >
            {item.kind === "spot" ? "Scouted" : "Interested"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {navUrl ? (
            <a href={navUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2 h-11">
                <Navigation className="h-4 w-4" />
                Navigate
              </Button>
            </a>
          ) : (
            <Button disabled className="flex-1 h-11" variant="outline">
              No coords
            </Button>
          )}

          {!saved && (
            <Button
              variant="outline"
              className={`gap-2 h-11 px-4 border-border/50 hover:border-amber-500/50 hover:text-amber-400 ${expanded ? "text-amber-400 border-amber-500/50 bg-amber-500/5" : ""}`}
              onClick={() => setExpanded(!expanded)}
            >
              <Zap className="h-4 w-4" />
              Quick Rate
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium px-3">
              <CheckCircle className="h-4 w-4" />
              Saved!
            </div>
          )}
        </div>

        {/* Quick Rate panel */}
        {expanded && !saved && (
          <div className="border border-border/50 rounded-xl p-4 space-y-4 bg-background/40 mt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Quick Rate</h4>
              <div className="flex items-center gap-1.5 text-xs">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400 font-bold text-base">{calcOverall()}</span>
                <span className="text-muted-foreground">overall</span>
              </div>
            </div>

            <div className="space-y-3">
              <ScoreSlider
                label="Proximity to seating"
                value={rating.proximity}
                onChange={(v) => setRating((r) => ({ ...r, proximity: v }))}
              />
              <ScoreSlider
                label="Car visibility"
                value={rating.visibility}
                onChange={(v) => setRating((r) => ({ ...r, visibility: v }))}
              />
              <ScoreSlider
                label="Foot traffic"
                value={rating.footTraffic}
                onChange={(v) => setRating((r) => ({ ...r, footTraffic: v }))}
              />
              <ScoreSlider
                label="Vibe"
                value={rating.vibe}
                onChange={(v) => setRating((r) => ({ ...r, vibe: v }))}
              />
              <ScoreSlider
                label="Networking potential"
                value={rating.networking}
                onChange={(v) => setRating((r) => ({ ...r, networking: v }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Set Status</label>
              <Select value={rating.status} onValueChange={(v) => setRating((r) => ({ ...r, status: v ?? "verified" }))}>
                <SelectTrigger className="bg-background border-border/50 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SPOT_STATUSES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Notes</label>
              <Textarea
                placeholder="Parking layout, crowd, vibe notes..."
                value={rating.notes}
                onChange={(e) => setRating((r) => ({ ...r, notes: e.target.value }))}
                className="bg-background border-border/50 resize-none text-sm h-20"
              />
            </div>

            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2 h-11"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Rating
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ScoutPage() {
  const [items, setItems] = useState<ScoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [spotsRes, suggestionsRes] = await Promise.allSettled([
        fetch("/api/spots?status=scouted").then((r) => r.json()),
        fetch("/api/discover/suggestions?status=interested").then((r) => r.json()),
      ]);

      const scoutedSpots: Spot[] =
        spotsRes.status === "fulfilled" && Array.isArray(spotsRes.value)
          ? spotsRes.value
          : [];

      const interestedSuggestions: SpotSuggestion[] =
        suggestionsRes.status === "fulfilled" && Array.isArray(suggestionsRes.value)
          ? suggestionsRes.value
          : [];

      const combined: ScoutItem[] = [
        ...scoutedSpots.map((s): ScoutItem => ({ kind: "spot", data: s })),
        ...interestedSuggestions.map((s): ScoutItem => ({ kind: "suggestion", data: s })),
      ];

      setItems(combined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleRated(id: string, kind: "spot" | "suggestion") {
    // Remove from list after rating
    setItems((prev) =>
      prev.filter((item) => {
        if (item.kind !== kind) return true;
        const itemId = item.kind === "spot" ? (item.data as Spot).id : (item.data as SpotSuggestion).id;
        return itemId !== id;
      })
    );
  }

  return (
    <div className="space-y-0 max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Compass className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Scout Mode</h1>
              <p className="text-muted-foreground text-xs">
                {loading ? "Loading..." : `${items.length} spot${items.length !== 1 ? "s" : ""} to scout`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border/50 text-muted-foreground hover:text-foreground gap-1.5 h-8"
            onClick={fetchItems}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-sm">Loading scout list...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <Compass className="h-12 w-12 text-amber-400/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nothing to scout</h3>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                Mark spots as <span className="text-purple-400">Scouted</span> in your spots list,
                or mark discovery suggestions as <span className="text-amber-400">Interested</span> to
                add them here.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <a href="/spots">
                <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground text-sm">
                  My Spots
                </Button>
              </a>
              <a href="/discover">
                <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm">
                  <Compass className="h-4 w-4 mr-1.5" />
                  Discover Spots
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Section: Scouted Spots */}
            {items.filter((i) => i.kind === "spot").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    Scouted Spots
                  </span>
                  <div className="flex-1 h-px bg-purple-500/20" />
                  <span className="text-xs text-muted-foreground/60">
                    {items.filter((i) => i.kind === "spot").length}
                  </span>
                </div>
                <div className="space-y-4">
                  {items
                    .filter((i) => i.kind === "spot")
                    .map((item) => (
                      <ScoutCard
                        key={(item.data as Spot).id}
                        item={item}
                        onRated={handleRated}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Section: Interested Suggestions */}
            {items.filter((i) => i.kind === "suggestion").length > 0 && (
              <div className={items.filter((i) => i.kind === "spot").length > 0 ? "mt-6" : ""}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Interested Suggestions
                  </span>
                  <div className="flex-1 h-px bg-amber-500/20" />
                  <span className="text-xs text-muted-foreground/60">
                    {items.filter((i) => i.kind === "suggestion").length}
                  </span>
                </div>
                <div className="space-y-4">
                  {items
                    .filter((i) => i.kind === "suggestion")
                    .map((item) => (
                      <ScoutCard
                        key={(item.data as SpotSuggestion).id}
                        item={item}
                        onRated={handleRated}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
