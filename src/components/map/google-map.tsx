"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import {
  Layers,
  LocateFixed,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNavigationUrl, calculateDistance } from "@/lib/google-maps";
import { SPOT_TYPES, SPOT_STATUSES } from "@/lib/constants";
import { ZONES } from "@/lib/zones";
import type { Spot } from "@/types";

interface GoogleMapProps {
  spots: Spot[];
  apiKey: string;
}

function getMarkerColor(score: number): string {
  if (score >= 7) return "#10b981";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
}

function getMarkerSvg(score: number): string {
  const color = getMarkerColor(score);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="9" fill="white" opacity="0.9"/>
      <text x="18" y="22" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="${color}">${score >= 10 ? "10" : score.toFixed(1)}</text>
    </svg>
  `)}`;
}

export function GoogleMap({ spots, apiKey }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [spotTypeFilter, setSpotTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSpots = spots.filter((spot) => {
    if (spotTypeFilter !== "all" && spot.spotType !== spotTypeFilter) return false;
    if (zoneFilter !== "all" && spot.zone !== zoneFilter) return false;
    if (statusFilter !== "all" && spot.status !== statusFilter) return false;
    if (nearMeActive && userLocation) {
      const lat = parseFloat(String(spot.latitude));
      const lng = parseFloat(String(spot.longitude));
      if (!isNaN(lat) && !isNaN(lng)) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
        if (dist > 5) return false;
      }
    }
    return true;
  });

  // Load Google Maps via new functional API
  useEffect(() => {
    setOptions({ key: apiKey, v: "weekly" });
    importLibrary("maps")
      .then(() => setIsLoaded(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load Google Maps";
        setLoadError(msg);
      });
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 45.45, lng: -73.51 },
      zoom: 11,
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#172b1a" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#374151" }] },
        { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isLoaded]);

  // Update markers
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const currentIds = new Set(filteredSpots.map((s) => s.id));

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    filteredSpots.forEach((spot) => {
      const lat = parseFloat(String(spot.latitude));
      const lng = parseFloat(String(spot.longitude));
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      const score = parseFloat(String(spot.scoreOverall ?? "0"));
      const navUrl = getNavigationUrl(lat, lng);
      const spotTypeMeta = SPOT_TYPES[spot.spotType as keyof typeof SPOT_TYPES];

      if (markersRef.current.has(spot.id)) {
        const marker = markersRef.current.get(spot.id)!;
        marker.setIcon({
          url: getMarkerSvg(score),
          scaledSize: new google.maps.Size(36, 48),
          anchor: new google.maps.Point(18, 48),
        });
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current!,
        title: spot.name,
        icon: {
          url: getMarkerSvg(score),
          scaledSize: new google.maps.Size(36, 48),
          anchor: new google.maps.Point(18, 48),
        },
        animation: google.maps.Animation.DROP,
      });

      marker.addListener("click", () => {
        const statusMeta = SPOT_STATUSES[spot.status as keyof typeof SPOT_STATUSES];
        const content = `
          <div style="background:#1a1a2e;border:1px solid #374151;border-radius:10px;padding:14px;min-width:220px;max-width:280px;font-family:system-ui,sans-serif;color:#f9fafb;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">
              <div style="min-width:0;">
                <div style="font-size:15px;font-weight:700;color:#f9fafb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${spot.name}</div>
                <div style="font-size:12px;color:#9ca3af;margin-top:2px;">${spot.address}, ${spot.city}</div>
              </div>
              <div style="flex-shrink:0;background:${getMarkerColor(score)}20;color:${getMarkerColor(score)};font-size:16px;font-weight:800;padding:4px 10px;border-radius:8px;border:1px solid ${getMarkerColor(score)}40;">
                ${score.toFixed(1)}
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              <span style="background:#1f2937;color:#9ca3af;font-size:11px;padding:2px 8px;border-radius:4px;border:1px solid #374151;">${spotTypeMeta?.label ?? spot.spotType}</span>
              <span style="font-size:11px;padding:2px 8px;border-radius:4px;color:#9ca3af;background:#1f2937;">${statusMeta?.label ?? spot.status}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="flex:1;background:#f59e0b;color:#000;font-size:12px;font-weight:700;padding:7px 12px;border-radius:7px;text-decoration:none;text-align:center;display:block;">Navigate</a>
              <a href="/spots/${spot.id}" style="flex:1;background:#1f2937;color:#d1d5db;font-size:12px;font-weight:600;padding:7px 12px;border-radius:7px;text-decoration:none;text-align:center;display:block;border:1px solid #374151;">View Detail</a>
            </div>
          </div>
        `;
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.set(spot.id, marker);
    });
  }, [filteredSpots, isLoaded]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  const toggleSatellite = () => {
    if (!mapInstanceRef.current) return;
    const newSatellite = !isSatellite;
    setIsSatellite(newSatellite);
    mapInstanceRef.current.setMapTypeId(newSatellite ? "satellite" : "roadmap");
    if (!newSatellite) {
      mapInstanceRef.current.setOptions({
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        ],
      });
    } else {
      mapInstanceRef.current.setOptions({ styles: [] });
    }
  };

  const handleNearMe = () => {
    if (nearMeActive) { setNearMeActive(false); return; }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setNearMeActive(true);
        mapInstanceRef.current?.panTo(loc);
        mapInstanceRef.current?.setZoom(13);
      },
      () => alert("Could not get your location.")
    );
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="p-3 rounded-full bg-red-500/10"><X className="h-8 w-8 text-red-400" /></div>
        <p className="text-red-400 font-medium">Failed to load Google Maps</p>
        <p className="text-muted-foreground text-sm">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card/80 border-b border-border/50 backdrop-blur-sm">
        <Select value={spotTypeFilter} onValueChange={(v) => setSpotTypeFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-[140px] bg-background border-border/50 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(SPOT_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-[180px] bg-background border-border/50 text-sm">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {Object.entries(ZONES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-[140px] bg-background border-border/50 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(SPOT_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <span className="text-muted-foreground text-xs">{filteredSpots.length} of {spots.length} spots</span>
        <Button
          size="sm"
          variant={nearMeActive ? "default" : "outline"}
          className={`h-8 text-xs gap-1.5 ${nearMeActive ? "bg-amber-500 text-black hover:bg-amber-400" : "border-border/50 hover:border-amber-500/50 hover:text-amber-400"}`}
          onClick={handleNearMe}
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {nearMeActive ? "Near Me (on)" : "Near Me"}
        </Button>
        <Button
          size="sm"
          variant={isSatellite ? "default" : "outline"}
          className={`h-8 text-xs gap-1.5 ${isSatellite ? "bg-amber-500 text-black hover:bg-amber-400" : "border-border/50 hover:border-amber-500/50 hover:text-amber-400"}`}
          onClick={toggleSatellite}
        >
          <Layers className="h-3.5 w-3.5" />
          {isSatellite ? "Road" : "Satellite"}
        </Button>
      </div>
      <div className="relative flex-1">
        {!isLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background gap-3">
            <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        {isLoaded && (
          <div className="absolute bottom-4 left-4 bg-card/90 border border-border/50 rounded-lg p-3 backdrop-blur-sm text-xs space-y-1.5">
            <div className="text-muted-foreground font-medium mb-2">Score Legend</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-muted-foreground">7.0+</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-muted-foreground">5.0 – 7.0</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-muted-foreground">&lt; 5.0</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
