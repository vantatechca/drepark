"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  Users,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_SLOTS } from "@/lib/constants";
import type { Spot, VisitFormData } from "@/types";

const today = new Date().toISOString().split("T")[0];

const DEFAULT_FORM: VisitFormData = {
  spotId: "",
  date: today,
  arrivedAt: "",
  departedAt: "",
  timeSlot: "afternoon",
  parkedWhere: "",
  badgeFacingCrowd: false,
  crowdQuality: "",
  crowdGender: "",
  conversationsCount: 0,
  contactsExchanged: 0,
  carCompliments: 0,
  networkingRating: undefined,
  vibeRating: undefined,
  contentCreated: false,
  whatIDid: "",
  notableInteractions: "",
  weather: "",
  notes: "",
};

const PARKED_WHERE_OPTIONS = [
  { value: "ideal_spot", label: "Ideal Spot", emoji: "🎯" },
  { value: "acceptable", label: "Acceptable", emoji: "✅" },
  { value: "had_to_park_far", label: "Parked Far", emoji: "🚶" },
  { value: "lot_full", label: "Lot Full", emoji: "❌" },
];

const CROWD_QUALITY_OPTIONS = [
  { value: "perfect", label: "Perfect", color: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" },
  { value: "good", label: "Good", color: "border-green-500/60 bg-green-500/10 text-green-300" },
  { value: "mediocre", label: "Mediocre", color: "border-yellow-500/60 bg-yellow-500/10 text-yellow-300" },
  { value: "wrong_crowd", label: "Wrong Crowd", color: "border-orange-500/60 bg-orange-500/10 text-orange-300" },
  { value: "empty", label: "Empty", color: "border-gray-500/60 bg-gray-500/10 text-gray-300" },
];

function RadioGrid({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; emoji?: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        const base = "rounded-md border px-3 py-2.5 cursor-pointer transition-all text-sm font-medium text-center flex items-center justify-center gap-1.5";
        const activeClass = opt.color
          ? opt.color
          : "border-amber-500/60 bg-amber-500/10 text-amber-300";
        const inactiveClass = "border-border/50 text-muted-foreground hover:border-border hover:text-foreground";
        return (
          <button
            key={opt.value}
            type="button"
            className={`${base} ${selected ? activeClass : inactiveClass}`}
            onClick={() => onChange(selected ? "" : opt.value)}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RatingButtons({
  value,
  onChange,
  max = 5,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? undefined : n)}
          className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-all ${
            (value ?? 0) >= n
              ? "border-amber-500 bg-amber-500 text-black"
              : "border-border/50 text-muted-foreground hover:border-amber-500/40 hover:text-foreground"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step < current
                ? "bg-amber-500 text-black"
                : step === current
                ? "bg-amber-500/20 border-2 border-amber-500 text-amber-400"
                : "bg-background border border-border/50 text-muted-foreground"
            }`}
          >
            {step < current ? <Check className="h-3.5 w-3.5" /> : step}
          </div>
          {step < total && (
            <div
              className={`h-0.5 w-8 ${
                step < current ? "bg-amber-500" : "bg-border/50"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const STEP_LABELS = ["Select Spot", "Quick Metrics", "Details"];

export default function LogVisitPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>}>
      <LogVisitContent />
    </Suspense>
  );
}

function LogVisitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSpotId = searchParams.get("spotId") ?? "";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<VisitFormData>({
    ...DEFAULT_FORM,
    spotId: preselectedSpotId,
  });
  const [spots, setSpots] = useState<Spot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((d) => setSpots(Array.isArray(d) ? d : []))
      .catch(() => setSpots([]));
  }, []);

  function setField<K extends keyof VisitFormData>(key: K, value: VisitFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed() {
    if (step === 1) return !!form.spotId;
    if (step === 2) return !!form.date && !!form.timeSlot;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        arrivedAt: form.arrivedAt || null,
        departedAt: form.departedAt || null,
        parkedWhere: form.parkedWhere || null,
        crowdQuality: form.crowdQuality || null,
        crowdGender: form.crowdGender || null,
        whatIDid: form.whatIDid || null,
        weather: form.weather || null,
        notableInteractions: form.notableInteractions || null,
        notes: form.notes || null,
      };

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to log visit");
      }

      router.push("/visits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Log Visit</h1>
          <p className="text-muted-foreground text-sm">{STEP_LABELS[step - 1]}</p>
        </div>
        <StepIndicator current={step} total={3} />
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select Spot */}
      {step === 1 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Which spot?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Spot *</Label>
              <Select value={form.spotId} onValueChange={(v) => v && setField("spotId", v)}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Select a spot..." />
                </SelectTrigger>
                <SelectContent>
                  {spots.map((spot) => (
                    <SelectItem key={spot.id} value={spot.id}>
                      {spot.name} — {spot.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {spots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No spots yet.{" "}
                <a href="/spots/new" className="text-amber-400 underline underline-offset-2">
                  Add a spot first.
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Quick Metrics */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                When?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    className="bg-background border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Time Slot *</Label>
                  <Select value={form.timeSlot} onValueChange={(v) => v && setField("timeSlot", v)}>
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIME_SLOTS).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label} ({val.range})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400">
                Parking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGrid
                options={PARKED_WHERE_OPTIONS}
                value={form.parkedWhere ?? ""}
                onChange={(v) => setField("parkedWhere", v)}
              />
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  checked={form.badgeFacingCrowd}
                  onCheckedChange={(v) => setField("badgeFacingCrowd", v)}
                />
                <Label className="text-sm">Badge facing crowd</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Crowd
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Crowd Quality</Label>
                <RadioGrid
                  options={CROWD_QUALITY_OPTIONS}
                  value={form.crowdQuality ?? ""}
                  onChange={(v) => setField("crowdQuality", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Crowd Gender</Label>
                <Select
                  value={form.crowdGender ?? ""}
                  onValueChange={(v) => v && setField("crowdGender", v)}
                >
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mostly_men">Mostly Men</SelectItem>
                    <SelectItem value="mostly_women">Mostly Women</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400">
                Interactions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {(
                [
                  { key: "conversationsCount", label: "Conversations" },
                  { key: "contactsExchanged", label: "Contacts" },
                  { key: "carCompliments", label: "Car Compliments" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form[key]}
                    onChange={(e) => setField(key, parseInt(e.target.value) || 0)}
                    className="bg-background border-border/50 text-center text-lg font-semibold h-12"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Optional Details */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400">
                Exact Times (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Arrived At</Label>
                <Input
                  type="time"
                  value={form.arrivedAt ?? ""}
                  onChange={(e) => setField("arrivedAt", e.target.value)}
                  className="bg-background border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Departed At</Label>
                <Input
                  type="time"
                  value={form.departedAt ?? ""}
                  onChange={(e) => setField("departedAt", e.target.value)}
                  className="bg-background border-border/50"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Networking Rating</Label>
                <RatingButtons
                  value={form.networkingRating}
                  onChange={(v) => setField("networkingRating", v)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Vibe Rating</Label>
                <RatingButtons
                  value={form.vibeRating}
                  onChange={(v) => setField("vibeRating", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400">
                Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">What I Did</Label>
                  <Select
                    value={form.whatIDid ?? ""}
                    onValueChange={(v) => v && setField("whatIDid", v)}
                  >
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laptop_work">Laptop Work</SelectItem>
                      <SelectItem value="coffee_hangout">Coffee Hangout</SelectItem>
                      <SelectItem value="brunch">Brunch</SelectItem>
                      <SelectItem value="ice_cream">Ice Cream</SelectItem>
                      <SelectItem value="drinks">Drinks</SelectItem>
                      <SelectItem value="just_parked">Just Parked</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Weather</Label>
                  <Select
                    value={form.weather ?? ""}
                    onValueChange={(v) => v && setField("weather", v)}
                  >
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">Sunny</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="overcast">Overcast</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                      <SelectItem value="snowy">Snowy</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.contentCreated}
                  onCheckedChange={(v) => setField("contentCreated", v)}
                />
                <Label className="text-sm">Content created during this visit</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-400">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Notable Interactions</Label>
                <Textarea
                  value={form.notableInteractions ?? ""}
                  onChange={(e) => setField("notableInteractions", e.target.value)}
                  placeholder="Any standout conversations or moments..."
                  className="bg-background border-border/50 min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">General Notes</Label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Anything else worth remembering..."
                  className="bg-background border-border/50 min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="border-border/50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold min-w-[120px]"
          >
            {submitting ? "Saving..." : "Log Visit"}
          </Button>
        )}
      </div>
    </div>
  );
}
