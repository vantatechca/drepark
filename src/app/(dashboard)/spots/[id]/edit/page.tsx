"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotForm } from "@/components/spots/spot-form";
import type { Spot } from "@/types";
import type { SpotFormData } from "@/types";

function spotToFormData(spot: Spot): SpotFormData {
  const audienceTags = Array.isArray(spot.audienceTags) ? spot.audienceTags : [];
  return {
    name: spot.name ?? "",
    spotType: spot.spotType ?? "cafe",
    address: spot.address ?? "",
    city: spot.city ?? "",
    neighborhood: spot.neighborhood ?? "",
    zone: spot.zone ?? "south_shore_primary",
    latitude: String(spot.latitude ?? ""),
    longitude: String(spot.longitude ?? ""),
    googlePlaceId: spot.googlePlaceId ?? "",
    googleMapsUrl: spot.googleMapsUrl ?? "",
    websiteUrl: spot.websiteUrl ?? "",
    phone: spot.phone ?? "",
    parkingType: spot.parkingType ?? "",
    parkingSpotsCount: spot.parkingSpotsCount ?? undefined,
    distanceCarToSeatingM: spot.distanceCarToSeatingM ?? undefined,
    badgeVisible: spot.badgeVisible ?? false,
    backInPossible: spot.backInPossible ?? false,
    terracePatio: spot.terracePatio ?? false,
    laptopFriendly: spot.laptopFriendly ?? false,
    priceRange: spot.priceRange ?? "",
    audienceTags,
    streetViewHeading: spot.streetViewHeading ?? undefined,
    scoreProximity: Number(spot.scoreProximity ?? 5),
    scoreVisibility: Number(spot.scoreVisibility ?? 5),
    scoreFootTraffic: Number(spot.scoreFootTraffic ?? 5),
    scoreVibe: Number(spot.scoreVibe ?? 5),
    scoreNetworking: Number(spot.scoreNetworking ?? 5),
    status: spot.status ?? "suggested",
    notes: spot.notes ?? "",
  };
}

export default function EditSpotPage() {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/spots" className="hover:text-foreground transition-colors">
          My Spots
        </Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <Link
          href={`/spots/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {spot.name}
        </Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <span className="text-foreground">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Spot</h1>
        <p className="text-muted-foreground text-sm mt-1">{spot.name}</p>
      </div>

      <SpotForm mode="edit" spotId={id} initialData={spotToFormData(spot)} />
    </div>
  );
}
