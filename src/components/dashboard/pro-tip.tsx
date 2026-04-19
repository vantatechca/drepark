"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Car,
  Clock,
  Users,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProTip = {
  id: string;
  category: string;
  title: string;
  description: string;
  active: boolean;
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  parking: <Car className="w-4 h-4" />,
  timing: <Clock className="w-4 h-4" />,
  networking: <Users className="w-4 h-4" />,
  general: <BookOpen className="w-4 h-4" />,
  car_care: <Car className="w-4 h-4" />,
  content: <Lightbulb className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  parking: "text-blue-400",
  timing: "text-purple-400",
  networking: "text-emerald-400",
  general: "text-amber-400",
  car_care: "text-sky-400",
  content: "text-pink-400",
};

export function ProTipWidget() {
  const [tip, setTip] = useState<ProTip | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchTip() {
    setLoading(true);
    fetch("/api/tips?random=true")
      .then((r) => r.json())
      .then((data) => setTip(data))
      .catch(() => setTip(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTip();
  }, []);

  const iconColor = tip ? (CATEGORY_COLORS[tip.category] ?? "text-amber-400") : "text-amber-400";
  const icon = tip ? (CATEGORY_ICONS[tip.category] ?? <Lightbulb className="w-4 h-4" />) : <Lightbulb className="w-4 h-4" />;

  return (
    <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-amber-400/30 to-transparent" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                "bg-zinc-800 border border-zinc-700",
                iconColor
              )}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400/70">
                  Pro Tip
                </span>
                {tip && (
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-medium",
                      iconColor
                    )}
                  >
                    · {tip.category.replace("_", " ")}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-full" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-2/3" />
                </div>
              ) : tip ? (
                <>
                  <p className="text-sm font-semibold text-white leading-snug">
                    {tip.title}
                  </p>
                  {tip.description && tip.description !== tip.title && (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {tip.description}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-zinc-500">No tip available</p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchTip}
            disabled={loading}
            className="h-7 w-7 p-0 text-zinc-600 hover:text-zinc-300 flex-shrink-0"
            title="Get another tip"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
