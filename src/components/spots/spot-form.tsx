"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge } from "@/components/spots/score-badge";
import {
  SPOT_TYPES,
  PARKING_TYPES,
  SPOT_STATUSES,
  AUDIENCE_TAGS,
} from "@/lib/constants";
import { calculateOverallScore } from "@/lib/scoring";
import { ZONES } from "@/lib/zones";
import type { SpotFormData } from "@/types";

const DEFAULT_FORM: SpotFormData = {
  name: "",
  spotType: "cafe",
  address: "",
  city: "",
  neighborhood: "",
  zone: "south_shore_primary",
  latitude: "",
  longitude: "",
  googlePlaceId: "",
  googleMapsUrl: "",
  parkingType: "",
  parkingSpotsCount: undefined,
  distanceCarToSeatingM: undefined,
  badgeVisible: false,
  backInPossible: false,
  terracePatio: false,
  laptopFriendly: false,
  audienceTags: [],
  scoreProximity: 5,
  scoreVisibility: 5,
  scoreFootTraffic: 5,
  scoreVibe: 5,
  scoreNetworking: 5,
  priceRange: "",
  notes: "",
  status: "suggested",
};

interface SpotFormProps {
  initialData?: Partial<SpotFormData>;
  spotId?: string;
  mode: "create" | "edit";
}

export function SpotForm({ initialData, spotId, mode }: SpotFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<SpotFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overallScore = calculateOverallScore({
    proximity: form.scoreProximity,
    visibility: form.scoreVisibility,
    footTraffic: form.scoreFootTraffic,
    vibe: form.scoreVibe,
    networking: form.scoreNetworking,
  });

  function setField<K extends keyof SpotFormData>(key: K, value: SpotFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAudienceTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      audienceTags: prev.audienceTags.includes(tag)
        ? prev.audienceTags.filter((t) => t !== tag)
        : [...prev.audienceTags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === "create" ? "/api/spots" : `/api/spots/${spotId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save spot");
      }

      const saved = await res.json();
      router.push(`/spots/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Spot Name *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Café Crème La Prairie"
              className="bg-background border-border/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Spot Type *</Label>
            <Select
              value={form.spotType}
              onValueChange={(v) => v && setField("spotType", v)}
            >
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SPOT_TYPES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Zone *</Label>
            <Select
              value={form.zone}
              onValueChange={(v) => v && setField("zone", v)}
            >
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ZONES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label>Address *</Label>
            <Input
              required
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="123 Main St"
              className="bg-background border-border/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label>City *</Label>
            <Input
              required
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="La Prairie"
              className="bg-background border-border/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Neighborhood</Label>
            <Input
              value={form.neighborhood ?? ""}
              onChange={(e) => setField("neighborhood", e.target.value)}
              placeholder="Downtown"
              className="bg-background border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Latitude</Label>
            <Input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setField("latitude", e.target.value)}
              placeholder="45.3876"
              className="bg-background border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Longitude</Label>
            <Input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setField("longitude", e.target.value)}
              placeholder="-73.5087"
              className="bg-background border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Place ID</Label>
            <Input
              value={form.googlePlaceId ?? ""}
              onChange={(e) => setField("googlePlaceId", e.target.value)}
              placeholder="ChIJ..."
              className="bg-background border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps URL</Label>
            <Input
              value={form.googleMapsUrl ?? ""}
              onChange={(e) => setField("googleMapsUrl", e.target.value)}
              placeholder="https://maps.google.com/..."
              className="bg-background border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parking */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Parking
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Parking Type</Label>
            <Select
              value={form.parkingType ?? ""}
              onValueChange={(v) => setField("parkingType", v || undefined)}
            >
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARKING_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Parking Spots Count</Label>
            <Input
              type="number"
              min={0}
              value={form.parkingSpotsCount ?? ""}
              onChange={(e) =>
                setField("parkingSpotsCount", e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="e.g. 4"
              className="bg-background border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Distance Car to Seating (m)</Label>
            <Input
              type="number"
              min={0}
              value={form.distanceCarToSeatingM ?? ""}
              onChange={(e) =>
                setField("distanceCarToSeatingM", e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="e.g. 5"
              className="bg-background border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Features
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(
            [
              { key: "badgeVisible", label: "Badge Visible" },
              { key: "backInPossible", label: "Back-In Possible" },
              { key: "terracePatio", label: "Terrace / Patio" },
              { key: "laptopFriendly", label: "Laptop Friendly" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Switch
                checked={form[key]}
                onCheckedChange={(checked) => setField(key, checked)}
              />
              <Label className="text-sm cursor-pointer">{label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audience Tags */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Audience Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AUDIENCE_TAGS.map((tag) => {
            const selected = form.audienceTags.includes(tag.value);
            return (
              <label
                key={tag.value}
                className={`flex items-center gap-2.5 rounded-md border px-3 py-2 cursor-pointer transition-colors text-sm ${
                  selected
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                    : "border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleAudienceTag(tag.value)}
                  className="sr-only"
                />
                <span
                  className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${
                    selected
                      ? "bg-amber-500 border-amber-500 text-black font-bold"
                      : "border-border/50"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
                {tag.label}
              </label>
            );
          })}
        </CardContent>
      </Card>

      {/* Scoring */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-amber-400">
              Intelligence Scoring
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Overall:</span>
              <ScoreBadge score={overallScore} size="md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(
            [
              { key: "scoreProximity", label: "Proximity", weight: "25%" },
              { key: "scoreVisibility", label: "Visibility", weight: "25%" },
              { key: "scoreFootTraffic", label: "Foot Traffic", weight: "20%" },
              { key: "scoreVibe", label: "Vibe", weight: "15%" },
              { key: "scoreNetworking", label: "Networking", weight: "15%" },
            ] as const
          ).map(({ key, label, weight }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">{label}</Label>
                  <span className="text-xs text-muted-foreground">({weight})</span>
                </div>
                <span className="text-sm font-semibold text-amber-400 w-6 text-right">
                  {form[key]}
                </span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[form[key]]}
                onValueChange={(v) => setField(key, Array.isArray(v) ? v[0] : v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-amber-400">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Price Range</Label>
              <Select
                value={form.priceRange ?? ""}
                onValueChange={(v) => setField("priceRange", v || undefined)}
              >
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {["$", "$$", "$$$", "$$$$"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => v && setField("status", v)}
              >
                <SelectTrigger className="bg-background border-border/50">
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
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Personal notes about this spot..."
              className="bg-background border-border/50 min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-border/50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold min-w-[120px]"
        >
          {submitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Create Spot"
            : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
