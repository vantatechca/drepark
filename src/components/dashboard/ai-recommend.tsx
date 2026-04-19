"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MapPin,
  CalendarDays,
  Loader2,
  AlertCircle,
  Navigation,
  Settings,
} from "lucide-react";
import Link from "next/link";

type Recommendation = {
  spotId: string;
  spotName: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  expectedAudience: string;
};

type RecommendResult = {
  recommendations: Recommendation[] | null;
  insight?: string;
  message?: string;
  context?: { dayOfWeek: string; timeSlot: string; currentTime: string };
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-zinc-700 text-zinc-400 border-zinc-600",
};

export function AIRecommendWidget() {
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommend", { method: "POST" });
      const data: RecommendResult = await res.json();
      setResult(data);
    } catch {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const noAIKey =
    result?.message?.includes("ANTHROPIC_API_KEY") && !result.recommendations;
  const noSpots =
    result?.message?.includes("verified spots") && !result.recommendations;

  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800 overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />

      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Where Should I Go Now?
        </CardTitle>
        <p className="text-sm text-zinc-500">
          AI-powered recommendation based on timing data, visit history, and
          crowd patterns
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Context display */}
        {result?.context && (
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {result.context.dayOfWeek}
            </span>
            <span>·</span>
            <span>{result.context.currentTime}</span>
            <span>·</span>
            <span className="capitalize">
              {result.context.timeSlot.replace("_", " ")}
            </span>
          </div>
        )}

        {/* No AI key state */}
        {noAIKey && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                AI recommendations not configured
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Add{" "}
                <code className="bg-zinc-800 px-1 rounded text-amber-400">
                  ANTHROPIC_API_KEY
                </code>{" "}
                to your .env.local to enable AI recommendations
              </p>
              <Link href="/settings">
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  View Settings
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* No spots state */}
        {noSpots && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-800 border border-zinc-700">
            <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-300">
                No verified spots yet
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Add and verify spots first to get AI recommendations
              </p>
              <Link href="/spots/new">
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Add First Spot
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* AI Insight */}
        {result?.insight && (
          <div className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-sm text-zinc-300 italic">
            "{result.insight}"
          </div>
        )}

        {/* Recommendations */}
        {result?.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-3">
            {result.recommendations.slice(0, 3).map((rec, i) => (
              <div
                key={rec.spotId}
                className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg font-bold text-amber-400 flex-shrink-0">
                      #{i + 1}
                    </span>
                    <p className="text-sm font-semibold text-white truncate">
                      {rec.spotName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${
                      CONFIDENCE_STYLES[rec.confidence] ??
                      CONFIDENCE_STYLES.low
                    }`}
                  >
                    {rec.confidence} confidence
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {rec.reasoning}
                </p>
                {rec.expectedAudience && (
                  <p className="text-xs text-zinc-500">
                    <span className="text-zinc-400 font-medium">Expected:</span>{" "}
                    {rec.expectedAudience}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Link href={`/spots/${rec.spotId}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      View Spot
                    </Button>
                  </Link>
                  <Link href={`/spots/${rec.spotId}`}>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Navigate
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main CTA */}
        {!noAIKey && !noSpots && (
          <Button
            onClick={handleGetRecommendations}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-11 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing timing data...
              </>
            ) : result?.recommendations ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Refresh Recommendations
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Recommendations
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
