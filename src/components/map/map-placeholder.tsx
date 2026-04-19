"use client";

import Link from "next/link";
import { MapPin, Navigation, Star, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/spots/score-badge";
import { SpotStatusBadge } from "@/components/spots/spot-status-badge";
import { getNavigationUrl } from "@/lib/google-maps";
import { SPOT_TYPES, PARKING_TYPES } from "@/lib/constants";
import { ZONES } from "@/lib/zones";
import type { Spot } from "@/types";

interface MapPlaceholderProps {
  spots: Spot[];
}

export function MapPlaceholder({ spots }: MapPlaceholderProps) {
  return (
    <div className="space-y-6 p-6">
      {/* No Key Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">Google Maps API key not configured</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Add your{" "}
                <code className="bg-background/80 px-1.5 py-0.5 rounded text-amber-400 text-xs font-mono">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </code>{" "}
                to{" "}
                <code className="bg-background/80 px-1.5 py-0.5 rounded text-foreground text-xs font-mono">
                  .env.local
                </code>{" "}
                to enable the interactive map with markers, Street View, and navigation.
                Below is a list view of your spots with navigation links.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spot Count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Spot Locations</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {spots.length} spot{spots.length !== 1 ? "s" : ""} — navigate directly from here
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="h-4 w-4 text-amber-400" />
          Map view unavailable
        </div>
      </div>

      {/* Spots Grid */}
      {spots.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <MapPin className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No spots in your database yet.</p>
            <Link href="/spots/new">
              <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 mt-2">
                Add Your First Spot
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {spots.map((spot) => (
            <SpotLocationCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}
    </div>
  );
}

function SpotLocationCard({ spot }: { spot: Spot }) {
  const score = parseFloat(String(spot.scoreOverall ?? "0"));
  const lat = parseFloat(String(spot.latitude));
  const lng = parseFloat(String(spot.longitude));
  const hasCoords = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
  const navUrl = hasCoords ? getNavigationUrl(lat, lng) : null;
  const spotType = SPOT_TYPES[spot.spotType as keyof typeof SPOT_TYPES];
  const zone = ZONES[spot.zone as keyof typeof ZONES];
  const parkingType = spot.parkingType ? PARKING_TYPES[spot.parkingType as keyof typeof PARKING_TYPES] : null;

  return (
    <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors group overflow-hidden">
      {/* Score bar */}
      <div
        className="h-1 w-full"
        style={{
          background:
            score >= 7
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : score >= 5
              ? "linear-gradient(90deg, #f59e0b, #fcd34d)"
              : "linear-gradient(90deg, #ef4444, #f87171)",
        }}
      />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-foreground truncate group-hover:text-amber-400 transition-colors">
              {spot.name}
            </CardTitle>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              {spot.address}, {spot.city}
            </p>
          </div>
          <ScoreBadge score={score} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-background/60 text-muted-foreground border border-border/40">
            {spotType?.label ?? spot.spotType}
          </span>
          {zone && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-background/60 text-muted-foreground border border-border/40">
              {zone.label}
            </span>
          )}
          <SpotStatusBadge status={spot.status} />
        </div>

        {/* Parking info */}
        {parkingType && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-amber-400/70 flex-shrink-0" />
            {parkingType}
            {spot.parkingSpotsCount && (
              <span className="text-amber-400/70">({spot.parkingSpotsCount} spots)</span>
            )}
          </div>
        )}

        {/* Google rating if available */}
        {spot.visitCount != null && spot.visitCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 text-amber-400/70 flex-shrink-0" />
            {spot.visitCount} visit{spot.visitCount !== 1 ? "s" : ""}
            {spot.lastVisitedAt && (
              <span> · Last {new Date(spot.lastVisitedAt).toLocaleDateString()}</span>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-1">
          {navUrl ? (
            <a href={navUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-8"
              >
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                Navigate
              </Button>
            </a>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-border/50 text-muted-foreground text-xs h-8"
              disabled
            >
              No coords
            </Button>
          )}
          <Link href={`/spots/${spot.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="border-border/50 text-muted-foreground hover:text-foreground text-xs h-8 px-3"
            >
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
