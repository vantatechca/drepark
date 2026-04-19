"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Coffee,
  IceCream,
  UtensilsCrossed,
  ChefHat,
  Wine,
  Scissors,
  Flame,
  Dumbbell,
  Car,
  MapPin,
  Edit,
  Navigation,
  CalendarPlus,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Umbrella,
  Laptop,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/spots/score-badge";
import { ScoreRadar } from "@/components/spots/score-radar";
import { SpotStatusBadge } from "@/components/spots/spot-status-badge";
import { SPOT_TYPES, PARKING_TYPES, AUDIENCE_TAGS } from "@/lib/constants";
import {
  getStreetViewUrl,
  getNavigationUrl,
  hasGoogleMapsKey,
} from "@/lib/google-maps";
import { ZONES } from "@/lib/zones";
import type { Spot } from "@/types";

const SPOT_ICONS: Record<string, React.ReactNode> = {
  cafe: <Coffee className="h-6 w-6" />,
  ice_cream: <IceCream className="h-6 w-6" />,
  brunch: <UtensilsCrossed className="h-6 w-6" />,
  restaurant: <ChefHat className="h-6 w-6" />,
  wine_bar: <Wine className="h-6 w-6" />,
  barber: <Scissors className="h-6 w-6" />,
  cigar_lounge: <Flame className="h-6 w-6" />,
  gym: <Dumbbell className="h-6 w-6" />,
  car_meet: <Car className="h-6 w-6" />,
  other: <MapPin className="h-6 w-6" />,
};

function FeatureRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean | string | number | null | undefined;
}) {
  const isBoolean = typeof value === "boolean";
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      {isBoolean ? (
        value ? (
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground/50" />
        )
      ) : (
        <span className="text-sm font-medium text-foreground">
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

export default function SpotDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function loadSpot() {
      try {
        const res = await fetch(`/api/spots/${id}`);
        if (res.status === 404) {
          setNotFoundState(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setSpot(data);
      } catch {
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }
    loadSpot();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground p-6">
        Loading spot...
      </div>
    );
  }

  if (notFoundState || !spot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
        <MapPin className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">Spot not found</p>
        <Link href="/spots">
          <Button variant="outline" className="border-border/50">
            Back to Spots
          </Button>
        </Link>
      </div>
    );
  }

  const lat = parseFloat(String(spot.latitude ?? "0"));
  const lng = parseFloat(String(spot.longitude ?? "0"));
  const hasCoords = lat !== 0 || lng !== 0;
  const streetViewUrl =
    hasGoogleMapsKey() && hasCoords
      ? getStreetViewUrl(lat, lng, spot.streetViewHeading ?? 0, "900x400")
      : null;
  const navUrl = hasCoords ? getNavigationUrl(lat, lng) : null;

  const overallScore = parseFloat(String(spot.scoreOverall ?? "0"));
  const zoneKey = spot.zone as keyof typeof ZONES;
  const typeKey = spot.spotType as keyof typeof SPOT_TYPES;

  const audienceTags = Array.isArray(spot.audienceTags) ? spot.audienceTags : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Breadcrumb */}
      <Link
        href="/spots"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        My Spots
      </Link>

      {/* Hero */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                {SPOT_ICONS[spot.spotType] ?? <MapPin className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{spot.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-muted-foreground text-sm">
                    {spot.city}
                    {spot.neighborhood ? ` · ${spot.neighborhood}` : ""}
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground text-sm">
                    {ZONES[zoneKey]?.label ?? spot.zone}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <SpotStatusBadge status={spot.status} />
                  {spot.priceRange && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {spot.priceRange}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {SPOT_TYPES[typeKey]?.label ?? spot.spotType}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ScoreBadge score={overallScore} size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/spots/${id}/edit`}>
          <Button variant="outline" className="border-border/50 gap-2">
            <Edit className="h-4 w-4" />
            Edit Spot
          </Button>
        </Link>
        {navUrl && (
          <a href={navUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-border/50 gap-2">
              <Navigation className="h-4 w-4" />
              Navigate
            </Button>
          </a>
        )}
        <Link href={`/visits/new?spotId=${id}`}>
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2">
            <CalendarPlus className="h-4 w-4" />
            Log Visit
          </Button>
        </Link>
      </div>

      {/* Street View */}
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Street View
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {streetViewUrl ? (
            <div className="relative w-full h-52 sm:h-64">
              <img
                src={streetViewUrl}
                alt={`Street view of ${spot.name}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground bg-muted/20">
              <MapPin className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {hasGoogleMapsKey()
                  ? hasCoords
                    ? "Street view unavailable"
                    : "Add coordinates to enable Street View"
                  : "Add Google Maps API key for Street View"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Radar + Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-400">
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadar
              proximity={Number(spot.scoreProximity ?? 0)}
              visibility={Number(spot.scoreVisibility ?? 0)}
              footTraffic={Number(spot.scoreFootTraffic ?? 0)}
              vibe={Number(spot.scoreVibe ?? 0)}
              networking={Number(spot.scoreNetworking ?? 0)}
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "Proximity", val: spot.scoreProximity },
                { label: "Visibility", val: spot.scoreVisibility },
                { label: "Foot Traffic", val: spot.scoreFootTraffic },
                { label: "Vibe", val: spot.scoreVibe },
                { label: "Networking", val: spot.scoreNetworking },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">
                    {Number(val ?? 0)}/10
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-400">
              Parking & Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FeatureRow
              icon={<Car className="h-4 w-4" />}
              label="Parking Type"
              value={
                spot.parkingType
                  ? PARKING_TYPES[spot.parkingType as keyof typeof PARKING_TYPES]
                  : null
              }
            />
            <FeatureRow
              icon={<MapPin className="h-4 w-4" />}
              label="Parking Spots"
              value={spot.parkingSpotsCount ?? null}
            />
            <FeatureRow
              icon={<Navigation className="h-4 w-4" />}
              label="Car to Seating"
              value={
                spot.distanceCarToSeatingM != null
                  ? `${spot.distanceCarToSeatingM}m`
                  : null
              }
            />
            <FeatureRow
              icon={<Eye className="h-4 w-4" />}
              label="Badge Visible"
              value={spot.badgeVisible ?? false}
            />
            <FeatureRow
              icon={<RotateCcw className="h-4 w-4" />}
              label="Back-In Possible"
              value={spot.backInPossible ?? false}
            />
            <FeatureRow
              icon={<Umbrella className="h-4 w-4" />}
              label="Terrace / Patio"
              value={spot.terracePatio ?? false}
            />
            <FeatureRow
              icon={<Laptop className="h-4 w-4" />}
              label="Laptop Friendly"
              value={spot.laptopFriendly ?? false}
            />
            {spot.visitCount != null && spot.visitCount > 0 && (
              <FeatureRow
                icon={<CalendarPlus className="h-4 w-4" />}
                label="Total Visits"
                value={spot.visitCount}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audience Tags */}
      {audienceTags.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-400">
              Audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {audienceTags.map((tag) => {
                const tagDef = AUDIENCE_TAGS.find((t) => t.value === tag);
                return (
                  <Badge
                    key={tag}
                    className="bg-amber-500/10 text-amber-300 border-amber-500/30 border"
                  >
                    {tagDef?.label ?? tag}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {spot.notes && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-400">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {spot.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Address */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>{spot.address}</p>
          <p>
            {spot.city}
            {spot.neighborhood ? `, ${spot.neighborhood}` : ""}
          </p>
          {hasCoords && (
            <p className="font-mono text-xs text-muted-foreground/60 mt-2">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
