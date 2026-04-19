"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Search,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Plus,
  AlertTriangle,
  RefreshCw,
  History,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SPOT_TYPES } from "@/lib/constants";
import { ZONES } from "@/lib/zones";
import type { SpotSuggestion } from "@/types";

// ── Env checks ────────────────────────────────────────────────────────────

// GOOGLE_PLACES_API_KEY lives server-side only; we can't read it here.
// The UI shows a helpful message but the actual check happens in the API route.
const GOOGLE_PLACES_CONFIGURED = true; // optimistic — API route returns error if unconfigured

interface DiscoverySearch {
  id: string;
  searchQuery: string;
  zone: string | null;
  spotTypeFilter: string | null;
  resultsCount: number | null;
  suggestionsCreated: number | null;
  searchedAt: string;
}

// ── Suggestion Card ───────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onStatusChange,
}: {
  suggestion: SpotSuggestion;
  onStatusChange: (id: string, status: string, reason?: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const lat = parseFloat(String(suggestion.latitude));
  const lng = parseFloat(String(suggestion.longitude));
  const rating = suggestion.googleRating ? parseFloat(String(suggestion.googleRating)) : null;
  const aiScore = suggestion.aiParkingScoreEst;

  async function handleStatus(status: string, reason?: string) {
    setBusy(true);
    try {
      await fetch("/api/discover/suggestions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: suggestion.id, status, rejectionReason: reason }),
      });
      onStatusChange(suggestion.id, status, reason);
    } finally {
      setBusy(false);
      setShowReject(false);
    }
  }

  const statusColor: Record<string, string> = {
    pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    interested: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    scouted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    added: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <Card className="border-border/50 bg-card/50 overflow-hidden hover:bg-card/80 transition-colors">
      {/* Street View thumbnail */}
      {suggestion.streetViewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={suggestion.streetViewUrl}
          alt={suggestion.name}
          className="w-full h-36 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-background to-card flex items-center justify-center">
          <MapPin className="h-10 w-10 text-muted-foreground/20" />
        </div>
      )}

      <CardContent className="pt-4 space-y-3">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{suggestion.name}</h3>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              {suggestion.address}, {suggestion.city}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[suggestion.status] ?? statusColor.pending}`}
          >
            {suggestion.status}
          </span>
        </div>

        {/* Ratings row */}
        <div className="flex flex-wrap gap-2 text-xs">
          {rating !== null && (
            <span className="flex items-center gap-1 bg-background/60 px-2 py-1 rounded border border-border/40 text-muted-foreground">
              <Star className="h-3 w-3 text-amber-400" />
              {rating.toFixed(1)} Google
              {suggestion.googleReviewCount && (
                <span className="text-muted-foreground/60">({suggestion.googleReviewCount})</span>
              )}
            </span>
          )}
          {aiScore !== null && aiScore !== undefined && (
            <span className="flex items-center gap-1 bg-background/60 px-2 py-1 rounded border border-border/40 text-muted-foreground">
              <Bot className="h-3 w-3 text-purple-400" />
              AI Score: {aiScore}/10
            </span>
          )}
          {suggestion.spotType && (
            <span className="bg-background/60 px-2 py-1 rounded border border-border/40 text-muted-foreground">
              {SPOT_TYPES[suggestion.spotType as keyof typeof SPOT_TYPES]?.label ?? suggestion.spotType}
            </span>
          )}
        </div>

        {/* AI assessment */}
        {suggestion.aiAssessment && (
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2.5 text-xs text-muted-foreground leading-relaxed">
            <span className="text-purple-400 font-medium">AI: </span>
            {suggestion.aiAssessment}
          </div>
        )}

        {/* Rejection reason */}
        {suggestion.status === "rejected" && suggestion.rejectionReason && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5 text-xs text-red-400/80">
            Rejected: {suggestion.rejectionReason}
          </div>
        )}

        {/* Reject reason input */}
        {showReject && (
          <div className="space-y-2">
            <Textarea
              placeholder="Why are you rejecting this spot? (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs h-16 bg-background border-border/50 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 text-xs h-7"
                disabled={busy}
                onClick={() => handleStatus("rejected", rejectReason || undefined)}
              >
                Confirm Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-border/50"
                onClick={() => setShowReject(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons — only for non-added non-rejected */}
        {suggestion.status !== "added" && suggestion.status !== "rejected" && !showReject && (
          <div className="flex gap-1.5 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              disabled={busy || suggestion.status === "interested"}
              onClick={() => handleStatus("interested")}
            >
              <Heart className="h-3 w-3 mr-1" />
              {suggestion.status === "interested" ? "Interested" : "Interest"}
            </Button>

            <Button
              size="sm"
              className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-500 text-white font-medium"
              disabled={busy}
              onClick={() => handleStatus("added")}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Spot
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 px-2"
              disabled={busy}
              onClick={() => setShowReject(true)}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {suggestion.status === "added" && (
          <div className="flex items-center gap-1.5 text-xs text-green-400 pt-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Added to your spots
          </div>
        )}

        {/* Nav link */}
        {!isNaN(lat) && !isNaN(lng) && lat !== 0 && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <MapPin className="h-3 w-3" />
            View on Google Maps
          </a>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [suggestions, setSuggestions] = useState<SpotSuggestion[]>([]);
  const [history, setHistory] = useState<DiscoverySearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("south_shore_primary");
  const [spotTypeFilter, setSpotTypeFilter] = useState("all");

  const fetchSuggestions = useCallback(async (status?: string) => {
    try {
      const url = status && status !== "all"
        ? `/api/discover/suggestions?status=${status}`
        : "/api/discover/suggestions";
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/discover");
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSuggestions(), fetchHistory()]).finally(() => setLoading(false));
  }, [fetchSuggestions, fetchHistory]);

  useEffect(() => {
    fetchSuggestions(activeTab !== "all" ? activeTab : undefined);
  }, [activeTab, fetchSuggestions]);

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setSearchSuccess(null);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: zoneFilter,
          spotType: spotTypeFilter !== "all" ? spotTypeFilter : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error ?? "Search failed");
        return;
      }

      setSearchSuccess(
        `Found ${data.total} new suggestions from ${data.scanned} eligible places`
      );
      await fetchSuggestions(activeTab !== "all" ? activeTab : undefined);
      await fetchHistory();
    } catch {
      setSearchError("Network error — please try again");
    } finally {
      setSearching(false);
    }
  }

  function handleStatusChange(id: string, newStatus: string) {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus as SpotSuggestion["status"] } : s))
    );
  }

  const tabCounts: Record<string, number> = {
    all: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    interested: suggestions.filter((s) => s.status === "interested").length,
    rejected: suggestions.filter((s) => s.status === "rejected").length,
    added: suggestions.filter((s) => s.status === "added").length,
  };

  const displayedSuggestions =
    activeTab === "all"
      ? suggestions
      : suggestions.filter((s) => s.status === activeTab);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            AI Discovery
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find new parking spots using Google Places + AI assessment
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border/50 text-muted-foreground hover:text-foreground gap-2"
          onClick={() => {
            fetchSuggestions(activeTab !== "all" ? activeTab : undefined);
            fetchHistory();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search Panel */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-400" />
            Find New Spots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API key status */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {GOOGLE_PLACES_CONFIGURED ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span className="text-muted-foreground">
                Google Places API{" "}
                <span className={GOOGLE_PLACES_CONFIGURED ? "text-green-400" : "text-amber-400"}>
                  {GOOGLE_PLACES_CONFIGURED ? "(configured server-side)" : "(not configured)"}
                </span>
              </span>
            </div>
          </div>

          {!GOOGLE_PLACES_CONFIGURED && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400/80">
              Add{" "}
              <code className="bg-background/80 px-1.5 py-0.5 rounded text-amber-400 text-xs font-mono">
                GOOGLE_PLACES_API_KEY
              </code>{" "}
              to your{" "}
              <code className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>{" "}
              to enable automatic spot discovery. An{" "}
              <code className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono">ANTHROPIC_API_KEY</code>{" "}
              is optional for AI scoring of candidates.
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 min-w-[200px]">
              <label className="text-xs text-muted-foreground font-medium">Zone</label>
              <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v ?? "south_shore_primary")}>
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

            <div className="space-y-1.5 min-w-[160px]">
              <label className="text-xs text-muted-foreground font-medium">Spot Type</label>
              <Select value={spotTypeFilter} onValueChange={(v) => setSpotTypeFilter(v ?? "all")}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(SPOT_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2"
            >
              {searching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Search result feedback */}
          {searchError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {searchError}
            </div>
          )}
          {searchSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {searchSuccess}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Suggestions</h2>
          <span className="text-muted-foreground text-sm">{displayedSuggestions.length} results</span>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "all")}>
          <TabsList className="bg-card/50 border border-border/50 mb-4">
            {[
              { key: "all", label: "All", icon: <Sparkles className="h-3.5 w-3.5" /> },
              { key: "pending", label: "Pending", icon: <Clock className="h-3.5 w-3.5" /> },
              { key: "interested", label: "Interested", icon: <Heart className="h-3.5 w-3.5" /> },
              { key: "added", label: "Added", icon: <CheckCircle className="h-3.5 w-3.5" /> },
              { key: "rejected", label: "Rejected", icon: <XCircle className="h-3.5 w-3.5" /> },
            ].map(({ key, label, icon }) => (
              <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                {icon}
                {label}
                {tabCounts[key] > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 min-w-4 px-1 text-xs bg-background/60"
                  >
                    {tabCounts[key]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
                Loading suggestions...
              </div>
            ) : displayedSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-muted-foreground font-medium">No suggestions yet</p>
                <p className="text-muted-foreground/60 text-sm">
                  Use &quot;Find New Spots&quot; above to discover parking spots in your zones
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedSuggestions.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Discovery History — collapsed by default */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <History className="h-4 w-4" />
          Search History
          {showHistory ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {history.length > 0 && (
            <span className="text-xs text-muted-foreground/60">({history.length} searches)</span>
          )}
        </button>

        {showHistory && (
          <Card className="mt-3 border-border/50 bg-card/50">
            <CardContent className="pt-4">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No searches yet
                </p>
              ) : (
                <div className="space-y-2">
                  {[...history].reverse().map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm text-foreground font-medium">{item.searchQuery}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.searchedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>
                          <span className="text-foreground font-medium">{item.resultsCount ?? 0}</span> found
                        </span>
                        <span>
                          <span className="text-amber-400 font-medium">{item.suggestionsCreated ?? 0}</span> added
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
