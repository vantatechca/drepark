"use client";

import { useEffect, useState } from "react";
import { Map } from "lucide-react";
import { GoogleMap } from "@/components/map/google-map";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import type { Spot } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function MapPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((data) => setSpots(Array.isArray(data) ? data : []))
      .catch(() => setSpots([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3 text-muted-foreground">
        <Map className="h-8 w-8 animate-pulse text-amber-400" />
        <p className="text-sm">Loading map data...</p>
      </div>
    );
  }

  if (!API_KEY) {
    return <MapPlaceholder spots={spots} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-foreground">Map View</h1>
        </div>
        <span className="text-muted-foreground text-sm">
          {spots.length} spot{spots.length !== 1 ? "s" : ""} mapped
        </span>
      </div>

      {/* Full-screen map */}
      <div className="flex-1 overflow-hidden">
        <GoogleMap spots={spots} apiKey={API_KEY} />
      </div>
    </div>
  );
}
